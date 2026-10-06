export default function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="nx-field-error" role="alert">
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="11" fill="#eb3942" />
        <path d="M8.2 8.2l7.6 7.6M15.8 8.2l-7.6 7.6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      {message}
    </p>
  );
}
