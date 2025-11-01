export default function SecondaryButton({ children, onClick, type = 'button', disabled = false, className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-block px-10 py-2 rounded-full mt-2 ${className}`}
      style={{
        borderWidth: '3px',
        borderStyle: 'solid',
        borderColor: 'black',
        backgroundColor: 'white',
        color: 'black'
      }}
    >
      <span className="text-2xl font-medium font-quattrocento whitespace-nowrap">
        {children}
      </span>
    </button>
  );
}

