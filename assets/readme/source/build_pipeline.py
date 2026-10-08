"""Builds pipeline.svg and pipeline-ar.svg from one stage list. Run: python source/build_pipeline.py"""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent
MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
ARAB = "'Segoe UI', Tahoma, 'Geeza Pro', 'Noto Sans Arabic', sans-serif"
ACCENT, GOLD, FG, MUTED, BODY = "#ff7a1a", "#b8863c", "#f4efe4", "#96897a", "#b3a696"

COPY = {
    "en": dict(
        title="How an audit runs",
        desc="Four stages. Fetch and Score run in code, so the Health Score is the same every run. "
             "Only the Explain stage calls Claude, which returns a summary and five ranked fixes through a fixed schema.",
        lanes=[("CODE DECIDES", ACCENT, 0, 2), ("MODEL EXPLAINS", GOLD, 2, 3), ("YOU GET", MUTED, 3, 4)],
        stages=[
            ("01 FETCH", "scrape.ts", ["Title, meta, H1s,", "alt text, canonical", "SSRF guard blocks", "private IPs"]),
            ("02 SCORE", "pagespeed.ts", ["4 Lighthouse scores", "Health Score =", "their average,", "computed in code"]),
            ("03 EXPLAIN", "analyze.ts", ["Claude reads both", "Forced tool-use", "returns a schema:", "summary + 5 fixes"]),
            ("04 REPORT", "route.ts", ["One JSON report", "Gauges and a", "ranked fix list", "PDF and CSV export"]),
        ],
        caption="Anything that has to match between runs is arithmetic, not a model guess.",
    ),
    "ar": dict(
        title="كيف يجري التدقيق",
        desc="أربع مراحل. الجلب والتقييم يجريان في الكود، فتبقى درجة الصحّة واحدة في كل تشغيل. "
             "مرحلة الشرح وحدها تستدعي Claude، فيعيد ملخّصاً وخمسة إصلاحات مرتّبة عبر مخطّط ثابت.",
        lanes=[("الكود يقرّر", ACCENT, 0, 2), ("النموذج يشرح", GOLD, 2, 3), ("النتيجة", MUTED, 3, 4)],
        stages=[
            ("01 جلب", "scrape.ts", ["العنوان والميتا وH1", "والنص البديل", "ووسم canonical", "مع حماية SSRF"]),
            ("02 تقييم", "pagespeed.ts", ["4 درجات Lighthouse", "درجة الصحّة هي", "متوسّطها، ويحسبها", "الكود لا النموذج"]),
            ("03 شرح", "analyze.ts", ["Claude يقرأ الاثنين", "ويُلزَم بأداة محدّدة", "تعيد مخطّطاً ثابتاً:", "ملخّص و5 إصلاحات"]),
            ("04 تقرير", "route.ts", ["تقرير JSON واحد", "مؤشّرات وقائمة", "إصلاحات مرتّبة", "تصدير PDF وCSV"]),
        ],
        caption="كل ما يجب أن يتطابق بين تشغيل وآخر حسابٌ في الكود، لا تخمينٌ من النموذج.",
    ),
}

W, H, M, BW, GAP, BY, BH = 1200, 440, 64, 238, 40, 116, 244


def box_x(i, rtl):
    x = M + i * (BW + GAP)
    return W - x - BW if rtl else x


def build(lang):
    c, rtl = COPY[lang], lang == "ar"
    font = ARAB if rtl else SANS
    # text anchored at the reading-start edge of each box
    def tx(x):
        return x + BW - 22 if rtl else x + 22
    anchor = 'text-anchor="start" direction="rtl"' if rtl else ""
    p = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="title desc">',
         f'  <title id="title">{c["title"]}</title>', f'  <desc id="desc">{c["desc"]}</desc>',
         '  <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#f4efe4" stroke-opacity="0.05"/></pattern></defs>',
         f'  <rect width="{W}" height="{H}" rx="24" fill="#0b0a08"/>', f'  <rect width="{W}" height="{H}" rx="24" fill="url(#grid)"/>']
    for label, color, a, b in c["lanes"]:
        xs = [box_x(i, rtl) for i in range(a, b)]
        x1, x2 = min(xs), max(xs) + BW
        lx, la = (x2, 'text-anchor="end"') if rtl else (x1, "")
        lf = font if rtl else MONO
        ls = "" if rtl else ' letter-spacing="3"'
        p.append(f'  <text x="{lx}" y="72" {la} font-family="{lf}" font-size="{22 if rtl else 18}" font-weight="700"{ls} fill="{color}">{label}</text>')
        p.append(f'  <path d="M{x1} 96V86H{x2}V96" fill="none" stroke="{color}" stroke-width="2"/>')
    for i, (step, file, lines) in enumerate(c["stages"]):
        x = box_x(i, rtl)
        p.append(f'  <rect x="{x}" y="{BY}" width="{BW}" height="{BH}" fill="#171310" stroke="#f4efe4" stroke-opacity="0.14"/>')
        sf = f'font-family="{font}" font-size="20" font-weight="700" {anchor}' if rtl else f'font-family="{MONO}" font-size="18" letter-spacing="3"'
        p.append(f'  <text x="{tx(x)}" y="{BY + 40}" {sf} fill="{ACCENT}">{step}</text>')
        fa = 'text-anchor="end"' if rtl else ""
        p.append(f'  <text x="{tx(x)}" y="{BY + 80}" {fa} font-family="{MONO}" font-size="22" fill="{FG}">{file}</text>')
        p.append(f'  <line x1="{x + 22}" y1="{BY + 100}" x2="{x + BW - 22}" y2="{BY + 100}" stroke="#f4efe4" stroke-opacity="0.14"/>')
        for j, line in enumerate(lines):
            p.append(f'  <text x="{tx(x)}" y="{BY + 136 + j * 30}" {anchor} font-family="{font}" font-size="20" fill="{BODY}">{line}</text>')
        if i < 3:  # arrow toward the next stage, in reading direction
            cy = BY + BH / 2
            if rtl:
                ax = x - GAP / 2
                p.append(f'  <path d="M{ax + 8} {cy - 9}L{ax - 4} {cy}L{ax + 8} {cy + 9}" fill="none" stroke="{ACCENT}" stroke-width="3"/>')
            else:
                ax = x + BW + GAP / 2
                p.append(f'  <path d="M{ax - 8} {cy - 9}L{ax + 4} {cy}L{ax - 8} {cy + 9}" fill="none" stroke="{ACCENT}" stroke-width="3"/>')
    cx, ca = (W - M, 'text-anchor="start" direction="rtl"') if rtl else (M, "")
    cf = font if rtl else MONO
    p.append(f'  <text x="{cx}" y="{BY + BH + 50}" {ca} font-family="{cf}" font-size="{21 if rtl else 19}" fill="{MUTED}"><tspan fill="{ACCENT}">{"&lt;" if rtl else "&gt;"}</tspan> {c["caption"]}</text>')
    p.append("</svg>\n")
    name = "pipeline-ar.svg" if rtl else "pipeline.svg"
    (OUT / name).write_text("\n".join(p), encoding="utf-8")


for lang in COPY:
    build(lang)
