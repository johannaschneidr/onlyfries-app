import { useState, useEffect } from 'react';

export default function DesktopWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if user has already dismissed the warning in this session
    const dismissed = sessionStorage.getItem('desktopWarningDismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    // Detect if user is on desktop
    const isDesktop = () => {
      // Check screen width (desktop typically > 768px)
      const isWideScreen = window.innerWidth > 768;
      
      // Check user agent for mobile devices
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      
      // Also check for touch capability (desktop might have touch but we want to show for non-touch or large screens)
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Show warning if: wide screen AND (not mobile device OR no touch screen)
      return isWideScreen && (!isMobileDevice || !hasTouchScreen);
    };

    // Small delay to ensure smooth page load
    const timer = setTimeout(() => {
      if (isDesktop() && !isDismissed) {
        setShowWarning(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isDismissed]);

  const handleClose = () => {
    setShowWarning(false);
    setIsDismissed(true);
    // Remember dismissal for this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('desktopWarningDismissed', 'true');
    }
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl relative" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black' }}>
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-4xl font-bold mb-3 font-rouge-script" style={{ color: 'var(--red-custom)' }}>
          Ooops!
        </h3>
        <p className="text-lg mb-6 font-baloo2 text-gray-700">
          Head to your phone for the true OnlyFries experience
        </p>
        <button
          onClick={handleClose}
          className="w-full px-4 py-3 text-base font-medium rounded-full transition-colors font-baloo2"
          style={{ 
            backgroundColor: 'var(--yellow-custom)',
            color: 'var(--red-custom)',
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: 'var(--red-custom)'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '0.9'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >
          Got it!
        </button>
      </div>
    </div>
  );
}

