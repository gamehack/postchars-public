import type { ConsentSettings } from './consent';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    POSTCHARS_GA4_ID?: string;
    __postcharsConsentInitialized?: boolean;
  }
}

let consentInitialized = false;
let analyticsEnabled = false;
let configuredMeasurementId: string | null = null;

function ensureGoogleTagQueue(): void {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || ((...args: unknown[]) => {
    window.dataLayer.push(args);
  });

  if (!consentInitialized) {
    // The static HTML bootstrap runs before the AdSense verification tag.
    // Only add a fallback default when running without that bootstrap.
    if (!window.__postcharsConsentInitialized) {
      window.gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
      window.__postcharsConsentInitialized = true;
    }
    consentInitialized = true;
  }
}

/**
 * GA4 loads only after analytics consent. The AdSense verification tag is
 * separate and initialized with denied consent in static HTML; a certified
 * CMP must manage Google advertising consent for regulated markets.
 * Adsterra is separately gated by the local advertising preference.
 */
export function updateAnalyticsConsent(settings: ConsentSettings | null): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  ensureGoogleTagQueue();

  const analyticsAllowed = settings?.analytics === true;

  // The first-party preference only controls GA4. Adsterra is gated by
  // AdsterraNativeSlot; Google AdSense advertising consent must be
  // managed separately by a certified CMP where regional rules require it.
  // Do not turn the local advertising toggle into a Google AdSense consent signal.
  window.gtag('consent', 'update', {
    analytics_storage: analyticsAllowed ? 'granted' : 'denied'
  });

  analyticsEnabled = analyticsAllowed;
  if (!analyticsAllowed) return;

  const measurementId = window.POSTCHARS_GA4_ID?.trim() || document
    .querySelector<HTMLMetaElement>('meta[name="postchars-ga4-id"]')
    ?.content.trim();

  if (!measurementId || !/^G-[A-Z0-9]+$/.test(measurementId)) return;
  if (configuredMeasurementId === measurementId) return;

  configuredMeasurementId = measurementId;
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: true });

  if (!document.getElementById('postchars-ga4-script')) {
    const script = document.createElement('script');
    script.id = 'postchars-ga4-script';
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    document.head.appendChild(script);
  }
}

export function trackEvent(
  eventName: string,
  parameters: Record<string, string | number | boolean> = {}
): void {
  if (typeof window === 'undefined' || !analyticsEnabled || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, parameters);
}
