# Design — "The Yard": 3-Act Cinematic Video Scroll Experience

**Date:** 2026-06-21
**Status:** Approved (design + Seedance model confirmed by user)

## Goal

Recreate / upgrade the existing scroll-driven hero "experience" for Muskingum
Materials (a mining & aggregate sales business — they process raw materials and
sell them). Replace the placeholder Adobe Firefly footage with **new
Higgsfield-generated video seeded from the company's real mine-site footage**,
featuring heavy machinery, and expand the experience to **three full scroll
screens**: Hero → Description/Feature → CTA. Keep the big bold Anton lettering.

The static homepage hero (`app/page.tsx`) is **left untouched** per the user.

## What already exists (reused)

- `motion/react` (Framer Motion v12) + a custom canvas frame-scrub engine,
  `components/home/cinematic-hero/use-scrub-frames.ts`, which decodes a `.webp`
  image sequence and scrubs it on scroll (the "buttery" loading/scroll effect).
- Two acts today: `scroll-video-hero.tsx` ("MOVE THE EARTH.", frames from
  `/frames/firefly-1`) and `rock-dump-section.tsx` ("AGGREGATE" knockout mask,
  `/frames/firefly-2`).
- Mounted two ways: `cinematic-intro-overlay.tsx` (once-per-session overlay over
  the homepage, with a "Loading the yard" progress cover) and the standalone
  `/experience` page (`app/experience/page.tsx`).
- Design tokens (`tailwind.config.ts`): `coal #0b0a09`, `iron`, `grit`, `dust`,
  `bone #f4f1ea`, `caution #f2b705`, `ember #e8590c`. Fonts: `font-display`
  (Anton), `font-tech` (JetBrains Mono).

## Decisions

- **Placement:** Upgrade the cinematic experience *in place* (overlay +
  `/experience`). Static homepage hero stays.
- **Mine site:** Image-to-video seeded from real frames of the company footage
  (`water.mp4`, `gravel.mp4`) so the clips genuinely extend their site.
- **Mechanism:** Canvas frame-scrub (extract generated mp4 → ~150 webp frames),
  preserving the existing engine and "Loading the yard" cover.
- **Clips:** Three (one per screen).
- **Model:** Higgsfield **Seedance 2.0**, image-to-video, 720p, `mode: fast`
  (starter plan), silent, 5s, 16:9. ~22 credits each (~68 total of 280).

## The three acts

1. **HERO** — seed `water.mp4 @14s` (two excavators digging + red dump truck by
   the pond). Headline **"MOVE THE EARTH."** (Anton, `text-[18vw]`, `caution`
   accent). Camera pull-back scrub, spec plate, scroll cue. Frames →
   `/frames/hero`.
2. **FEATURE / DESCRIPTION** — seed `gravel.mp4 @2s` (red screener cascading
   gravel onto a stockpile). The footage plays full-bleed and scrubbed (same
   treatment as the hero) under a big Anton slogan **"CRUSHED ON SITE."** with a
   short caption: "We dig it, crush it, and grade it on-site — no middlemen, no
   markup." Frames → `/frames/process`. (Earlier iteration used an "AGGREGATE"
   SVG letter-knockout; replaced with the slogan treatment at the user's
   request — `feature-section.tsx`, formerly `rock-dump-section.tsx`.)
3. **CTA** (new act) — seed `gravel.mp4 @11s` (wheel loader + screener + yard,
   golden hour). Headline **"LOAD UP."** + buttons `Request a Load` (→ /order)
   and `Call {BUSINESS_INFO.phone}`. Replaces the overlay's plain closing beat;
   scrolling to the bottom still hands off to the site. Frames → `/frames/deliver`.

## Asset pipeline

1. `ffmpeg` extracts seed stills from real footage (done).
2. Higgsfield image-to-video → 3 mp4s (Seedance 2.0).
3. `scripts/extract-frames.sh <video> <out-dir> [count]` slices each mp4 into
   zero-padded `0001.webp …` frames (~150) at the resolution the engine draws.
4. Original `firefly-1/2` frames are kept as a fallback.

## Files

- New: `public/frames/{hero,process,deliver}/`, generated mp4s under
  `public/images/videos/`, `components/home/cinematic-hero/cta-section.tsx`,
  `scripts/extract-frames.sh`.
- Edit: `cinematic-hero.tsx` (compose 3 acts), `scroll-video-hero.tsx` (point at
  `/frames/hero`), `rock-dump-section.tsx` (point at `/frames/process`),
  `cinematic-intro-overlay.tsx` (replace closing beat with the CTA act / handoff).

## Verification

- `npm run lint` and `npm run build` pass.
- Visit `/experience` and the homepage intro overlay: three screens scroll, each
  with scrubbed real-site footage and bold lettering; the loader cover lifts once
  opening frames decode; reaching the bottom hands off to the site.
