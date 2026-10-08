'use strict'

/**
 * LANZEY Database Seed (SQLite compatible)
 * No createMany with skipDuplicates — uses upsert/create with .catch()
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('\n🌱 LANZEY Seed Starting...\n')

  // ── Users ──────────────────────────────────────────────────────────
  console.log('Creating users...')
  const production = process.env.NODE_ENV === 'production'
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD
  if (production && (!adminEmail || !adminPassword || adminPassword.length < 16)) {
    throw new Error('Production seeding requires ADMIN_EMAIL and an ADMIN_PASSWORD of at least 16 characters.')
  }
  const pw = await bcrypt.hash(production ? adminPassword : 'lanzey123', 12)
  const userDefs = production ? [
    { email: adminEmail, name: 'LANZEY Administrator', role: 'ADMIN', department: 'admin' },
  ] : [
    { email: 'admin@lanzey.in',   name: 'Admin User',      role: 'ADMIN',           department: 'admin'       },
    { email: 'cil@lanzey.in',     name: 'CIL Manager',     role: 'CIL',             department: 'cil'         },
    { email: 'cmpdi@lanzey.in',   name: 'CMPDI Engineer',  role: 'CMPDI',           department: 'cmpdi'       },
    { email: 'geo@lanzey.in',     name: 'Geologist',       role: 'GEOLOGICAL',      department: 'geological'  },
    { email: 'env@lanzey.in',     name: 'Env. Manager',    role: 'ENVIRONMENT',     department: 'environment' },
    { email: 'mach@lanzey.in',    name: 'Machinery Supt.', role: 'MACHINERY',       department: 'machinery'   },
    { email: 'reserve@lanzey.in', name: 'Reserve Checker', role: 'RESERVE_CHECKER', department: 'reserve'     },
  ]
  for (const u of userDefs) {
    await prisma.user.upsert({
      where:  { email: u.email },
      update: { name: u.name, role: u.role, department: u.department, passwordHash: pw },
      create: { email: u.email, name: u.name, role: u.role, department: u.department, passwordHash: pw },
    })
  }
  console.log(`  ✓ ${userDefs.length} users created`)

  // ── Sites ──────────────────────────────────────────────────────────
  console.log('Creating mine sites...')
  const siteDefs = [
    { code: 'CCL-001',  name: 'Bhurkunda Mine',      location: 'Bhurkunda',  state: 'Jharkhand',      company: 'CCL',  type: 'opencast'    },
    { code: 'CCL-002',  name: 'Kuju Mine',            location: 'Kuju',       state: 'Jharkhand',      company: 'CCL',  type: 'underground' },
    { code: 'ECL-001',  name: 'Rajmahal Mine',        location: 'Rajmahal',   state: 'Jharkhand',      company: 'ECL',  type: 'opencast'    },
    { code: 'BCCL-001', name: 'Jharia Mine',          location: 'Jharia',     state: 'Jharkhand',      company: 'BCCL', type: 'underground' },
    { code: 'NCL-001',  name: 'Nigahi Mine',          location: 'Singrauli',  state: 'Madhya Pradesh', company: 'NCL',  type: 'opencast'    },
    { code: 'NCL-002',  name: 'Dudhichua Mine',       location: 'Singrauli',  state: 'Madhya Pradesh', company: 'NCL',  type: 'opencast'    },
    { code: 'SECL-001', name: 'Gevra Mine',           location: 'Korba',      state: 'Chhattisgarh',   company: 'SECL', type: 'opencast'    },
    { code: 'MCL-001',  name: 'Lakhanpur Mine',       location: 'Jharsuguda', state: 'Odisha',         company: 'MCL',  type: 'opencast'    },
    { code: 'WCL-001',  name: 'Majri Mine',           location: 'Chandrapur', state: 'Maharashtra',    company: 'WCL',  type: 'underground' },
    { code: 'ECL-002',  name: 'Sonepur Bazari Mine',  location: 'Asansol',    state: 'West Bengal',    company: 'ECL',  type: 'opencast'    },
  ]
  const siteMap = {}
  for (const s of siteDefs) {
    const site = await prisma.site.upsert({
      where:  { code: s.code },
      update: { name: s.name, location: s.location, state: s.state, company: s.company, type: s.type },
      create: { ...s },
    })
    siteMap[s.code] = site.id
  }
  console.log(`  ✓ ${siteDefs.length} sites created`)

  // ── Production (2020–2026) ─────────────────────────────────────────
  console.log('Creating production records...')
  const productionByMine = {
    'CCL-001':  [38.2, 41.5, 39.8, 44.1, 46.3, 43.7, 28.4],
    'CCL-002':  [12.1, 13.4, 11.9, 14.2, 15.1, 14.8,  9.1],
    'ECL-001':  [22.4, 24.8, 23.1, 25.6, 27.3, 26.1, 16.2],
    'BCCL-001': [18.7, 19.2, 18.4, 20.1, 21.4, 20.8, 12.9],
    'NCL-001':  [45.3, 48.7, 47.2, 51.4, 54.8, 52.3, 32.6],
    'NCL-002':  [31.2, 33.8, 32.4, 35.9, 38.2, 36.7, 22.8],
    'SECL-001': [52.1, 55.6, 53.8, 58.3, 62.4, 59.7, 37.2],
    'MCL-001':  [28.4, 30.2, 29.1, 32.8, 35.1, 33.6, 20.9],
    'WCL-001':  [15.3, 16.8, 15.9, 17.6, 18.9, 18.1, 11.2],
    'ECL-002':  [24.7, 26.3, 25.1, 28.4, 30.2, 28.9, 17.9],
  }
  const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026]
  let prodCount = 0
  for (const [code, vals] of Object.entries(productionByMine)) {
    const siteId = siteMap[code]
    if (!siteId) continue
    for (let i = 0; i < years.length; i++) {
      await prisma.production.create({
        data: {
          siteId,
          date:         new Date(`${years[i]}-06-30`),
          year:         years[i],
          productionMT: vals[i],
          targetMT:     +(vals[i] * 1.05).toFixed(2),
          coalType:     'non-coking',
          source:       `Annual Production Report ${years[i]}`,
          sourceDoc:    `Production_Report_${years[i]}.pdf`,
          sourcePage:   Math.floor(Math.random() * 40) + 5,
        },
      }).catch(() => {}) // skip if already exists
      prodCount++
    }
  }
  console.log(`  ✓ ${prodCount} production records created`)

  // ── Geological Seams ───────────────────────────────────────────────
  console.log('Creating geological seams...')
  const seamsData = [
    { code: 'CCL-001',  seams: [
      { seamName: 'Seam-I',   thickness: 4.2, depth: 45,  gCV: 4850, gradeDesignation: 'G8',  ashContent: 28.4, moistureContent: 8.2 },
      { seamName: 'Seam-II',  thickness: 6.8, depth: 78,  gCV: 5200, gradeDesignation: 'G7',  ashContent: 24.1, moistureContent: 7.8 },
      { seamName: 'Seam-III', thickness: 3.1, depth: 112, gCV: 5650, gradeDesignation: 'G6',  ashContent: 20.3, moistureContent: 7.1 },
    ]},
    { code: 'NCL-001',  seams: [
      { seamName: 'Rewa-I',   thickness: 8.4, depth: 35,  gCV: 4200, gradeDesignation: 'G9',  ashContent: 32.1, moistureContent: 9.4 },
      { seamName: 'Rewa-II',  thickness: 5.2, depth: 68,  gCV: 4650, gradeDesignation: 'G8',  ashContent: 28.8, moistureContent: 8.6 },
    ]},
    { code: 'SECL-001', seams: [
      { seamName: 'Ib-I',     thickness: 12.1,depth: 28,  gCV: 3900, gradeDesignation: 'G12', ashContent: 38.4, moistureContent: 10.2 },
      { seamName: 'Ib-II',    thickness: 7.4, depth: 52,  gCV: 4100, gradeDesignation: 'G11', ashContent: 35.1, moistureContent: 9.8  },
      { seamName: 'Ib-III',   thickness: 4.8, depth: 84,  gCV: 4400, gradeDesignation: 'G10', ashContent: 31.2, moistureContent: 9.1  },
    ]},
    { code: 'ECL-001',  seams: [
      { seamName: 'Rajmahal', thickness: 9.2, depth: 42,  gCV: 4350, gradeDesignation: 'G9',  ashContent: 31.4, moistureContent: 9.2  },
    ]},
    { code: 'MCL-001',  seams: [
      { seamName: 'Ib-I',     thickness: 10.8,depth: 38,  gCV: 4050, gradeDesignation: 'G11', ashContent: 36.2, moistureContent: 10.1 },
      { seamName: 'Ib-II',    thickness: 6.2, depth: 71,  gCV: 4280, gradeDesignation: 'G10', ashContent: 32.8, moistureContent: 9.5  },
    ]},
  ]
  for (const { code, seams } of seamsData) {
    const siteId = siteMap[code]
    if (!siteId) continue
    for (const s of seams) {
      await prisma.geologicalSeam.create({
        data: {
          siteId,
          seamName:        s.seamName,
          thickness:       s.thickness,
          depth:           s.depth,
          gCV:             s.gCV,
          gradeDesignation:s.gradeDesignation,
          ashContent:      s.ashContent,
          moistureContent: s.moistureContent,
          dip:             +(Math.random() * 15 + 2).toFixed(1),
          strike:          'NE-SW',
          mineable:        true,
          source:          `Geological Survey Report — ${code}`,
          sourceDoc:       `Geological_Report_${code}.pdf`,
          sourcePage:      Math.floor(Math.random() * 60) + 10,
        },
      }).catch(() => {})
    }
  }
  console.log('  ✓ Geological seams created')

  // ── Geological blocks ──────────────────────────────────────────────
  for (const [code, siteId] of Object.entries(siteMap)) {
    await prisma.geologicalData.create({
      data: {
        siteId,
        formation:       'Gondwana',
        blockName:       `${code}-Block-A`,
        seamCount:       Math.floor(Math.random() * 4) + 1,
        totalThickness:  +(Math.random() * 20 + 5).toFixed(1),
        depth:           +(Math.random() * 100 + 30).toFixed(1),
        faults:          'Minor thrust faults in NE section',
        strata:          'Sandstone, shale, carbonaceous shale',
        explorationDate: new Date('2022-03-15'),
        source:          `CMPDI Exploration Report — ${code}`,
        sourceDoc:       `Exploration_${code}.pdf`,
        sourcePage:      15,
      },
    }).catch(() => {})
  }
  console.log('  ✓ Geological blocks created')

  // ── Reserve data ───────────────────────────────────────────────────
  console.log('Creating reserve data...')
  const reserveDefs = [
    { code: 'NCL-001',  total: 1240.5, mineable: 892.3,  cat: 'proved',   grade: 'G9',  status: 'verified'          },
    { code: 'NCL-002',  total:  845.2, mineable: 612.8,  cat: 'proved',   grade: 'G8',  status: 'verified'          },
    { code: 'SECL-001', total: 2150.8, mineable: 1580.4, cat: 'proved',   grade: 'G12', status: 'verified'          },
    { code: 'CCL-001',  total:  420.3, mineable: 310.6,  cat: 'probable', grade: 'G7',  status: 'pending'           },
    { code: 'MCL-001',  total:  680.4, mineable: 490.2,  cat: 'proved',   grade: 'G11', status: 'verified'          },
    { code: 'ECL-001',  total:  380.6, mineable: null,   cat: 'possible', grade: 'G9',  status: 'insufficient_data' },
    { code: 'BCCL-001', total:  190.2, mineable: 142.8,  cat: 'proved',   grade: 'G6',  status: 'verified'          },
  ]
  for (const r of reserveDefs) {
    const siteId = siteMap[r.code]
    if (!siteId) continue
    await prisma.reserveData.create({
      data: {
        siteId,
        blockName:          `${r.code}-Block-Main`,
        category:           r.cat,
        totalReserveMT:     r.total,
        mineableReserveMT:  r.mineable,
        coalType:           'non-coking',
        gradeDesignation:   r.grade,
        verificationStatus: r.status,
        verifiedBy:         r.status === 'verified' ? 'CMPDI Survey Team' : null,
        verifiedAt:         r.status === 'verified' ? new Date('2024-04-01') : null,
        notes:              r.mineable == null ? 'Mineable reserve requires additional borehole data.' : null,
        source:             `Reserve Estimation Report — ${r.code}`,
        sourceDoc:          `Reserve_Report_${r.code}.pdf`,
        sourcePage:         22,
      },
    }).catch(() => {})
  }
  console.log('  ✓ Reserve data created')

  // ── Machinery ──────────────────────────────────────────────────────
  console.log('Creating machinery, maintenance, telemetry...')
  const machTypes = [
    { type: 'Dragline', make: 'Bucyrus',    model: '1570-W', capacity: '24 CuM bucket' },
    { type: 'Shovel',   make: 'Komatsu',    model: 'PC8000', capacity: '42 CuM'        },
    { type: 'Dumper',   make: 'CAT',        model: '785D',   capacity: '150T'           },
    { type: 'Dumper',   make: 'BEML',       model: 'BH100',  capacity: '100T'           },
    { type: 'Dozer',    make: 'Komatsu',    model: 'D475A',  capacity: '69T'            },
    { type: 'Drill',    make: 'Atlas Copco',model: 'DM50E',  capacity: '250mm dia'      },
  ]
  const statuses = ['OPERATIONAL','OPERATIONAL','OPERATIONAL','MAINTENANCE','BREAKDOWN','IDLE']

  for (const [code, siteId] of Object.entries(siteMap).slice(0, 5)) {
    for (let i = 0; i < 4; i++) {
      const mt = machTypes[i % machTypes.length]
      const machineId = `${code}-${mt.type.slice(0,4).toUpperCase()}-${String(i+1).padStart(3,'0')}`
      const machine = await prisma.machinery.upsert({
        where:  { machineId },
        update: {},
        create: {
          siteId,
          machineId,
          name:              `${mt.make} ${mt.model}`,
          type:              mt.type,
          make:              mt.make,
          model:             mt.model,
          capacity:          mt.capacity,
          yearOfManufacture: 2018 + (i % 4),
          commissionDate:    new Date(`${2019 + (i % 3)}-04-01`),
          status:            statuses[i % statuses.length],
          location:          `${code} - Bench ${i + 1}`,
          hoursOperated:     Math.floor(Math.random() * 15000) + 2000,
        },
      })

      // Maintenance — individual creates
      for (const m of [
        { type: 'scheduled', description: '500-hour service', startDate: new Date('2026-07-15'), endDate: new Date('2026-07-16'), duration: 8, technician: 'Ramesh Kumar', cost: 45000, parts: 'Filters, brake pads', status: 'COMPLETED' },
        { type: 'breakdown',  description: 'Hydraulic pump failure', startDate: new Date('2026-05-22'), endDate: new Date('2026-05-24'), duration: 36, technician: 'Suresh Singh', cost: 185000, parts: 'Hydraulic pump assembly', status: 'COMPLETED' },
      ]) {
        await prisma.maintenance.create({ data: { machineryId: machine.id, ...m } }).catch(() => {})
      }

      // Telemetry — individual creates
      for (let j = 0; j < 5; j++) {
        await prisma.telemetry.create({
          data: {
            machineryId: machine.id,
            recordedAt:  new Date(Date.now() - j * 3600000),
            fuelLevel:   Math.round(Math.random() * 40 + 55),
            engineTemp:  Math.round(Math.random() * 20 + 75),
            oilPressure: Math.round(Math.random() * 10 + 40),
            rpm:         Math.round(Math.random() * 400 + 1200),
            hoursToday:  Math.round(Math.random() * 8 + 1),
            speed:       Math.round(Math.random() * 20),
            loadWeight:  Math.round(Math.random() * 50 + 50),
            status:      machine.status,
          },
        }).catch(() => {})
      }
    }
  }
  console.log('  ✓ Machinery, maintenance, telemetry created')

  // ── Environmental data ─────────────────────────────────────────────
  console.log('Creating environmental data...')
  const envParams = [
    { paramType: 'air',   parameter: 'SPM',  unit: 'µg/m³', standard: 600,  val: () => Math.random() * 400 + 100 },
    { paramType: 'air',   parameter: 'SO2',  unit: 'µg/m³', standard: 80,   val: () => Math.random() * 60 + 10   },
    { paramType: 'water', parameter: 'pH',   unit: 'pH',    standard: 8.5,  val: () => Math.random() * 2 + 6.5   },
    { paramType: 'water', parameter: 'TDS',  unit: 'mg/L',  standard: 2100, val: () => Math.random() * 1500 + 300 },
    { paramType: 'noise', parameter: 'Leq',  unit: 'dB(A)', standard: 75,   val: () => Math.random() * 30 + 55   },
  ]
  for (const [code, siteId] of Object.entries(siteMap).slice(0, 4)) {
    for (const ep of envParams) {
      const v = +ep.val().toFixed(2)
      await prisma.environmentalData.create({
        data: {
          siteId,
          monitoringDate: new Date('2026-09-01'),
          paramType:      ep.paramType,
          parameter:      ep.parameter,
          value:          v,
          unit:           ep.unit,
          standard:       ep.standard,
          compliant:      v <= ep.standard,
          location:       `${code} - Station 1`,
          observation:    v > ep.standard
            ? `Exceeds limit of ${ep.standard} ${ep.unit}.`
            : 'Within permissible limits.',
          source:    `Env. Monitoring Report — ${code}`,
          sourceDoc: `Env_${code}_Q2_2026.pdf`,
          sourcePage: Math.floor(Math.random() * 30) + 5,
        },
      }).catch(() => {})
    }
  }
  console.log('  ✓ Environmental data created')

  // ── Risk items ─────────────────────────────────────────────────────
  console.log('Creating risk items...')
  const riskDefs = [
    { siteCode: 'CCL-001',  title: 'Tailings dam freeboard below minimum', category: 'Environmental', severity: 5, likelihood: 2, level: 'critical', trend: 'up',   owner: 'Env. Manager',      description: 'Dam freeboard measured at 0.6m against minimum 1.0m.',     controls: ['Daily level monitoring','Emergency pumping standby','NDMA alert protocol'],        recommendedAction: 'Immediate dewatering.', status: 'OPEN', lastReview: new Date('2026-09-08') },
    { siteCode: 'BCCL-001', title: 'Slope instability — West Face Bench 4', category: 'Geological',   severity: 4, likelihood: 3, level: 'high',     trend: 'up',   owner: 'Geotech Lead',       description: 'Prism monitoring shows 18mm/day displacement.',              controls: ['Daily prism monitoring','50m exclusion zone','Weekly audit'],                      recommendedAction: 'Flatten bench angle to 42°.', status: 'OPEN', lastReview: new Date('2026-09-10') },
    { siteCode: 'NCL-001',  title: 'Dragline wire rope fatigue',            category: 'Machinery',    severity: 4, likelihood: 2, level: 'high',     trend: 'flat', owner: 'Maintenance Supt.',  description: '12% broken wires in 6-strand drag rope section.',            controls: ['Weekly rope inspection','Load limit -20%','Replacement ordered'],                 recommendedAction: 'Replace drag rope in 72h.', status: 'OPEN', lastReview: new Date('2026-09-09') },
    { siteCode: 'SECL-001', title: 'Reagent spill containment risk',        category: 'Safety',       severity: 3, likelihood: 3, level: 'medium',   trend: 'down', owner: 'SHE Manager',        description: 'Secondary bund in reagent storage needs repair.',            controls: ['Temporary earth bund','HAZMAT standby','Repair scheduled'],                       recommendedAction: 'Repair bund within 7 days.', status: 'OPEN', lastReview: new Date('2026-09-05') },
    { siteCode: 'MCL-001',  title: 'Water licence compliance risk',          category: 'Operational',  severity: 3, likelihood: 2, level: 'medium',   trend: 'flat', owner: 'Env. Manager',       description: 'Discharge approaching quarterly allocation limit.',          controls: ['Daily discharge metering','Regulator notification','Pond capacity review'],        recommendedAction: 'Reduce discharge rate.', status: 'OPEN', lastReview: new Date('2026-09-01') },
    { siteCode: null,       title: 'Contractor induction compliance gap',    category: 'Safety',       severity: 2, likelihood: 3, level: 'low',      trend: 'down', owner: 'SHE Coordinator',    description: '8% short-duration contractors without full induction.',      controls: ['Online induction mandatory','Gate access linked to status','Monthly audit'],       recommendedAction: 'Enforce gate check.', status: 'OPEN', lastReview: new Date('2026-09-09') },
  ]
  for (const r of riskDefs) {
    await prisma.riskItem.create({
      data: {
        siteId:            r.siteCode ? siteMap[r.siteCode] : null,
        title:             r.title,
        category:          r.category,
        severity:          r.severity,
        likelihood:        r.likelihood,
        level:             r.level,
        trend:             r.trend,
        owner:             r.owner,
        description:       r.description,
        controls:          JSON.stringify(r.controls),
        recommendedAction: r.recommendedAction,
        status:            r.status,
        lastReview:        r.lastReview,
      },
    }).catch(() => {})
  }
  console.log('  ✓ Risk items created')

  console.log('\n✅ Seed complete!\n')
  console.log('Login with any of these accounts (password: lanzey123):')
  console.log('  admin@lanzey.in  |  cil@lanzey.in  |  geo@lanzey.in')
  console.log('  env@lanzey.in    |  mach@lanzey.in |  reserve@lanzey.in')
  console.log('  cmpdi@lanzey.in\n')
}

main()
  .catch(e => { console.error('\n❌ Seed failed:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
