<div dir="rtl">

# מחברת חזרה למבחן

אפליקציה לחזרה למבחן במתמטיקה ובגאומטריה. האפליקציה היא דף HTML אחד (`app/index.html`) שעטוף בתוכנת שולחן עבודה (Electron) ל-Windows, Mac ו-Linux.

ההתקדמות נשמרת על המחשב עצמו, כך שאפשר לסגור את האפליקציה ולהמשיך מאותה נקודה בפעם הבאה.

## הורדה והתקנה

1. נכנסים לעמוד **Releases** של המאגר ב-GitHub (בצד ימין של עמוד המאגר, או בכתובת `.../releases`).
2. בוחרים את הגרסה האחרונה ומורידים את הקובץ שמתאים למחשב:

| מערכת | קובץ | איך מתקינים |
|---|---|---|
| Windows | `Math-Study-Setup-<גרסה>.exe` | מפעילים את הקובץ. האפליקציה לא חתומה דיגיטלית, ולכן ייתכן שתופיע אזהרת SmartScreen כחולה: לוחצים **More info** (מידע נוסף) ואז **Run anyway** (הפעל בכל זאת). אחר כך עוברים על אשף ההתקנה. ייווצר קיצור דרך בשולחן העבודה. |
| Mac | `Math-Study-<גרסה>-mac.dmg` | פותחים את ה-dmg וגוררים את האפליקציה לתיקיית Applications. בפעם הראשונה: **קליק ימני על האפליקציה ← Open (פתח)**, ובחלון שנפתח שוב **Open**. בגלל שהאפליקציה לא חתומה, לחיצה כפולה רגילה תיחסם בפעם הראשונה. אם עדיין חסום: הגדרות מערכת ← פרטיות ואבטחה ← "Open Anyway". |
| Linux | `Math-Study-<גרסה>-linux-x86_64.AppImage` | מריצים בטרמינל `chmod +x Math-Study-*.AppImage`, ואז מפעילים את הקובץ (לחיצה כפולה או `./Math-Study-*.AppImage`). |

## בלי התקנה: פתיחה בדפדפן

אותו קובץ `app/index.html` עובד גם כשפותחים אותו ישירות בדפדפן (Chrome, Edge, Firefox או Safari) בלחיצה כפולה. ההתקדמות נשמרת בדפדפן (localStorage). אם מעבירים את התיקייה, צריך להעביר את כל התיקייה `app/` (כולל `app/vendor/` אם קיימת).

## חיבור לאינטרנט

- הספריות (React ו-htm) נארזות בתוך האפליקציה (`app/vendor/`) בזמן הבנייה ב-CI, כך שהאפליקציה המותקנת עובדת גם בלי אינטרנט. אם ההורדה שלהן נכשלה בזמן הבנייה, הדף ממשיך לטעון אותן מה-CDN, ואז צריך אינטרנט בפתיחה הראשונה.
- הגופנים נטענים מ-Google Fonts. בלי אינטרנט מוצג גופן מערכת רגיל, והכול ממשיך לעבוד.

## יצירת גרסה חדשה (Release)

1. מעדכנים את `app/index.html` (ואם רוצים, את `"version"` ב-`package.json`).
2. שומרים ב-git ודוחפים:

```bash
git add -A && git commit -m "עדכון"
git push
git tag v1.0.0
git push origin v1.0.0
```

הדחיפה של תג שמתחיל ב-`v` מפעילה את ה-workflow ‏`.github/workflows/release.yml`. הוא בונה מתקינים ל-Windows, ל-Mac ול-Linux ויוצר Release חדש עם כל הקבצים. לגרסה הבאה משתמשים בתג חדש (`v1.0.1` וכן הלאה). אפשר גם להריץ את ה-workflow ידנית מלשונית **Actions** (Run workflow). הרצה ידנית בונה את הקבצים ומצרפת אותם להרצה (Artifacts), אבל לא יוצרת Release.

## הרצה מקומית (למפתחים)

```bash
npm install
npm start            # פותח את האפליקציה בחלון Electron
npm run vendor       # מוריד את React/htm ל-app/vendor ומעדכן את index.html
npm run dist         # בונה מתקין למערכת הנוכחית לתיקייה dist/
npm run icon         # יוצר מחדש את build/icon.png (דורש Playwright)
```

</div>

---

## English

**Math study notebook**: a single self-contained Hebrew (RTL) HTML study app (`app/index.html`) packaged as a desktop app with Electron.

- **Download:** grab the installer for your OS from the repository's **Releases** page.
  - *Windows:* run the `.exe`. It is unsigned, so SmartScreen may warn: click **More info → Run anyway**.
  - *macOS:* open the `.dmg` and drag the app to Applications. It is unsigned, so the first time **right-click the app → Open → Open**.
  - *Linux:* `chmod +x Math-Study-*.AppImage && ./Math-Study-*.AppImage`.
- **No install needed:** `app/index.html` also works when opened directly in any modern browser. Progress is kept in localStorage.
- **Offline:** CI runs `npm run vendor`, which downloads React 18.3.1, ReactDOM 18.3.1 and htm 3.1.1 UMD builds into `app/vendor/` and rewrites the `<script src>` tags. If that step fails, the CDN URLs are kept. Fonts come from Google Fonts and fall back to system fonts when offline.
- **Release:** `git tag v1.0.0 && git push origin v1.0.0`. GitHub Actions builds Windows (NSIS), macOS (DMG, universal, unsigned) and Linux (AppImage) installers and attaches them to a GitHub Release.
- **Local dev:** `npm install`, `npm start`. Build with `npm run dist` (output in `dist/`).
