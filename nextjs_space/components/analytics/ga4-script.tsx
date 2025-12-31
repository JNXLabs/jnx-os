/**
 * Google Analytics 4 Script Component
 * 
 * Loads GA4 tracking script in the app.
 * Only loads if NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 */

import Script from 'next/script';

export function GA4Script() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // Only render if measurement ID is configured
  if (!measurementId) {
    return null;
  }

  return (
    <>
      {/* Google Analytics */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
