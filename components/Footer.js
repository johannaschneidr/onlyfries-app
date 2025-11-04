export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full mt-4 py-3">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <p className="text-sm font-baloo2 text-white">
          © {currentYear} OnlyFries. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

