# Quick Start Guide - יומן חכם

## 🚀 5-Minute Setup

### Step 1: Deploy Apps Script (2 min)
```bash
1. Open https://script.google.com
2. New Project → Name it "GCal Smart Editor"
3. Copy src/Code.gs content → Paste into Code.gs
4. Add File → appsscript.json → Copy src/appsscript.json content
5. Deploy → New deployment → Type: Web app
   - Execute as: User accessing the web app
   - Who has access: Anyone
6. Deploy → Copy Web App URL
```

### Step 2: Configure Frontend (1 min)
```bash
1. Edit index.html
2. Find line: const SCRIPT_URL = 'https://...'
3. Replace with your Web App URL from Step 1
4. Save
```

### Step 3: Deploy Frontend (2 min)
```bash
# Option A: GitHub Pages (Recommended)
1. Push to GitHub
2. Settings → Pages → Source: main branch
3. Save → Copy your GitHub Pages URL

# Option B: Any HTTPS hosting
1. Upload all files to your web host
2. Ensure HTTPS is enabled
```

### Step 4: Test It! (30 sec)
```bash
1. Open your deployed URL
2. Click "התקן" to install PWA
3. Try command: "צור פגישה מחר ב-14:00"
4. Check your Google Calendar!
```

## 📱 First Use

### Authorize Google Calendar
1. First API call will prompt for authorization
2. Sign in with your Google account
3. Review and accept permissions
4. You're ready!

### Try These Commands
```
צור פגישה מחר ב-10:00
הצג אירועים היום
קבע פגישה עם הצוות מחרתיים בשעה 14:30
```

## 🔧 Troubleshooting

### "אין חיבור לאינטרנט"
- Check SCRIPT_URL is correct
- Verify Apps Script is deployed
- Check network connection

### "לא זוהתה כותרת לאירוע"
- Add more detail: "צור פגישה חשובה מחר ב-10:00"
- Or use the manual form in "יצירת אירוע" tab

### Authorization Issues
1. Open your SCRIPT_URL directly in browser
2. Complete authorization flow
3. Return to app and try again

## 📖 Learn More

- Full documentation: [GUIDELINES.md](GUIDELINES.md)
- API reference: [README.md](README.md)
- Implementation details: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

## ⚡ Power User Tips

### Keyboard Shortcuts
- `Enter` in NLP field → Execute command
- Tab between form fields

### Date Keywords
- `היום` = Today at current hour
- `מחר` = Tomorrow at 9:00 AM
- `מחרתיים` = Day after tomorrow at 9:00 AM
- `שבוע הבא` = Next week at 9:00 AM

### Time Format
- Use: `ב-14:30` or `בשעה 14:30`
- 24-hour format recommended

### Offline Mode
- UI works offline (cached)
- API calls require internet
- Install as PWA for best experience

## 🎯 Common Use Cases

### Morning Routine
```
הצג אירועים היום
```

### Quick Meeting
```
צור פגישה עם דני ב-15:00
```

### Weekly Planning
```
הצג אירועים השבוע
```

### Edit Event
1. Go to "רשימת אירועים"
2. Click "ערוך" on any event
3. Modify details
4. Save

## 🔐 Security Notes

- All data stays in YOUR Google Calendar
- No third-party storage
- OAuth 2.0 authentication
- You can revoke access anytime at https://myaccount.google.com/permissions

## 💡 Need Help?

- Check [GUIDELINES.md](GUIDELINES.md) for detailed docs
- Open an Issue on GitHub
- Review error messages (in Hebrew)

---

**Ready to go!** 🎉 Start managing your calendar in Hebrew!
