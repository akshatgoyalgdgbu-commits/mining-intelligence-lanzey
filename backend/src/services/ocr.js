'use strict'

/**
 * LANZEY OCR & Field Extraction Service
 *
 * Pipeline per document:
 *   1. Read file from disk
 *   2. Extract raw text (pdf-parse for PDFs, xlsx for spreadsheets, mammoth for Word)
 *   3. Run keyword/regex extractors to pull structured fields
 *   4. Store extracted fields in the KnowledgeEntry table
 *   5. Update document status to READY
 *
 * No external AI API required — pattern-based extraction works for
 * structured mining reports that follow standard Indian coal industry formats.
 */

const fs      = require('fs')
const path    = require('path')

// ── Text extractors ───────────────────────────────────────────────────
async function extractText(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase()

  try {
    // PDF
    if (mimeType === 'application/pdf' || ext === '.pdf') {
      try {
        const pdfParse = require('pdf-parse')
        const buffer   = fs.readFileSync(filePath)
        const data     = await pdfParse(buffer)
        return { text: data.text || '', pages: data.numpages || 1, method: 'pdf-parse' }
      } catch (pdfErr) {
        // pdf-parse failed (encrypted/corrupt PDF) — return empty but don't crash
        console.warn('[OCR] pdf-parse failed, treating as empty:', pdfErr.message)
        return { text: '', pages: 0, method: 'pdf-error', error: pdfErr.message }
      }
    }

    // Excel / CSV
    if (['.xlsx','.xls','.csv'].includes(ext) ||
        mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      const XLSX = require('xlsx')
      const wb   = XLSX.readFile(filePath)
      let text   = ''
      for (const sheetName of wb.SheetNames) {
        const ws  = wb.Sheets[sheetName]
        const csv = XLSX.utils.sheet_to_csv(ws)
        text += `\n=== Sheet: ${sheetName} ===\n${csv}\n`
      }
      return { text, pages: wb.SheetNames.length, method: 'xlsx' }
    }

    // Word
    if (['.docx','.doc'].includes(ext) ||
        mimeType.includes('word') || mimeType.includes('document')) {
      const mammoth = require('mammoth')
      const result  = await mammoth.extractRawText({ path: filePath })
      return { text: result.value, pages: 1, method: 'mammoth' }
    }

    // Plain text / fallback
    if (['.txt','.csv'].includes(ext)) {
      const text = fs.readFileSync(filePath, 'utf8')
      return { text, pages: 1, method: 'plaintext' }
    }

    return { text: '', pages: 0, method: 'unsupported' }
  } catch (err) {
    console.error('[OCR] extraction failed:', err.message)
    return { text: '', pages: 0, method: 'error', error: err.message }
  }
}

// ── Field extractors ──────────────────────────────────────────────────
function extractFields(text, department) {
  const fields = {}
  const t = text.toLowerCase()

  // ── Universal fields ──────────────────────────────────────────────
  // Dates  e.g. "2026-09-15" or "15/09/2026" or "September 2026"
  const dateMatches = text.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4})\b/gi)
  if (dateMatches) fields.dates = [...new Set(dateMatches)].slice(0, 5)

  // Mine / site name
  const mineMatch = text.match(/(?:mine|colliery|opencast|project)[:\s]+([A-Z][A-Za-z\s\-]{2,30})/i)
  if (mineMatch) fields.mineName = mineMatch[1].trim()

  // ── Production fields ─────────────────────────────────────────────
  if (department === 'cil' || department === 'production' || t.includes('production') || t.includes('mt') || t.includes('tonne')) {
    // Production value  e.g. "production: 42.3 MT" or "42.3 Million Tonnes"
    const prodMatch = text.match(/(?:production|output|coal produced)[:\s]+([\d,\.]+)\s*(?:MT|million tonne|lakh tonne|kt)/i)
    if (prodMatch) fields.productionMT = parseFloat(prodMatch[1].replace(/,/g,''))

    // Target
    const targetMatch = text.match(/(?:target|planned)[:\s]+([\d,\.]+)\s*(?:MT|million tonne)/i)
    if (targetMatch) fields.targetMT = parseFloat(targetMatch[1].replace(/,/g,''))

    // Year
    const yearMatch = text.match(/(?:year|fy|financial year)[:\s]+(\d{4}[-\/]\d{2,4}|\d{4})/i)
    if (yearMatch) fields.year = yearMatch[1]

    // Dispatch
    const dispatchMatch = text.match(/(?:dispatch|despatched|lifting)[:\s]+([\d,\.]+)\s*(?:MT|million|tonne)/i)
    if (dispatchMatch) fields.dispatchMT = parseFloat(dispatchMatch[1].replace(/,/g,''))
  }

  // ── Geological fields ─────────────────────────────────────────────
  if (department === 'geological' || department === 'cmpdi' || t.includes('seam') || t.includes('geology') || t.includes('strata')) {
    // Seam thickness  e.g. "seam thickness: 4.2 m" or "thickness of 6.8 metres"
    const seamMatches = [...text.matchAll(/seam[:\s\-]+([A-Za-z0-9\-\s]+)[,\s]+thickness[:\s]+([\d\.]+)\s*m/gi)]
    if (seamMatches.length) {
      fields.seams = seamMatches.map(m => ({ name: m[1].trim(), thicknessM: parseFloat(m[2]) }))
    }

    // GCV  e.g. "GCV: 4850 kcal/kg"
    const gcvMatch = text.match(/(?:GCV|gross calorific value)[:\s]+([\d,\.]+)\s*(?:kcal|kJ)/i)
    if (gcvMatch) fields.gcvKcal = parseFloat(gcvMatch[1].replace(/,/g,''))

    // Grade
    const gradeMatch = text.match(/(?:grade|coal grade)[:\s]+([Gg]\d{1,2})/i)
    if (gradeMatch) fields.grade = gradeMatch[1].toUpperCase()

    // Depth
    const depthMatch = text.match(/(?:depth|overburden)[:\s]+([\d,\.]+)\s*m/i)
    if (depthMatch) fields.depthM = parseFloat(depthMatch[1].replace(/,/g,''))

    // Ash content
    const ashMatch = text.match(/(?:ash content|ash%)[:\s]+([\d\.]+)\s*%/i)
    if (ashMatch) fields.ashPct = parseFloat(ashMatch[1])

    // Formation
    const formationMatch = text.match(/(?:formation|gondwana|barakar|raniganj)[:\s]*([A-Za-z\s]{3,30})/i)
    if (formationMatch) fields.formation = formationMatch[0].trim().slice(0,60)
  }

  // ── Machinery fields ──────────────────────────────────────────────
  if (department === 'machinery' || t.includes('dragline') || t.includes('shovel') || t.includes('dumper') || t.includes('equipment')) {
    // Machine count
    const machineCountMatch = text.match(/(\d+)\s+(?:dragline|shovel|dumper|dozer|excavator)/i)
    if (machineCountMatch) fields.machineCount = parseInt(machineCountMatch[1])

    // Availability %
    const availMatch = text.match(/(?:availability|utilization|utilisation)[:\s]+([\d\.]+)\s*%/i)
    if (availMatch) fields.availabilityPct = parseFloat(availMatch[1])

    // Breakdown hours
    const breakdownMatch = text.match(/(?:breakdown|downtime)[:\s]+([\d\.]+)\s*(?:hours|hrs|h)/i)
    if (breakdownMatch) fields.breakdownHours = parseFloat(breakdownMatch[1])
  }

  // ── Environmental fields ──────────────────────────────────────────
  if (department === 'environment' || t.includes('spm') || t.includes('emission') || t.includes('ambient') || t.includes('compliance')) {
    // SPM
    const spmMatch = text.match(/(?:SPM|suspended particulate)[:\s]+([\d\.]+)\s*(?:µg|ug|mcg)\/m/i)
    if (spmMatch) fields.spmUgM3 = parseFloat(spmMatch[1])

    // SO2
    const so2Match = text.match(/SO2[:\s]+([\d\.]+)\s*(?:µg|ug|mcg)\/m/i)
    if (so2Match) fields.so2UgM3 = parseFloat(so2Match[1])

    // pH
    const phMatch = text.match(/(?:pH)[:\s]+([\d\.]+)/i)
    if (phMatch) fields.pH = parseFloat(phMatch[1])

    // Compliance status
    if (t.includes('non-compliant') || t.includes('non compliant') || t.includes('violation')) {
      fields.complianceStatus = 'non-compliant'
    } else if (t.includes('compliant') || t.includes('within limit')) {
      fields.complianceStatus = 'compliant'
    }

    // Permit/clearance
    const permitMatch = text.match(/(?:permit|clearance|licence)\s+(?:no\.?|number)[:\s]+([A-Z0-9\-\/]+)/i)
    if (permitMatch) fields.permitNumber = permitMatch[1]
  }

  // ── Reserve fields ────────────────────────────────────────────────
  if (department === 'reserve' || t.includes('reserve') || t.includes('geological reserve') || t.includes('mineable')) {
    const totalResMatch = text.match(/(?:total reserve|geological reserve)[:\s]+([\d,\.]+)\s*(?:MT|million|billion)/i)
    if (totalResMatch) fields.totalReserveMT = parseFloat(totalResMatch[1].replace(/,/g,''))

    const mineableMatch = text.match(/(?:mineable|extractable|recoverable)\s+reserve[:\s]+([\d,\.]+)\s*(?:MT|million)/i)
    if (mineableMatch) fields.mineableReserveMT = parseFloat(mineableMatch[1].replace(/,/g,''))

    const categoryMatch = text.match(/(?:category|class)[:\s]+(proved|probable|possible|inferred)/i)
    if (categoryMatch) fields.category = categoryMatch[1].toLowerCase()
  }

  // ── Safety/Risk fields ────────────────────────────────────────────
  if (t.includes('incident') || t.includes('accident') || t.includes('lti') || t.includes('safety')) {
    const ltiMatch = text.match(/(?:LTI|lost time injury)[:\s]+(\d+)/i)
    if (ltiMatch) fields.ltiCount = parseInt(ltiMatch[1])

    const nearMissMatch = text.match(/(?:near miss|near-miss)[:\s]+(\d+)/i)
    if (nearMissMatch) fields.nearMissCount = parseInt(nearMissMatch[1])
  }

  return fields
}

// ── Summary generator ─────────────────────────────────────────────────
function generateSummary(text, fields, department) {
  const lines = []

  if (fields.mineName)      lines.push(`Mine: ${fields.mineName}`)
  if (fields.year)          lines.push(`Period: ${fields.year}`)
  if (fields.productionMT)  lines.push(`Production: ${fields.productionMT} MT`)
  if (fields.targetMT)      lines.push(`Target: ${fields.targetMT} MT`)
  if (fields.seams)         lines.push(`Seams found: ${fields.seams.length}`)
  if (fields.gcvKcal)       lines.push(`GCV: ${fields.gcvKcal} kcal/kg`)
  if (fields.grade)         lines.push(`Coal Grade: ${fields.grade}`)
  if (fields.totalReserveMT) lines.push(`Reserve: ${fields.totalReserveMT} MT`)
  if (fields.complianceStatus) lines.push(`Compliance: ${fields.complianceStatus}`)
  if (fields.availabilityPct)  lines.push(`Machine Availability: ${fields.availabilityPct}%`)

  const wordCount = text.split(/\s+/).length
  lines.push(`Document contains ~${wordCount} words.`)

  return lines.join(' | ')
}

// ── Main pipeline function ────────────────────────────────────────────
/**
 * processDocument(doc, prisma)
 *   doc — Prisma Document record
 *   prisma — PrismaClient instance
 *
 * Runs the full pipeline and stores results.
 */
async function processDocument(doc, prisma) {
  const docId = doc.id

  const updateStatus = (status, progress) =>
    prisma.document.update({
      where: { id: docId },
      data:  { status, processingProgress: progress },
    }).catch(() => {})

  try {
    // ── Stage 1: EXTRACTING ───────────────────────────────────────
    await updateStatus('EXTRACTING', 15)
    const { text, pages, method } = await extractText(doc.path, doc.mimeType)

    if (!text || text.trim().length < 10) {
      // Not enough text — still mark READY but note it
      await prisma.document.update({
        where: { id: docId },
        data: {
          status: 'READY',
          processingProgress: 100,
          metadata: JSON.stringify({ summary: 'No text could be extracted. File may be image-only or encrypted.', fields: {}, extractedFieldCount: 0 }),
          errorMessage: 'Low text content — manual review recommended.',
        },
      }).catch(() => {})
      return
    }

    await prisma.document.update({
      where: { id: docId },
      data: {
        extractedText:  text.slice(0, 20000),   // store first 20k chars
        pageCount:      pages,
        processingProgress: 30,
        status: 'EXTRACTING',
      },
    }).catch(() => {})

    // ── Stage 2: PROCESSING ───────────────────────────────────────
    await updateStatus('PROCESSING', 50)
    await new Promise(r => setTimeout(r, 300))   // brief pause for UI

    // ── Stage 3: AI_ANALYSIS — field extraction ───────────────────
    await updateStatus('AI_ANALYSIS', 68)
    const fields  = extractFields(text, doc.department || '')
    const summary = generateSummary(text, fields, doc.department || '')

    // ── Stage 4: INDEXED — write to knowledge base ────────────────
    await updateStatus('INDEXED', 88)

    // Store each extracted field as a KnowledgeEntry
    const entries = []
    for (const [key, value] of Object.entries(fields)) {
      if (value == null || value === '') continue
      const strVal = typeof value === 'object' ? JSON.stringify(value) : String(value)
      entries.push({
        documentId:  docId,
        siteId:      doc.siteId || null,
        department:  doc.department || 'general',
        fieldName:   key,
        fieldValue:  strVal,
        confidence:  0.82,
        sourcePage:  null,
        extractedAt: new Date(),
      })
    }

    // Upsert entries (one per field per document)
    for (const entry of entries) {
      await prisma.knowledgeEntry.upsert({
        where: { documentId_fieldName: { documentId: docId, fieldName: entry.fieldName } },
        update: { fieldValue: entry.fieldValue, confidence: entry.confidence, extractedAt: entry.extractedAt },
        create: entry,
      }).catch(() => {})
    }

    // Update document metadata
    await prisma.document.update({
      where: { id: docId },
      data: {
        metadata:           JSON.stringify({ fields, summary, method, extractedFieldCount: entries.length }),
        processingProgress: 100,
        status:             'READY',
      },
    }).catch(() => {})

  } catch (err) {
    console.error(`[OCR] pipeline error for ${docId}:`, err.message)
    await prisma.document.update({
      where: { id: docId },
      data: { status: 'ERROR', errorMessage: err.message, processingProgress: 0 },
    }).catch(() => {})
  }
}

module.exports = { processDocument, extractText, extractFields }
