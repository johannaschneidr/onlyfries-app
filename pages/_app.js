import '../global.css'
import Script from 'next/script'

// Google Maps Integration
// This script loads the Google Maps JavaScript API with Places library
// The API key is stored in NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable
// The 'beforeInteractive' strategy ensures the script loads before the page becomes interactive
function MyApp({ Component, pageProps }) {
  return (
    <div className="min-h-screen">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="beforeInteractive"
      />
      <Component {...pageProps} />
    </div>
  )
}

export default MyApp 