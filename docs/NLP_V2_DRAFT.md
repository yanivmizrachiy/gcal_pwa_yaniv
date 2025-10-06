# NLP v2 Draft - תכנון וטוקניזציה

## מטרות גרסה 2
שיפור מנתח השפה הטבעית (NLP) לתמיכה במבנים מורכבים יותר, תאריכים מוחלטים, וביטויים יחסיים.

## ארכיטקטורה מתוכננת

### Pipeline עיבוד
```
טקסט גולמי
    ↓
1. טוקניזציה (Tokenization)
    ↓
2. זיהוי ישויות (Named Entity Recognition)
    ↓
3. פרסור תחבירי (Syntactic Parsing)
    ↓
4. פרשנות סמנטית (Semantic Interpretation)
    ↓
מבנה אירוע מובנה
```

## 1. טוקניזציה (Tokenization)

### מטרה
פיצול הטקסט ליחידות בסיסיות (tokens) וזיהוי סוג כל token.

### סוגי Tokens

#### DATE_REF (הפניות תאריך יחסיות)
- **היום**, **מחר**, **מחרתיים**
- **אתמול** (לצרכי log/history)
- **השבוע**, **בשבוע הזה**
- **השבוע הבא**, **בשבוע הבא**
- **החודש**, **בחודש הזה**
- **החודש הבא**, **בחודש הבא**

#### WEEKDAY (ימי שבוע)
- **ראשון**, **שני**, **שלישי**, **רביעי**, **חמישי**, **שישי**, **שבת**
- תמיכה בקיצורים: **א׳**, **ב׳**, **ג׳**, **ד׳**, **ה׳**, **ו׳**, **ש׳**

#### MODIFIER (מתארים/מצביעים)
- **הבא**, **הקודם**
- **זה**, **זו**, **זאת**
- **הקרוב**, **הבאה**

#### DATE_ABSOLUTE (תאריכים מוחלטים)
- **DD/MM/YYYY**: `15/01/2024`, `1/1/24`
- **DD/MM**: `15/01` (שנה נוכחית)
- **DD בחודש**: `15 בינואר`, `1 בפברואר`

#### TIME (זמנים)
- **HH:MM**: `14:00`, `9:30`
- **HH**: `14` (רק שעה, דקות 00)
- **HH:MM AM/PM**: `2:30 PM`, `10:00 AM` (תמיכה אנגלית)

#### TIME_REF (הפניות זמן יחסיות)
- **בבוקר**, **בצהריים**, **אחר הצהריים**, **בערב**, **בלילה**
- **בשעה**: מתקשר לזמן קונקרטי (`בשעה 14:00`)

#### DURATION (משך זמן)
- **שעה**, **שעתיים**, **שלוש שעות**
- **חצי שעה**
- **דקה**, **דקות** (15 דקות, 30 דקות)

#### SEPARATOR (מפרידים)
- **–**, **-** (מפריד בין זמנים)
- **עד** (`מ-14:00 עד 15:30`)
- **,** (פסיק)

#### PREPOSITION (מילות יחס)
- **ב-**, **ה-**, **ל-**, **מ-**, **עד**, **של**
- **עם** (כשמתקשר לאנשים: "פגישה עם מנכ״ל")

#### ATTRIBUTE (תכונות)
- **צבע**
- **תזכורת**
- **מיקום**, **ב-** (מיקום)

#### COLOR (צבעים)
- **אדום**, **כחול**, **ירוק**, **צהוב**, **כתום**, **סגול**, **ורוד**
- **לבן**, **שחור**, **אפור**, **חום**

#### RECURRENCE (חזרה)
- **כל** (`כל יום`, `כל שבוע`)
- **מידי** (`מידי יום ראשון`)
- **פעם ב-** (`פעם בשבוע`)

#### NUMBER (מספרים)
- **מספרים**: 1, 2, 3...
- **מילות מספר**: אחד, שתיים, שלוש...

#### TEXT (טקסט כותרת)
- כל מילה שלא שייכת לקטגוריות אחרות

#### PUNCTUATION (סימני פיסוק)
- **.**, **!**, **?**, **:**

### פונקציית Tokenization (מימוש ראשוני)

```javascript
function tokenizeHebrewV2(text) {
  var tokens = [];
  var words = text.trim().split(/\s+/);
  
  for (var i = 0; i < words.length; i++) {
    var word = words[i];
    var token = { text: word, type: 'UNKNOWN', position: i };
    
    // DATE_REF
    if (/^(היום|מחר|מחרתיים|אתמול|השבוע|החודש)$/.test(word)) {
      token.type = 'DATE_REF';
    }
    // WEEKDAY
    else if (/^(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת|א׳|ב׳|ג׳|ד׳|ה׳|ו׳|ש׳)$/.test(word)) {
      token.type = 'WEEKDAY';
    }
    // MODIFIER
    else if (/^(הבא|הקודם|זה|זו|זאת|הקרוב|הבאה)$/.test(word)) {
      token.type = 'MODIFIER';
    }
    // DATE_ABSOLUTE (DD/MM/YYYY or DD/MM)
    else if (/^\d{1,2}\/\d{1,2}(\/\d{2,4})?$/.test(word)) {
      token.type = 'DATE_ABSOLUTE';
    }
    // TIME (HH:MM)
    else if (/^\d{1,2}:\d{2}$/.test(word)) {
      token.type = 'TIME';
    }
    // TIME_REF
    else if (/^(בבוקר|בצהריים|אחר|בערב|בלילה|בשעה)$/.test(word)) {
      token.type = 'TIME_REF';
    }
    // DURATION
    else if (/^(שעה|שעתיים|שלוש|חצי|דקה|דקות)$/.test(word)) {
      token.type = 'DURATION';
    }
    // SEPARATOR
    else if (/^(–|-|עד)$/.test(word)) {
      token.type = 'SEPARATOR';
    }
    // PREPOSITION
    else if (/^(ב-|ה-|ל-|מ-|של|עם)$/.test(word)) {
      token.type = 'PREPOSITION';
    }
    // ATTRIBUTE
    else if (/^(צבע|תזכורת|מיקום)$/.test(word)) {
      token.type = 'ATTRIBUTE';
    }
    // COLOR
    else if (/^(אדום|כחול|ירוק|צהוב|כתום|סגול|ורוד|לבן|שחור|אפור|חום)$/.test(word)) {
      token.type = 'COLOR';
    }
    // RECURRENCE
    else if (/^(כל|מידי|פעם)$/.test(word)) {
      token.type = 'RECURRENCE';
    }
    // NUMBER
    else if (/^\d+$/.test(word)) {
      token.type = 'NUMBER';
      token.value = parseInt(word);
    }
    // PUNCTUATION
    else if (/^[.,!?:]$/.test(word)) {
      token.type = 'PUNCTUATION';
    }
    // Default: TEXT
    else {
      token.type = 'TEXT';
    }
    
    tokens.push(token);
  }
  
  return tokens;
}
```

### דוגמאות Tokenization

#### דוגמה 1: פשוט
```
Input: "פגישה מחר 14:00–15:00"
Tokens:
[
  {text: "פגישה", type: "TEXT", position: 0},
  {text: "מחר", type: "DATE_REF", position: 1},
  {text: "14:00", type: "TIME", position: 2},
  {text: "–", type: "SEPARATOR", position: 3},
  {text: "15:00", type: "TIME", position: 4}
]
```

#### דוגמה 2: מורכב
```
Input: "ישיבת סטטוס כל יום ראשון בשעה 10:00 בבוקר"
Tokens:
[
  {text: "ישיבת", type: "TEXT", position: 0},
  {text: "סטטוס", type: "TEXT", position: 1},
  {text: "כל", type: "RECURRENCE", position: 2},
  {text: "יום", type: "TEXT", position: 3},
  {text: "ראשון", type: "WEEKDAY", position: 4},
  {text: "בשעה", type: "TIME_REF", position: 5},
  {text: "10:00", type: "TIME", position: 6},
  {text: "בבוקר", type: "TIME_REF", position: 7}
]
```

#### דוגמה 3: תאריך מוחלט
```
Input: "פגישה ב-15/01 בשעה 14:00 צבע אדום"
Tokens:
[
  {text: "פגישה", type: "TEXT", position: 0},
  {text: "ב-", type: "PREPOSITION", position: 1},
  {text: "15/01", type: "DATE_ABSOLUTE", position: 2},
  {text: "בשעה", type: "TIME_REF", position: 3},
  {text: "14:00", type: "TIME", position: 4},
  {text: "צבע", type: "ATTRIBUTE", position: 5},
  {text: "אדום", type: "COLOR", position: 6}
]
```

## 2. זיהוי ישויות (Named Entity Recognition)

### מטרה
קיבוץ tokens למבנים בעלי משמעות (entities).

### Entities מתוכננים

#### DATE_ENTITY
```javascript
{
  type: "DATE",
  value: Date,
  source: ["מחר"] or ["15/01"] or ["ראשון", "הבא"]
}
```

#### TIME_RANGE_ENTITY
```javascript
{
  type: "TIME_RANGE",
  start: "14:00",
  end: "15:30",
  source: ["14:00", "–", "15:30"]
}
```

#### COLOR_ENTITY
```javascript
{
  type: "COLOR",
  value: "RED",
  source: ["צבע", "אדום"]
}
```

#### TITLE_ENTITY
```javascript
{
  type: "TITLE",
  value: "פגישה עם מנכ״ל",
  source: ["פגישה", "עם", "מנכ״ל"]
}
```

#### RECURRENCE_ENTITY
```javascript
{
  type: "RECURRENCE",
  frequency: "WEEKLY",
  byDay: ["SU"],
  source: ["כל", "יום", "ראשון"]
}
```

## 3. פרסור תחבירי (Syntactic Parsing)

### דקדוק בסיסי (Grammar)
```
EVENT → TITLE DATE? TIME_RANGE? MODIFIERS*
TITLE → TEXT+
DATE → DATE_REF | (WEEKDAY MODIFIER) | DATE_ABSOLUTE
TIME_RANGE → TIME SEPARATOR TIME | TIME
MODIFIERS → COLOR_MOD | RECURRENCE_MOD
COLOR_MOD → "צבע" COLOR
RECURRENCE_MOD → "כל" WEEKDAY
```

### תהליך Parsing
1. זיהוי DATE entities
2. זיהוי TIME_RANGE entities
3. זיהוי MODIFIER entities (צבע, חזרה)
4. כל השאר = TITLE

## 4. פרשנות סמנטית (Semantic Interpretation)

### המרה למבנה סופי
```javascript
{
  title: "string",
  start: Date,
  end: Date,
  allDay: boolean,
  color: string?,
  description: string?,
  recurrence: {
    frequency: "DAILY" | "WEEKLY" | "MONTHLY",
    interval: number,
    byDay: string[]?,
    until: Date?
  }?
}
```

## שיפורים נוספים (עתידיים)

### תמיכה בשמות חודשים
```
"15 בינואר" → 15/01
"5 במרץ 2024" → 05/03/2024
```

### תמיכה בביטויים יחסיים
```
"בעוד שבוע" → תאריך: עכשיו + 7 ימים
"בעוד חודש" → תאריך: עכשיו + 1 חודש
"בעוד שעתיים" → זמן: עכשיו + 2 שעות
```

### תמיכה בזמנים יחסיים
```
"בבוקר" → 09:00
"אחר הצהריים" → 15:00
"בערב" → 19:00
```

### תמיכה במיקום
```
"פגישה בתל אביב" → location: "תל אביב"
"ישיבה במשרד" → location: "משרד"
```

### תמיכה בתזכורות
```
"תזכורת 15 דקות לפני"
"תזכורת שעה לפני"
```

## מימוש מדורג

### Phase 1: Tokenization בלבד (✅ הושלם)
- מימוש `parseOnly` action ב-Apps Script
- החזרת רשימת tokens עם סוגים

### Phase 2: Entity Recognition
- קיבוץ tokens ל-entities
- זיהוי תאריכים מוחלטים
- זיהוי ביטויים מורכבים

### Phase 3: Parsing & Interpretation
- פרסור מבנה האירוע
- המרה לפורמט Google Calendar
- תמיכה באירועים חוזרים בסיסיים

### Phase 4: Advanced Features
- תמיכה במיקום
- תמיכה בתזכורות
- שיפור דיוק עם ML (אופציונלי)

## בדיקות (Testing)

### Test Cases לטוקניזציה

```javascript
// Test 1: Basic
tokenizeHebrewV2("פגישה מחר 14:00")
// Expected: [TEXT, DATE_REF, TIME]

// Test 2: Date absolute
tokenizeHebrewV2("פגישה 15/01/2024 10:00")
// Expected: [TEXT, DATE_ABSOLUTE, TIME]

// Test 3: Recurrence
tokenizeHebrewV2("ישיבה כל יום שני")
// Expected: [TEXT, RECURRENCE, TEXT, WEEKDAY]

// Test 4: Complex
tokenizeHebrewV2("פגישה דחופה עם מנכ״ל ב-15/01 בשעה 14:00–15:30 צבע אדום")
// Expected: [TEXT, TEXT, PREPOSITION, TEXT, PREPOSITION, DATE_ABSOLUTE, TIME_REF, TIME, SEPARATOR, TIME, ATTRIBUTE, COLOR]
```

## סיכום

גרסה 2 של ה-NLP תספק:
- **טוקניזציה מתקדמת** עם סוגי tokens מפורטים
- **זיהוי ישויות** לקיבוץ מושגים
- **פרסור תחבירי** להבנת מבנה המשפט
- **תמיכה מורחבת** בתאריכים, זמנים וביטויים

כרגע, רק **Phase 1 (Tokenization)** מומש כ-`parseOnly` action.  
Phases נוספים יפותחו בהדרגה.

---

**גרסה**: NLP v2 Draft  
**סטטוס**: Tokenization בלבד  
**תאריך עדכון**: 2024  
**מתחזק**: Yaniv
