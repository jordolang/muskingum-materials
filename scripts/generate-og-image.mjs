// Regenerates app/opengraph-image.png — the static Open Graph / Twitter card
// scrapers use when the site is shared on Facebook, LinkedIn, X, iMessage, etc.
// It is served for the homepage / default share via Next.js's file convention
// (app/opengraph-image.png + app/opengraph-image.alt.txt). Section routes still
// use the dynamic template in lib/seo/og/template.tsx.
//
//   node scripts/generate-og-image.mjs
//
// The card is a 1200x630 editorial split: the brand crest on a coal panel that
// matches the crest's own baked backdrop (so there is no seam), beside a photo
// of the actual Zanesville operation. Palette + type come straight from the
// site's "cinematic hero" tokens in tailwind.config.ts (coal / gold / bone,
// Anton + JetBrains Mono + Inter). Edit the copy or swap PHOTO below, then rerun.
//
// Requires Google Chrome installed (Playwright drives it via channel: "chrome").
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CREST = "public/muskingum-materials-logo.png";
const PHOTO = "public/images/photos/loading-dump-truck.jpg";
const OUT = resolve(ROOT, "app/opengraph-image.png");

const dataUri = (relPath, mime) =>
  `data:${mime};base64,${readFileSync(resolve(ROOT, relPath)).toString("base64")}`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet"/>
<style>
  :root{--coal:#0b0a09;--steel:#211d19;--iron:#44403c;--grit:#78716c;--dust:#d6d2cb;--bone:#f4f1ea;--gold:#f2b705;}
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{background:var(--coal);}
  .card{position:relative;width:1200px;height:630px;overflow:hidden;background:var(--coal);font-family:"Inter",system-ui,sans-serif;display:flex;}
  .panel{position:relative;width:660px;height:100%;flex:0 0 660px;
    background:radial-gradient(120% 90% at 40% 32%, #2b2620 0%, #1a1611 40%, #100e0b 70%, #0b0a09 100%);
    padding:44px 60px 40px;display:flex;flex-direction:column;}
  .panel::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.06;
    background-image:radial-gradient(rgba(244,241,234,.9) 1px, transparent 1.4px);background-size:7px 7px;
    -webkit-mask-image:radial-gradient(120% 90% at 40% 40%, #000 40%, transparent 85%);
            mask-image:radial-gradient(120% 90% at 40% 40%, #000 40%, transparent 85%);}
  .crest{width:290px;height:auto;display:block;margin:0 0 22px -6px;filter:drop-shadow(0 18px 40px rgba(0,0,0,.55));}
  .eyebrow{font-family:"JetBrains Mono",monospace;font-weight:600;font-size:13.5px;letter-spacing:.185em;
    text-transform:uppercase;white-space:nowrap;color:var(--gold);display:flex;align-items:center;gap:11px;margin-bottom:16px;}
  .eyebrow::before{content:"";width:24px;height:2px;background:var(--gold);display:inline-block;flex:0 0 auto;}
  h1{font-family:"Anton",sans-serif;font-weight:400;color:var(--bone);font-size:66px;line-height:.92;
    letter-spacing:.005em;text-transform:uppercase;text-shadow:0 2px 24px rgba(0,0,0,.4);}
  h1 .amp{color:var(--gold);}
  .sub{margin-top:16px;max-width:500px;color:var(--dust);font-size:18px;line-height:1.4;font-weight:400;}
  .spacer{flex:1;min-height:8px;}
  .meta{display:flex;align-items:center;gap:18px;margin-top:16px;}
  .loc{display:inline-flex;align-items:center;gap:10px;border:1px solid rgba(242,183,5,.35);border-radius:999px;
    padding:9px 16px 9px 14px;color:var(--bone);font-size:15px;font-weight:600;letter-spacing:.01em;
    background:linear-gradient(180deg, rgba(242,183,5,.10), rgba(242,183,5,.03));}
  .loc .pin{width:9px;height:9px;border-radius:50%;background:var(--gold);box-shadow:0 0 0 4px rgba(242,183,5,.18);}
  .contact{display:flex;align-items:baseline;gap:14px;margin-top:16px;font-family:"JetBrains Mono",monospace;}
  .phone{color:var(--bone);font-weight:600;font-size:24px;letter-spacing:.01em;}
  .dot{color:var(--iron);}
  .site{color:var(--grit);font-weight:500;font-size:16px;letter-spacing:.06em;text-transform:uppercase;}
  .photo{position:relative;flex:1;height:100%;overflow:hidden;}
  .photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:58% 62%;
    filter:saturate(.86) contrast(1.05) brightness(.9);}
  .photo::before{content:"";position:absolute;inset:0;z-index:2;background:
      linear-gradient(90deg, var(--coal) 0%, rgba(11,10,9,.72) 9%, rgba(11,10,9,.10) 26%, transparent 42%),
      linear-gradient(0deg, rgba(11,10,9,.62) 0%, transparent 34%),
      linear-gradient(180deg, rgba(20,17,14,.34) 0%, transparent 30%),
      radial-gradient(90% 120% at 82% 30%, rgba(242,183,5,.10), transparent 55%);}
  .seam{position:absolute;top:0;left:660px;width:3px;height:100%;z-index:5;
    background:linear-gradient(180deg, rgba(242,183,5,0), var(--gold) 18%, var(--gold) 82%, rgba(242,183,5,0));
    box-shadow:0 0 22px 2px rgba(242,183,5,.45);}
  .tick{position:absolute;z-index:8;width:34px;height:34px;pointer-events:none;}
  .tick::before,.tick::after{content:"";position:absolute;background:var(--gold);opacity:.85;}
  .tick::before{width:34px;height:2px;} .tick::after{width:2px;height:34px;}
  .tl{top:26px;left:26px;} .tl::before{top:0;left:0;} .tl::after{top:0;left:0;}
  .tr{top:26px;right:26px;} .tr::before{top:0;right:0;} .tr::after{top:0;right:0;}
  .bl{bottom:26px;left:26px;} .bl::before{bottom:0;left:0;} .bl::after{bottom:0;left:0;}
  .br{bottom:26px;right:26px;} .br::before{bottom:0;right:0;} .br::after{bottom:0;right:0;}
  .cred{position:absolute;z-index:9;right:34px;bottom:30px;display:inline-flex;align-items:center;gap:9px;
    font-family:"JetBrains Mono",monospace;font-weight:600;font-size:12px;letter-spacing:.16em;text-transform:uppercase;
    color:var(--coal);background:var(--gold);padding:8px 13px;border-radius:6px;box-shadow:0 8px 22px rgba(0,0,0,.45);}
  .cred .chk{font-size:13px;line-height:1;}
</style></head>
<body><div class="card">
  <section class="panel">
    <img class="crest" src="${dataUri(CREST, "image/png")}" alt="Muskingum Materials"/>
    <div class="eyebrow">State &amp; ODOT Approved · Zanesville, Ohio</div>
    <h1>Sand, Gravel<br/><span class="amp">&amp;</span> Aggregate</h1>
    <p class="sub">Trusted material supply for contractors, municipalities &amp; commercial projects — backed by on-site state-approved scales.</p>
    <div class="spacer"></div>
    <div class="meta"><span class="loc"><span class="pin"></span>Serving Central &amp; Southeastern Ohio</span></div>
    <div class="contact"><span class="phone">(740)&nbsp;319-0183</span><span class="dot">·</span><span class="site">muskingummaterials.com</span></div>
  </section>
  <div class="photo"><img src="${dataUri(PHOTO, "image/jpeg")}" alt="Muskingum Materials aggregate operation"/></div>
  <div class="seam"></div>
  <div class="cred"><span class="chk">✔</span> ODOT Approved Materials</div>
  <span class="tick tl"></span><span class="tick tr"></span><span class="tick bl"></span><span class="tick br"></span>
</div></body></html>`;

const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);
  const buffer = await page.locator(".card").screenshot({ type: "png" });
  writeFileSync(OUT, buffer);
  console.log(`Wrote ${OUT} (${(buffer.length / 1024).toFixed(0)} KB, 1200x630)`);
} finally {
  await browser.close();
}
