# Google Calendar PWA with Apps Script Backend

A Progressive Web Application for Google Calendar with Hebrew NLP support, powered by Google Apps Script backend.

## Project Structure

- `src/` - Google Apps Script backend code
- `frontend/` - Next.js PWA frontend
- `icons/` - PWA icons
- `index.html` - Root PWA page
- `manifest.webmanifest` - PWA manifest
- `sw.js` - Service worker

## CI/CD – Deploy to Google Apps Script

Production deployments are fully automated via GitHub Actions.

**Workflow**: `.github/workflows/deploy-gas.yml`

**Triggers**: push to `main`, manual dispatch.

**Secrets used**:
- `CLASPRC_JSON` – full exported `~/.clasprc.json` from a trusted `clasp login` session
- `SCRIPT_ID` – Apps Script project ID
- `DEPLOYMENT_ID` – Existing Web App deployment ID (keeps URL stable)
- `WEB_APP_URL` – For log reference

**Deployment Flow**:
1. Code merged into `main` (protected branch) via PR.
2. Workflow runs: push → reuse deployment → output confirmation.
3. Web App URL remains constant; no need to reconfigure PWA unless scopes change.

**Rollback**: revert commit in GitHub → push to `main` → workflow redeploys previous stable code.

**Manual run**: Actions → Deploy Google Apps Script → Run workflow (requires environment approval if configured).

## Development

### Apps Script Backend

The backend provides:
- Calendar CRUD operations (findEvents, createEvent, updateEvent, deleteEvent)
- Hebrew Natural Language Processing (NLP v1)
- Self-test endpoint
- Legacy GET endpoints for backward compatibility

### Frontend

See `frontend/README.md` for Next.js development instructions.

## License

See repository license information.
