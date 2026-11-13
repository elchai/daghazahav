# Content plan: daghazahav.com/articles/

Goal: daghazahav.com is the leading Israeli site for "פיתוח מערכות ניהול בהתאמה אישית".
The pillar is `/articles/custom-management-system-development/`; every new guide links back to it and is linked from it.

## How the daily job uses this file

1. Take the first row whose status is `todo` (rows are in priority order, top first).
2. Add the guide to `scripts/guides-data.mjs` (same shape as the existing guides), and add its slug to the pillar's `guides` block.
3. `npm run build:articles` then `npm run check:articles`. Do not ship unless the check passes.
4. Change the row's status to `done` in the same commit.

Rules the check does not catch: facts only from the repo and the live product sites (no invented clients, numbers, prices, timelines or features); no גדודון in marketing copy; commas only where the sentence misreads without one; "וואצאפ"; "אלחי פיין"; never "פיילוט" or "בקרוב". Before writing, read `answers/` so the new guide does not target the same query as an existing answer page.

Intent: `commercial` = the reader is choosing a system or a vendor; `informational` = the reader is learning how something works.

## Backlog

| # | slug | כותרת | שאילתת יעד | intent | מאמרי מערכות לקישור | status |
|---|------|-------|------------|--------|---------------------|--------|
| 1 | custom-management-system-development | פיתוח מערכת ניהול בהתאמה אישית: המדריך המלא | פיתוח מערכת ניהול בהתאמה אישית | commercial | כל המאמרים חוץ מגדודון | done |
| 2 | off-the-shelf-vs-custom-system | מערכת מדף או מערכת בהתאמה אישית: איך מחליטים | מערכת מדף או מערכת בהתאמה אישית | commercial | mosachun, hafakon, crazy-crm | done |
| 3 | custom-system-cost-factors | מה משפיע על המחיר של פיתוח מערכת ניהול | כמה עולה לפתח מערכת ניהול | commercial | mishmeron, dfuson, mosachun | done |
| 4 | custom-system-development-process | איך עובר פרויקט פיתוח מערכת ניהול: מהאפיון ועד העלייה לאוויר | שלבי פיתוח מערכת ניהול | informational | mosachun, mifalon, iruchon | done |
| 5 | excel-to-management-system | מעבר מאקסל למערכת ניהול: מדריך מעשי | מעבר מאקסל למערכת ניהול | informational | yishuvon, mifalon, mosachun | done |
| 6 | whatsapp-management-system-integration | חיבור וואצאפ למערכת ניהול: מה אפשר לעשות ומה חשוב לבדוק | חיבור וואצאפ למערכת ניהול | informational | crazy-crm, mosachun, kehilot | done |
| 7 | custom-crm-development | פיתוח CRM בהתאמה אישית: מה הוא כולל ומתי צריך אותו | פיתוח CRM בהתאמה אישית | commercial | crazy-crm, dfuson, hafakon | done |
| 8 | management-system-invoicing-integration | חיבור מערכת ניהול לחשבוניות: Morning, iCount ומספר הקצאה | חיבור מערכת ניהול לחשבונית ירוקה | commercial | mosachun, dfuson, mifalon, crazy-crm | done |
| 9 | garage-management-software-guide | תוכנה לניהול מוסך: מה חשוב לבדוק לפני שבוחרים | תוכנה לניהול מוסך | commercial | mosachun | done |
| 10 | factory-erp-or-dedicated-system | מפעל קטן: ERP או מערכת ניהול ייעודית | מערכת ERP למפעל קטן | commercial | mifalon | done |
| 11 | settlement-secretariat-software | תוכנה למזכירות ישוב: מה היא צריכה לכלול | תוכנה לניהול ישוב | commercial | yishuvon, kehilot | todo |
| 12 | event-venue-management-software | תוכנה לניהול אולם אירועים: מה לבדוק לפני שבוחרים | תוכנה לניהול אולם אירועים | commercial | hafakon | todo |
| 13 | security-shift-scheduling-software | סידור משמרות לחברת שמירה: איך בוחרים תוכנה | תוכנה לסידור משמרות שומרים | commercial | mishmeron | todo |
| 14 | print-shop-management-software | תוכנה לניהול בית דפוס: מהליד ועד המסירה | תוכנה לניהול בית דפוס | commercial | dfuson | todo |
| 15 | accessibility-standard-5568-systems | נגישות במערכת ניהול: מה דורש תקן ת"י 5568 | תקן נגישות 5568 מערכת | informational | kehilot, yishuvon | todo |
| 16 | privacy-data-security-management-system | הגנת פרטיות ואבטחת מידע במערכת ניהול: מה לבדוק | אבטחת מידע במערכת ניהול | informational | kehilot, yishuvon, crazy-crm | todo |
| 17 | hospitality-field-school-software | תוכנה לניהול בית ספר שדה ומתחם אירוח | תוכנה לניהול מתחם אירוח | commercial | iruchon | todo |
| 18 | municipality-community-department-system | מערכת לאגף קהילה ברשות מקומית: מה חשוב לבדוק | מערכת ניהול לאגף קהילה | commercial | kehilot | todo |
| 19 | shooting-range-software-checklist | תוכנה לניהול מטווח: רשימת בדיקה לפני שבוחרים | תוכנה לניהול מטווח ירי | commercial | mitvachon | todo |
| 20 | questions-to-ask-software-vendor | שאלות לשאול חברת פיתוח לפני שחותמים | איך בוחרים חברת פיתוח תוכנה | commercial | crazy-crm, mosachun | todo |
| 21 | management-system-requirements-doc | איך כותבים אפיון למערכת ניהול: מבנה ודוגמה | אפיון מערכת ניהול | informational | mifalon, dfuson | todo |
| 22 | customer-portal-without-app | פורטל לקוח בלי אפליקציה: קישור אישי בוואצאפ | פורטל לקוח | informational | mosachun, yishuvon, hafakon | todo |
| 23 | digital-signature-quotes | הצעת מחיר עם חתימה דיגיטלית מהנייד: איך זה עובד | הצעת מחיר חתימה דיגיטלית | informational | crazy-crm, hafakon, iruchon | todo |
| 24 | inventory-management-small-business | ניהול מלאי לעסק קטן: מתי האקסל כבר לא מספיק | תוכנה לניהול מלאי לעסק קטן | commercial | mifalon, iruchon, mitvachon | todo |
| 25 | leads-from-facebook-and-site-to-crm | קליטת לידים מפייסבוק, מהאתר ומוואצאפ למקום אחד | ניהול לידים מפייסבוק | informational | crazy-crm, dfuson | todo |
| 26 | lost-leads-follow-up | למה לידים הולכים לאיבוד ואיך עוצרים את זה | מעקב לידים | informational | crazy-crm, dfuson | todo |
| 27 | pwa-or-native-app-for-business | אפליקציה או מערכת בדפדפן לעסק: מה ההבדל ומה מתאים | אפליקציה לעסק או PWA | informational | mosachun, mishmeron | todo |
| 28 | bill-of-materials-product-costing | עץ מוצר ותמחיר: איך יודעים כמה עולה כל מוצר באמת | תמחיר מוצר במפעל | informational | mifalon | todo |
| 29 | shop-floor-tablet-reporting | דיווח מרצפת הייצור בטאבלט: מה צריך כדי שעובדים ישתמשו | דיווח ייצור בטאבלט | informational | mifalon | todo |
| 30 | garage-digital-vehicle-inspection | בדיקת רכב דיגיטלית עם תמונות ללקוח | בדיקת רכב דיגיטלית | informational | mosachun | todo |
| 31 | settlement-emergency-team-management | ניהול צח"י וכיתת כוננות בישוב: רשימות, הקפצה והודעות | ניהול צח"י בישוב | informational | yishuvon, kehilot | todo |
| 32 | residents-online-voting | הצבעה מקוונת לתושבים ולדיירים: איך עושים את זה נכון | הצבעה מקוונת לתושבים | informational | yishuvon, kehilot | todo |
| 33 | settlement-fees-collection | גביית דמי ועד בישוב: איך מסדרים חיובים ותזכורות | גביית דמי ועד | informational | yishuvon | todo |
| 34 | guard-patrol-qr-nfc | סיורי שמירה עם נקודות ביקורת QR ו-NFC | מערכת סיורים לשומרים | informational | mishmeron | todo |
| 35 | certification-expiry-tracking | מעקב הסמכות ותוקף רישיונות לעובדים | מעקב תוקף רישיונות עובדים | informational | mishmeron, mitvachon | todo |
| 36 | venue-calendar-double-booking | יומן תפוסה לאולם: איך מונעים הזמנה כפולה | יומן תפוסה לאולם אירועים | informational | hafakon, iruchon | todo |
| 37 | feedback-and-google-reviews | משוב אחרי שירות וביקורות בגוגל: איך בונים תהליך | איך לקבל ביקורות בגוגל | informational | hafakon, iruchon | todo |
| 38 | print-proof-approval | אישור הדמיה לפני הדפסה: תהליך שחוסך טעויות | אישור הדמיה בית דפוס | informational | dfuson | todo |
| 39 | guide-scheduling-field-trips | שיבוץ מדריכים לטיולים: זמינות, הסמכות ותיק טיול | שיבוץ מדריכי טיולים | informational | iruchon | todo |
| 40 | ai-in-management-systems | בינה מלאכותית במערכת ניהול: שימושים מעשיים | בינה מלאכותית במערכת ניהול | informational | mifalon, mosachun, crazy-crm | todo |
| 41 | hebrew-rtl-system-requirements | מערכת בעברית מימין לשמאל: מה לבדוק מעבר לתרגום | מערכת ניהול בעברית | informational | crazy-crm, dfuson | todo |
| 42 | data-ownership-vendor-lock-in | בעלות על הנתונים: איך לא נתקעים עם ספק תוכנה | ייצוא נתונים ממערכת ניהול | informational | crazy-crm, mifalon | todo |
| 43 | system-maintenance-after-launch | תחזוקת מערכת ניהול אחרי העלייה לאוויר: מה לסכם מראש | תחזוקת מערכת תוכנה | informational | mishmeron, dfuson | todo |
| 44 | whatsapp-official-api-or-linked-device | וואצאפ רשמי או מכשיר מקושר: מה ההבדל למערכת שלכם | WhatsApp API לעסקים | informational | crazy-crm, mosachun | todo |
| 45 | kanban-sales-pipeline | ניהול לידים ועסקאות בלוח קנבן: איך בונים שלבים נכונים | ניהול לידים בקנבן | informational | crazy-crm | todo |
| 46 | monday-limits-for-israeli-business | מתי כלי ניהול כללי כבר לא מספיק לעסק | מתי לעבור ממאנדיי | commercial | crazy-crm, mosachun | todo |

Slug keys in the links column are the system articles under `/articles/`: yishuvon-settlement-management, hafakon-event-venue-management, mosachun-garage-management, kehilot-building-community-management, iruchon-hospitality-compound-management, mifalon-factory-management, mishmeron-security-company-management, mitvachon-shooting-range-management, dfuson-print-shop-management, crazy-crm-hebrew-crm.

Overlap to avoid: `/answers/` already targets "איזו חברה לפיתוח מערכת ניהול" (custom-management-system-development-israel), "CRM מדף מול CRM בהתאמה לעסק קטן" (small-business-custom-crm-comparison), "כמה עולה מערכת PWA עם בוט" (custom-pwa-management-system-cost), "בוט וואצאפ AI לעסקים" (whatsapp-ai-bot-for-business) and one question per system. A new guide must take a different angle and link to the answer page instead of repeating it.
