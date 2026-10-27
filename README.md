# HireMatch AI - Enterprise Recruitment CRM

Full-stack Recruitment CRM application featuring local, privacy-preserving NLP candidate parsing, pipeline management, job requisition tracking, and automated resume parsing.

---

## Running in Visual Studio Code (Live Server & Hot Reload)

> **Important Note regarding the VS Code "Live Server" extension:**
> This application is built with **React 19, TypeScript, Tailwind CSS, and a Node.js Express backend**. The standard VS Code "Live Server" extension (port 5500) only serves raw static HTML files and cannot compile TypeScript or handle backend API routes (like PDF document parsing and authentication).
> 
> Instead, this project comes with **built-in Live Reload (Hot Module Replacement)** powered by Vite and Node.js. Whenever you edit and save any file in VS Code, your browser updates **instantly without losing state**.

---

### Step 1: Prerequisites
- Install **Node.js** (v18.0.0 or higher recommended). Download from [nodejs.org](https://nodejs.org).
- Install **Visual Studio Code**.

---

### Step 2: Open Project in VS Code
1. Open Visual Studio Code.
2. Click **File > Open Folder...** (or press `Ctrl+K Ctrl+O` on Windows/Linux, `Cmd+O` on macOS).
3. Select this project root folder and click **Open**.

---

### Step 3: Install Dependencies
1. Open the integrated terminal in VS Code:
   - Go to menu **Terminal > New Terminal** (or press `Ctrl + \`` / `Cmd + \``).
2. Run the install command:
   ```bash
   npm install
   ```

---

### Step 4: Start the Live Dev Server
You can start the server in any of these easy ways:

#### Option A: Via Terminal (Fastest)
In the VS Code terminal, run:
```bash
npm run dev
```

#### Option B: Press `F5` in VS Code
We have pre-configured `.vscode/launch.json`:
1. Press `F5` on your keyboard (or go to the **Run & Debug** tab and click the green Play arrow).
2. VS Code will automatically start the server in the integrated terminal.

#### Option C: Press `Ctrl + Shift + B`
We have pre-configured `.vscode/tasks.json`:
- Press `Ctrl + Shift + B` (or `Cmd + Shift + B` on Mac) to start **npm: dev**.

---

### Step 5: Open in Your Browser
Once started, open your web browser to:
```
http://localhost:3000
```

- Any edits you make to `src/` or `server/` files will **automatically update live in your browser**.
- All resume parsing (PDF, DOCX, TXT) and candidate matching run locally and offline with zero external cloud API keys required.

---

### Available Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts full-stack development server with live reload on port 3000 |
| `npm test` | Runs the full automated test suite (26 unit & integration tests) |
| `npm run lint` | Type checks all TypeScript files (`tsc --noEmit`) |
| `npm run build` | Builds optimized production client bundle to `dist/` |
