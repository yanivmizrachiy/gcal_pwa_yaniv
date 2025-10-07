# Deployment Quick Reference

## 🚀 Autonomous Deployment Flow

### Automatic Triggers
| Trigger | Frequency | Description |
|---------|-----------|-------------|
| Schedule | Every hour | Self-healing deployment |
| Push to main | On commit | Deploy when code changes |
| Manual | On demand | Workflow dispatch |

### Deployment Stages

```
┌─────────────────────────────────────────────────────────────┐
│                    GAS DEPLOYMENT (30%)                     │
├─────────────────────────────────────────────────────────────┤
│ 1. Checkout code                                            │
│ 2. Setup Node.js                                            │
│ 3. Install clasp                                            │
│ 4. Configure authentication                                  │
│ 5. Push source to Apps Script (with retry)                 │
│ 6. Create version & deploy (with retry)                    │
│ 7. Locate EXEC_URL (primary + fallback)                    │
│ 8. Run selftest (with retry)                               │
│ 9. Update progress.json → 30%                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                 EXEC_URL UPDATE (60%)                       │
├─────────────────────────────────────────────────────────────┤
│ 1. Checkout main branch                                     │
│ 2. Fetch gh-pages branch                                    │
│ 3. Switch to gh-pages                                       │
│ 4. Update EXEC_URL in index.html                           │
│ 5. Commit & push to gh-pages                               │
│ 6. Update progress.json → 60%                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   PWA DEPLOYMENT (100%)                     │
├─────────────────────────────────────────────────────────────┤
│ 1. Trigger pages.yml workflow                               │
│ 2. Build & upload static site                              │
│ 3. Deploy to GitHub Pages                                   │
│ 4. Update progress.json → 100%                             │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Progress Tracking

Check deployment progress in `progress.json`:
```bash
curl https://raw.githubusercontent.com/yanivmizrachiy/gcal_pwa_yaniv/main/progress.json
```

### Status Values
- `pending` - Not started
- `in_progress` - Currently running
- `completed` - Successfully finished
- `failed` - Error occurred

## 🔧 Manual Operations

### Trigger Deployment Manually
```bash
# Using GitHub CLI
gh workflow run gas-deploy.yml

# Via GitHub UI
Actions → GAS Deployment → Run workflow
```

### Set EXEC_URL Manually
```bash
# Method 1: Create an issue
Title: "Set EXEC_URL"
Body: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# Method 2: GitHub CLI
gh workflow run set-exec-url.yml -f exec_url="https://script.google.com/..."
```

### Check Deployment Status
```bash
# View latest workflow runs
gh run list --workflow=gas-deploy.yml --limit 5

# View specific run
gh run view RUN_ID --log

# View progress
gh api repos/yanivmizrachiy/gcal_pwa_yaniv/contents/progress.json
```

## 🔍 Monitoring

### Key Files to Monitor
| File | Purpose | Location |
|------|---------|----------|
| `progress.json` | Deployment progress | Main branch |
| `index.html` | PWA frontend with EXEC_URL | gh-pages branch |
| Workflow logs | Detailed execution logs | Actions tab |

### Health Check Endpoints
```bash
# Check GAS backend
curl "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?mode=selftest"

# Check PWA frontend
curl "https://yanivmizrachiy.github.io/gcal_pwa_yaniv/"
```

## 🛠️ Troubleshooting

### Common Issues

#### Deployment Stuck at 30%
- Check GAS deployment logs for errors
- Verify CLASP_TOKEN_JSON secret is valid
- Check GAS_SCRIPT_ID secret is correct

#### EXEC_URL Not Updated (Stuck at 60%)
- Verify gh-pages branch exists
- Check update-exec-url job logs
- Ensure index.html exists in gh-pages

#### PWA Not Deployed (Stuck at 60-100%)
- Check if pages.yml was triggered
- Verify GitHub Pages is enabled
- Check Pages deployment permissions

#### Schedule Not Running
- Repository must be active (GitHub disables after 60 days inactivity)
- Check Actions tab for disabled workflows
- Manually trigger to re-enable

### Recovery Commands

```bash
# Re-run failed workflow
gh run rerun RUN_ID

# Reset progress.json
git checkout main
cat > progress.json << EOF
{
  "lastUpdate": "",
  "currentStep": "idle",
  "percent": 0,
  ...
}
EOF
git add progress.json
git commit -m "Reset progress tracking"
git push
```

## 📝 Configuration

### Adjust Schedule Frequency
Edit `.github/workflows/gas-deploy.yml`:
```yaml
schedule:
  - cron: '0 * * * *'  # Every hour (current)
  # - cron: '0 */6 * * *'  # Every 6 hours
  # - cron: '0 0 * * *'    # Daily at midnight
  # - cron: '0 9 * * 1'    # Weekly on Monday at 9 AM
```

### Required Secrets
| Secret | Description | How to get |
|--------|-------------|------------|
| `CLASP_TOKEN_JSON` | Google Apps Script auth | Run `clasp login` locally |
| `GAS_SCRIPT_ID` | Apps Script project ID | Get from Apps Script URL |

### Required Permissions
```yaml
contents: write     # Update files and branches
actions: write      # Trigger other workflows
issues: write       # Comment on issues
pages: write        # Deploy to GitHub Pages
id-token: write     # GitHub Pages authentication
```

## 📈 Metrics

### Typical Deployment Times
- **GAS Deploy**: 2-3 minutes
- **EXEC_URL Update**: 30-60 seconds
- **PWA Deploy**: 1-2 minutes
- **Total**: ~4-6 minutes end-to-end

### Success Rates
- Monitor via GitHub Actions insights
- Track failed runs and retry patterns
- Review progress.json history

## 🔒 Security Notes

- Never commit `CLASP_TOKEN_JSON` to the repository
- Always use GitHub Secrets for sensitive data
- Review workflow permissions regularly
- Limit schedule frequency to avoid rate limits

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Google Apps Script Clasp](https://github.com/google/clasp)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Cron Expression Reference](https://crontab.guru/)
