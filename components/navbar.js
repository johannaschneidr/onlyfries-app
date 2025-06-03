// components/Navbar.js
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const isProfilePage = router.pathname === '/profile';
  const isSearchPage = router.pathname === '/search';

  return (
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
      <div className="flex items-center gap-4">
        <Link
          href="/search"
          className={`p-2 transition-colors ${
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
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </Link>
        {user ? (
          <Link
            href="/profile"
            className={`p-2 transition-colors ${
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
          </Link>
        ) : (
          <Link
            href="/login"
            className="p-2 text-gray-600 hover:text-yellow-500 transition-colors"
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
          </Link>
        )}
      </div>
    </nav>
  );
}
