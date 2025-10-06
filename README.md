# 📅 יומן חכם – Google Calendar Smart Editor (Hebrew PWA)

[![Apps Script](https://img.shields.io/badge/Apps%20Script-V8-4285F4?logo=google)](https://developers.google.com/apps-script)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa)](https://web.dev/progressive-web-apps/)
[![Hebrew](https://img.shields.io/badge/Language-Hebrew-0038B8)](https://he.wikipedia.org)

> **Full-featured Progressive Web App (PWA) for Google Calendar with Hebrew Natural Language Processing (NLP) support.**

## ✨ Features

### 🎯 Core Capabilities
- ✅ **Full CRUD Operations**: Create, Read, Update, Delete calendar events
- 🗣️ **Hebrew NLP v1**: Natural language processing for Hebrew commands
- 📱 **Progressive Web App**: Install to home screen, works offline
- 🔄 **Real-time Sync**: Direct integration with Google Calendar
- 🌐 **RTL Support**: Native right-to-left interface for Hebrew

### 🧠 Natural Language Examples

```hebrew
צור פגישה עם דני מחר בשעה 14:00
הוסף תזכורת לקנות חלב היום
מחק פגישה עם הבוס
עדכן פגישת צוות ל 15:00
```

### 📊 Smart Features
- **Parse-only mode**: Preview what the system understands before executing
- **Time parsing**: Supports "היום", "מחר", "שבוע הבא", specific dates (DD/MM/YYYY)
- **Inline actions**: Update/delete events directly from the list
- **Self-test**: Built-in diagnostics and capability reporting

## 🚀 Quick Start

### 1. Deploy Apps Script Backend

1. Open [Google Apps Script](https://script.google.com)
2. Create a new project
3. Copy contents from `src/Code.gs` to the script editor
4. Copy contents from `src/appsscript.json` (File → Project Properties → appsscript.json)
5. Deploy as Web App:
   - **Execute as**: User accessing the web app
   - **Who has access**: Anyone
6. Authorize calendar access when prompted
7. Copy the deployment URL (ending in `/exec`)

### 2. Configure PWA

1. Open `index.html` in your browser (or host on GitHub Pages)
2. Enter your Apps Script deployment URL in the settings
3. Click "בדיקה" (Test) to verify connection
4. Install to home screen using the "התקן" (Install) button

### 3. Start Using

```hebrew
# Try your first command:
צור פגישה חשובה מחר בשעה 10:00
```

## 📁 Project Structure

```
gcal_pwa_yaniv/
├── src/
│   ├── Code.gs              # Apps Script backend (full CRUD + NLP)
│   └── appsscript.json      # OAuth scopes & configuration
├── docs/
│   └── NLP_NOTES.md         # Technical NLP documentation
├── icons/
│   ├── icon-192.png         # PWA icon (192x192)
│   └── icon-512.png         # PWA icon (512x512)
├── index.html               # PWA frontend (Hebrew RTL UI)
├── sw.js                    # Service Worker (caching strategy)
├── manifest.webmanifest     # PWA manifest
├── OPERATING_GUIDELINES.md  # User guide (Hebrew)
└── README.md                # This file
```

## 🔧 API Reference

### REST Endpoints

#### `doPost` - JSON API (Main)

**Self Test**
```javascript
POST { action: "selfTest" }
// Returns: System status, capabilities, NLP version
```

**Find Events**
```javascript
POST {
  action: "findEvents",
  options: {
    timeMin?: ISO8601,    // Optional
    timeMax?: ISO8601,    // Optional
    q?: string,           // Search query
    maxResults?: number   // Default: 50
  }
}
```

**Create Event**
```javascript
POST {
  action: "createEvent",
  options: {
    title: string,
    start: ISO8601,
    end: ISO8601,
    description?: string,
    location?: string,
    allDay?: boolean
  }
}
```

**Update Event**
```javascript
POST {
  action: "updateEvent",
  options: {
    id: string,           // Required
    title?: string,
    description?: string,
    location?: string,
    start?: ISO8601,
    end?: ISO8601
  }
}
```

**Delete Event**
```javascript
POST {
  action: "deleteEvent",
  options: { id: string }
}
```

**Parse Text (NLP)**
```javascript
POST {
  action: "parseText",
  options: {
    text: string,         // Hebrew command
    parseOnly?: boolean   // true = parse only, false = execute
  }
}
// parseOnly=true returns v2-draft token structure
```

#### `doGet` - Legacy Support

```
GET ?mode=selftest    # System check
GET ?mode=today       # Today's events
GET ?mode=events      # Next 7 days
```

## 🧪 Testing

### Manual Testing

```bash
# Test backend (after deployment)
curl -X POST "YOUR_DEPLOYMENT_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"selfTest"}'

# Expected response:
{
  "ok": true,
  "capabilities": {
    "nlpVersion": "v1",
    "hebrewNLP": true,
    "parseOnlyDraft": "v2-draft"
  }
}
```

### Hebrew NLP Test Cases

```javascript
// Create commands
"צור פגישה היום בשעה 14:00"        // ✓ Create with time
"הוסף תזכורת לקנות חלב מחר"        // ✓ Create tomorrow
"יצירה פגישת צוות ב-25/12"         // ✓ Create on specific date

// Update commands
"עדכן פגישה עם דני ל 15:00"        // ✓ Update time
"שנה תזכורת חלב למחר"              // ✓ Update date

// Delete commands
"מחק פגישה עם דני"                 // ✓ Delete by title
"בטל תזכורת חלב"                   // ✓ Cancel event
```

## 📱 PWA Features

### Service Worker Strategy
- **Static Assets**: Cache-first (HTML, CSS, manifest, icons)
- **API Calls**: Network-first (always try network, fallback to error)
- **Cache Version**: `yaniv-v4`

### Install Support
- ✅ Android: Chrome, Edge, Samsung Internet
- ✅ iOS: Safari (Add to Home Screen)
- ✅ Desktop: Chrome, Edge

## 🔐 Security & Privacy

### OAuth Scopes
```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/calendar",          // Full calendar access
    "https://www.googleapis.com/auth/userinfo.email",    // User identification
    "https://www.googleapis.com/auth/script.external_request"
  ]
}
```

### Access Control
- Web app runs as **User Accessing** (not service account)
- Each user sees only their own calendar
- OAuth consent required on first use
- No server-side data storage

## 📖 Documentation

### User Guides
- **[OPERATING_GUIDELINES.md](OPERATING_GUIDELINES.md)** - Complete user guide in Hebrew
  - Setup instructions
  - NLP command examples
  - Troubleshooting
  - API reference

### Technical Documentation
- **[docs/NLP_NOTES.md](docs/NLP_NOTES.md)** - NLP implementation details
  - v1 pattern matching architecture
  - v2-draft tokenization proposal
  - Hebrew time/date parsing
  - Test cases and edge cases

## 🛠️ Development

### Prerequisites
- Google Account
- Modern browser (Chrome, Firefox, Safari, Edge)
- Basic understanding of Hebrew (for NLP features)

### Local Development

1. **Clone repository**
   ```bash
   git clone https://github.com/yanivmizrachiy/gcal_pwa_yaniv.git
   cd gcal_pwa_yaniv
   ```

2. **Test frontend locally**
   ```bash
   # Serve with any static server
   python -m http.server 8000
   # or
   npx serve .
   ```

3. **Deploy backend to Apps Script**
   - Copy files from `src/` to Apps Script Editor
   - Deploy and get URL
   - Configure in frontend

### Contributing

Contributions welcome! Areas for improvement:

#### High Priority
- [ ] Enhanced time parsing (week days, month names)
- [ ] Multi-event operations
- [ ] Recurring events support
- [ ] Location extraction from text

#### Future Enhancements
- [ ] NLP v2 with tokenization
- [ ] English language support
- [ ] Voice input
- [ ] Conflict detection
- [ ] Smart suggestions

See [docs/NLP_NOTES.md](docs/NLP_NOTES.md) for v2 architecture plans.

## 🐛 Known Limitations

1. **NLP v1**: Basic pattern matching only (v2 planned with tokenization)
2. **Update Events**: Requires manual event ID (not always auto-detected)
3. **Recurring Events**: No support yet
4. **Search**: Basic text matching in title/description only
5. **Time Zone**: Fixed to Asia/Jerusalem

## 📊 Roadmap

### v1.0 (Current) ✅
- [x] Full CRUD API
- [x] Hebrew NLP v1
- [x] PWA with offline support
- [x] RTL Hebrew interface
- [x] Documentation

### v1.1 (Next)
- [ ] Enhanced time parsing
- [ ] Better error messages
- [ ] Event templates
- [ ] Export/import

### v2.0 (Future)
- [ ] NLP v2 with tokenization
- [ ] Multi-language (Hebrew + English)
- [ ] Recurring events
- [ ] Voice input
- [ ] ML-based parsing

## 🤝 Support

- **Issues**: [GitHub Issues](https://github.com/yanivmizrachiy/gcal_pwa_yaniv/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yanivmizrachiy/gcal_pwa_yaniv/discussions)
- **Documentation**: See [OPERATING_GUIDELINES.md](OPERATING_GUIDELINES.md)

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Google Apps Script team for excellent Calendar API
- Hebrew NLP community for linguistic insights
- PWA community for best practices

---

**Made with ❤️ for the Hebrew-speaking community**

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: December 2024

---

### Quick Links
- 📘 [User Guide (Hebrew)](OPERATING_GUIDELINES.md)
- 🔬 [Technical NLP Docs](docs/NLP_NOTES.md)
- 🚀 [Google Apps Script](https://script.google.com)
- 📱 [PWA Best Practices](https://web.dev/progressive-web-apps/)
