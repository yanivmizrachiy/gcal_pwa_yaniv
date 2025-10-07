# CHANGELOG

## [Unreleased]
- (placeholder)

## [2025-10-08] CI/CD Migration
### Added
- New workflow: `.github/workflows/deploy-gas.yml` for authoritative production deployments.
- Automated reuse of fixed `DEPLOYMENT_ID` to keep Web App URL stable.
- Documentation section in README (CI/CD – Deploy to Google Apps Script).
- Initial CHANGELOG file.

### Changed
- Deployment responsibility moved entirely to GitHub Actions (no local manual deploys in standard flow).

### Security / Ops
- Secrets-driven authentication for Apps Script deploy.
- Production environment gating supported (configure Environment reviewers in repo settings).
