# CredVault — Certificate Issuing & Verification Platform (Frontend)

Vanilla HTML, CSS, and JavaScript frontend for **CredVault**, connected to the Spring Boot backend at `http://localhost:8080`.

## Features & Workflows

- **Request Certificate (`/request`)**: Submit citizen applications (`POST /api/applications`) and receive a generated Application ID (`APP-...`).
- **Track Application (`/track`)**: Look up application status (`GET /api/applications/track/{applicationId}`).
- **Verify Certificate (`/verify`)**: Verify certificate authenticity (`GET /api/certificates/verify/{certificateId}`), returning holder details, issue date, and status (`Valid` or `Revoked`).
- **Admin Dashboard**:
  - Sign in (`POST /api/admin/login`) using seeded credentials (`admin` / `admin123`).
  - View applications (`GET /api/admin/applications`), approve & issue certificates (`PATCH /api/admin/applications/{applicationId}/approve`), or reject applications (`PATCH /api/admin/applications/{applicationId}/reject`).
  - View certificates (`GET /api/admin/certificates`) and revoke valid certificates (`GET /api/admin/certificates/{certificateId}/revoke`).

## Running Locally

1. Start the Spring Boot backend on `http://localhost:8080` first.
2. Open `index.html` in a browser (or serve the `CredVault` folder via a local/VS Code Live Server).
3. Use admin credentials **`admin`** / **`admin123`** to access the **Applications** and **Certificates** views.