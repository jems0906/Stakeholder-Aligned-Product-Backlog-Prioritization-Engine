# React Version

This folder contains the React + Vite upgrade of the backlog prioritization tool.

## Run locally

```powershell
Set-Location "c:\project\Stakeholder-Aligned Product Backlog Prioritization Engine\react-app"
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`

## Build for production

```powershell
npm run build
```

The app includes the same core capabilities as the static version:
- RICE prioritization
- Gantt-style roadmap
- What-if dependency planning
- Jira / Confluence export
- Generated stories and sprint assignments
