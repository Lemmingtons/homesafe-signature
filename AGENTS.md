# AGENTS.md — homesafe-signature

Internal email signature generator for Homesafe franchise staff. Single-file app (`index.html`) — no build step, no dependencies. Deployed as a page inside the Homesafe Franchise Portal.

---

## Current handoff (2026-04-29)

A Gmail "signature is too long" bug was fixed and validated. Two pre-existing issues remain for Codex to resolve.

**Full context:** see `HANDOFF.md` in this repo root.

---

## Outstanding tasks

### 1. Fix strata logo (medium priority)

`buildSignatureHTML()` in `index.html` references `assets/homesafe-strata-logo.png` but that file does not exist in the repo. The BPI logo is already hosted at Azure Blob Storage — the strata logo needs the same treatment.

**Steps:**
1. Get the strata logo file from Ryan
2. Upload to `https://homesafe.blob.core.windows.net/images/` (same container as `homesafe-logo.png`)
3. In `index.html`, replace:
   ```js
   strata: 'assets/homesafe-strata-logo.png'
   ```
   with:
   ```js
   strata: 'https://homesafe.blob.core.windows.net/images/homesafe-strata-logo.png'
   ```
4. Remove the TODO comment on the line above it

### 2. Fix same-file re-upload edge case (low priority)

In `removePhoto()`, clearing `photoFile.value = ''` means selecting the same file again after removing won't trigger `onchange` in some browsers.

**Fix in `index.html` inside `removePhoto()`** — replace:
```js
document.getElementById('photoFile').value = '';
```
with:
```js
const photoFile = document.getElementById('photoFile');
photoFile.value = '';
if (photoFile.value) { photoFile.type = 'text'; photoFile.type = 'file'; }
```

---

## What was recently fixed (do not redo)

`handlePhotoUpload()` now resizes photos to 90×90 JPEG at 50% quality via canvas before embedding. Raw phone photos were 27,000+ chars as data URIs; compressed output is ~2,900 chars. Gmail limit is 10,000 chars. Fix is in commit `163074f` and has been validated.

---

## File map

```
index.html          — entire app (~790 lines, HTML + CSS + JS inline)
assets/
  homesafe-logo.png           — BPI logo (used in signatures)
  ryan-headshot.jpg           — dev reference only, not used at runtime
  homesafe-strata-logo.png    — MISSING (see task 1 above)
HANDOFF.md          — detailed fix summary and test checklist
AGENTS.md           — this file
```

---

## Test checklist before next deploy

- [ ] Upload a large phone photo — signature copies into Gmail without "too long" error
- [ ] Select Strata company — logo renders correctly (blocked on task 1)
- [ ] Remove photo, re-upload same photo — `onchange` fires (blocked on task 2)
- [ ] All four social links filled — icons appear in preview
- [ ] Copy for Gmail → paste into Gmail → Save Changes → no error
