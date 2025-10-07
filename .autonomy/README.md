# Autonomy Framework

This directory contains the autonomous system's security, analytics, and reporting infrastructure.

## Directory Structure

```
.autonomy/
├── security/          # Security and integrity verification
│   ├── AUDIT_LOG.md              # Security event audit log
│   └── script_hashes.manifest    # SHA256 hashes of critical scripts
├── analytics/         # Analytics and metrics
│   └── timeline.json             # Aggregated autonomy timeline
└── reports/           # Autonomy execution reports
```

## Components

### 1. Security & Integrity Verification

**Purpose**: Ensure the integrity of critical automation scripts before execution.

**Files**:
- `.autonomy/security/script_hashes.manifest` - SHA256 hashes of all core scripts
- `.autonomy/security/AUDIT_LOG.md` - Chronological security event log
- `scripts/verify_hashes.js` - Validation script
- `scripts/generate_hash_manifest.sh` - Manifest generation script

**Usage**:
```bash
# Verify all script hashes
node scripts/verify_hashes.js

# Regenerate hash manifest (after intentional script changes)
bash scripts/generate_hash_manifest.sh
```

**Integration**: The `auto-progress.yml` workflow (or any autonomous workflow) should call `verify_hashes.js` immediately after checkout and before any script execution.

### 2. Analytics & Timeline Aggregation

**Purpose**: Track autonomy cycles, changes, and impact over time.

**Files**:
- `.autonomy/analytics/timeline.json` - Aggregated timeline (max 60 entries)
- `scripts/aggregate_reports.sh` - Timeline aggregation script

**Timeline Entry Format**:
```json
{
  "file": "report-12345-foo.json",
  "timestamp": "2024-01-01T12:00:00Z",
  "runId": "12345",
  "diffBytes": 2048,
  "impact": "medium"
}
```

**Impact Levels**:
- `low`: < 1000 bytes changed
- `medium`: 1000-5000 bytes changed
- `high`: > 5000 bytes changed

**Usage**:
```bash
# Aggregate reports into timeline
bash scripts/aggregate_reports.sh
```

**Workflow**: The `autonomy-analytics.yml` workflow runs aggregation 3x daily (06:00, 14:00, 22:00 UTC) and commits only if changes exceed 128 bytes.

### 3. Security Scanning (CodeQL)

**Purpose**: Automated security analysis of JavaScript/TypeScript code.

**Workflow**: `.github/workflows/codeql.yml`

**Triggers**:
- Push to `main` branch
- Daily at 06:00 UTC
- Manual dispatch

**Features**:
- Non-blocking (failures surface as security alerts, not build failures)
- Uploads findings to GitHub Security tab
- Analyzes both Google Apps Script and Next.js frontend code

## Workflows

### CodeQL Security Scanning
**File**: `.github/workflows/codeql.yml`  
**Frequency**: Daily + on push to main  
**Purpose**: Security vulnerability detection

### Autonomy Analytics
**File**: `.github/workflows/autonomy-analytics.yml`  
**Frequency**: 3x daily (06:00, 14:00, 22:00 UTC)  
**Purpose**: Timeline aggregation and metrics collection

### Auto Progress (Example)
**File**: `.github/workflows/auto-progress.example.yml`  
**Purpose**: Reference implementation showing integration of security and analytics

## Commit Message Policy

Autonomous commits follow this enhanced format:

```
[auto-cycle] cycle=<timestamp>, impact=<level>, entries=<count>[, timeline_updated=+<bytes>B]
```

**Example**:
```
[auto-cycle] cycle=1704110400, impact=medium, entries=42, timeline_updated=+256B
```

## Maintenance

### Updating Hashes After Script Changes

When you intentionally modify scripts:
1. Make your changes
2. Run: `bash scripts/generate_hash_manifest.sh`
3. Commit both the script changes and updated manifest together

### Reviewing Security Logs

Check `.autonomy/security/AUDIT_LOG.md` periodically:
- Review integrity verification results
- Monitor security scanning findings
- Archive old entries (>90 days) as needed

### Timeline Retention

The timeline maintains up to 60 recent entries. Older entries are automatically pruned during aggregation to keep the file manageable.

## Executive Autonomy Directive Compliance

This framework implements Phase 1 of the Executive Autonomy Directive:
- ✅ Production-grade security scanning (CodeQL)
- ✅ Integrity verification before script execution
- ✅ Structured analytics timeline aggregation
- ✅ Non-blocking security alerts
- ✅ Automated report compilation (max 60 entries)
- ✅ Enhanced commit policies with impact levels

## Next Steps

Future enhancements may include:
- Automated remediation for low-risk security findings
- Machine learning-based anomaly detection in timeline data
- Cross-repository security insights aggregation
- Real-time integrity monitoring webhooks
