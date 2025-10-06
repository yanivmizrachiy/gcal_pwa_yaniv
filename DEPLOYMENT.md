# 🚀 Deployment Guide

Step-by-step instructions for deploying the Google Calendar Smart Editor.

---

## Prerequisites

- ✅ Google Account
- ✅ Modern web browser (Chrome, Firefox, Safari, Edge)
- ✅ Basic understanding of Google Apps Script
- ✅ (Optional) GitHub Pages, Netlify, or any static hosting for PWA

---

## Part 1: Deploy Backend (Google Apps Script)

### Step 1: Create Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click **New project**
3. Name your project: "Google Calendar Smart Editor" (or any name)

### Step 2: Copy Backend Code

1. Delete the default `function myFunction()` code
2. Copy the entire contents of `src/Code.gs` from this repository
3. Paste into the Apps Script editor
4. Save (Ctrl+S or Cmd+S)

### Step 3: Configure Project Settings

1. Click the gear icon ⚙️ (Project Settings) in the left sidebar
2. Scroll down to **Script Properties** (optional - for future config)
3. Go back to **Editor**

### Step 4: Set OAuth Scopes

1. Click **Project Settings** ⚙️
2. Scroll to **appsscript.json** section
3. Check "Show appsscript.json manifest file in editor"
4. Go back to **Editor**
5. You should now see `appsscript.json` file in the file list
6. Open it and replace contents with `src/appsscript.json` from this repo:

```json
{
  "timeZone": "Asia/Jerusalem",
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/calendar"
  ],
  "webapp": {
    "access": "ANYONE",
    "executeAs": "USER_ACCESSING"
  }
}
```

7. Save all files (Ctrl+S)

### Step 5: Test the Script (Optional)

1. Select `doGet` function from the dropdown at the top
2. Click **Run** (▶️)
3. First time: You'll be prompted to authorize
   - Click **Review permissions**
   - Choose your Google Account
   - Click **Advanced** → **Go to [Your Project Name] (unsafe)**
   - Click **Allow**
4. Check **Execution log** for output (should show success)

### Step 6: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Fill in the deployment settings:
   - **Description**: "v1.0.0 - Initial release"
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone**
5. Click **Deploy**
6. First time deployment:
   - You may need to authorize again
   - Click **Authorize access**
   - Choose your Google Account
   - Click **Advanced** → **Go to [Your Project Name] (unsafe)**
   - Click **Allow**
7. Copy the **Web app URL** (ends with `/exec`)
   - Example: `https://script.google.com/macros/s/AKfycby.../exec`
   - **SAVE THIS URL** - you'll need it for frontend configuration!
8. Click **Done**

### ✅ Backend Deployment Complete!

Test your backend:
```bash
curl "YOUR_WEB_APP_URL?mode=selftest"
```

Expected response:
```json
{
  "ok": true,
  "now": "2024-12-25T12:00:00.000Z",
  "user": "your-email@gmail.com"
}
```

---

## Part 2: Deploy Frontend (PWA)

### Option A: Quick Test (Local)

**Perfect for: Testing before deploying**

1. Download all files from this repository
2. Open a terminal in the project directory
3. Start a local server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js (npx)
   npx serve .
   
   # Node.js (http-server)
   npm install -g http-server
   http-server -p 8000
   ```
4. Open browser: `http://localhost:8000`
5. Enter your Apps Script URL in settings
6. Test the application

### Option B: GitHub Pages (Recommended)

**Perfect for: Free hosting, version control, automatic deployment**

#### Step 1: Fork or Clone Repository

```bash
# Clone the repository
git clone https://github.com/yanivmizrachiy/gcal_pwa_yaniv.git
cd gcal_pwa_yaniv

# Or fork it on GitHub and clone your fork
```

#### Step 2: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - Branch: `main` (or `master`)
   - Folder: `/ (root)`
4. Click **Save**
5. Wait a few minutes for deployment
6. Your site will be available at:
   `https://yourusername.github.io/gcal_pwa_yaniv/`

#### Step 3: Update Service Worker (if needed)

If your GitHub Pages URL is different from the root domain, update `sw.js`:

```javascript
// Change this line if needed
const ASSETS = [
  './',
  './index.html',
  // ... rest of assets
];
```

### Option C: Netlify

**Perfect for: Modern deployment with CI/CD**

1. Go to [Netlify](https://www.netlify.com)
2. Sign up/Log in
3. Click **Add new site** → **Import an existing project**
4. Connect your GitHub repository
5. Configure:
   - **Build command**: (leave empty - static site)
   - **Publish directory**: (leave empty or `.`)
6. Click **Deploy site**
7. Wait for deployment (usually < 1 minute)
8. Your site will be available at: `https://random-name.netlify.app`
9. (Optional) Configure custom domain in **Domain settings**

### Option D: Vercel

**Perfect for: Fast deployment with great developer experience**

1. Go to [Vercel](https://vercel.com)
2. Sign up/Log in with GitHub
3. Click **Add New** → **Project**
4. Import your GitHub repository
5. Click **Deploy**
6. Wait for deployment (usually < 30 seconds)
7. Your site will be available at: `https://your-project.vercel.app`

### Option E: Any Static Host

The PWA is just HTML/CSS/JS files. You can host on:
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Static Web Apps
- Firebase Hosting
- Cloudflare Pages
- Or any web server (Apache, Nginx, etc.)

Just upload all files to your web root.

---

## Part 3: Configure & Test

### Step 1: Open Your PWA

Open your deployed PWA URL in a browser.

### Step 2: Configure Backend URL

1. Find the **⚙️ הגדרות** (Settings) section
2. Paste your Apps Script Web App URL (from Part 1, Step 6)
3. The URL should end with `/exec`
4. Click away from the input field (auto-saves to localStorage)

### Step 3: Run Self Test

1. Scroll to **📅 האירועים שלי** (My Events) section
2. Click **בדיקה** (Test) button
3. You should see:
   ```
   ✅ המערכת פעילה!
   משתמש: your-email@gmail.com
   זמן: [current date/time]
   יכולות: findEvents, createEvent, updateEvent, deleteEvent, parseText
   NLP: גרסה v1, תמיכה בעברית: כן
   ```

### Step 4: Test Calendar Access

1. Click **השבוע** (This Week) button
2. First time: You may be redirected to Google OAuth consent
   - Click **Allow** to grant calendar access
3. You should see your calendar events listed

### Step 5: Test Hebrew NLP

1. In the **✍️ עורך חכם בעברית** (Smart Editor) section
2. Type: `צור פגישה בדיקה היום בשעה 14:00`
3. Click **✅ בצע פעולה** (Execute)
4. Check Google Calendar - event should be created!

### Step 6: Install PWA (Optional)

#### On Desktop (Chrome/Edge):
1. Look for install icon ➕ in address bar
2. Or click the **התקן** (Install) button in the app
3. Click **Install**
4. App will open in standalone window

#### On Android:
1. Open the PWA in Chrome
2. Click menu (⋮) → **Install app** or **Add to Home Screen**
3. Or click the **התקן** (Install) button in the app
4. App will be added to home screen

#### On iOS (Safari):
1. Open the PWA in Safari
2. Tap Share button (⬆️)
3. Tap **Add to Home Screen**
4. Tap **Add**

### ✅ Deployment Complete!

Your Google Calendar Smart Editor is now live and ready to use!

---

## Verification Checklist

After deployment, verify:

- [ ] Backend URL configured in PWA
- [ ] Self test shows "המערכת פעילה"
- [ ] OAuth authorization completed
- [ ] Can load calendar events
- [ ] Can create event via NLP (test: `צור בדיקה היום`)
- [ ] Can see created event in list
- [ ] Can delete event from list
- [ ] PWA installable (install icon appears)
- [ ] Service Worker active (check DevTools → Application)
- [ ] Works offline (after initial load, disconnect and reload)

---

## Troubleshooting

### Issue: "נא להגדיר כתובת API"

**Solution**: Enter your Apps Script URL in the settings section

### Issue: OAuth Authorization Loop

**Solution**: 
1. Clear browser cookies for `script.google.com`
2. Try in incognito/private window
3. Make sure "Who has access" is set to "Anyone" in Apps Script deployment

### Issue: "Error 401" or "Unauthorized"

**Solution**:
1. Re-deploy the web app in Apps Script
2. Make sure "Execute as" is "Me" (not "User accessing the web app")
3. Re-authorize the application

### Issue: Events Not Loading

**Solution**:
1. Check browser console for errors (F12)
2. Verify OAuth authorization
3. Make sure you have events in your calendar
4. Try "השבוע" (This Week) instead of "היום" (Today)

### Issue: NLP Not Working

**Solution**:
1. Test with: `צור בדיקה היום`
2. Check that text is in Hebrew
3. Click "🔍 נתח טקסט" to see what was parsed
4. Review NLP patterns in `docs/NLP_NOTES.md`

### Issue: PWA Not Installing

**Solution**:
1. Must be served over HTTPS (or localhost)
2. Service Worker must register successfully
3. Check manifest.webmanifest is accessible
4. Icons must be present in `/icons/` folder

### Issue: Service Worker Not Working

**Solution**:
1. Open DevTools → Application → Service Workers
2. Check for errors
3. Click "Unregister" then refresh page
4. Service Worker will re-register

---

## Updating the Deployment

### Update Backend

1. Make changes in Apps Script editor
2. Save (Ctrl+S)
3. Deploy → **Manage deployments**
4. Click ✏️ (Edit) on your deployment
5. Change version to "New version"
6. Add description: "v1.0.1 - Bug fixes"
7. Click **Deploy**
8. Users will automatically get the update (no action needed)

### Update Frontend

#### GitHub Pages:
```bash
git add .
git commit -m "Update frontend"
git push origin main
# Wait a few minutes for automatic deployment
```

#### Netlify/Vercel:
```bash
git add .
git commit -m "Update frontend"
git push origin main
# Automatic deployment triggers immediately
```

#### Manual Hosting:
- Upload updated files via FTP/SCP
- Clear browser cache (Ctrl+Shift+R)
- Service Worker will update automatically

---

## Production Best Practices

1. **Security**:
   - Keep Apps Script URL private
   - Don't commit it to public repositories
   - Use environment variables if possible

2. **Performance**:
   - Enable gzip compression on your web server
   - Use CDN for static assets (optional)
   - Monitor Apps Script quota usage

3. **Monitoring**:
   - Check Apps Script execution logs regularly
   - Monitor error rates in browser console
   - Track user adoption via PWA install rate

4. **Backup**:
   - Regularly backup Apps Script code
   - Export calendar data periodically
   - Keep deployment documentation updated

5. **Updates**:
   - Test changes locally first
   - Deploy to staging environment (optional)
   - Document all changes in CHANGELOG.md
   - Communicate breaking changes to users

---

## Rollback Procedure

### If Something Goes Wrong

#### Backend Rollback:
1. Go to Apps Script → Deploy → **Manage deployments**
2. Find previous working version
3. Click ⋮ → **Edit**
4. Select that version
5. Click **Deploy**

#### Frontend Rollback (Git):
```bash
# Find the working commit
git log --oneline

# Revert to that commit
git revert <commit-hash>
git push origin main
```

---

## Support

- **Documentation**: See [README.md](README.md), [OPERATING_GUIDELINES.md](OPERATING_GUIDELINES.md)
- **Issues**: [GitHub Issues](https://github.com/yanivmizrachiy/gcal_pwa_yaniv/issues)
- **Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Deployment Guide
