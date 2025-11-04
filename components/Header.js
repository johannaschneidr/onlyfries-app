export default function Header() {
  return (
    <header className="w-full">
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-12 text-center">
        <h1 className="text-8xl font-bold font-rouge-script" style={{ lineHeight: '0.8' }}>
          <span className="text-white">Find the </span>
          <span style={{ color: 'var(--light-blue-custom)' }}>hottest</span>
          <span className="text-white"> fries in town</span>
        </h1>
      </div>
    </header>
  );
} 