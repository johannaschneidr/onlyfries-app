// components/Navbar.js
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="p-4 flex justify-between items-center">
      <Link href="/" className="flex items-center">
        <Image
          src="/assets/logo.png"
          alt="OnlyFries Logo"
          width={120}
          height={40}
          priority
          fetchpriority="high"
          sizes="(max-width: 768px) 120px, 120px"
          style={{ width: 'auto', height: 'auto' }}
        />
      </Link>
    </nav>
  );
}
