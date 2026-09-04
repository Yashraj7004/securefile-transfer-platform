# 🛡️ SecureFile Transfer Platform

> **A production-grade, highly secure, and scalable cloud-style file storage, encryption, and sharing platform with real-time download tracking and role-based access control.**

---

## 📌 Project Overview

**SecureFile Transfer Platform** is an enterprise-inspired file transfer application (conceptually similar to Google Drive and WeTransfer) built from the ground up to showcase clean full-stack engineering, defense-in-depth security, and memory-efficient streaming.

Uploaded files undergo **server-side streaming AES-256-CBC encryption** with unique 16-byte initialization vectors (IVs) generated per file. Raw, unencrypted files never touch disk storage or MongoDB. File downloads decrypt the encrypted stream on-the-fly directly to the HTTP response, keeping the memory footprint minimal even for 500 MB+ transfers.

### Key Highlights
- 🔐 **End-to-End Streaming AES-256 Encryption**: Native Node.js `crypto` stream pipelines for upload encryption and download decryption.
- ⚡ **Zero-Buffering Architecture**: No large files are buffered entirely in RAM; Node streams pipe chunks from socket to cipher to disk.
- 🔗 **Granular Shareable Links**: Cryptographically secure 40-character random tokens, optional bcrypt passphrases, download caps (e.g. 1-time download), and expirations (1h, 1d, 7d, 30d, custom).
- 📊 **Download Tracking & Audit Logs**: Full IP address, timestamp, and user-agent logging on every download event.
- 👥 **Role-Based Access Control (RBAC)**: Enforced both on the Express API middleware layer and frontend route guards.
- 🗄️ **Pluggable Storage Layer**: Unified `StorageService` interface allowing local disk storage to be swapped with AWS S3, Azure Blob, or Google Cloud Storage without altering API controllers.
- 🚀 **Zero-Config Developer Experience**: Automatic fallback to embedded MongoDB if local MongoDB service is not started.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite | High-performance modern Single-Page Application (SPA) |
| **Routing** | React Router v6 | Client-side navigation, Protected and Admin route guards |
| **Styling** | Tailwind CSS, Lucide Icons | Responsive modern SaaS design system |
| **HTTP Client** | Axios | REST client with interceptors for JWT injection and auto-logout |
| **Backend** | Node.js, Express.js | RESTful API server, streaming pipelines |
| **Database** | MongoDB, Mongoose | Schema definitions, compound indexes, and audit logging |
| **Security** | Helmet, CORS, Rate-Limit | Security headers, strict CORS, and brute-force protection |
| **Cryptography**| AES-256-CBC, Bcrypt | File stream ciphering, password hashing, secure tokens |
| **Testing** | Jest, Supertest | Automated integration testing for Auth, Crypto, Shares, RBAC |
| **DevOps** | Docker, Docker Compose | Containerized multi-service deployment |

---

## 🏗️ System Architecture

```
                                  +-----------------------------+
                                  |   React + Vite Frontend     |
                                  | (Tailwind CSS, Lucide,      |
                                  |  Axios, React Router v6)    |
                                  +--------------+--------------+
                                                 |
                                         RESTful JSON / Streams
                                         (JWT Auth / Bearer)
                                                 |
                                                 v
                                  +-----------------------------+
                                  |     Express.js Backend      |
                                  | (Helmet, CORS, Rate Limit)  |
                                  +--------------+--------------+
                                                 |
                 +-------------------------------+-------------------------------+
                 |                               |                               |
                 v                               v                               v
    +-------------------------+     +-------------------------+     +-------------------------+
    |   Auth & RBAC Layer     |     | Streaming Crypto Layer  |     |  Pluggable Storage      |
    | - JWT Verification      |     | - AES-256 Cipher stream |     | - LocalStorageService   |
    | - requireRole('admin')  |     | - AES-256 Decipher strm |     | - Future S3 / Azure     |
    | - Storage Quota Checks  |     | - Unique IV per file    |     |                         |
    +-------------------------+     +-------------------------+     +-------------------------+
                 |                               |                               |
                 v                               v                               v
    +-------------------------+     +-------------------------+     +-------------------------+
    |    MongoDB Models       |     |   Download Tracking     |     |   Encrypted Filesystem  |
    | - User (quota/roles)    |     | - IP, UserAgent, time   |     | - No raw plaintext     |
    | - File (IV, metadata)   |     | - Per-file/share stats  |     | - Random UUID paths     |
    | - ShareLink (expiry)    |     | - Dashboard analytics   |     | - Streamed to client    |
    | - DownloadLog (audit)   |     |                         |     |                         |
    +-------------------------+     +-------------------------+     +-------------------------+
```

---

## 📁 Folder Structure

```
file-transfer-project/
├── docker-compose.yml              # Multi-container orchestration (Mongo, API, Client)
├── package.json                    # Workspace root scripts
├── README.md                       # Complete technical documentation
│
├── server/                         # Backend Express API
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   ├── storage/
│   │   ├── encrypted/              # Storage for AES-256 encrypted files
│   │   └── temp/                   # Staging directory for incoming chunks
│   ├── src/
│   │   ├── app.js                  # Express application configuration & middleware
│   │   ├── server.js               # Entry point, DB connection & server listener
│   │   ├── config/
│   │   │   ├── db.js               # MongoDB connection with zero-config fallback
│   │   │   └── env.js              # Validated environment configuration
│   │   ├── controllers/
│   │   │   ├── authController.js   # Registration, login, profile management
│   │   │   ├── fileController.js   # File upload, query, streaming download, delete
│   │   │   ├── shareController.js  # Share links, password verification, public download
│   │   │   ├── adminController.js  # System stats, user management, file moderation
│   │   │   └── dashboardController.js # Quotas, recent uploads, and activity feed
│   │   ├── middleware/
│   │   │   ├── auth.js             # authenticateUser, authorizeRoles, optionalAuth
│   │   │   ├── errorHandler.js     # ApiError class, central 400/401/403/404/500 handler
│   │   │   ├── rateLimiter.js      # Endpoint rate limiters
│   │   │   ├── upload.js           # Multer file staging & dangerous extension filter
│   │   │   └── validators.js       # Express-validator schemas
│   │   ├── models/
│   │   │   ├── User.js             # User credentials, roles, storage quota
│   │   │   ├── File.js             # File metadata & encryption IV details
│   │   │   ├── ShareLink.js        # Tokens, passwords, expirations, download limits
│   │   │   └── DownloadLog.js      # Audit log entries
│   │   ├── services/
│   │   │   ├── authService.js      # Auth business logic
│   │   │   ├── cryptoService.js    # AES-256 stream encryption/decryption
│   │   │   ├── fileService.js      # File lifecycle orchestration
│   │   │   ├── shareService.js     # Public share lifecycle
│   │   │   └── storageService.js   # Storage interface & LocalStorageService
│   │   └── utils/
│   │       ├── helpers.js          # Sanitization, token generator, byte formatter
│   │       └── logger.js           # Formatted console logger
│   └── tests/
│       ├── setup.js                # MongoMemoryServer test fixture
│       ├── auth.test.js            # Auth & JWT integration tests
│       ├── file_and_share.test.js  # Encryption, upload, download, and share tests
│       └── admin_rbac.test.js      # Role-based access control tests
│
└── client/                         # Frontend React + Vite SPA
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── src/
    │   ├── App.jsx                 # Routes and provider hierarchy
    │   ├── main.jsx                # Application root mount
    │   ├── index.css               # Tailwind & custom scrollbar styles
    │   ├── components/
    │   │   ├── common/             # Navbar, Sidebar, Modal, Button, Badge, etc.
    │   │   └── files/              # UploadBox, FileCard, FileTable, ShareModal, etc.
    │   ├── context/
    │   │   ├── AuthContext.jsx     # User session state and methods
    │   │   └── ToastContext.jsx    # Toast notification system
    │   ├── layouts/
    │   │   ├── AppLayout.jsx       # Authenticated layout with Navbar & Sidebar
    │   │   └── AuthLayout.jsx      # Clean centered layout for Login/Register
    │   ├── pages/
    │   │   ├── LandingPage.jsx     # SaaS presentation page
    │   │   ├── LoginPage.jsx       # Login with demo autofill buttons
    │   │   ├── RegisterPage.jsx    # Registration with password strength meter
    │   │   ├── DashboardPage.jsx   # Storage usage gauge, metrics, quick upload
    │   │   ├── MyFilesPage.jsx     # File explorer with search, filters, table/grid
    │   │   ├── UploadPage.jsx      # Drag & drop upload center
    │   │   ├── SharedFilesPage.jsx # Manage links, copy URLs, toggle active status
    │   │   ├── ActivityPage.jsx    # Audit logs for all downloads
    │   │   ├── ProfilePage.jsx     # Account details & password update
    │   │   ├── PublicSharePage.jsx # WeTransfer-style public download page
    │   │   ├── AdminDashboardPage.jsx # System-wide analytics
    │   │   ├── AdminUsersPage.jsx  # User management (toggle active, change role)
    │   │   ├── AdminFilesPage.jsx  # Global file moderation
    │   │   └── NotFoundPage.jsx    # 404 page
    │   ├── routes/
    │   │   ├── ProtectedRoute.jsx  # Authentication gate
    │   │   └── AdminRoute.jsx      # RBAC administrator gate
    │   └── services/
    │       ├── api.js              # Axios instance with Bearer interceptors
    │       ├── authService.js
    │       ├── fileService.js
    │       ├── shareService.js
    │       └── adminService.js
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: v18+ (tested on Node v24 LTS)
- **npm**: v9+
- *(Optional)* MongoDB: If a local MongoDB instance is not running on port `27017`, the backend will **automatically initialize an embedded in-memory MongoDB engine** so you can run the project immediately with zero setup!

### Step 1: Install Dependencies
From the project root:
```bash
# Install root, backend, and frontend packages
npm run install:all
```
*(Or navigate into `server/` and run `npm install`, then into `client/` and run `npm install`)*.

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` in the `server` directory:
```bash
# Windows PowerShell:
Copy-Item server/.env.example server/.env

# Linux/macOS:
cp server/.env.example server/.env
```

Default configuration in `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/securefile_db
JWT_SECRET=super_secret_jwt_key_securefile_transfer_2026_dev_prod
JWT_EXPIRES_IN=7d
FILE_ENCRYPTION_KEY=01234567890123456789012345678901
UPLOAD_DIR=./storage
MAX_FILE_SIZE=524288000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Step 3: Run the Application

#### Terminal 1 — Start Backend Server:
```bash
cd server
npm start
```
*Backend API will run on `http://localhost:5000`.*

#### Terminal 2 — Start Frontend Client:
```bash
cd client
npm run dev
```
*Frontend application will run on `http://localhost:5173`.*

---

## 🔑 Pre-Seeded Test Credentials

When first run, the database automatically seeds demo accounts for instant evaluation:

| Role | Email | Password | Storage Quota | Capabilities |
|---|---|---|---|---|
| **Administrator** | `admin@securefile.local` | `Admin@12345` | 10 GB | Full system access, all files, user management, system metrics |
| **Standard User** | `user@securefile.local` | `User@12345` | 5 GB | Upload, download own files, share files, download tracking |

> 💡 *On the Login page, click the **"Admin Demo"** or **"User Demo"** button to automatically populate credentials and sign in with one click!*

---

## 🔒 Security & Cryptography Implementation

### 1. File Upload & Encryption Pipeline
```
[Client Upload Stream]
          │
          ▼
[Multer Staging (Temp)]  ──> Validate Size & Block Dangerous Extensions (.exe, .bat, .sh)
          │
          ▼
[Crypto Transform Stream]  ──> AES-256-CBC cipher with random 16-byte IV per file
          │
          ▼
[Encrypted Disk Storage]   ──> File stored as UUID_timestamp.ext.enc (zero plaintext on disk)
          │
          ▼
[MongoDB Metadata]         ──> Stores encrypted: true, IV hex, size, owner, download count
```

### 2. File Download & Decryption Pipeline
```
[HTTP GET /api/files/:id/download]
          │
          ▼
[Auth & Ownership Verification]  ──> Verified against req.user._id or admin privilege
          │
          ▼
[Encrypted ReadStream]           ──> Read from storage/encrypted/<storedName>
          │
          ▼
[Decipher Transform Stream]      ──> AES-256-CBC decipher using file's unique IV
          │
          ▼
[HTTP Response Stream]           ──> Direct chunk streaming with Content-Disposition
          │
          ▼
[Audit Log Recorded]             ──> Timestamp, client IP, and user-agent stored in DownloadLog
```

### 3. Share Links Security
- **Token Generation**: High-entropy 40-character hexadecimal token (`crypto.randomBytes(20).toString('hex')`).
- **Passphrase Hashing**: Passwords for share links are hashed using `bcrypt` (10 salt rounds); plain-text passwords are never stored.
- **Expiration Enforcement**: Supports `1h`, `1d`, `7d`, `30d`, `custom`, and `never`. Expired requests are immediately blocked with a clear message.
- **Download Limits**: Owners can specify a maximum download cap (e.g. `1` for single-use burn-after-reading transfers). Upon reaching the threshold, the link automatically deactivates.

---

## 📡 Complete REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create account (`name`, `email`, `password`, `confirmPassword`).
- `POST /api/auth/login` - Authenticate user, returns JWT token and user info.
- `GET /api/auth/me` - Get authenticated user profile and current quota usage (Bearer token required).
- `PUT /api/auth/profile` - Update display name or password.

### Files (`/api/files`)
- `POST /api/files/upload` - Upload file via `multipart/form-data` (`file` field).
- `GET /api/files` - List user's files (query params: `search`, `category`, `sortBy`, `sortOrder`, `page`, `limit`).
- `GET /api/files/:id` - Get file metadata.
- `GET /api/files/:id/download` - Stream decrypted file download.
- `DELETE /api/files/:id` - Delete file, release storage quota, and revoke share links.

### Sharing (`/api/share`)
- `POST /api/share` - Create share link (`fileId`, `expiration`, `password`, `maxDownloads`).
- `GET /api/share` - List user's active share links.
- `GET /api/share/:token` - Get public share metadata (name, size, type, expiration, password requirement).
- `POST /api/share/:token/verify` - Verify passphrase for protected link.
- `GET /api/share/:token/download` - Stream decrypted file download (accepts `?password=...`).
- `PATCH /api/share/:id` - Update share link status (toggle active/inactive, update download limit).
- `DELETE /api/share/:id` - Revoke / delete share link.

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard/stats` - Total files, storage used, storage limit, downloads, active shares.
- `GET /api/dashboard/activity` - Recent uploads and recent download audit records.

### Administration (`/api/admin`) *(Requires `admin` role)*
- `GET /api/admin/stats` - System-wide stats: total users, active users, total files, storage used, downloads.
- `GET /api/admin/users` - Paginated user list with role and status filtering.
- `PATCH /api/admin/users/:id/status` - Toggle user active or disabled status.
- `PATCH /api/admin/users/:id/role` - Elevate or demote user role (`user` / `admin`).
- `GET /api/admin/files` - Browse all files in the system with owner details.
- `DELETE /api/admin/files/:id` - Moderate/delete inappropriate file across any user.

---

## 🧪 Automated Testing

The backend includes a comprehensive Jest and Supertest integration suite:

```bash
cd server
npm test
```

### Test Coverage Areas:
1. **Authentication**: Registration, email validation, password strength requirements, duplicate prevention, credential verification, and JWT issuance.
2. **Streaming Encryption & Storage**: File upload, verification that bytes on disk are ciphered and NOT plaintext, streaming decryption validation, and IDOR protection.
3. **Sharing**: Share link generation, public access, password-protected downloads, expiration rejection, and download limits.
4. **Admin & RBAC**: Admin privileges, blocking regular users with `403 Forbidden`, and account deactivation verification.

---

## 🐳 Docker Deployment

To launch the full stack (Node Backend, React Frontend with Nginx, and MongoDB) using Docker:

```bash
docker-compose up --build
```

- **Frontend**: Accessible at `http://localhost:5173`
- **Backend API**: Accessible at `http://localhost:5000`
- **MongoDB**: Running internally on `mongodb:27017`

---

## 💡 Future Enhancements
- [ ] Direct AWS S3 / Azure Blob Storage adapter implementation for the `StorageService` interface.
- [ ] End-to-end client-side zero-knowledge encryption in the browser (Web Crypto API) prior to upload.
- [ ] Chunked/resumable uploads via tus protocol or custom chunk sessions for gigabyte-scale files.
- [ ] Folder hierarchy and tag organization.
- [ ] Two-factor authentication (TOTP) with QR code setup.
