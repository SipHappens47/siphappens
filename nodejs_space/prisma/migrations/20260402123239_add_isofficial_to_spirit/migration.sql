-- Add isofficial field to spirit table
ALTER TABLE "spirit" ADD COLUMN "isofficial" BOOLEAN NOT NULL DEFAULT false;

-- Delete all spirits that are linked to distilleries but not official
-- (auto-populated from user scans)
DELETE FROM "spirit" WHERE "distilleryid" IS NOT NULL AND "isofficial" = false;
