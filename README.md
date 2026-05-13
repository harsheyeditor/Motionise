# Motionise

> **AI-powered non-linear video editor** — a professional-grade NLE prototype built with React + Vite.

Motionise combines a DaVinci Resolve-inspired editing interface with an AI generation pipeline, letting you compose multi-track timelines, apply effects, and generate motion-design clips from a text prompt — all in the browser.

---

## ✨ What It Is

Motionise is a **client-side NLE prototype** that demonstrates a production-quality editing workflow:

| Layer | What you get |
|---|---|
| **Media** | Asset library with search, grid/list views, drag-to-timeline |
| **Timeline** | Multi-track editor with drag, trim, split (blade), snap, markers, undo/redo |
| **Preview** | Program monitor with transport controls, safe-zones, JKL shuttle |
| **Inspector** | Transform, composite, speed, stabilisation, and AI controls per clip |
| **Color** | Color wheels, waveform scopes, curves (bottom panel, toggle via COLOR tab) |
| **AI Studio** | Template-based brief → master prompt → simulated generation pipeline |
| **Export** | Format, resolution, fps, quality settings modal |

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Then open **http://localhost:5173** in your browser.

> No API keys required. AI generation is simulated client-side.

---

## 🗂 Project Structure

```
src/
├── App.jsx                        # Root shell, panel layout, resize dividers
├── context/
│   └── AppContext.jsx             # Global state (clips, tracks, playback, undo…)
└── components/
    ├── Topbar/          # Brand, project name, workspace tabs, export
    ├── Toolbar/         # Vertical tool rail (Select, Trim, Blade, Text…)
    ├── LeftPanel/       # Media browser, Effects, Transitions, Titles
    ├── Studio/          # Program monitor, transport bar, AI command bar
    ├── Timeline/        # Multi-track timeline, clip editing, mixer
    ├── RightPanel/      # Inspector, Applied Effects, Essential Graphics
    ├── ColorPanel/      # Color wheels + waveform scopes
    ├── AIStudio/        # Full-screen AI brief → generate workflow
    ├── ExportModal/     # Export settings dialog
    └── KeyboardShortcutsModal/
```

---

## ⌨️ Key Shortcuts

| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `J` | Shuttle reverse (press again to speed up) |
| `K` | Stop shuttle |
| `L` | Shuttle forward (press again to speed up) |
| `V` | Selection tool |
| `B` | Blade tool — press again on selected clip to split |
| `T` | Trim tool |
| `M` | Add marker at playhead |
| `Del` / `Backspace` | Delete selected clip |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `?` | Keyboard shortcuts reference |

---

## 🔧 Tech Stack

| | |
|---|---|
| Framework | React 18 + Vite |
| Styling | Vanilla CSS with CSS custom properties |
| State | React Context + useReducer-style callbacks |
| Build | Vite (ESBuild) |
| Lint | ESLint + react-hooks plugin |

---

## 🎬 User Workflow

```
1. MEDIA     → Import / browse assets in the left panel
2. TIMELINE  → Drag assets onto tracks; drag to move, handles to trim
3. PREVIEW   → Use transport controls or JKL to scrub and review
4. INSPECTOR → Fine-tune transform, opacity, speed per clip (right panel)
5. COLOR     → Switch to COLOR tab (bottom nav) for grading tools
6. AI STUDIO → Click "AI STUDIO" in the top nav to generate clips from prompts
7. EXPORT    → Hit Export (top-right) to configure and render
```

---

## 📝 Notes

- All video playback and AI generation is **simulated** — no real encode or API call occurs.
- Drag-and-drop from the media browser to the timeline is fully functional.
- Undo/redo operates on a 20-step ring buffer covering clip state.
- The color panel, fairlight, and deliver workspaces are UI stubs ready for implementation.
