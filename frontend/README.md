# יומן חכם – Frontend (Next.js)

## סקירה כללית

Frontend מודרני מבוסס Next.js 15 עם תמיכה מלאה בעברית RTL, עיצוב Glassmorphism, ותמיכה ב-PWA.

## ארכיטקטורה

### Stack טכנולוגי
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4 + CSS Variables
- **UI**: React 18 עם Server/Client Components
- **Font**: Noto Sans Hebrew מ-Google Fonts

### מבנה תיקיות

```
frontend/
├── src/
│   ├── app/                 # App Router pages
│   │   ├── layout.tsx       # Root layout (RTL, theme, fonts)
│   │   ├── page.tsx         # Redirect to /calendar
│   │   └── calendar/        # Main calendar screen
│   ├── components/          # React components
│   │   ├── ThemeToggle.tsx  # Dark/light mode toggle
│   │   ├── ExecUrlBanner.tsx # EXEC_URL configuration banner
│   │   ├── CommandBar.tsx   # Natural language input + actions
│   │   ├── EventList.tsx    # Display calendar events
│   │   └── Toast.tsx        # Notifications (Hebrew)
│   ├── lib/
│   │   └── api.ts          # API client for GAS backend
│   ├── types/
│   │   └── calendar.ts     # TypeScript interfaces
│   └── styles/
│       └── globals.css     # Global styles + Tailwind
├── public/                 # Static assets
│   ├── manifest.webmanifest
│   ├── sw.js              # Service worker
│   └── icons/             # PWA icons
├── next.config.js         # Next.js config (static export)
├── tailwind.config.js     # Tailwind customization
└── package.json
```

## פיתוח מקומי

### דרישות מקדימות
- Node.js 20 (ראה `.nvmrc`)
- npm או yarn

### התקנה

```bash
cd frontend
npm install
```

### הפעלת שרת פיתוח

```bash
npm run dev
```

האפליקציה תרוץ ב-`http://localhost:3000` ותפנה אוטומטית ל-`/calendar`.

### בניית ייצוא סטטי

```bash
npm run build
```

הקבצים הסטטיים ייווצרו בתיקייה `out/` ומוכנים ל-deployment ב-GitHub Pages.

## מנגנון EXEC_URL

ה-Frontend מחפש את ה-EXEC_URL של Google Apps Script בסדר העדיפויות הבא:

1. **`window.EXEC_URL`** - מוזרק על ידי workflow ה-CI (set-exec-url.yml) לתוך `index.html` ב-gh-pages
2. **`process.env.NEXT_PUBLIC_EXEC_URL`** - משתנה סביבה בזמן build (לא נדרש ב-CI)
3. **`localStorage.EXEC_URL_OVERRIDE`** - override זמני שמשתמש יכול להגדיר דרך הבאנר

### הגדרת EXEC_URL למטרות פיתוח

אפשרות 1 - דרך הבאנר ב-UI:
- כאשר EXEC_URL חסר, יופיע באנר צהוב
- לחץ "הגדר זמנית" והדבק את ה-URL שלך

אפשרות 2 - ב-console של הדפדפן:
```javascript
localStorage.setItem('EXEC_URL_OVERRIDE', 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec');
window.location.reload();
```

## תכונות עיקריות (Stage 1)

### ✅ מוטמע
- [x] עיצוב RTL מלא לעברית
- [x] Theme toggle (בהיר/כהה) עם localStorage persistence
- [x] Glassmorphism styling (backdrop-blur + transparency)
- [x] בר פקודות עם textarea לשפה טבעית
- [x] כפתורים: "אירועי היום", "חפש טווח", "SelfTest"
- [x] תצוגת אירועים (EventList) עם formatting עברי
- [x] מערכת Toast להודעות (בעברית)
- [x] ExecUrlBanner לאבחון חסר EXEC_URL
- [x] PWA support (manifest + service worker)
- [x] Static export ל-GitHub Pages

### 🚧 Stage 2 (מתוכנן)
- [ ] CRUD מלא: יצירה, עדכון, מחיקה של אירועים
- [ ] פענוח NLP בצד ה-Frontend (או proxy ל-GAS)
- [ ] חיפוש טווח תאריכים עם קריאת API
- [ ] אינטגרציה עם GPT/AI לפענוח פקודות
- [ ] Auth (JWT/OAuth)
- [ ] Offline mutation queue (optimistic updates)

## Linting & Build

```bash
# Run ESLint
npm run lint

# Type checking
npx tsc --noEmit
```

## CI/CD

ה-workflow `.github/workflows/pages.yml` מבצע:
1. התקנת Node 20
2. `cd frontend && npm ci`
3. `npm run build` (ייצוא סטטי ל-`out/`)
4. Upload artifact מתיקיית `frontend/out`
5. Deploy ל-GitHub Pages

ה-workflow `set-exec-url.yml` מזריק את `window.EXEC_URL` ל-`index.html` ב-branch gh-pages.

## תאימות Backward

- ה-`index.html` הקיים בשורש הפרויקט נשמר (לא נמחק)
- לאחר ה-deploy, gh-pages משרת את ה-Next.js export
- Pattern של `const EXEC_URL = "__EXEC_URL__";` נשמר ב-layout.tsx לתאימות עם injection

## טיפים ופתרון בעיות

### הבעיה: "EXEC_URL חסר"
- ודא שהרצת workflow `gas-deploy.yml` לפחות פעם אחת
- פתח Issue עם כותרת "Set EXEC_URL" והדבק את ה-URL
- או הגדר זמנית דרך הבאנר

### הבעיה: Events לא מוצגים
- בדוק ב-Console של הדפדפן שאין שגיאות CORS
- ודא ש-EXEC_URL מצביע על deployment פעיל של GAS
- נסה ללחוץ "SelfTest" לוודא חיבור

### הבעיה: Theme לא משתנה
- נקה את localStorage: `localStorage.clear()` ורענן
- בדוק שה-class `dark` מתווסף/נמחק מ-`<html>`

## רישיון

MIT - ראה LICENSE בשורש הפרויקט.
