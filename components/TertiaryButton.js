export default function TertiaryButton({ children, onClick, type = 'button', disabled = false, className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-block px-10 py-2 ${className}`}
      style={{
        backgroundColor: 'transparent',
        color: 'var(--blue-custom)'
      }}
    >
      <span className="text-lg font-medium font-quattrocento uppercase whitespace-nowrap">
        {children}
      </span>
    </button>
  );
}

