# Autonomous Operations Policy

**FADA Level-1**: Full Autonomous Deployment Architecture

## Overview

This document defines the operational policy for autonomous CI/CD operations in the gcal_pwa_yaniv repository. The system is designed to minimize manual intervention while maintaining safety and reliability through automated gates and monitoring.

## FADA Principles

### 1. Automated Validation
Every deployment must pass SelfTest validation before being considered successful. The pipeline:
- Executes SelfTest endpoint via GET request with `?mode=selftest`
- Retries up to 4 times with delays to handle propagation latency
- Requires `ok:true` in JSON response
- Fails the entire pipeline if validation does not pass

### 2. Immutable Deployment ID
Deployments use a fixed `DEPLOYMENT_ID` rather than creating new deployments on each push. This ensures:
- Consistent endpoint URLs
- Simplified rollback procedures
- Reduced configuration drift
- Single source of truth for production

### 3. Observability
The system maintains transparency through:
- **Job Summaries**: Each deployment generates a markdown summary with commit SHA, timestamp, deployment ID, and EXEC_URL
- **Artifacts**: SelfTest results are uploaded as artifacts for post-mortem analysis
- **Periodic Monitoring**: Health checks run every 30 minutes to detect degradation
- **Daily Audits**: Secrets presence verified daily to prevent configuration drift

### 4. Fail-Safe Mechanisms
- Deployment pipeline fails fast on SelfTest failure
- Monitor workflow emits warnings on health check failures
- Secrets audit fails if any required secret is missing
- All workflows support manual dispatch for emergency intervention

## Protection Model

### Branch Protection
- The `main` branch should be protected to require:
  - Pull request reviews before merge
  - Status checks to pass before merge
  - Up-to-date branches before merge

### Environment Gating
The deployment workflow uses GitHub environment `production` for:
- Additional approval requirements (optional)
- Environment-specific secrets
- Deployment history tracking

### Secret Rotation
Secrets should be rotated periodically:
- `CLASPRC_JSON`: Google OAuth tokens expire; refresh as needed
- `SCRIPT_ID`: Immutable after project creation
- `DEPLOYMENT_ID`: Immutable for a given deployment
- `WEB_APP_URL`: Changes only with new deployment ID

## Monitoring Strategy

### Real-Time Health Checks
**Monitor Health** workflow (`monitor.yml`):
- Frequency: Every 30 minutes
- Validation: Checks `?mode=selftest` endpoint
- Alert: Emits GitHub workflow warning on failure
- Action: Manual investigation required on consecutive failures

### Secrets Integrity
**Secrets Audit** workflow (`secrets-audit.yml`):
- Frequency: Daily at 03:00 UTC
- Validation: Verifies all required secrets exist
- Alert: Workflow fails if any secret missing
- Action: Immediate remediation required

### Deployment Validation
**Deploy Google Apps Script** workflow (`deploy-gas.yml`):
- Trigger: Every push to `main`
- Validation: SelfTest must return `ok:true`
- Alert: Entire pipeline fails on validation failure
- Action: Deployment blocked until issue resolved

## Future Hardening Hooks

The system includes placeholder comments for future enhancements:

### 1. Automated Rollback
**Location**: `deploy-gas.yml` summary step

**Intent**: Automatically revert to previous deployment on SelfTest failure

**Implementation considerations**:
- Maintain deployment version history
- Store previous `DEPLOYMENT_ID` or version descriptors
- Execute `clasp deploy -i <previous_id>` on failure
- Re-run SelfTest to confirm rollback success

### 2. External Notifications
**Location**: All workflows

**Intent**: Send alerts to external systems (Slack, Email, PagerDuty)

**Implementation considerations**:
- Add webhook secrets for notification services
- Trigger on workflow failure, not just completion
- Include deployment context (commit, author, timestamp)
- Rate-limit to avoid alert fatigue

### 3. Canary Deployments
**Location**: `deploy-gas.yml`

**Intent**: Deploy to subset of users before full rollout

**Implementation considerations**:
- Maintain separate canary deployment ID
- Route traffic based on user criteria
- Monitor canary metrics before promoting
- Automate promotion or rollback based on metrics

### 4. Compliance Logging
**Location**: All workflows

**Intent**: Export audit logs for compliance requirements

**Implementation considerations**:
- Log all deployment events to external system
- Include actor, timestamp, commit, and outcome
- Maintain immutable audit trail
- Support compliance queries and reporting

### 5. Cost Monitoring
**Location**: New workflow

**Intent**: Track Apps Script quota usage and costs

**Implementation considerations**:
- Query Apps Script API for quota metrics
- Alert on approaching limits
- Correlate usage with deployment frequency
- Optimize based on usage patterns

## Operational Procedures

### Emergency Rollback
If automated deployment causes issues:

1. Identify last known good deployment:
   ```bash
   clasp deployments
   ```

2. Revert to previous deployment ID (if available):
   ```bash
   clasp deploy -i <previous_deployment_id> -d "emergency rollback"
   ```

3. Verify rollback:
   ```bash
   curl "$WEB_APP_URL?mode=selftest"
   ```

### Manual Deployment Override
To deploy without automated pipeline:

1. Authenticate clasp locally:
   ```bash
   clasp login
   ```

2. Configure script ID:
   ```bash
   echo '{"scriptId":"<SCRIPT_ID>","rootDir":"src"}' > .clasp.json
   ```

3. Push and deploy:
   ```bash
   clasp push --force
   clasp deploy -i <DEPLOYMENT_ID> -d "manual override"
   ```

### Secret Recovery
If secrets are lost or corrupted:

1. Regenerate Google OAuth credentials via [Google Cloud Console](https://console.cloud.google.com/)
2. Run `clasp login` to generate new `.clasprc.json`
3. Update `CLASPRC_JSON` secret in repository settings
4. Trigger manual workflow run to validate

## Policy Review

This policy should be reviewed:
- Quarterly for routine updates
- After any major incident
- When adding new automation capabilities
- When compliance requirements change

**Last reviewed**: 2025-10-08
**Next review**: 2026-01-08

## References

- [Deployment Workflow](/.github/workflows/deploy-gas.yml)
- [Monitor Workflow](/.github/workflows/monitor.yml)
- [Secrets Audit Workflow](/.github/workflows/secrets-audit.yml)
- [Changelog](/CHANGELOG.md)
- [README](/README.md)
