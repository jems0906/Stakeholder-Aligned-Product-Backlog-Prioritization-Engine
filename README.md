# Stakeholder-Aligned Feature Delivery Simulator

A lightweight, interactive backlog prioritization tool for Product Project.

This workspace now includes both a **static HTML/CSS/JS version** and a **React + Vite version** for demo or submission use.

## Included features

- **Stakeholder request intake** for features, bugs, and tech debt
- **RICE prioritization matrix** using Reach, Impact, Confidence, and Effort
- **Gantt-style roadmap** with dependency-aware sprint planning
- **What-if scenario planner** to show delay impact on downstream work
- **Jira / Confluence export** text output for sharing and handoff
- **Generated user stories** with acceptance criteria and sprint assignments

## Quick start

### Static version
1. Open `index.html` in a browser, or serve the folder with any static web server.
2. Review the seeded requests, including:
   - `Add approval workflows`
   - `Fix stale dashboard metrics`
   - `RBAC policy templates`
3. Add a new request and watch the roadmap, stories, and exports update instantly.

### React version
```powershell
Set-Location "c:\project\Stakeholder-Aligned Product Backlog Prioritization Engine\react-app"
npm install
npm run dev
```
Then open `http://127.0.0.1:5173/`.

## Suggested demo scenario

- Select **Add approval workflows** in the backlog.
- Open the **What-if planner**.
- Delay a dependency by 1–2 sprints.
- Show how delivery moves across quarters and affects generated sprint assignments.

## Files

- `index.html` — app layout
- `styles.css` — dashboard styling and roadmap visuals
- `app.js` — scoring logic, scheduling, stories, and export generation
- `react-app/` — React + Vite implementation

## GitHub-friendly cleanup

The repo is set up to exclude local and generated files such as:
- `.venv/`
- `react-app/node_modules/`
- `react-app/dist/`
- `*.zip`
