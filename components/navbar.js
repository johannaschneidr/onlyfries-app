// components/Navbar.js
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="p-4 flex justify-between items-center">
      <Link href="/" className="relative w-[120px] h-[40px]">
        <Image
          src="/assets/logo.png"
          alt="OnlyFries Logo"
          fill
          className="object-contain"
        />
      </Link>
    </nav>
  );
}
