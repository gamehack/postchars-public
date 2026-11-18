// Optional GA4 configuration for a self-hosted PostChars deployment.
// Analytics is disabled until the site operator supplies their own measurement ID.
(function () {
  'use strict';
  var measurementId = '';
  window.POSTCHARS_GA4_ID = measurementId;
  var meta = document.querySelector('meta[name="postchars-ga4-id"]');
  if (measurementId && !meta) {
    meta = document.createElement('meta');
    meta.name = 'postchars-ga4-id';
    document.head.appendChild(meta);
  }
  if (meta) meta.content = measurementId;
})();
