# Photo-assisted fight records

Either participant can record a fight. One image of the **Overall** statistics screen is enough when it shows both columns and the finish. Up to three images can be attached if the result and statistics appear on separate screens. The other player does not need to upload a second copy.

During an active fight, choose **Take a photo** (rear camera on supported phones) or **Upload screenshot**. Photos are resized and text recognition runs in the browser using Tesseract.js. The first recognition may download its worker and English language data. A straight-on, sharp screenshot is preferable to an angled TV photo. This is text recognition rather than a general visual AI; tilted screens and small text can require substantial manual correction.

The form recognizes readable, labeled rows for stuns/wobbles, body and leg health events, knockdowns, significant and total strikes landed/attempted, takedowns landed/attempted, and control time. Readable result text can prefill KO/TKO, Submission, Decision, round, and elapsed time. Winners are chosen manually. Explicitly match the left photo column to its player before submission. Confirm that Overall is selected; the importer does not reliably detect which tab is highlighted.

Every field remains editable. Unknown statistics stay blank, distinct from a recorded zero. Winner, finish method, scheduled rounds, winning round, and time are required. The fighter names and weight class come from the pre-fight selections.

Submitting creates a pending proposal. No win, loss, or statistic is added to lifetime records yet. The rival views the evidence and both players' entered numbers, then confirms or requests corrections with a note. The submitter can withdraw a proposal to edit it, but cannot confirm it. A stale or repeated confirmation is rejected. After confirmation, either player can start the next fight or end the night. Historical records created before this feature remain unchanged.

Images are stored in the Site's R2 `BUCKET`, and records store authenticated image URLs. The `/api/evidence` route authorizes the requesting player against the fight-night participants and verifies that the image is referenced by that night. Images are not placed in the public asset directory or sent to an AI service for recognition.

## Verification

Run:

```sh
node --import tsx --test tests/fight-results.test.ts
npx tsc --noEmit
npm run build
```

Tests cover readable text extraction, unreadable fields, numeric validation, self-confirmation, stale confirmations, exactly-once recording, correction requests, and withdrawal ownership. A local OCR trial on the user's angled sample photo extracted only some rows, so manual review is essential. OCR quality on direct console screenshots and full multi-user browser testing require further real-world samples.
