# Progressly – NestJS Backend

A fully functional REST API backend for the Progressly project management tool, built with **NestJS**, **MongoDB** (Mongoose), and **JWT authentication**.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 10 |
| Database | MongoDB (via Mongoose) |
| Auth | JWT + bcrypt |
| Validation | class-validator |
| Language | TypeScript |

---

## 📁 Project Structure

```
src/
├── main.ts                    # Entry point, CORS, global pipes
├── app.module.ts              # Root module
├── auth/
│   ├── auth.controller.ts     # POST /auth/login, /auth/register
│   ├── auth.service.ts        # Login / register logic
│   ├── auth.module.ts
│   ├── dto/auth.dto.ts
│   ├── guards/jwt-auth.guard.ts
│   └── strategies/jwt.strategy.ts
├── users/
│   ├── users.service.ts       # User CRUD + password hashing
│   ├── users.module.ts
│   └── schemas/user.schema.ts
├── projects/
│   ├── projects.controller.ts # CRUD /projects
│   ├── projects.service.ts
│   ├── projects.module.ts
│   ├── dto/project.dto.ts
│   └── schemas/project.schema.ts
├── tasks/
│   ├── tasks.controller.ts    # CRUD /projects/:id/tasks
│   ├── tasks.service.ts
│   ├── tasks.module.ts
│   ├── dto/task.dto.ts
│   └── schemas/task.schema.ts
└── members/
    ├── members.controller.ts  # /projects/:id/members
    ├── members.service.ts
    ├── members.module.ts
    ├── dto/member.dto.ts
    └── schemas/member.schema.ts
```

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** v18+
- **MongoDB** running locally OR a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free cluster

### 2. Install dependencies

```bash
cd progressly-backend
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/progressly
JWT_SECRET=your-long-random-secret-here
```

> **MongoDB Atlas:** Replace `MONGODB_URI` with your Atlas connection string:
> `mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/progressly?retryWrites=true&w=majority`

### 4. Run in development

```bash
npm run start:dev
```

Server starts at: `http://localhost:3001/api`

### 5. Run in production

```bash
npm run build
npm run start:prod
```

---

## 🔌 Connecting the Frontend

### Step 1 – Add environment variable

In your React project root, create or update `.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

### Step 2 – Replace api.ts

Copy `frontend-api.ts` (included in this zip) into your frontend at:

```
src/src/services/api.ts
```

This replaces the mock data with real HTTP calls to the backend.

### Step 3 – Handle auth persistence (optional)

The new `api.ts` stores the JWT token in `localStorage` automatically. To restore the session on page load, add this to your `App.tsx` or root component:

```tsx
import { api } from './src/services/api';

// On app startup, check if token exists and fetch current user
useEffect(() => {
  if (api.auth.isAuthenticated()) {
    // Token is still in localStorage – user was previously logged in
    // You may want to call a /auth/me endpoint to rehydrate user state
    // For now, just redirect from landing to dashboard if token exists
  }
}, []);
```

---

## 📡 API Reference

### Auth

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | Register new user |
| POST | `/api/auth/login` | `{ email, password }` | Login, returns JWT |

Both return: `{ access_token: string, user: User }`

---

### Projects

All routes require `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | Get all projects for current user |
| POST | `/api/projects` | Create a new project |
| GET | `/api/projects/:id` | Get project by ID |
| PUT | `/api/projects/:id` | Update project (owner/admin) |
| DELETE | `/api/projects/:id` | Delete project + all tasks/members (owner/admin) |

---

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/:projectId/tasks` | Get all tasks in a project |
| POST | `/api/projects/:projectId/tasks` | Create a task |
| PUT | `/api/projects/:projectId/tasks/:taskId` | Update a task |
| DELETE | `/api/projects/:projectId/tasks/:taskId` | Delete a task (owner/admin) |

**Task statuses:** `todo` · `in_progress` · `done`  
**Task priorities:** `low` · `medium` · `high`

---

### Members

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/api/projects/:projectId/members` | — | List all members |
| POST | `/api/projects/:projectId/members/invite` | `{ email, role }` | Send invitation email |
| GET | `/api/invites/:token` | — | Get invite details by token |
| POST | `/api/invites/:token/accept` | — | Accept invite (logged in user) |
| PUT | `/api/projects/:projectId/members/:memberId/role` | `{ role }` | Change member role (owner/admin) |
| DELETE | `/api/projects/:projectId/members/:memberId` | — | Remove member (owner/admin) |

**Roles:** `owner` · `admin` · `member`

---

## 🔒 Permissions Matrix

| Action | Owner | Admin | Member |
|---|---|---|---|
| View project & tasks | ✅ | ✅ | ✅ |
| Create tasks | ✅ | ✅ | ✅ |
| Edit any task | ✅ | ✅ | ❌ |
| Change status / assignee | ✅ | ✅ | ✅ |
| Delete tasks | ✅ | ✅ | ❌ |
| Invite members | ✅ | ✅ | ❌ |
| Change member roles | ✅ | ✅ | ❌ |
| Remove members | ✅ | ✅ | ❌ |
| Edit project info | ✅ | ✅ | ❌ |
| Delete project | ✅ | ✅ | ❌ |

---

## 🗄️ MongoDB Collections

| Collection | Description |
|---|---|
| `users` | Registered users (password hashed with bcrypt) |
| `projects` | Projects with owner reference |
| `projectmembers` | Membership records with role (unique per user+project) |
| `tasks` | Tasks belonging to a project |

---

## 🛠️ Troubleshooting

**"Cannot connect to MongoDB"**  
→ Make sure MongoDB is running: `mongod` (local) or check Atlas network whitelist.

**"Unauthorized" on all requests**  
→ Make sure the `Authorization: Bearer <token>` header is being sent. Check that the frontend `.env` has `VITE_API_URL` set correctly.

**"Invite email not sent"**  
→ Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` in `.env`.

**Invite flow**
→ Existing account: user opens invite link, logs in, and accepts invite.
→ No account yet: user registers with the invited email, then accepts invite from the same token.

**CORS errors**  
→ The backend allows `localhost:5173`, `localhost:3000`, `localhost:4173` by default. If your frontend runs on a different port, update `app.enableCors()` in `src/main.ts`.
