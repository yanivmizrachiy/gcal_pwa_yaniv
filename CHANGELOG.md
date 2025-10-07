# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2025-10-08] Autonomous CI/CD Expansion

### Added
- **Full Autonomous Operation Mode (FADA Level-1)** implementation
- `.github/workflows/deploy-gas.yml`: Authoritative production deployment pipeline
  - Push to `main` and manual dispatch triggers
  - Clasp authentication with `CLASPRC_JSON` secret
  - Forced push to Apps Script with `clasp push --force`
  - Fixed deployment ID updates via `clasp deploy -i`
  - SelfTest gating with retry logic (up to 4 attempts)
  - Artifact upload for selftest results
  - Comprehensive job summary with commit SHA, timestamp, deployment ID, and EXEC_URL
  - Pipeline fails if SelfTest does not return `ok:true`
  - Placeholder comment for future rollback automation
- `.github/workflows/monitor.yml`: Periodic health monitoring
  - Runs every 30 minutes via cron schedule
  - Fetches `WEB_APP_URL?mode=selftest` endpoint
  - Emits warning and fails workflow if health check fails
  - Manual dispatch support for on-demand checks
- `.github/workflows/secrets-audit.yml`: Daily secrets verification
  - Runs daily at 03:00 UTC via cron schedule
  - Verifies presence of all required secrets: `CLASPRC_JSON`, `SCRIPT_ID`, `DEPLOYMENT_ID`, `WEB_APP_URL`
  - Fails workflow if any secret is missing
  - Reports secret size metrics (without exposing values)
- `README.md`: Comprehensive project documentation
  - Project overview and features
  - CI/CD Autonomous Mode section with workflow table
  - Required secrets table with descriptions
  - Project structure documentation
  - Development guidelines
  - Governance references
- `POLICY_AUTONOMY.md`: Operational policy document
  - FADA Level-1 principles (Automated Validation, Immutable Deployment ID, Observability, Fail-Safe)
  - Protection model (Branch Protection, Environment Gating, Secret Rotation)
  - Monitoring strategy (Real-Time Health, Secrets Integrity, Deployment Validation)
  - Future hardening hooks (Rollback, Notifications, Canary, Compliance, Cost Monitoring)
  - Operational procedures (Emergency Rollback, Manual Override, Secret Recovery)
- `CHANGELOG.md`: Version history tracking (this file)

### Changed
- None - This update focuses on CI/CD and governance, no runtime logic changes

### Deprecated
- None - Legacy `gas-deploy.yml` workflow remains active during transition period

### Security
- Secrets audit workflow ensures configuration integrity
- Environment gating for production deployments
- Immutable deployment IDs prevent configuration drift

### Notes
- **Migration Path**: New workflows use `CLASPRC_JSON`, `SCRIPT_ID`, `DEPLOYMENT_ID`, `WEB_APP_URL` secrets. Legacy workflows may use `CLASP_TOKEN_JSON` and `GAS_SCRIPT_ID`. Ensure both naming conventions exist during transition.
- **No Runtime Changes**: All changes are infrastructure-only; `src/Code.gs` calendar logic unchanged.
- **Post-Merge Actions**:
  1. Verify all required secrets exist in repository settings
  2. Run manual dispatch of "Deploy Google Apps Script" workflow to validate
  3. Monitor first scheduled run of "Monitor Health" workflow
  4. Consider deprecating legacy `gas-deploy.yml` after stability observed
