export default function PrimaryButton({ children, onClick, type = 'button', disabled = false, className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-block px-10 py-2 rounded-full mt-2 ${className}`}
      style={{
        borderWidth: '3px',
        borderStyle: 'solid',
        borderColor: 'var(--red-custom)',
        backgroundColor: 'var(--yellow-custom)',
        color: 'var(--red-custom)'
      }}
    >
      <span className="text-2xl font-medium font-quattrocento underline whitespace-nowrap">
        {children}
      </span>
    </button>
  );
}


