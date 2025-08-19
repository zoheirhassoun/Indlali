# إعداد Google Sheets لإندلالي - المعلمة الذكية

## خطوات إعداد جدول بيانات منفصل لتقييمات إندلالي

### 1. إنشاء Google Sheet جديد

1. انتقل إلى [Google Sheets](https://sheets.google.com)
2. اضغط على "+" لإنشاء جدول بيانات جديد
3. اعط الجدول اسماً مثل: **"إندلالي - تقييمات المعلمة الذكية"**

### 2. إعداد أعمدة الجدول

أضف الأعمدة التالية في الصف الأول:

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| التاريخ | التقييم | التعليق | نص الاستفسار | وقت الاستجابة | IP العنوان | المتصفح | اللغة | الشاشة | المنطقة الزمنية | المصدر | معرف الجلسة |

### 3. إنشاء Google Apps Script

1. في جدول البيانات، اذهب إلى **Extensions > Apps Script**
2. احذف الكود الموجود واستبدله بالكود التالي:

```javascript
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    // معرف جدول البيانات (ضع معرف جدولك هنا)
    const SHEET_ID = 'YOUR_SHEET_ID_HERE';
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    
    let data;
    
    if (e.parameter.data) {
      // طلب GET مع البيانات كمعامل
      data = JSON.parse(e.parameter.data);
    } else if (e.postData) {
      // طلب POST مع البيانات في الجسم
      data = JSON.parse(e.postData.contents);
    } else {
      throw new Error('لا توجد بيانات في الطلب');
    }
    
    // التحقق من وجود البيانات المطلوبة
    if (!data.rating || !data.timestamp) {
      throw new Error('البيانات المطلوبة مفقودة');
    }
    
    // إعداد البيانات للإدراج
    const rowData = [
      new Date(data.timestamp), // التاريخ
      data.rating, // التقييم (positive/negative)
      data.comment || '', // التعليق
      data.queryText || '', // نص الاستفسار
      data.responseTime || 0, // وقت الاستجابة
      data.ipAddress || 'غير معروف', // عنوان IP
      data.userAgent || 'غير معروف', // المتصفح
      data.language || 'ar', // اللغة
      data.screenResolution || 'غير معروف', // حجم الشاشة
      data.timezone || 'غير معروف', // المنطقة الزمنية
      data.source || 'web', // المصدر
      data.sessionId || 0 // معرف الجلسة
    ];
    
    // إضافة البيانات إلى الجدول
    sheet.appendRow(rowData);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'تم حفظ التقييم بنجاح',
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('خطأ في حفظ التقييم:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 4. تحديث معرف الجدول

1. في الكود أعلاه، استبدل `YOUR_SHEET_ID_HERE` بمعرف جدول البيانات الخاص بك
2. يمكنك العثور على معرف الجدول في رابط URL للجدول:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```

### 5. نشر السكريبت

1. اضغط على **Deploy > New deployment**
2. اختر **Type: Web app**
3. ضع الوصف: "إندلالي - معالج تقييمات المعلمة الذكية"
4. ضع **Execute as: Me**
5. ضع **Who has access: Anyone**
6. اضغط **Deploy**
7. انسخ **Web app URL** الذي سيظهر

### 6. تحديث ملف config.js

1. افتح ملف `config.js`
2. استبدل `YOUR_INDLALI_GOOGLE_APPS_SCRIPT_URL_HERE` برابط Web app الذي نسخته
3. استبدل `YOUR_INDLALI_SHEET_ID_HERE` بمعرف جدول البيانات

```javascript
GOOGLE_SHEETS: {
    ENABLED: true,
    SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    SHEET_ID: 'YOUR_ACTUAL_SHEET_ID',
    FALLBACK_TO_N8N: true
},
```

### 7. اختبار النظام

1. افتح موقع إندلالي
2. اذهب إلى قسم "المعلمة الذكية"
3. اكتب استفساراً تعليمياً واضغط إرسال
4. قيّم الإجابة واتركت تعليقاً
5. تحقق من ظهور البيانات في جدول Google Sheets

## ملاحظات مهمة

- ✅ هذا الجدول منفصل تماماً عن جدول "معين"
- ✅ البيانات ستحفظ بتنسيق عربي مناسب
- ✅ يمكن تحليل البيانات لاحقاً لتحسين أداء المعلمة الذكية
- ✅ النظام يدعم حفظ البيانات محلياً كبديل في حالة فشل الاتصال

## استكشاف الأخطاء

إذا واجهت مشاكل:

1. **تحقق من أذونات Google Apps Script**
2. **تأكد من صحة معرف الجدول**
3. **راجع سجلات الأخطاء في Google Apps Script**
4. **تحقق من إعدادات الخصوصية في المتصفح**

## مثال على البيانات المحفوظة

| التاريخ | التقييم | التعليق | نص الاستفسار |
|---------|---------|---------|-------------|
| 2025-01-08 14:30 | positive | إجابة ممتازة ومفيدة | ما هي أفضل طرق التعلم الفعال؟ |
| 2025-01-08 14:35 | negative | الإجابة غير واضحة | كيف أحسن من درجاتي؟ |
