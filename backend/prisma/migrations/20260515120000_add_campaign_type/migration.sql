-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM (
  'MEDICAL_EMERGENCY',
  'RESCUE_TRANSPORT',
  'SHELTER_DAILY_CARE',
  'SPAY_NEUTER_TNR',
  'ADOPTION_FOSTER',
  'BEHAVIOR_TRAINING',
  'MEMORIAL_TRIBUTE',
  'COMMUNITY_EDUCATION',
  'OTHER'
);

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN "campaignType" "CampaignType" NOT NULL DEFAULT 'OTHER';

-- CreateIndex
CREATE INDEX "Campaign_campaignType_idx" ON "Campaign"("campaignType");
