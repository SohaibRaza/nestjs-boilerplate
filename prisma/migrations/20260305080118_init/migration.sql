-- CreateEnum
CREATE TYPE "EnumUserGender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "EnumUserStatus" AS ENUM ('active', 'inactive', 'blocked');

-- CreateEnum
CREATE TYPE "EnumUserSignUpFrom" AS ENUM ('system', 'admin', 'website', 'mobile');

-- CreateEnum
CREATE TYPE "EnumUserSignUpWith" AS ENUM ('credential', 'socialGoogle', 'socialApple');

-- CreateEnum
CREATE TYPE "EnumUserLoginFrom" AS ENUM ('website', 'mobile');

-- CreateEnum
CREATE TYPE "EnumUserLoginWith" AS ENUM ('credential', 'socialGoogle', 'socialApple');

-- CreateEnum
CREATE TYPE "EnumRoleType" AS ENUM ('superAdmin', 'admin', 'user');

-- CreateEnum
CREATE TYPE "EnumApiKeyType" AS ENUM ('system', 'default');

-- CreateEnum
CREATE TYPE "EnumTermPolicyType" AS ENUM ('termsOfService', 'privacy', 'cookies', 'marketing');

-- CreateEnum
CREATE TYPE "EnumTermPolicyStatus" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "EnumVerificationType" AS ENUM ('mobileNumber', 'email');

-- CreateEnum
CREATE TYPE "EnumPasswordHistoryType" AS ENUM ('signUp', 'forgot', 'admin', 'profile');

-- CreateEnum
CREATE TYPE "EnumActivityLogAction" AS ENUM ('userCreated', 'userBlocked', 'userUpdateStatus', 'userUpdateProfile', 'userUpdatePhotoProfile', 'userChangePassword', 'userDeleteSelf', 'userAddMobileNumber', 'userUpdateMobileNumber', 'userDeleteMobileNumber', 'userClaimUsername', 'userUpdatePasswordByAdmin', 'userLoginCredential', 'userLoginGoogle', 'userLoginApple', 'userRefreshToken', 'userVerifiedEmail', 'userSendVerificationEmail', 'userSignedUp', 'userResetPassword', 'userRevokeSession', 'userRevokeSessionByAdmin', 'userRevokeAllSessions', 'userRevokeAllSessionsByAdmin', 'userAcceptTermPolicy', 'userForgotPassword', 'userReachMaxPasswordAttempt', 'userSetupTwoFactor', 'userEnableTwoFactor', 'userDisableTwoFactor', 'userVerifyTwoFactor', 'userRegenerateTwoFactorBackupCodes', 'adminSessionRevoke', 'adminApiKeyCreate', 'adminApiKeyReset', 'adminApiKeyUpdate', 'adminApiKeyUpdateDate', 'adminApiKeyUpdateStatus', 'adminApiKeyDelete', 'adminRoleCreate', 'adminRoleUpdate', 'adminRoleDelete', 'adminTermPolicyCreate', 'adminTermPolicyDelete', 'adminTermPolicyUpdateContent', 'adminTermPolicyAddContent', 'adminTermPolicyRemoveContent', 'adminTermPolicyPublish', 'adminUserCreate', 'adminUserUpdateStatus', 'adminUserUpdatePassword', 'adminUserResetTwoFactor', 'adminUserImport');

-- CreateTable
CREATE TABLE "ApiKeys" (
    "id" TEXT NOT NULL,
    "type" "EnumApiKeyType" NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "ApiKeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "EnumRoleType" NOT NULL DEFAULT 'user',
    "abilities" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Countries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "alpha2Code" TEXT NOT NULL,
    "alpha3Code" TEXT NOT NULL,
    "phoneCode" JSONB NOT NULL,
    "continent" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "Countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMobiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "phoneCode" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "UserMobiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "email" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "password" TEXT,
    "passwordExpired" TIMESTAMP(3),
    "passwordCreated" TIMESTAMP(3),
    "passwordAttempt" INTEGER,
    "signUpAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signUpFrom" "EnumUserSignUpFrom" NOT NULL,
    "signUpWith" "EnumUserSignUpWith" NOT NULL,
    "status" "EnumUserStatus" NOT NULL DEFAULT 'active',
    "gender" "EnumUserGender",
    "countryId" TEXT NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "lastIPAddress" TEXT,
    "lastLoginFrom" "EnumUserLoginFrom",
    "lastLoginWith" "EnumUserLoginWith",
    "termPolicy" JSONB NOT NULL,
    "photo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mobileNumberId" TEXT,
    "to" TEXT NOT NULL,
    "type" "EnumVerificationType" NOT NULL,
    "token" TEXT NOT NULL,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "Verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordHistories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "type" "EnumPasswordHistoryType" NOT NULL,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "PasswordHistories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLogs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "EnumActivityLogAction" NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "ActivityLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" JSONB NOT NULL,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "Sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwoFactors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "secret" TEXT,
    "iv" TEXT,
    "backupCodes" JSONB NOT NULL DEFAULT '[]',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "requiredSetup" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "TwoFactors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermPolicies" (
    "id" TEXT NOT NULL,
    "type" "EnumTermPolicyType" NOT NULL,
    "contents" JSONB NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "EnumTermPolicyStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "TermPolicies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermPolicyUserAcceptances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "termPolicyId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "TermPolicyUserAcceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlags" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isEnable" BOOLEAN NOT NULL DEFAULT true,
    "rolloutPercent" INTEGER NOT NULL DEFAULT 100,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "FeatureFlags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForgotPasswords" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "resetAt" TIMESTAMP(3),
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "ForgotPasswords_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiKeys_name_isActive_type_createdAt_idx" ON "ApiKeys"("name", "isActive", "type", "createdAt");

-- CreateIndex
CREATE INDEX "ApiKeys_createdAt_idx" ON "ApiKeys"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKeys_key_key" ON "ApiKeys"("key");

-- CreateIndex
CREATE INDEX "Roles_name_type_createdAt_idx" ON "Roles"("name", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Roles_createdAt_idx" ON "Roles"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Roles_name_key" ON "Roles"("name");

-- CreateIndex
CREATE INDEX "Countries_name_alpha2Code_alpha3Code_continent_createdAt_idx" ON "Countries"("name", "alpha2Code", "alpha3Code", "continent", "createdAt");

-- CreateIndex
CREATE INDEX "Countries_createdAt_idx" ON "Countries"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Countries_alpha2Code_key" ON "Countries"("alpha2Code");

-- CreateIndex
CREATE UNIQUE INDEX "Countries_alpha3Code_key" ON "Countries"("alpha3Code");

-- CreateIndex
CREATE INDEX "UserMobiles_userId_idx" ON "UserMobiles"("userId");

-- CreateIndex
CREATE INDEX "UserMobiles_isVerified_idx" ON "UserMobiles"("isVerified");

-- CreateIndex
CREATE INDEX "UserMobiles_createdAt_idx" ON "UserMobiles"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserMobiles_userId_countryId_phoneCode_number_key" ON "UserMobiles"("userId", "countryId", "phoneCode", "number");

-- CreateIndex
CREATE INDEX "Users_status_countryId_roleId_createdAt_idx" ON "Users"("status", "countryId", "roleId", "createdAt");

-- CreateIndex
CREATE INDEX "Users_id_deletedAt_idx" ON "Users"("id", "deletedAt");

-- CreateIndex
CREATE INDEX "Users_email_deletedAt_idx" ON "Users"("email", "deletedAt");

-- CreateIndex
CREATE INDEX "Users_createdAt_idx" ON "Users"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE INDEX "Verifications_token_expiredAt_isUsed_type_idx" ON "Verifications"("token", "expiredAt", "isUsed", "type");

-- CreateIndex
CREATE INDEX "Verifications_token_idx" ON "Verifications"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Verifications_reference_key" ON "Verifications"("reference");

-- CreateIndex
CREATE INDEX "ActivityLogs_userId_idx" ON "ActivityLogs"("userId");

-- CreateIndex
CREATE INDEX "ActivityLogs_createdAt_idx" ON "ActivityLogs"("createdAt");

-- CreateIndex
CREATE INDEX "Sessions_userId_idx" ON "Sessions"("userId");

-- CreateIndex
CREATE INDEX "Sessions_userId_isRevoked_expiredAt_idx" ON "Sessions"("userId", "isRevoked", "expiredAt");

-- CreateIndex
CREATE INDEX "Sessions_createdAt_idx" ON "Sessions"("createdAt");

-- CreateIndex
CREATE INDEX "Sessions_updatedAt_idx" ON "Sessions"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactors_userId_key" ON "TwoFactors"("userId");

-- CreateIndex
CREATE INDEX "TwoFactors_createdAt_idx" ON "TwoFactors"("createdAt");

-- CreateIndex
CREATE INDEX "TwoFactors_updatedAt_idx" ON "TwoFactors"("updatedAt");

-- CreateIndex
CREATE INDEX "TermPolicies_type_status_createdAt_idx" ON "TermPolicies"("type", "status", "createdAt");

-- CreateIndex
CREATE INDEX "TermPolicies_createdAt_idx" ON "TermPolicies"("createdAt");

-- CreateIndex
CREATE INDEX "TermPolicies_publishedAt_idx" ON "TermPolicies"("publishedAt");

-- CreateIndex
CREATE INDEX "TermPolicies_version_idx" ON "TermPolicies"("version");

-- CreateIndex
CREATE UNIQUE INDEX "TermPolicies_type_version_key" ON "TermPolicies"("type", "version");

-- CreateIndex
CREATE INDEX "TermPolicyUserAcceptances_userId_idx" ON "TermPolicyUserAcceptances"("userId");

-- CreateIndex
CREATE INDEX "TermPolicyUserAcceptances_acceptedAt_idx" ON "TermPolicyUserAcceptances"("acceptedAt");

-- CreateIndex
CREATE INDEX "TermPolicyUserAcceptances_createdAt_idx" ON "TermPolicyUserAcceptances"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TermPolicyUserAcceptances_userId_termPolicyId_key" ON "TermPolicyUserAcceptances"("userId", "termPolicyId");

-- CreateIndex
CREATE INDEX "FeatureFlags_key_createdAt_idx" ON "FeatureFlags"("key", "createdAt");

-- CreateIndex
CREATE INDEX "FeatureFlags_createdAt_idx" ON "FeatureFlags"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlags_key_key" ON "FeatureFlags"("key");

-- CreateIndex
CREATE INDEX "ForgotPasswords_token_expiredAt_isUsed_idx" ON "ForgotPasswords"("token", "expiredAt", "isUsed");

-- CreateIndex
CREATE INDEX "ForgotPasswords_token_idx" ON "ForgotPasswords"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ForgotPasswords_reference_key" ON "ForgotPasswords"("reference");

-- AddForeignKey
ALTER TABLE "UserMobiles" ADD CONSTRAINT "UserMobiles_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMobiles" ADD CONSTRAINT "UserMobiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verifications" ADD CONSTRAINT "Verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verifications" ADD CONSTRAINT "Verifications_mobileNumberId_fkey" FOREIGN KEY ("mobileNumberId") REFERENCES "UserMobiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordHistories" ADD CONSTRAINT "PasswordHistories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLogs" ADD CONSTRAINT "ActivityLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwoFactors" ADD CONSTRAINT "TwoFactors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermPolicyUserAcceptances" ADD CONSTRAINT "TermPolicyUserAcceptances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermPolicyUserAcceptances" ADD CONSTRAINT "TermPolicyUserAcceptances_termPolicyId_fkey" FOREIGN KEY ("termPolicyId") REFERENCES "TermPolicies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForgotPasswords" ADD CONSTRAINT "ForgotPasswords_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
