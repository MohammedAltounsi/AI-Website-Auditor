<div align="left">

[English](README.md) · **العربية**

</div>

<p align="center">
  <a href="https://ai-website-auditor-indol.vercel.app">
    <img src="./assets/readme/hero-ar.svg" width="100%" alt="مُدقّق المواقع بالذكاء الاصطناعي: الصق رابطاً واحصل على درجة صحّة من بيانات PageSpeed الحقيقية وقائمة إصلاحات مرتّبة. اللوحة تعرض تدقيقاً لموقع stripe.com بدرجة 73.">
  </a>
</p>

<p align="center">
  <a href="https://ai-website-auditor-indol.vercel.app"><img src="https://img.shields.io/website?url=https%3A%2F%2Fai-website-auditor-indol.vercel.app&label=live%20demo&up_message=online&up_color=ff7a1a&labelColor=171310&style=flat" alt="حالة الموقع المباشر"></a>
  <img src="https://img.shields.io/badge/Next.js-16-171310?style=flat&logo=nextdotjs&logoColor=white" alt="Next.js 16">
  <img src="https://img.shields.io/badge/TypeScript-5-171310?style=flat&logo=typescript&logoColor=white" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/data-PageSpeed%20Insights-171310?style=flat&logo=google&logoColor=white" alt="البيانات من Google PageSpeed Insights">
  <img src="https://img.shields.io/badge/tests-Vitest-171310?style=flat&logo=vitest&logoColor=white" alt="الاختبارات عبر Vitest">
</p>

<div dir="rtl">

<p align="center">
  <a href="https://ai-website-auditor-indol.vercel.app"><b>جرّب الموقع المباشر</b></a> ·
  <a href="#التشغيل-المحلي">التشغيل المحلي</a> ·
  <a href="#كيف-يجري-التدقيق">كيف يعمل</a>
</p>

الصق رابط أي موقع، فيعيد لك المُدقّق درجة صحّة، وتفصيلاً للأداء وإتاحة
الوصول وتحسين محركات البحث وأفضل الممارسات من بيانات Google PageSpeed
Insights، وملخّصاً قصيراً يكتبه Claude، وقائمة إصلاحات مرتّبة حسب الخطورة.
ويمكنك تصدير التقرير بصيغة PDF أو CSV.

## تشغيل حقيقي

<p align="center">
  <img src="./screenshots/audit.png" width="100%" alt="المُدقّق المباشر بعد فحص stripe.com: درجة الصحّة 73، والأداء 44، وإتاحة الوصول 100، وSEO 92، وأفضل الممارسات 54">
</p>

هذه لقطة من الموقع المباشر وهو يدقّق stripe.com. الدرجات الأربع تأتي من
PageSpeed كما هي، والرقم 73 في المنتصف متوسّطها بعد التقريب.

## القرار التصميمي الأساسي

النموذج لا يولّد درجة الصحّة أبداً. الكود يأخذ درجات PageSpeed الأربع
الحقيقية ويقرّب متوسّطها بدالة `Math.round`، فيحصل الموقع نفسه على الدرجة
نفسها في كل تدقيق. أما Claude فيكتب الملخّص وقائمة الإصلاحات فقط.

القاعدة التي يثبتها المشروع: النموذج يشرح، والكود يقرّر كل ما يجب أن يبقى
ثابتاً بين تشغيل وآخر.

## كيف يجري التدقيق

<p align="center">
  <img src="./assets/readme/pipeline-ar.svg" width="100%" alt="أربع مراحل: 01 جلب (scrape.ts) و02 تقييم (pagespeed.ts) تجريان في الكود، و03 شرح (analyze.ts) تستدعي Claude باستخدام إجباري للأداة لإخراج ملخّص وخمسة إصلاحات، و04 تقرير (route.ts) يعيد تقرير JSON واحداً مع تصدير PDF وCSV.">
</p>

<details>
<summary><b>شرح الملفات واحداً واحداً</b></summary>

1. **`lib/scrape.ts`** يجلب الصفحة المستهدفة ويستخرج إشارات SEO داخل
   الصفحة باستخدام `cheerio`: العنوان، ووصف الميتا، وعدد عناوين H1، وتغطية
   النص البديل للصور، ووسم canonical، ووسم viewport، وعدد الكلمات.
2. **`lib/pagespeed.ts`** يستدعي واجهة PageSpeed Insights (بإعدادات
   الجوال) للحصول على درجات الفئات الأربع، ويعيد المحاولة حتى ثلاث مرات عند
   أخطاء 5xx العابرة، ثم يحسب درجة الصحّة متوسّطاً لها.
3. **`lib/analyze.ts`** يرسل بيانات الاستخراج وPageSpeed إلى Claude مع
   إلزامه باستخدام الأداة (`tool_choice: { type: 'tool' }`). فتأتي
   الاستجابة دائماً كائناً منظّماً يطابق مخطّط `submit_audit_report`، لا
   نصاً حرّاً يحتاج إلى تحليل.
4. **`app/api/audit/route.ts`** يشغّل المراحل ويعيد تقرير JSON واحداً.
5. **`app/page.tsx` و`app/components/*`** تعرض نموذج الرابط، ومؤشّر درجة
   الصحّة المتحرّك، وتفصيل الفئات، وقائمة الإصلاحات بشارات الخطورة، وتصدير
   PDF (عبر طباعة المتصفّح) وCSV.

</details>

## آمن مع أي رابط

يجلب المُدقّق أي رابط عام يكتبه الزائر، لذلك يتعامل `lib/scrape.ts` مع هذا
المُدخل على أنه غير موثوق:

- **الحماية من SSRF.** يحلّ اسم النطاق أولاً، ويحجب النطاقات الخاصة
  وعناوين loopback وlink-local وعناوين IPv6 المرتبطة بـ IPv4، ثم يثبّت
  الاتصال على العنوان الذي فحصه. فإذا أشار نطاق عام إلى `169.254.169.254`
  رُفض الطلب.
- **إعادة التوجيه.** يتبع حتى 5 عمليات إعادة توجيه يدوياً ويفحص كل خطوة،
  فلا يستطيع رابط عام أن يقود إلى عنوان داخلي.
- **الحدود.** ينتهي كل طلب جلب بعد 15 ثانية، ويتوقّف عن القراءة عند 5
  ميغابايت.
- **تصدير CSV.** يعالج الخلايا التي تبدأ بـ `=` أو `+` أو `-` أو `@` حتى
  لا تُنفَّذ كصيغ في برامج الجداول.

## التشغيل المحلي

تحتاج إلى Node.js، و[مفتاح Anthropic API](https://console.anthropic.com)،
و[مفتاح Google Cloud](https://console.cloud.google.com) مع تفعيل PageSpeed
Insights API.

</div>

```bash
npm install
cp .env.local.example .env.local
# set ANTHROPIC_API_KEY and PAGESPEED_API_KEY in .env.local
npm run dev
```

<div dir="rtl">

تشغيل الاختبارات:

</div>

```bash
npm test
```

<div dir="rtl">

## التقنيات

Next.js 16 (App Router)، وTypeScript، وTailwind CSS 4، وواجهة Google
PageSpeed Insights، وواجهة Anthropic بنموذج `claude-sonnet-5` مع الاستخدام
الإجباري للأداة، وVitest مع Testing Library.

<details>
<summary><b>الخطوات القادمة</b></summary>

- حفظ التدقيقات السابقة (Postgres أو Supabase) ليعود المستخدم إلى أي تقرير عبر رابط.
- وضع المقارنة: تدقيق رابطين ومقارنة الإصلاحات بينهما.
- فحص الظهور لزواحف الذكاء الاصطناعي (GEO): هل يجد ChatGPT وPerplexity وGemini الصفحة ويستشهدون بها.
- درجة صحّة مُرجّحة حين يكشف الاستخدام الفعلي أي فئة تستحق وزناً أكبر.
- خيار للتبديل بين الجوال وسطح المكتب في PageSpeed بدل الجوال وحده.
- تحديد عدد الطلبات لكل عنوان IP (Vercel KV) حين تصل زيارات حقيقية.

</details>

---

<p align="center">
  تصميم وتطوير: <b>محمد الطنسي</b> · <a href="https://www.linkedin.com/in/mohammed-altounsi/">لينكدإن</a>
</p>

</div>
