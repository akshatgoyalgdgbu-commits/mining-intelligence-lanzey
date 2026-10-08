-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "state" TEXT,
    "district" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "type" TEXT,
    "company" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "siteId" TEXT,
    "period" TEXT,
    "summary" TEXT,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "generatedById" TEXT NOT NULL,
    "exportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_documents" (
    "reportId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "report_documents_pkey" PRIMARY KEY ("reportId","documentId")
);

-- CreateTable
CREATE TABLE "production" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "quarter" TEXT,
    "productionMT" DOUBLE PRECISION NOT NULL,
    "targetMT" DOUBLE PRECISION,
    "coalType" TEXT,
    "seam" TEXT,
    "shift" TEXT,
    "source" TEXT,
    "sourceDoc" TEXT,
    "sourcePage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatch" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dispatchMT" DOUBLE PRECISION NOT NULL,
    "destination" TEXT,
    "mode" TEXT,
    "consignee" TEXT,
    "source" TEXT,
    "sourceDoc" TEXT,
    "sourcePage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geological_data" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "formation" TEXT,
    "blockName" TEXT,
    "seamCount" INTEGER,
    "totalThickness" DOUBLE PRECISION,
    "depth" DOUBLE PRECISION,
    "faults" TEXT,
    "strata" TEXT,
    "explorationDate" TIMESTAMP(3),
    "notes" TEXT,
    "source" TEXT,
    "sourceDoc" TEXT,
    "sourcePage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geological_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geological_seams" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "seamName" TEXT NOT NULL,
    "thickness" DOUBLE PRECISION,
    "depth" DOUBLE PRECISION,
    "dip" DOUBLE PRECISION,
    "strike" TEXT,
    "ashContent" DOUBLE PRECISION,
    "moistureContent" DOUBLE PRECISION,
    "gCV" DOUBLE PRECISION,
    "sulfurContent" DOUBLE PRECISION,
    "gradeDesignation" TEXT,
    "mineable" BOOLEAN DEFAULT true,
    "source" TEXT,
    "sourceDoc" TEXT,
    "sourcePage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geological_seams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserve_data" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "blockName" TEXT,
    "category" TEXT,
    "totalReserveMT" DOUBLE PRECISION,
    "mineableReserveMT" DOUBLE PRECISION,
    "coalType" TEXT,
    "gradeDesignation" TEXT,
    "verificationStatus" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "source" TEXT,
    "sourceDoc" TEXT,
    "sourcePage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reserve_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machinery" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "capacity" TEXT,
    "yearOfManufacture" INTEGER,
    "commissionDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPERATIONAL',
    "location" TEXT,
    "hoursOperated" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machinery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance" (
    "id" TEXT NOT NULL,
    "machineryId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "duration" INTEGER,
    "technician" TEXT,
    "cost" DOUBLE PRECISION,
    "parts" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry" (
    "id" TEXT NOT NULL,
    "machineryId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fuelLevel" DOUBLE PRECISION,
    "engineTemp" DOUBLE PRECISION,
    "oilPressure" DOUBLE PRECISION,
    "rpm" DOUBLE PRECISION,
    "hoursToday" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "loadWeight" DOUBLE PRECISION,
    "status" TEXT,

    CONSTRAINT "telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environmental_data" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "monitoringDate" TIMESTAMP(3) NOT NULL,
    "paramType" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "unit" TEXT,
    "standard" DOUBLE PRECISION,
    "compliant" BOOLEAN,
    "location" TEXT,
    "observation" TEXT,
    "clearanceNumber" TEXT,
    "permitNumber" TEXT,
    "source" TEXT,
    "sourceDoc" TEXT,
    "sourcePage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "environmental_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_items" (
    "id" TEXT NOT NULL,
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
    "lastReview" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "source" TEXT,
    "sourceDoc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_entries" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "siteId" TEXT,
    "department" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldValue" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION DEFAULT 0.8,
    "sourcePage" INTEGER,
    "extractedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sites_code_key" ON "sites"("code");

-- CreateIndex
CREATE UNIQUE INDEX "machinery_machineId_key" ON "machinery"("machineId");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_entries_documentId_fieldName_key" ON "knowledge_entries"("documentId", "fieldName");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_documents" ADD CONSTRAINT "report_documents_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_documents" ADD CONSTRAINT "report_documents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production" ADD CONSTRAINT "production_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch" ADD CONSTRAINT "dispatch_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geological_data" ADD CONSTRAINT "geological_data_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geological_seams" ADD CONSTRAINT "geological_seams_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserve_data" ADD CONSTRAINT "reserve_data_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machinery" ADD CONSTRAINT "machinery_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance" ADD CONSTRAINT "maintenance_machineryId_fkey" FOREIGN KEY ("machineryId") REFERENCES "machinery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry" ADD CONSTRAINT "telemetry_machineryId_fkey" FOREIGN KEY ("machineryId") REFERENCES "machinery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environmental_data" ADD CONSTRAINT "environmental_data_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_items" ADD CONSTRAINT "risk_items_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_entries" ADD CONSTRAINT "knowledge_entries_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_entries" ADD CONSTRAINT "knowledge_entries_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

