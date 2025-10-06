# Operational Guide - Smart Calendar PWA

## Quick Start

### For Developers

1. **Deploy the backend:**
   ```bash
   cd /path/to/gcal_pwa_yaniv
   clasp push
   clasp deploy
   ```

2. **Get the deployment URL:**
   ```bash
   clasp open --webapp
   ```

3. **Update the frontend:**
   - Edit `index.html` and replace the iframe `src` with your deployment URL

4. **Test the deployment:**
   ```bash
   # Self-test
   curl "YOUR_DEPLOYMENT_URL?mode=selftest"
   ```

### For Users

1. **Access the app:**
   - Open the deployed GitHub Pages URL (or local index.html)
   
2. **Install as PWA:**
   - Click "התקן" (Install) button
   - Or use browser's "Add to Home Screen"

3. **Authorize access:**
   - First API call will prompt for Google Calendar authorization
   - Grant access to read and write calendar events

---

## Daily Operations

### Creating Events

#### Via API:
```bash
curl -X POST YOUR_DEPLOYMENT_URL \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createEvent",
    "summary": "Team Meeting",
    "start": "2024-01-15T14:00:00Z",
    "end": "2024-01-15T15:00:00Z",
    "location": "Conference Room"
  }'
```

#### Via Hebrew NLP:
```bash
curl -X POST YOUR_DEPLOYMENT_URL \
  -H "Content-Type: application/json" \
  -d '{
    "action": "text",
    "text": "פגישה מחר בשעה 14:00"
  }'
```

### Finding Events

```bash
curl -X POST YOUR_DEPLOYMENT_URL \
  -H "Content-Type: application/json" \
  -d '{
    "action": "findEvents",
    "options": {
      "timeMin": "2024-01-15T00:00:00Z",
      "timeMax": "2024-01-22T00:00:00Z",
      "q": "meeting"
    }
  }'
```

### Updating Events

```bash
curl -X POST YOUR_DEPLOYMENT_URL \
  -H "Content-Type: application/json" \
  -d '{
    "action": "updateEvent",
    "id": "EVENT_ID_HERE",
    "summary": "Updated Meeting Title",
    "start": "2024-01-15T15:00:00Z"
  }'
```

### Deleting Events

```bash
curl -X POST YOUR_DEPLOYMENT_URL \
  -H "Content-Type: application/json" \
  -d '{
    "action": "deleteEvent",
    "id": "EVENT_ID_HERE"
  }'
```

---

## Monitoring

### Health Check

Run self-test regularly:
```bash
curl "YOUR_DEPLOYMENT_URL?mode=selftest"
```

Expected response:
```json
{
  "ok": true,
  "now": "2024-01-15T10:00:00Z",
  "user": "user@example.com",
  "scopes": ["calendar", "external_request", "userinfo.email"]
}
```

### Checking Logs

1. **Apps Script Logs:**
   - Open Apps Script editor
   - View → Execution log
   - Check for errors or performance issues

2. **GitHub Actions:**
   - Go to repository → Actions tab
   - Check deployment workflow status
   - Review selftest results in workflow summary

### Common Monitoring Tasks

1. **Daily:**
   - Check selftest endpoint
   - Verify deployment is accessible

2. **Weekly:**
   - Review Apps Script execution logs
   - Check for quota warnings
   - Monitor error rates

3. **Monthly:**
   - Review API usage patterns
   - Update documentation if needed
   - Check for Apps Script API updates

---

## Troubleshooting

### Issue: API returns 401/403 Unauthorized

**Cause:** OAuth authorization expired or not granted

**Solution:**
1. Re-deploy the script: `clasp deploy`
2. User must re-authorize the app
3. Check that scopes in appsscript.json are correct

---

### Issue: "Event not found" errors

**Cause:** Event ID is incorrect or event was deleted

**Solution:**
1. Use `findEvents` to get current event IDs
2. Verify the event exists in Google Calendar
3. Check that you're using the full event ID (not shortened)

---

### Issue: Hebrew NLP not parsing correctly

**Cause:** Text format not matching expected patterns

**Solution:**
1. Use `parseOnly` action to see how text is being parsed
2. Ensure text includes temporal markers (היום, מחר, etc.)
3. Include time in HH:MM format
4. Example working format: "פגישה מחר בשעה 14:00"

---

### Issue: Service Worker not updating

**Cause:** Browser caching old service worker

**Solution:**
1. Increment cache version in sw.js (e.g., 'yaniv-v4' → 'yaniv-v5')
2. Clear browser cache
3. Reload page with Ctrl+Shift+R (or Cmd+Shift+R on Mac)
4. Unregister old service worker in DevTools → Application → Service Workers

---

### Issue: API quota exceeded

**Cause:** Too many API calls

**Solution:**
1. Check Apps Script quotas: https://developers.google.com/apps-script/guides/services/quotas
2. Implement rate limiting in client
3. Reduce `maxResults` in findEvents calls
4. Cache frequently accessed data

---

### Issue: Deployment fails in GitHub Actions

**Cause:** Missing or invalid secrets

**Solution:**
1. Verify `CLASP_TOKEN_JSON` secret is set correctly
2. Verify `GAS_SCRIPT_ID` secret matches your script
3. Check workflow logs for specific error
4. Re-authenticate clasp if token expired

---

## Maintenance Tasks

### Regular Updates

1. **Keep Dependencies Updated:**
   ```bash
   npm update -g @google/clasp
   ```

2. **Monitor Apps Script API Changes:**
   - Subscribe to Google Workspace updates
   - Test new API features as they're released

3. **Review Security:**
   - Audit OAuth scopes periodically
   - Check for security advisories
   - Update service worker caching strategy if needed

### Backup

**Important:** Google Calendar data is not stored in Apps Script. Events are always in the user's Google Calendar, which Google backs up automatically.

However, you should backup:
1. Source code (already in Git)
2. Deployment IDs and URLs (document in repo)
3. Configuration secrets (store securely, not in repo)

### Performance Optimization

1. **Reduce findEvents calls:**
   - Cache results on client side
   - Use specific time ranges
   - Limit maxResults to what's needed

2. **Optimize service worker:**
   - Review cached assets regularly
   - Remove unused assets from cache
   - Monitor cache size

3. **Code optimization:**
   - Review Apps Script execution time in logs
   - Optimize slow operations
   - Consider pagination for large result sets

---

## Support Escalation

### Level 1: Self-Service
- Check this guide
- Review README.md
- Test with curl commands
- Check browser console for errors

### Level 2: Debugging
- Review Apps Script execution logs
- Check GitHub Actions workflow logs
- Use `parseOnly` for NLP debugging
- Enable verbose logging in Code.gs

### Level 3: Google Support
- Apps Script issues: https://issuetracker.google.com/issues?q=componentid:192515
- Calendar API issues: https://developers.google.com/calendar/api/guides/troubleshooting
- OAuth issues: https://developers.google.com/identity/protocols/oauth2/troubleshooting

---

## Best Practices

### Development

1. **Test locally before deploying:**
   - Use Apps Script editor's test features
   - Test each action individually

2. **Version control:**
   - Commit frequently
   - Use descriptive commit messages
   - Tag releases

3. **Documentation:**
   - Update README when API changes
   - Document new features
   - Keep examples current

### Production

1. **Monitor actively:**
   - Set up alerts for deployment failures
   - Check selftest endpoint regularly
   - Monitor error logs

2. **Handle errors gracefully:**
   - Always return proper error responses
   - Log errors for debugging
   - Provide helpful error messages

3. **Security:**
   - Never commit secrets
   - Use environment variables for sensitive data
   - Regularly review OAuth permissions

### User Experience

1. **Response times:**
   - Keep API responses under 5 seconds
   - Use loading indicators in UI
   - Cache when possible

2. **Error messages:**
   - Use clear, actionable error messages
   - Provide Hebrew messages for user-facing errors
   - Include error codes for debugging

3. **Accessibility:**
   - Support RTL layout for Hebrew
   - Ensure keyboard navigation works
   - Test on multiple devices

---

## Automation

### CI/CD Pipeline

The repository includes automated deployment:

1. **On push to main:**
   - Code is automatically pushed to Apps Script
   - New deployment is created
   - Self-test is run
   - Deployment URL is captured

2. **On pull request:**
   - Code can be reviewed
   - Manual testing before merge

### Scheduled Tasks

Consider adding:

1. **Daily health check:**
   - Cron job to hit selftest endpoint
   - Alert on failure

2. **Weekly reports:**
   - Usage statistics
   - Error rate summary
   - Performance metrics

---

## Contact & Resources

- **Repository:** https://github.com/yanivmizrachiy/gcal_pwa_yaniv
- **Google Apps Script:** https://script.google.com
- **Calendar API Docs:** https://developers.google.com/calendar/api
- **PWA Documentation:** https://web.dev/progressive-web-apps/

---

Last Updated: 2024-01-15
Version: 1.0
