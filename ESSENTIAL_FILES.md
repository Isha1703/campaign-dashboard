# Essential Files Guide

This document lists all essential files in the repository and their purposes.

## Core Application Files

### Frontend (React + TypeScript)
- `src/` - React application source code
- `index.html` - Main HTML entry point
- `vite.config.ts` - Vite build configuration
- `package.json` - Frontend dependencies

### Backend (Python + FastAPI)
- `simple_dashboard_server.py` - Main FastAPI server
- `market_campaign.py` - AI agents orchestration (7 agents)
- `mcp_utils.py` - MCP gateway utilities
- `requirements.txt` - Python dependencies

### Configuration
- `.env.example` - Environment variables template
- `real_mcp_gateway_config.example.json` - MCP gateway config template

## Deployment Files

- `Dockerfile` & `Dockerfile.frontend` - Container configurations
- `docker-compose.yml` - Multi-container orchestration
- `railway.json` - Railway deployment config
- `vercel.json` - Vercel deployment config

## Documentation

- `README.md` - Main documentation
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `ARCHITECTURE.md` - System architecture
- `project_description.md` - Detailed project description

## Never Commit

- `.env` - Contains secrets
- `real_mcp_gateway_config.json` - Contains OAuth credentials
- `node_modules/` - Dependencies
- `__pycache__/` - Python cache
