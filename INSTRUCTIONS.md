# Audit & Rebuild Instructions

The "Gearbox Fintech" project has been audited and rebuilt to function independently.

## Audit Findings
1.  **Incomplete Project**: The provided zip contained a flat list of source files without project configuration (`package.json`, `tsconfig.json`).
2.  **Corrupted Files**: Some files (e.g., `Home.tsx`, `db.ts`) were truncated or corrupted in the source.
3.  **Missing Dependencies**: The codebase relied on an external "Manus" environment and "Manus OAuth" which were absent.
4.  **Missing Components**: The UI library (shadcn/ui) was referenced but not included.

## Rebuild Actions
1.  **New Architecture**: Initialized a modern standard stack:
    -   **Frontend**: React + Vite + TailwindCSS
    -   **Backend**: Node.js + Express + tRPC
    -   **Database**: SQLite (via LibSQL) + Drizzle ORM (replaced MySQL dependency)
2.  **Code Restoration**:
    -   Patched `db.ts` with a new SQLite implementation.
    -   Patched `routers.ts` to mock missing auth/system logic.
    -   Generated stubs for missing UI components (`src/components/ui/*`).
    -   Restored `Home.tsx` to a functional state.
3.  **Configuration**: Created `package.json`, `vite.config.ts`, `tsconfig.json` from scratch.

## Usage

Navigate to `rebuilt/` directory:
```powershell
cd rebuilt
```

### 1. Install Dependencies
```powershell
npm install
```

### 2. Setup Database
```powershell
npm run db:push
```

### 3. Start Servers
You need two terminals.

**Terminal 1 (Backend API):**
```powershell
npm run server
```
(Starts on port 3000)

**Terminal 2 (Frontend App):**
```powershell
npm run dev
```
(Starts on port 5173)

Open `http://localhost:5173` in your browser.
