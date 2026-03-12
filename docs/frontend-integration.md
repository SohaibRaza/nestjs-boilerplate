# Frontend Integration Guide (Technology Agnostic)

This guide provides a technically exhaustive reference for integrating a frontend application (Web or Mobile) with the backend. It is designed for both human developers and AI Agents.

---

## 1. Core Requirements

### Base Configuration

- **API Base URL**: `{{BASE_URL}}/v1`
- **Mandatory Header**: All requests MUST include `x-api-key`.
- **API Key Format**: `{{apiKey}}:{{apiSecret}}` (Colon separated).
- **Content-Type**: `application/json`

### Obtaining an API Key

For development (Local/Staging), you can use the default seeded keys or generate new ones:

1. **Seed Default Keys**: Run `pnpm run migration:seed` in the backend root.
2. **Default Local Key**:
   - **Key**: `fyFGb7ywyM37TqDY8nuhAmGW5`
   - **Secret**: `qbp7LmCxYUTHFwKvHnxGW1aTyjSNU6ytN21etK89MaP2Dj2KZP`
   - **Header Value**: `fyFGb7ywyM37TqDY8nuhAmGW5:qbp7LmCxYUTHFwKvHnxGW1aTyjSNU6ytN21etK89MaP2Dj2KZP`

3. **Production/Custom Keys**: Create them via the Admin API (`POST /v1/admin/api-key/user/:userId`).

- **Web**: `localStorage`, `sessionStorage`, or `Secure Cookies`.
- **Mobile (React Native/Flutter/Native)**: `Keychain` (iOS), `EncryptedSharedPreferences` (Android), or specialized libraries like `flutter_secure_storage` / `react-native-keychain`.

**Persist the following**:

- `accessToken`: Short-lived JWT (e.g., 1h).
- `refreshToken`: Long-lived JWT (e.g., 30d).

---

## 2. Authentication State Machine

### A. Credential Login

**Endpoint**: `POST /v1/user/login/credential`
**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Success Response (200 OK)**:

```json
{
  "isTwoFactorEnable": false,
  "tokens": {
    "tokenType": "Bearer",
    "roleType": "user",
    "expiresIn": 3600,
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

> [!IMPORTANT]
> If `isTwoFactorEnable` is `true`, the `tokens` object will be null/missing. The client MUST transition to the **2FA Verification** step.

### B. Two-Factor Verification

**Endpoint**: `POST /v1/user/login/2fa/verify`
**Request Body**:

```json
{
  "challengeToken": "...",
  "code": "123456"
}
```

### C. Social Login (Google/Apple)

**Endpoints**:

- Google: `POST /v1/user/login/social/google`
- Apple: `POST /v1/user/login/social/apple`
**Header**: `Authorization: Bearer <ID_TOKEN_FROM_PROVIDER>`

---

## 3. Registration & Verification

### A. User Sign-Up

**Endpoint**: `POST /v1/user/sign-up`

**Request Body**:

```json
{
  "email": "newuser@example.com",
  "name": "John Doe",
  "countryId": "60d5ec...",
  "password": "Password123!",
  "marketing": true,
  "cookies": true,
  "from": "website" // or "mobile"
}
```

> [!NOTE]
> `countryId` is a mandatory MongoId. You must fetch the list of available countries first.

### B. Country Selection

**Endpoint**: `GET /v1/country/list`

**Response**: Paginated list containing country IDs and names.

### C. Email Verification

After signup, the user must verify their email.

- **Verify Email**: `PATCH /v1/user/verify/email` (Body: `{"token": "..."}`)
- **Resend Code**: `POST /v1/user/send/email` (Body: `{"email": "..."}`)

---

## 4. Token Management & jti Rotation

The backend implements **jti (JWT ID) rotation** for security. When a token is refreshed, a new `jti` is generated and the old one is invalidated.

### Universal Refresh Logic (Pattern)

1. **Intercept 401 Unauthorized**: Catch the error on any protected request.
2. **Filter by Error Code**: Ensure the error is due to token expiry, not an invalid password or missing account.
3. **Atomic Refresh**: Ensure only one refresh request is sent if multiple requests fail simultaneously (use a 'refreshing' lock/mutex).
4. **Call Refresh Endpoint**: `POST /v1/user/refresh` using the `refreshToken` in the `Authorization` header.
5. **Update State**: Store the new `accessToken` and `refreshToken` (the `jti` has changed).
6. **Retry Queue**: Re-execute the original failed request(s) with the new `accessToken`.
7. **On Failure**: If the refresh itself fails (401), clear storage and redirect to Login.

---

## 4. Authorization & Permission Model

### Data Structures

Regardless of the language (Typescript, Dart, Swift), use these models:

```json
{
  "role": {
    "type": "user | admin | superAdmin",
    "abilities": [
      {
        "subject": "user",
        "action": ["read", "update"]
      }
    ]
  }
}
```

### Permission Logic (Generic)

A user is authorized if:

1. `role.type` is `superAdmin` (Full access, bypasses checks).
2. OR, an ability exists where `ability.subject` matches the resource (or is `all`) AND the required `action` is in the `ability.action` array.

---

## 5. Error & Event Mapping

Use the backend `statusCode` or `message` to trigger UI transitions:

| HTTP | Backend Identifier | Frontend Action |
| :--- | :--- | :--- |
| 401 | `USER_PASSWORD_EXPIRED` | Redirect to **Change Password** view. |
| 403 | `EMAIL_NOT_VERIFIED` | Show **Verification Pending** status/banner. |
| 403 | `INACTIVE_FORBIDDEN` | Show **Account Suspended** and Logout. |
| 403 | `TERM_POLICY_INVALID` | Show **Terms Acceptance** modal. |
| 403 | `ROLE_FORBIDDEN` | Show **Access Denied** toast/notification. |
| 404 | `USER_NOT_FOUND` | Clear session and redirect to **Login**. |

---

## 6. Common Endpoint Map

All paths are relative to `{{BASE_URL}}/v1`.

- **User Profile**: `GET /user/profile`
- **Token Refresh**: `POST /user/refresh`
- **Password Change**: `PATCH /user/change-password`
- **Logout**: Handled client-side by clearing session/tokens and optionally calling a session-revoke endpoint if available.
