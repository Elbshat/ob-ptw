# PTW Spatial Checker

A Permit to Work (PTW) spatial conflict detection system for BAPETCO OB Gas Field.

## Project Status

The project structure has been created with the following files:

### Backend (Vercel Serverless Functions)
- ✅ `api/_lib/db.js` - Database schema and utilities
- ✅ `api/_lib/auth.js` - Authentication and authorization
- ✅ `api/login.js` - Login endpoint
- ✅ `api/state.js` - Get current state (map + permits)
- ✅ `api/map.js` - Upload/update map image
- ✅ `api/permits/index.js` - Create permits
- ✅ `api/permits/[id].js` - Update/delete permits

### Frontend (React + Vite)
- ✅ `src/main.jsx` - Entry point
- ✅ `src/helpers.js` - Utility functions
- ✅ `src/api.js` - API client
- ✅ `src/LoginModal.jsx` - Login modal component
- ✅ `src/AddPermitModal.jsx` - Add permit modal
- ✅ `src/DailyReportModal.jsx` - Daily report generator
- ✅ `src/ListTab.jsx` - Permits list view
- ✅ `src/Sidebar.jsx` - Sidebar with permit details
- ✅ `src/MapCanvas.jsx` - Interactive map canvas
- ⚠️ `src/PTWMap.jsx` - **NEEDS TO BE CREATED** (main orchestrator component)

### Configuration
- ✅ `package.json` - Dependencies
- ✅ `vercel.json` - Vercel configuration
- ✅ `vite.config.js` - Vite configuration
- ✅ `index.html` - HTML entry point
- ✅ `.gitignore` - Git ignore rules

## Missing File

The main `src/PTWMap.jsx` file needs to be created. This is the orchestrator component that:
- Manages all state (permits, map, zoom, pan, auth)
- Handles user interactions (drag, resize, zoom)
- Coordinates between all child components
- Implements the main UI layout

The complete content for this file is provided in the PTW2.docx document (FILE 22).

## Next Steps

1. Create `src/PTWMap.jsx` with the content from the document
2. Run `npm install` to install dependencies
3. Set up Vercel project and add environment variables
4. Deploy to Vercel

## Deployment Instructions

See the deployment section in the original document for complete instructions on:
- GitHub setup
- Vercel project creation
- Postgres and Blob storage setup
- Environment variables configuration
