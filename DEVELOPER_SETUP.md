# 🛠️ Developer Setup Guide

This guide provides a comprehensive walkthrough for setting up the **ACKNestJs** project on your local machine.

## 📋 Prerequisites

Ensure you have the following installed:

- **Node.js**: v24.11.0+ (LTS recommended)
- **PNPM**: v10.25.x (Required for package management)
- **Docker & Docker Compose**: For running MongoDB and Redis locally.

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Configuration

Copy the template environment file to create your local configuration:

```bash
cp .env.example .env
```

> [!IMPORTANT]
> **Default Local Settings:**
>
> - `HTTP_HOST`: `127.0.0.1` (or `localhost`)
> - `APP_TIMEZONE`: `Asia/Karachi` (Supported in updated `EnumRequestTimezone`)

### 3. Generate JWT Keys

The application uses **ES256** (Access) and **ES512** (Refresh) algorithms. You **must** generate these keys for the app to start.

```bash
pnpm generate:keys --direct-insert
```

*This command generates PEM files in `/keys` and automatically updates your `.env` with the base64-encoded strings.*

### 4. Start Infrastructure (Docker)

Ensure your local database and cache are running:

```bash
docker-compose up -d
```

*This starts MongoDB (as a replica set) and Redis.*

### 5. Database Initialization

Generate the Prisma client and seed the initial data:

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema to database
pnpm db:migrate

# Seed initial data (Roles, Permissions, etc.)
pnpm migration:seed
```

### 6. Run the Application

```bash
pnpm run start:dev
```

Access the API at `http://localhost:3000/api/v1` and Swagger documentation at `http://localhost:3000/docs`.

---

## 🔍 Troubleshooting

### ❌ `ERR_OSSL_ASN1_WRONG_TAG`

**Cause**: Invalid JWT keys in `.env` (placeholder strings).
**Fix**: Run `pnpm generate:keys --direct-insert`.

### ❌ `APP_TIMEZONE does not match any valid enum value`

**Cause**: The timezone provided in `.env` is not in the allowed list.
**Fix**: Ensure `APP_TIMEZONE` is set to a value supported in `src/common/request/enums/request.enum.ts` (e.g., `Asia/Karachi` or `Asia/Jakarta`).

### ❌ `ECONNREFUSED ::1:6379` (Redis)

**Cause**: Redis is not running or the app is trying to connect via IPv6.
**Fix**: Run `docker-compose up -d`. If issues persist, ensure `CACHE_REDIS_URL` uses `127.0.0.1` instead of `localhost`.

### ❌ `HTTP_HOST must be an ip address`

**Fix**: use `127.0.0.1` instead of `localhost`.

### ❌ Cannot find module 'generated/prisma-client'

**Fix**: Run `pnpm db:generate` OR `pnpm exec prisma generate`
