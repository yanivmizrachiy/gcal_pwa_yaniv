# הרשאה תפעולית – NLP v2 Production Autonomy
**תאריך עדכון:** 2025-10-07

---

## תוכן עניינים / Table of Contents

1. [ההרשאה המקורית](#ההרשאה-המקורית)
2. [נוסח מוארך](#נוסח-מוארך)
3. [Executive Summary (EN)](#executive-summary-en)
4. [גבולות ואי הכללה](#גבולות-ואי-הכללה)
5. [תהליך פריסה Production](#תהליך-פריסה-production)
6. [אימות SelfTest](#אימות-selftest)
7. [קודי אזהרה NLP v2](#קודי-אזהרה-nlp-v2)
8. [Roadmap Phase B](#roadmap-phase-b)
9. [Changelog](#changelog)

---

## ההרשאה המקורית

> אתה מחויב להשלים את כל תהליך העבודה **עד הסוף**, אוטומטית וללא בקשות אישור ממני.
> עליך לבצע את כל השלבים — שדרוג הקוד, פריסה, בדיקות, עדכון הקישורים, הגדרות ההרשאות, והעלאת האפליקציה לפעולה מלאה — **עד למסירה של קישור סופי פעיל ומוכן לשימוש**.
>
> אתה רשאי ומורשה להשתמש **בכל הכלים החזקים ביותר** שברשותך ב-GitHub וב-AI שלך, כולל עריכה, ריצה, מיזוג, עדכון קבצים, בדיקות והרצת סקריפטים.
>
> עליך לפעול **בעצמאות מלאה** ולבצע הכל בלי לעצור או לשאול שאלות. אם נדרש אישור, תספק לי רק הודעה קצרה וברורה כמו "לחץ על Confirm בפריט X", כדי שאוכל לאשר בלחיצה אחת בלבד — והמשך מיידית.
>
> המטרה: **להשלים ולמסור אפליקציה פעילה ומוכנה לעבודה מלאה**, עם קישור אישי ישיר לשימוש.
> אין לכתוב או להריץ שום דבר שהוא דמו או חלקי — רק תוצאה אמיתית, מלאה, מוכנה לשימוש.

---

## נוסח מוארך

הרשאה זו מאפשרת ל-AI Agent לבצע באופן אוטונומי את כל תהליכי הפיתוח, הפריסה והתחזוקה של האפליקציה:

- **שדרוג קוד:**
  - עריכת קבצים קיימים
  - יצירת קבצים חדשים
  - מחיקת או שינוי מבני קוד
  - שדרוג ספריות ותלויות

- **פריסה לסביבת Production:**
  - הפעלת workflows (gas-deploy.yml, set-exec-url.yml)
  - עדכון Apps Script דרך clasp
  - יצירת deployment versions
  - עדכון משתני סביבה ו-EXEC_URL

- **בדיקות ואימות:**
  - הרצת selfTest endpoint
  - ניתוח תוצאות HTTP
  - אימות תגובות JSON
  - בדיקת תקינות NLP

- **עדכון קישורים והגדרות:**
  - עדכון EXEC_URL ב-gh-pages branch
  - עדכון קבצי manifest
  - עדכון משתני Frontend

- **הרשאות ואבטחה:**
  - שימוש ב-CLASP_TOKEN_JSON
  - שימוש ב-GAS_SCRIPT_ID
  - גישה ל-Google Calendar API
  - שימוש בכל ה-GitHub Actions permissions המוגדרים

- **מסירה לשימוש:**
  - אספקת EXEC_URL פעיל וסופי
  - תיעוד השינויים ב-PR
  - דיווח על השלמת תהליך
  - אין תוצרי ביניים או דמו בלבד

**עקרון פעולה מרכזי:** אוטונומיה מלאה עם מינימום התערבות משתמש. במקרי קצה שדורשים אישור, הודעה תהיה קצרה ומדויקת ("לחץ על X") כדי לאפשר המשך מיידי.

---

## Executive Summary (EN)

This operational authorization document grants full production deployment autonomy to the NLP v2 AI Agent for the `gcal_pwa_yaniv` project.

**Scope:**
- Complete code lifecycle: edit, create, delete, merge, upgrade dependencies
- Automated deployment: trigger workflows, deploy to Apps Script, update EXEC_URL
- Testing & validation: run selfTest, parse JSON responses, verify NLP functionality
- Configuration management: update environment variables, manifest files, gh-pages
- Security operations: use provided secrets (CLASP_TOKEN_JSON, GAS_SCRIPT_ID), access Calendar API

**Objective:**
Deliver a fully functional, production-ready application with an active EXEC_URL for immediate use. No partial or demo implementations permitted.

**Human intervention:**
Minimized to critical approval points only. When required, agent provides concise directive ("Click Confirm on item X") for single-click approval before immediate continuation.

**Authorization level:**
Full autonomy to utilize all GitHub and AI tools available, including workflow execution, code editing, testing, and deployment scripts.

---

## גבולות ואי הכללה

למרות האוטונומיה המלאה, קיימים גבולות ביטחוניים חשובים:

**אסור בהחלט:**
- ⛔ חשיפת credentials או secrets בקוד
- ⛔ שיתוף מידע רגיש עם מערכות צד שלישי לא מורשות
- ⛔ התחזות לזהות אחרת או שינוי הרשאות משתמשים
- ⛔ מחיקת או פגיעה במאגרי מידע חיוניים (main branch protection)
- ⛔ עקיפת security policies או bypassing של בדיקות אבטחה
- ⛔ יצירת backdoors או קוד זדוני
- ⛔ שימוש בפעולות שעלולות להפר זכויות יוצרים

**חובות אבטחה:**
- ✅ שימוש ב-secrets דרך GitHub Secrets בלבד
- ✅ שמירה על `.gitignore` מעודכן (אין commits של credentials)
- ✅ אימות תגובות API לפני פעולה (error handling)
- ✅ logging מפורט לכל פעולה קריטית
- ✅ גיבוי אוטומטי לפני פעולות destructive
- ✅ פיקוח על גישה ל-Calendar API (read/write scoped)

**גבולות תפעוליים:**
- עבודה על ה-branch המוגדר בלבד (לא main ללא PR)
- שימוש בתהליכי CI/CD מוגדרים בלבד
- אין שינוי של workflow permissions ללא הרשאה
- יצירת backups/tags לפני שדרוגים גדולים

---

## תהליך פריסה Production

תהליך הפריסה ל-Production מבוצע דרך שני workflows מרכזיים:

### 1. gas-deploy.yml

````yaml
# Workflow: .github/workflows/gas-deploy.yml
# Trigger: push to main, manual workflow_dispatch
````

**שלבים:**
1. **Checkout code** – קבלת הקוד האחרון מ-main
2. **Setup Node.js 20** – הכנת סביבת Node
3. **Install clasp** – התקנת Google clasp CLI
4. **Configure clasp auth** – הגדרת `~/.clasprc.json` מ-CLASP_TOKEN_JSON secret
5. **Configure .clasp.json** – יצירת קובץ עם GAS_SCRIPT_ID ו-rootDir: src
6. **Push source** – `clasp push -f` להעלאת src/Code.gs ל-Apps Script
7. **Version & Deploy** – יצירת version חדש + deployment עם תיאור timestamp
8. **Locate EXEC_URL (primary)** – חילוץ EXEC_URL מ-`clasp open --webapp`
9. **Locate EXEC_URL (fallback)** – חילוץ מ-`clasp deployments` אם הראשון נכשל
10. **Finalize EXEC_URL** – אימות שה-URL נמצא, כתיבה ל-GITHUB_STEP_SUMMARY
11. **Selftest** – בדיקת HTTP 200 על `{EXEC_URL}?mode=selftest`, הצגת JSON
12. **Print summary** – הדפסת EXEC_URL ומסר השלמה

**תוצר:** EXEC_URL מוכן, validated via selfTest.

### 2. set-exec-url.yml

````yaml
# Workflow: .github/workflows/set-exec-url.yml
# Trigger: Issue/Comment with title containing "Set EXEC_URL"
````

**שלבים:**
1. **Parse URL from Issue** – חילוץ EXEC_URL מגוף ה-Issue/Comment (regex)
2. **Checkout default branch** – משיכת הקוד
3. **Fetch gh-pages** – משיכת branch gh-pages
4. **Switch to gh-pages** – מעבר ל-gh-pages (יצירה אם לא קיים)
5. **Update EXEC_URL in index.html** – עדכון `window.EXEC_URL` או `const EXEC_URL` ב-index.html
6. **Commit & push** – שמירת השינויים ו-push ל-gh-pages
7. **Comment result** – כתיבת תגובה ב-Issue עם אישור ולינק לאתר

**תוצר:** index.html ב-gh-pages מעודכן עם EXEC_URL חדש, מופעל באתר הפומבי.

---

## אימות SelfTest

אימות תקינות מבוצע דרך endpoint selfTest. דוגמה לתגובת JSON מלאה (NLP v2):

````json
{
  "ok": true,
  "action": "selfTest",
  "message": "בדיקה תקינה",
  "nlpVersion": "v2",
  "now": "2025-10-07T12:34:56.789Z",
  "completed": true,
  "progressPercent": 100,
  "features": [
    "hebrew_nlp",
    "create_event",
    "update_event",
    "delete_event",
    "parse_datetime",
    "color_support",
    "reminder_support",
    "guest_list",
    "recurrence"
  ],
  "warnings": []
}
````

**פרמטרים חובה:**
- `progressPercent`: 100 – מציין השלמה מלאה
- `completed`: true – אישור שהמערכת מוכנה לשימוש
- `nlpVersion`: "v2" – גרסת NLP פעילה
- `features`: מערך של יכולות פעילות

**אימות:**
- HTTP status 200
- `ok: true`
- `progressPercent === 100`
- `features` array מכיל לפחות: hebrew_nlp, create_event, parse_datetime

אם אחד מהערכים חסר או שגוי – הפריסה נחשבת חלקית ודורשת תיקון.

---

## קודי אזהרה NLP v2

רשימה מלאה של warning codes שה-NLP v2 עשוי להחזיר:

1. **MISSING_TITLE** – לא זוהתה כותרת לאירוע, נוצרת כותרת ברירת מחדל
2. **IGNORED_DURATION** – משך זמן שצוין בפקודה לא הובן, משתמשים במשך ברירת מחדל (1 שעה)
3. **DEFAULT_TIME_INFERRED** – לא צוינה שעה מפורשת, שעת ברירת מחדל הוסקה (למשל 09:00)
4. **GUEST_EMAIL_INVALID** – אחד מכתובות האימייל של האורחים אינה תקינה, מדלג על כתובת זו
5. **GUEST_LIST_TRUNCATED** – רשימת האורחים ארוכה מדי, חלק מהכתובות לא נוספו
6. **RECURRENCE_UNSUPPORTED** – חזרתיות מורכבת לא נתמכת, נוצר אירוע חד-פעמי
7. **RECURRENCE_CONFLICT** – סתירה בין כללי החזרתיות המבוקשים, נבחר ברירת מחדל
8. **AMBIGUOUS_MATCH** – התאמה מעורפלת לאירוע קיים (עדכון/מחיקה), נדרש פירוט נוסף
9. **NO_MATCH** – לא נמצא אירוע תואם לפעולת עדכון/מחיקה
10. **SERIES_INSTANCE_DELETE** – מחיקת מופע בודד בסדרה חוזרת – לא תמיד אפשרי, נדרש אישור
11. **GUEST_DUP_CONFLICT** – כפילות באורחים (אותה כתובת מופיעה פעמיים), מסירים כפילות
12. **FUZZY_TRUNCATED** – תוצאות חיפוש מטושטשות נחתכו, הוצגו רק N הראשונות

**שימוש:**
- קודים אלה מופיעים ב-array `warnings` בתגובת JSON
- לדוגמה: `"warnings": ["DEFAULT_TIME_INFERRED", "GUEST_EMAIL_INVALID"]`
- UI צריך להציג הודעות ידידותיות למשתמש על בסיס הקודים

---

## Roadmap Phase B

**שלבים עתידיים (placeholders בלבד):**

### 1. Focus Blocks (בלוקי פוקוס)
- יכולת ליצור בלוקי זמן מוקדשים למשימות ספציפיות
- סינכרון עם Google Calendar
- חסימה אוטומטית של התראות

### 2. Habits (הרגלים)
- מעקב אחר הרגלים יומיים/שבועיים
- יצירת אירועים חוזרים מבוססי הרגל
- דשבורד ניהול הרגלים

### 3. Analytics (אנליטיקס)
- ניתוח ויזואלי של השימוש ביומן
- דוחות זמן לפי קטגוריות
- insights על יעילות זמן

### 4. Travel Time (זמן נסיעה)
- אינטגרציה עם Google Maps/Waze
- חישוב אוטומטי של זמן נסיעה בין אירועים
- הצעות לזמני יציאה מומלצים

### 5. Timezone Override (עקיפת אזור זמן)
- תמיכה באירועים בין-לאומיים
- המרה אוטומטית בין אזורי זמן
- תצוגה של שעות מקומיות

### 6. Shared Links (קישורים משותפים)
- יצירת קישורי שיתוף לאירועים
- ניהול הרשאות צפייה/עריכה
- אינטגרציה עם Teams/Slack

**הערה חשובה:** פיצ'רים אלה הם placeholders בלבד ולא מיושמים כרגע. התיעדוף והמימוש ייעשו בשלבים עתידיים לפי צרכי המשתמש ומשאבים זמינים.

---

## Changelog

### v1.0 – 2025-10-07
- ✨ **Added:** הוספת קובץ הרשאה תפעולית OPERATIONAL_AUTH.md
- 📝 **Added:** תיעוד מלא של נוהלי פריסה production
- 🔐 **Added:** הגדרת גבולות אבטחה וסיכונים
- ⚠️ **Added:** רשימה מלאה של קודי אזהרה NLP v2
- 🗺️ **Added:** Roadmap Phase B – placeholders לפיצ'רים עתידיים
- ✅ **Added:** דוגמת SelfTest JSON עם progressPercent=100

---

**סיום המסמך** – מסמך זה מהווה מקור אמת יחיד עבור הרשאות תפעוליות של ה-AI Agent בסביבת Production.
