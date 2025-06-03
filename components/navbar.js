// components/Navbar.js
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const isProfilePage = router.pathname === '/profile';
  const isSearchPage = router.pathname === '/search';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="p-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <Image
            src="/assets/logo.png"
            alt="OnlyFries Logo"
            width={120}
            height={40}
            priority
            sizes="(max-width: 768px) 120px, 120px"
            style={{ width: 'auto', height: 'auto' }}
          />
        </Link>
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/search"
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
              isSearchPage
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label="Search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <span className="font-medium">Find the perfect fries</span>
          </Link>
          {user ? (
            <Link
              href="/profile"
              className={`flex items-center gap-2 p-2 transition-colors ${
                isProfilePage
                  ? 'text-yellow-500'
                  : 'text-gray-600 hover:text-yellow-500'
              }`}
              aria-label="Account"
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
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
              <span className="font-medium">Profile</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 p-2 text-gray-600 hover:text-yellow-500 transition-colors"
              aria-label="Account"
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
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
              <span className="font-medium">Profile</span>
            </Link>
          )}
        </div>
        {/* Mobile Burger Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 text-gray-600 hover:text-yellow-500 transition-colors"
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

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden">
          <div className="fixed inset-0 bg-white/95 backdrop-blur-sm">
            <div className="p-4 flex justify-between items-center">
              <Link href="/" className="flex items-center" onClick={closeMenu}>
                <Image
                  src="/assets/logo.png"
                  alt="OnlyFries Logo"
                  width={120}
                  height={40}
                  priority
                  sizes="(max-width: 768px) 120px, 120px"
                  style={{ width: 'auto', height: 'auto' }}
                />
              </Link>
              <button
                onClick={closeMenu}
                className="p-2 text-gray-600 hover:text-yellow-500 transition-colors"
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
            <div className="px-4 py-2 mt-8 space-y-4">
              <Link
                href="/"
                onClick={closeMenu}
                className={`flex items-center gap-2 p-2 transition-colors ${
                  router.pathname === '/'
                    ? 'text-yellow-500'
                    : 'text-gray-600 hover:text-yellow-500'
                }`}
                aria-label="Home"
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
                    d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                  />
                </svg>
                <span className="font-medium">Home</span>
              </Link>
              <Link
                href="/search"
                onClick={closeMenu}
                className={`flex items-center gap-2 p-2 transition-colors ${
                  isSearchPage
                    ? 'text-yellow-500'
                    : 'text-gray-600 hover:text-yellow-500'
                }`}
                aria-label="Search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <span className="font-medium">Find the perfect fries</span>
              </Link>
              {user ? (
                <Link
                  href="/profile"
                  onClick={closeMenu}
                  className={`flex items-center gap-2 p-2 transition-colors ${
                    isProfilePage
                      ? 'text-yellow-500'
                      : 'text-gray-600 hover:text-yellow-500'
                  }`}
                  aria-label="Account"
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
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                  <span className="font-medium">Profile</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="flex items-center gap-2 p-2 text-gray-600 hover:text-yellow-500 transition-colors"
                  aria-label="Account"
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
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                  <span className="font-medium">Profile</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
