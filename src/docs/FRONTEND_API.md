# Frontend API & Data Contracts

This document describes the frontend data shapes, expected success and error responses for the mock CRUD flows used in the Connected app, and timeout recommendations to avoid long-running logic.

Notes:

- The app uses an in-memory mock API (see `src/services/mock/api.ts`) and mock data in `src/data/mockData.ts`.
- Redux Toolkit is used for primary app state: auth and app slices (`src/store`). Some legacy mock-backed data is read directly from `mockData` until fully migrated.

1. Auth / Signup

- Endpoint (mock): `signupParent(form)` / `signupTeacher(form)`
- Request payload (example ParentSignupForm):

  {
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1 555-0000",
  "relationship": "Mother",
  "emergencyContactName": "John Doe",
  "emergencyContactPhone": "+1 555-0001",
  "emergencyContactRelationship": "Father"
  }

- Success response (mock):

  {
  "success": true,
  "message": "Registration submitted for approval."
  }

- Failure response (mock):

  {
  "success": false,
  "message": "Email already registered."
  }

- Frontend behavior: on success a notification is created (for admins) and an audit log entry is stored. Use `signupParent` / `signupTeacher` thunks from `src/store/slices/authSlice.ts`.

2. Login

- Endpoint (mock): `login(form)`
- Request payload (LoginForm):

  {
  "email": "jane@example.com",
  "password": "demo123",
  "role": "parent"
  }

- Success response: returns a `User` object (mock) and the user is persisted in redux `auth` slice.
- Failure responses:
  - Invalid credentials: `{ success: false, message: 'Invalid credentials.' }`
  - Pending approval: `{ success: false, message: 'Account pending approval.' }`

3. Admin: Approve User

- Flow: Admin approves via UI which calls the mock API to set `isApproved = true`, dispatches a notification for the user, and writes an audit log.
- Notification payload shape (`Notification`):

  {
  "id": "notif-...",
  "userId": "parent-123",
  "type": "account|approval",
  "title": "Account Approved",
  "message": "Your account has been approved...",
  "isRead": false,
  "createdAt": "2024-02-07T...Z",
  "link": "/auth"
  }

- Audit log shape (`AuditLog`):

  {
  "id": "log-...",
  "adminId": "admin-1",
  "action": "USER_APPROVED",
  "targetType": "user",
  "targetId": "parent-123",
  "details": "Approved parent account for Jane Doe",
  "timestamp": "2024-02-07T...Z"
  }

4. Audit Logs

- Stored in redux `app.auditLogs` and also in `src/data/mockData.ts` (in-memory). UI components can fetch logs from the Redux slice (or via `mockApi.getAuditLogsPaginated`).
- Grouping behavior: grouped by date (YYYY-MM-DD) in the `AuditLogsForUser` helper. This keeps the list readable.

5. Timeouts and aborts

- All mock network calls simulate latency via `delay()` helpers. In production, wrap fetches with an `AbortController` and timeouts.
- Recommended timeout configuration for network calls:
  - Short ops (login, small CRUD): 8s
  - Medium ops (bulk updates, file uploads): 20s
  - Long ops (report generation): 60s

6. Migration notes

- The app currently exposes `useAuthStore` and `useAppStore` hooks that are now adapters over Redux, preserving the original hook APIs used across the app to minimize rewrites.
- Full migration plan:
  1. Move remaining domain logic (students, classes, messages) into Redux slices.
  2. Replace direct `mockData` writes with RTK thunks calling a backend API.
  3. Add integration tests for approval/audit flows.

7. Where to look in the code

- Redux store: `src/store/index.ts`
- Auth slice: `src/store/slices/authSlice.ts`
- App slice (notifications/audit): `src/store/slices/appSlice.ts`
- Mock API: `src/services/mock/api.ts`
- Mock data: `src/data/mockData.ts`

If you want, I can generate a full OpenAPI-style contract or JSON Schema for each form and response next — do you want that?
