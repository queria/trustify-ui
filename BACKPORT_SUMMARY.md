# Upload BDD Tests - Backport Summary

**Branch:** `TC-4004-backport`  
**Base:** `release/0.4.z` (commit 67ed2f4a)  
**Implements:** TC-4004

---

## Overview

Backport of SBOM and advisory upload BDD test coverage to `release/0.4.z`.
Both upload workflows are consolidated into a shared `@uploads/` directory
with a single reusable step file.

---

## Files Added

### BDD Feature Files (2)
1. `e2e/tests/ui/features/@uploads/sbom-upload.feature`
   - 8 scenarios: navigation, page layout, valid/invalid uploads, multiple files, file removal

2. `e2e/tests/ui/features/@uploads/advisory-upload.feature`
   - 8 scenarios: navigation, page layout, valid/invalid uploads, multiple files, file removal
   - Uses `assets/csaf/` paths (release/0.4.z asset structure)

### Step Definitions (1)
3. `e2e/tests/ui/features/@uploads/upload.step.ts`
   - Shared step definitions serving both SBOM and advisory features
   - Uses `FileUpload.build(page)` generically (each page has one uploader)

### Page Objects (2)
4. `e2e/tests/ui/pages/sbom-upload/SBOMUploadPage.ts`
   - Page object for SBOM upload page with `buildFromBrowserPath()` and `fromCurrentPage()`

5. `e2e/tests/ui/pages/advisory-upload/AdvisoryUploadPage.ts`
   - Page object for advisory upload page with `buildFromBrowserPath()` and `fromCurrentPage()`

### Support Files (4)
6. `e2e/tests/ui/pages/FileUpload.ts`
   - File upload component wrapper using generic `div.pf-v6-c-multiple-file-upload` locator

7. `e2e/tests/ui/assertions/index.ts`
   - Minimal assertions module (FileUploadMatchers only)

8. `e2e/tests/ui/assertions/FileUploadMatchers.ts`
   - Custom Playwright matchers: `toHaveSummaryUploadStatus`, `toHaveItemUploadStatus`

9. `e2e/tests/ui/assertions/types.ts`
   - TypeScript type definitions for assertions

### Test Assets (2)
10. `e2e/tests/common/assets/invalid-file.json` — Invalid JSON for testing failed upload
11. `e2e/tests/common/assets/invalid-file.txt` — Unsupported file extension for rejection test

---

## Adaptations for release/0.4.z

### FileUpload.ts — no aria-label on upload components
On `main`, the `UploadFiles` component accepts `fileUploadProps` to pass
`aria-label` to the underlying `<MultipleFileUpload>`. On `release/0.4.z`
this prop doesn't exist, so the locator uses `div.pf-v6-c-multiple-file-upload`
without an aria-label qualifier (safe — one uploader per page).

### upload.step.ts — toolbar interaction
On `main`, "Upload SBOM" is in a kebab dropdown and the `Toolbar` class has
`clickKebabAction()`. On `release/0.4.z`, "Upload SBOM" is a primary button
and the Toolbar lacks kebab support. The step directly locates the toolbar by
`aria-label` and clicks the button.

### advisory-upload.feature — asset paths
Advisory test data lives in `assets/csaf/` on `release/0.4.z` (vs `assets/advisory/`
on `main`). File names also differ (e.g., `CVE-2022-45787-cve.json.bz2` vs
`cve-2022-45787.json.bz2`).

### Assertions module — minimal
Only includes `FileUploadMatchers` to avoid backporting the full page object
infrastructure (Table, Pagination, Toolbar, Dialog matchers and their dependencies).

---
