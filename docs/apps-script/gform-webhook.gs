// Google Form → MUN platform webhook.
//
// Install (one time, per form):
//   1. Open the Google Sheet LINKED to the form → Extensions → Apps Script.
//   2. Paste this file, fill in CONFIG below.
//   3. Triggers (clock icon) → Add Trigger → function onFormSubmit →
//      event source "From spreadsheet" → event type "On form submit" → Save.
//   4. Submit a test response and confirm it appears in /admin/registrations
//      (delegates) or /admin/recruitment (applicants).
//
// Missed/failed deliveries self-heal: publish the sheet as CSV
// (File → Share → Publish to web → CSV) and add that URL to the
// sheetPullSources setting — the daily /api/cron/gform-sync re-imports it.
// Duplicate rows are always deduped by email, so retries are safe.
//
// Optional near-real-time healing without the daily cron: add a second
// time-driven trigger (every 5 minutes) calling a function that re-POSTs
// the last N sheet rows — usually unnecessary, the webhook rarely misses.

var CONFIG = {
  url: "https://YOURAPP.vercel.app/api/webhooks/gform",
  secret: "PASTE_GFORM_SHARED_SECRET", // must equal GFORM_SHARED_SECRET env var
  kind: "delegate",                    // "delegate" | "applicant"
  preset: "gform-delegate",            // ImportPreset name (delegate kind only)
  source: "SELF",                      // "SELF" | "CROSS_DEL" (delegate kind only)
};

function onFormSubmit(e) {
  var row = {};
  for (var k in e.namedValues) row[k] = (e.namedValues[k] || []).join(", ");

  var res = UrlFetchApp.fetch(CONFIG.url, {
    method: "post",
    contentType: "application/json",
    headers: { "x-gform-secret": CONFIG.secret },
    payload: JSON.stringify({
      preset: CONFIG.preset,
      kind: CONFIG.kind,
      source: CONFIG.source,
      row: row,
    }),
    muteHttpExceptions: true,
  });

  if (res.getResponseCode() >= 400) {
    MailApp.sendEmail(
      Session.getEffectiveUser().getEmail(),
      "MUN platform: form webhook failed (" + res.getResponseCode() + ")",
      res.getContentText() + "\n\nThe daily re-sync will pick this row up; no data is lost."
    );
  }
}
