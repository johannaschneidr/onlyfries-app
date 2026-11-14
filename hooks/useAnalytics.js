import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { trackEvent, trackPageView, trackException, getPageType } from '../lib/analytics';

const MAX_LABEL_LENGTH = 40;

// Text shown on a button or link. Add data-analytics-label="..." to give an
// element a fixed name, or data-analytics-ignore to skip it (and its children).
function labelFor(el) {
  const raw =
    el.getAttribute('data-analytics-label') ||
    el.getAttribute('aria-label') ||
    el.innerText ||
    el.getAttribute('title') ||
    '';
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return '';
  // Never send anything that looks like an email address.
  if (text.includes('@')) return '(redacted)';
  return text.slice(0, MAX_LABEL_LENGTH);
}

// Sends a page_view on first load and every client-side route change, plus
// catch-all click and error tracking. Mount once, in _app.
export default function useAnalytics() {
  const router = useRouter();
  const routeRef = useRef(router.pathname);
  routeRef.current = router.pathname;

  // Page views
  useEffect(() => {
    if (!router.isReady) return;
    trackPageView(router.pathname);
    const handleRouteChange = () => {
      // The new page has rendered by the time routeChangeComplete fires,
      // so routeRef holds the new route pattern.
      trackPageView(routeRef.current);
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  // Clicks
  useEffect(() => {
    const handleClick = (e) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target || target.closest('[data-analytics-ignore]')) return;

      const source = getPageType(routeRef.current);
      const anchor = target.closest('a[href]');
      const control = target.closest('button, a[href], [role="button"]');
      if (!control) return;

      let linkPath;
      if (anchor) {
        try {
          const url = new URL(anchor.getAttribute('href'), window.location.href);
          if (url.origin === window.location.origin) {
            linkPath = url.pathname;
            if (url.pathname.startsWith('/location/')) {
              trackEvent('location_clicked', {
                location_slug: url.pathname.replace('/location/', ''),
                source,
              });
            } else if (url.pathname === '/search') {
              trackEvent('explore_map_clicked', { source });
            }
          } else {
            linkPath = 'external';
          }
        } catch (err) {
          // ignore malformed hrefs
        }
      }

      const label = labelFor(control);
      if (!label) return;
      trackEvent('ui_click', {
        label,
        element: control.tagName === 'A' ? 'link' : 'button',
        link_path: linkPath,
        page_type: source,
      });
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  // Uncaught errors
  useEffect(() => {
    const handleError = (e) => trackException(e.message || 'window_error', true);
    const handleRejection = (e) =>
      trackException((e.reason && (e.reason.code || e.reason.message)) || 'unhandled_rejection', false);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);
}
