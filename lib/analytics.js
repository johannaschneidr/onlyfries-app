// GA4 tracking (via Firebase Analytics).
//
// Guardrails:
// - Never send review text, usernames, emails or other personal data.
// - Prefer fixed label values over free text (GA4 buckets rare values into "(other)").
// - Query strings are stripped from page URLs (e.g. /auth/verify?email=...),
//   except campaign params so flyer UTM links still attribute correctly.
import { initializeAnalytics, isSupported, logEvent } from 'firebase/analytics';
import { app } from './firebase';

let analyticsPromise = null;

function getAnalyticsInstance() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!analyticsPromise) {
    analyticsPromise = isSupported()
      .then((yes) =>
        yes
          ? initializeAnalytics(app, {
              // We send page_view ourselves on every route change (see trackPageView).
              config: { send_page_view: false },
            })
          : null
      )
      .catch(() => null);
  }
  return analyticsPromise;
}

const MAX_PARAM_LENGTH = 100;

function clean(params = {}) {
  const out = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    out[key] = typeof value === 'string' ? value.slice(0, MAX_PARAM_LENGTH) : value;
  }
  return out;
}

export function trackEvent(name, params) {
  getAnalyticsInstance().then((analytics) => {
    if (!analytics) return;
    try {
      logEvent(analytics, name, clean(params));
    } catch (e) {
      // Analytics must never break the app.
    }
  });
}

const PAGE_TYPES = {
  '/': 'feed',
  '/search': 'map',
  '/location/[id]': 'restaurant',
  '/login': 'login',
  '/auth/verify': 'login',
  '/auth/reset-password': 'reset_password',
  '/auth/setup-username': 'setup_username',
  '/new': 'new_review',
  '/my-posts': 'my_posts',
  '/profile': 'profile',
  '/profile/change-password': 'profile',
  '/profile/delete-account': 'profile',
};

// `route` is the Next.js route pattern (router.pathname), e.g. "/location/[id]".
export function getPageType(route) {
  return PAGE_TYPES[route] || 'other';
}

const KEPT_QUERY_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'];

function safeLocation() {
  const url = new URL(window.location.href);
  const kept = new URLSearchParams();
  KEPT_QUERY_PARAMS.forEach((key) => {
    if (url.searchParams.has(key)) kept.set(key, url.searchParams.get(key));
  });
  const query = kept.toString();
  return {
    page_location: `${url.origin}${url.pathname}${query ? `?${query}` : ''}`,
    page_path: url.pathname,
  };
}

export function trackPageView(route) {
  if (typeof window === 'undefined') return;
  trackEvent('page_view', {
    ...safeLocation(),
    page_title: document.title,
    page_type: getPageType(route),
  });
}

export function trackException(description, fatal = false) {
  trackEvent('exception', { description: String(description || 'unknown'), fatal });
}

// First part of a "Name, address" location string, so we keep the restaurant
// name but not the full address.
export function locationLabel(locationName) {
  return (locationName || '').split(',')[0].trim();
}
