# BiyaEase Authentication & User Profiles Architecture (Phase 11)

## 1. Executive Summary

Phase 11 introduces secure user account registration, login authentication, password hashing, JWT session management, user profile screens, and automatic cloud data synchronization for saved places and favorite routes without breaking unauthenticated local offline usage.

---

## 2. Architecture & Data Flow

```
[ Mobile Client ]
  ├── Unauthenticated Local Mode ──> localStorageService (device storage)
  └── Authenticated Cloud Mode ────> AuthContext + authApiService
                                             │
                                             ▼
                                  [ Express Backend API ]
                                  ├── POST /api/auth/register
                                  ├── POST /api/auth/login
                                  ├── GET  /api/auth/me
                                  ├── POST /api/saved/places/sync
                                  └── POST /api/saved/routes/sync
                                             │
                                             ▼
                                  [ PostgreSQL + PostGIS ]
                                  ├── users table (UUID)
                                  ├── saved_places table (FK user_id)
                                  └── favorite_routes table (FK user_id)
```

---

## 3. Database Schema (`users`)

```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMPTZ
);
```

### Foreign Key Constraints
- `saved_places.user_id` -> `users(id)` ON DELETE CASCADE
- `favorite_routes.user_id` -> `users(id)` ON DELETE CASCADE

---

## 4. Security & Cryptography Standards

- **Password Hashing**: `bcryptjs` with salt rounds = 10. Plaintext passwords are never logged or stored.
- **Session Tokens**: `jsonwebtoken` (JWT) signed with `JWT_SECRET` expiring in 7 days (`7d`).
- **Token Format**: `Authorization: Bearer <token>` in HTTP request headers.
- **Middleware**:
  - `requireAuth`: Enforces valid Bearer JWT or returns `401 Unauthorized`.
  - `optionalAuth`: Attaches user object if valid token exists without blocking guest users.

---

## 5. Local-to-Cloud Data Synchronization

When a commuter signs in or registers an account:
1. `AuthContext` saves the JWT token in `localStorageService`.
2. `SavedDataContext` checks for active token and triggers background batch sync calls:
   - `POST /api/saved/places/sync`
   - `POST /api/saved/routes/sync`
3. Backend merges local entries into the user's PostgreSQL account without deleting local offline fallbacks.

---

## 6. Mobile UI Screens

- **`LoginScreen.tsx`**: Email/password authentication, error banner, and registration redirect.
- **`RegisterScreen.tsx`**: Name, email, password, confirm password fields, with instant login upon creation.
- **`ProfileScreen.tsx`**: Displays account profile details, cloud sync status (`🟢 Cloud Sync Active`), join date, guest warning banner, and sign out dialog.
