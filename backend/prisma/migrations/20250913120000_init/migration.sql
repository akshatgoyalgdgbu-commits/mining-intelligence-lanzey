-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "state" TEXT,
    "district" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "type" TEXT,
    "company" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeByes" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "department" TEXT,
    "siteId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "errorMessage" TEXT,
    "extractedText" TEXT,
    "metadata" TEXT,
    "pageCount" INTEGER,
    "processingProgress" INTEGER DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "documents_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "siteId" TEXT,
    "period" TEXT,
    "summary" TEXT,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "generatedById" TEXT NOT NULL,
    "exportedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reports_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "reports_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "report_documents" (
    "reportId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,

    PRIMARY KEY ("reportId", "documentId"),
    CONSTRAINT "report_documents_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "report_documents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "production" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "quarter" TEXT,
    "productionMT" REAL NOT NULL,
    "targetMT" REAL,
    "coalType" TEXT,
    "seam" TEXT,
    "shift" TEXT,
    "source" TEXT,
    "sourceDoc" TEXT,
    "sourcePage" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "production_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dispatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "dispatchMT" REAL NOT NULL,
    "destination" TEXT,
    "mode" TEXT,
    "consignee" TEXT,
    "source" TEXT,
    "sourceDoc" TEXT,
    "sourcePage" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dispatch_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "geological_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "formation" TEXT,
    "blockName" TEXT,
    "seamCount" INTEGER,
    "totalThickness" REAL,
    "depth" REAL,
    "faults" TEXT,
    "strata" TEXT,
    "explorationDate" DATETIME,
    "notes" TEXT,
    "source" TEXT,
    "sourceDoc" TEXT,
    "sourcePage" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "geological_data_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "geological_seams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "seamName" TEXT NOT NULL,
    "thickness" REAL,
    "depth" REAL,
    "dip" REAL,
    "strike" TEXT,
    "ashContent" REAL,
    "moistureContent" REAL,
    "gCV" REAL,
    "sulfurContent" REAL,
    "gradeDesignation" TEXT,
    "mineable" BOOLEAN DEFAULT true,
    "source" TEXT,
    "sourceDoc" TEXT,
    "sourcePage" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "geological_seams_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reserve_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "blockName" TEXT,
    "category" TEXT,
    "totalReserveMT" REAL,
    "mineableReserveMT" REAL,
    "coalType" TEXT,
    "gradeDesignation" TEXT,
    "verificationStatus" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "notes" TEXT,
    "source" TEXT,
    "sourceDoc" TEXT,
    "sourcePage" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reserve_data_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "machinery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "capacity" TEXT,
    "yearOfManufacture" INTEGER,
    "commissionDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPERATIONAL',
    "location" TEXT,
    "hoursOperated" REAL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "machinery_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maintenance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "machineryId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "duration" INTEGER,
    "technician" TEXT,
    "cost" REAL,
    "parts" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "maintenance_machineryId_fkey" FOREIGN KEY ("machineryId") REFERENCES "machinery" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "telemetry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "machineryId" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fuelLevel" REAL,
    "engineTemp" REAL,
    "oilPressure" REAL,
    "rpm" REAL,
    "hoursToday" REAL,
    "latitude" REAL,
    "longitude" REAL,
    "speed" REAL,
    "loadWeight" REAL,
    "status" TEXT,
    CONSTRAINT "telemetry_machineryId_fkey" FOREIGN KEY ("machineryId") REFERENCES "machinery" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "environmental_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "monitoringDate" DATETIME NOT NULL,
    "paramType" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "value" REAL,
    "unit" TEXT,
    "standard" REAL,
    "compliant" BOOLEAN,
    "location" TEXT,
    "observation" TEXT,
    "clearanceNumber" TEXT,
    "permitNumber" TEXT,
    "source" TEXT,
    "sourceDoc" TEXT,
    "sourcePage" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "environmental_data_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "risk_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "likelihood" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "trend" TEXT NOT NULL DEFAULT 'flat',
    "owner" TEXT,
    "description" TEXT,
    "controls" TEXT,
    "recommendedAction" TEXT,
    "lastReview" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "source" TEXT,
    "sourceDoc" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "risk_items_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "knowledge_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "siteId" TEXT,
    "department" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldValue" TEXT NOT NULL,
    "confidence" REAL DEFAULT 0.8,
    "sourcePage" INTEGER,
    "extractedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "knowledge_entries_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "knowledge_entries_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sites_code_key" ON "sites"("code");

-- CreateIndex
CREATE UNIQUE INDEX "machinery_machineId_key" ON "machinery"("machineId");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_entries_documentId_fieldName_key" ON "knowledge_entries"("documentId", "fieldName");

