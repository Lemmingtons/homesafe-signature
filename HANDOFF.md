# Handoff — homesafe-signature

**Date:** 2026-04-29  
**Repo:** https://github.com/Lemmingtons/homesafe-signature  
**Branch:** main  
**Last commit:** `163074f`

---

## What this tool is

Single-file HTML app (`index.html`) — internal email signature generator for Homesafe franchise staff. Runs as a page inside the Homesafe Franchise Portal. Staff fill in their name/title/phone/email, upload a headshot, select their company (BPI or Strata), optionally add social links, then click "Copy for Gmail" to paste the signature into Google Workspace.

No build step. No dependencies. Deploy by serving the file.

---

## What was just fixed

**Bug:** "error: the signature is too long" when importing into Gmail.

**Root cause:** Commit `e9cb33f` (Apr 28) added headshot upload via `FileReader.readAsDataURL()` and stored the raw base64 data URI directly in the signature HTML. A typical phone photo = 20–100KB = **27,000+ chars** as a data URI. Gmail's signature limit is ~10,000 chars total.

**Fix in `163074f`:**

`handlePhotoUpload()` now runs a canvas resize pipeline before storing:

```js
// Inside img.onload (after FileReader loads the raw file):
const canvas = document.createElement('canvas');
canvas.width = 90; canvas.height = 90;
const ctx = canvas.getContext('2d');
const size = Math.min(img.width, img.height);
const sx = (img.width - size) / 2;
const sy = (img.height - size) / 2;
ctx.drawImage(img, sx, sy, size, size, 0, 0, 90, 90);
uploadedPhotoData = canvas.toDataURL('image/jpeg', 0.5);
```

Result: 90×90 JPEG at 50% quality ≈ **2,900 chars** (from 27,823). Full signature with photo + all fields ≈ 5,400 chars — well under Gmail's 10k limit.

A hard guard was also added in `copyHTML()`: if `html.length > 10000`, block the copy and alert the user before anything reaches the clipboard.

**Validated by:** karen sub-agent (read code, confirmed canvas logic correct, no race condition, data flow intact, estimated compressed size via sharp).

---

## Pre-existing issues for Codex to address

These were not introduced by the recent fix but should be resolved.

### 1. Strata logo missing from assets (medium)

`buildSignatureHTML()` references `assets/homesafe-strata-logo.png` for the Strata company option, but that file **does not exist** in the repo. Only `homesafe-logo.png` and `ryan-headshot.jpg` are in `assets/`. There is even a TODO comment in the code acknowledging this:

```js
// TODO: Replace with Azure Blob URL once uploaded — using local asset for now
strata: 'assets/homesafe-strata-logo.png'
```

**Fix needed:** Upload the Strata logo to Azure Blob Storage (same container as the BPI logo at `https://homesafe.blob.core.windows.net/images/homesafe-logo.png`) and replace the local asset reference with the blob URL. Ask Ryan for the strata logo file.

### 2. File input re-upload edge case (low)

`removePhoto()` clears the file input with `document.getElementById('photoFile').value = ''`. In some browsers, after clearing, selecting the same file again does not trigger `onchange` because the browser sees no value change. The user would need to select a different file or refresh.

**Fix needed:** Use a small trick to reset the input reliably:

```js
// Replace the existing line:
document.getElementById('photoFile').value = '';

// With:
const photoFile = document.getElementById('photoFile');
photoFile.value = '';
// Force reset so same-file re-upload triggers onchange
if (photoFile.value) { photoFile.type = 'text'; photoFile.type = 'file'; }
```

### 3. Social icons depend on external CDN (low, known)

`HOSTED_ICONS` points to `img.icons8.com`. These load fine in the portal browser but may be blocked in email clients with external image loading disabled (Outlook, corporate Gmail). Not urgent — the franchise portal is internal and icons only appear as clickable links, not in the email body.

If this becomes an issue, replace with inline SVG or host the icons on the same Azure Blob Storage container.

---

## File map

```
index.html                  — entire app (HTML + CSS + JS, ~790 lines)
assets/
  homesafe-logo.png         — BPI logo (used in signatures)
  ryan-headshot.jpg         — sample headshot (not used at runtime, dev reference only)
  homesafe-strata-logo.png  — MISSING — see issue #1 above
```

---

## Test checklist before next deploy

- [ ] Upload a phone photo (HEIC or JPEG from camera roll) — signature should copy without Gmail "too long" error
- [ ] Select Strata company — logo should render (blocked on issue #1)
- [ ] Remove photo, re-upload same photo — `onchange` should fire correctly
- [ ] All social links present — verify icons load in preview
- [ ] Copy for Gmail → paste into Gmail signature editor → Save Changes → no error
