// components/Navbar.js
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

export default function Navbar({ onLogoClick, isRefreshing = false }) {
  const { user, userData, logout } = useAuth();
  const router = useRouter();
  const isProfilePage = router.pathname === '/profile';
  const isSearchPage = router.pathname === '/search';
  const isMyPostsPage = router.pathname === '/my-posts';
  const isHomePage = router.pathname === '/';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  // Prevent body scroll when menu is open or logout confirmation is shown
  useEffect(() => {
    if (isMenuOpen || showLogoutConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen, showLogoutConfirm]);

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
      closeMenu();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Get username from userData or user.displayName
  const username = userData?.username || user?.displayName;

  return (
    <>
      <nav className="z-50 p-4 flex justify-between items-center">
        {isHomePage && onLogoClick ? (
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              onLogoClick();
            }}
            className="flex items-center cursor-pointer relative"
            aria-label="Refresh posts"
          >
            <Image
              src="/assets/logo.png"
              alt="OnlyFries Logo"
              width={150}
              height={50}
              priority
              sizes="(max-width: 768px) 150px, 150px"
              style={{ width: 'auto', height: 'auto' }}
            />
          </button>
        ) : (
          <Link href="/" className="flex items-center">
            <Image
              src="/assets/logo.png"
              alt="OnlyFries Logo"
              width={150}
              height={50}
              priority
              sizes="(max-width: 768px) 150px, 150px"
              style={{ width: 'auto', height: 'auto' }}
            />
          </Link>
        )}
        {/* Burger Menu Button - All Devices */}
        <button
          onClick={toggleMenu}
          className="p-2 text-white transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>
      </nav>

      {/* Menu Overlay - All Devices */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50" style={{ zIndex: 999 }}>
          <div className="fixed inset-0 flex flex-col overflow-hidden background-image-menu" style={{ 
            backgroundImage: 'url(\'/assets/background6.png\')',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            height: '100dvh',
            zIndex: 999
          }}>
            <div className="p-4 flex justify-between items-center">
              <div className="w-0"></div>
              <button
                onClick={closeMenu}
                className="p-2 text-white transition-colors"
                aria-label="Close menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {user && username && (
              <div className="px-4 pt-2 pb-2">
                <p className="p-2 font-bold font-rouge-script text-8xl">
                  <span className="text-white">Hi, </span>
                  <span style={{ color: 'var(--light-blue-custom)' }}>{username}</span>
                </p>
              </div>
            )}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="px-4 py-2 mt-4 space-y-2">
                <Link
                  href="/"
                  onClick={closeMenu}
                  className={`flex items-center p-2 transition-colors ${
                    router.pathname === '/'
                      ? ''
                      : 'text-white'
                  }`}
                  style={router.pathname === '/' ? {} : {}}
                  onMouseEnter={(e) => router.pathname !== '/' && (e.target.style.color = 'var(--yellow-custom)')}
                  onMouseLeave={(e) => router.pathname !== '/' && (e.target.style.color = 'white')}
                  aria-label="Home"
                >
                  <span className={`font-medium text-2xl ${router.pathname === '/' ? 'underline' : ''} font-baloo2`} style={router.pathname === '/' ? { color: 'var(--yellow-custom)' } : {}}>Home</span>
                </Link>
                <Link
                  href="/search"
                  onClick={closeMenu}
                  className={`flex items-center p-2 transition-colors ${
                    isSearchPage
                      ? ''
                      : 'text-white'
                  }`}
                  style={isSearchPage ? {} : {}}
                  onMouseEnter={(e) => !isSearchPage && (e.target.style.color = 'var(--yellow-custom)')}
                  onMouseLeave={(e) => !isSearchPage && (e.target.style.color = 'white')}
                  aria-label="Search"
                >
                  <span className={`font-medium text-2xl ${isSearchPage ? 'underline' : ''} font-baloo2`} style={isSearchPage ? { color: 'var(--yellow-custom)' } : {}}>FriesFinder</span>
                </Link>
                {user && (
                  <Link
                    href="/my-posts"
                    onClick={closeMenu}
                    className={`flex items-center p-2 transition-colors ${
                      isMyPostsPage
                        ? ''
                        : 'text-white'
                    }`}
                    style={isMyPostsPage ? {} : {}}
                    onMouseEnter={(e) => !isMyPostsPage && (e.target.style.color = 'var(--yellow-custom)')}
                    onMouseLeave={(e) => !isMyPostsPage && (e.target.style.color = 'white')}
                    aria-label="My Reviews"
                  >
                    <span className={`font-medium text-2xl ${isMyPostsPage ? 'underline' : ''} font-baloo2`} style={isMyPostsPage ? { color: 'var(--yellow-custom)' } : {}}>My Reviews</span>
                  </Link>
                )}
                {user && (
                  <Link
                    href="/profile"
                    onClick={closeMenu}
                    className={`flex items-center p-2 transition-colors ${
                      isProfilePage
                        ? ''
                        : 'text-white'
                    }`}
                    style={isProfilePage ? {} : {}}
                    onMouseEnter={(e) => !isProfilePage && (e.target.style.color = 'var(--yellow-custom)')}
                    onMouseLeave={(e) => !isProfilePage && (e.target.style.color = 'white')}
                    aria-label="Account"
                  >
                    <span className={`font-medium text-2xl ${isProfilePage ? 'underline' : ''} font-baloo2`} style={isProfilePage ? { color: 'var(--yellow-custom)' } : {}}>Profile Settings</span>
                  </Link>
                )}
              </div>
            </div>
            <div className="p-4 pb-6 space-y-2">
              {user ? (
                <SecondaryButton
                  onClick={handleLogoutClick}
                  className="w-full"
                >
                  Log out
                </SecondaryButton>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="inline-block px-10 py-2 rounded-full w-full text-center"
                    style={{
                      borderWidth: '3px',
                      borderStyle: 'solid',
                      borderColor: 'var(--red-custom)',
                      backgroundColor: 'var(--yellow-custom)',
                      color: 'var(--red-custom)'
                    }}
                    aria-label="Login"
                  >
                    <span className="text-2xl font-medium font-baloo2 underline whitespace-nowrap">Login</span>
                  </Link>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="inline-block px-10 py-2 rounded-full w-full text-center"
                    style={{
                      borderWidth: '3px',
                      borderStyle: 'solid',
                      borderColor: 'black',
                      backgroundColor: 'white',
                      color: 'black'
                    }}
                    aria-label="Sign up"
                  >
                    <span className="text-2xl font-medium font-baloo2 whitespace-nowrap">Sign up</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Popup */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 relative" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: 'black' }}>
            <button
              onClick={handleLogoutCancel}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-4xl font-bold mb-3 font-rouge-script" style={{ color: 'black' }}>You sure?</h3>
            <p className="text-lg mb-6 font-baloo2 text-gray-700">
              Are you sure you want to log out?
            </p>
            <div className="flex flex-col gap-3">
              <PrimaryButton
                onClick={handleLogoutCancel}
                className="w-full"
              >
                Stay logged in
              </PrimaryButton>
              <SecondaryButton
                onClick={handleLogout}
                className="w-full"
              >
                Log out
              </SecondaryButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
