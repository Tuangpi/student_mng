CREATE UNIQUE INDEX "announcements_id_schoolId_key" ON "announcements"("id", "schoolId");
CREATE UNIQUE INDEX "users_id_schoolId_key" ON "users"("id", "schoolId");

CREATE TABLE "announcementReads" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "announcementReads_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "announcementReads_announcementId_userId_key" ON "announcementReads"("announcementId", "userId");
CREATE INDEX "announcementReads_schoolId_userId_idx" ON "announcementReads"("schoolId", "userId");
ALTER TABLE "announcementReads" ADD CONSTRAINT "announcementReads_announcementId_schoolId_fkey"
    FOREIGN KEY ("announcementId", "schoolId") REFERENCES "announcements"("id", "schoolId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "announcementReads" ADD CONSTRAINT "announcementReads_userId_schoolId_fkey"
    FOREIGN KEY ("userId", "schoolId") REFERENCES "users"("id", "schoolId") ON DELETE CASCADE ON UPDATE CASCADE;