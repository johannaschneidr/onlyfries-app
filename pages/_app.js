import { AuthProvider } from '../contexts/AuthContext';
import UsernameGuard from '../components/UsernameGuard';
import Footer from '../components/Footer';
import DesktopWarning from '../components/DesktopWarning';
import '../global.css'
import Script from 'next/script'
import { Baloo_2, Rouge_Script, Quattrocento } from 'next/font/google'

// Configure your fonts
const baloo2 = Baloo_2({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-baloo2',
  display: 'swap',
})

const rougeScript = Rouge_Script({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-rouge-script',
  display: 'swap',
})

const quattrocento = Quattrocento({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-quattrocento',
  display: 'swap',
})

// Or if you want multiple fonts:
// const poppins = Poppins({ 
//   subsets: ['latin'],
//   weight: ['400', '500', '600', '700'],
//   variable: '--font-poppins',
// })

// Google Maps Integration
// This script loads the Google Maps JavaScript API with Places library
// The API key is stored in NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable
// The 'beforeInteractive' strategy ensures the script loads before the page becomes interactive
function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <UsernameGuard>
        <div className={`min-h-screen flex flex-col relative ${baloo2.variable} ${rougeScript.variable} ${quattrocento.variable}`} style={{ zIndex: 10 }}>
          <div className="bg background-image" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100dvh',
            zIndex: -1,
            backgroundImage: 'url(\'/assets/background6.png\')'
          }} />
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
            strategy="beforeInteractive"
          />
          <div className="flex-1 relative" style={{ zIndex: 10 }}>
            <Component {...pageProps} />
          </div>
          <Footer />
          <DesktopWarning />
        </div>
      </UsernameGuard>
    </AuthProvider>
  )
}

export default MyApp 