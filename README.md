# gcal_pwa_yaniv

Hebrew Calendar PWA with Google Apps Script backend - A Progressive Web Application for managing Google Calendar events with Hebrew natural language processing.

## Overview

This project provides a calendar management system with:
- **Google Apps Script Backend**: REST API for calendar CRUD operations with Hebrew NLP v1
- **Progressive Web App Frontend**: Next.js-based frontend for user interaction
- **Autonomous CI/CD**: Full deployment automation with health monitoring

## Features

- Hebrew natural language processing for event creation
- Self-test endpoint for health monitoring
- Event CRUD operations (Create, Read, Update, Delete)
- Automated deployment pipeline with validation
- Periodic health monitoring
- Daily secrets audit

## CI/CD Autonomous Mode

The repository implements **FADA Level-1** (Full Autonomous Deployment Architecture) with three automated workflows:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **Deploy Google Apps Script** | Push to `main`, Manual | Authoritative production deployment pipeline with SelfTest gating |
| **Monitor Health** | Every 30 minutes, Manual | Periodic health check of deployed service |
| **Secrets Audit** | Daily at 03:00 UTC, Manual | Verify presence of all required secrets |

### Deployment Pipeline

The deployment workflow (`deploy-gas.yml`) performs:

1. **Build & Push**: Uses `clasp` to push source to Apps Script
2. **Deploy**: Updates fixed deployment ID with new version
3. **SelfTest Gate**: Validates deployment health (retries up to 4 times)
4. **Artifact Upload**: Saves test results for debugging
5. **Summary Report**: Provides commit SHA, timestamp, deployment ID, and EXEC_URL

**Failure handling**: Pipeline fails if SelfTest does not return `ok:true`, preventing broken deployments.

### Required Secrets

Configure these secrets in your repository settings:

| Secret | Description | Example |
|--------|-------------|---------|
| `CLASPRC_JSON` | Google Apps Script authentication JSON | `{"token":{"access_token":"..."}}` |
| `SCRIPT_ID` | Apps Script project ID | `1a2b3c4d5e6f7g8h9i0j` |
| `DEPLOYMENT_ID` | Fixed deployment ID for updates | `AKfycby...` |
| `WEB_APP_URL` | Deployed web app URL | `https://script.google.com/macros/s/.../exec` |

**Note**: Legacy workflows may use `CLASP_TOKEN_JSON` and `GAS_SCRIPT_ID`. New autonomous workflows use the naming above. Ensure both sets exist during transition.

## Project Structure

```
.
├── src/                    # Google Apps Script source
│   ├── Code.gs            # Main backend logic
│   └── appsscript.json    # Apps Script manifest
├── frontend/              # Next.js PWA frontend
├── .github/workflows/     # CI/CD automation
├── POLICY_AUTONOMY.md     # Autonomous operations policy
└── CHANGELOG.md           # Version history
```

## Development

### Backend (Apps Script)

The backend provides endpoints:

- **GET** `?mode=selftest` - Health check
- **POST** with `action: selfTest` - Detailed health check
- **POST** with `action: findEvents` - Query events
- **POST** with `action: createEvent` - Create event
- **POST** with `action: updateEvent` - Update event
- **POST** with `action: deleteEvent` - Delete event
- **POST** with `action: parseNlp` - Hebrew NLP parsing

### Frontend

See `frontend/README.md` for frontend development instructions.

## Governance

- **Protection Model**: See `POLICY_AUTONOMY.md` for operational policies
- **Change History**: See `CHANGELOG.md` for version history
- **Manual Override**: All workflows support manual dispatch for emergency interventions

## License

[Specify your license]

## Support

For issues or questions, please open a GitHub issue.
