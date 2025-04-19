// components/Navbar.js
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="p-4 border-b flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">OnlyFries</Link>
      <div className="flex gap-4">
        <Link href="/" className="hover:text-yellow-500">Home</Link>
      </div>
    </nav>
  );
}
