/**
 * Reusable Button component with variant styling and loading state.
 *
 * @param {object} props
 * @param {'primary'|'secondary'|'danger'|'success'} props.variant
 * @param {'sm'|'md'|'lg'} props.size
 * @param {boolean} props.loading
 * @param {boolean} props.disabled
 * @param {function} props.onClick
 * @param {React.ReactNode} props.children
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  children,
  className = '',
  type = 'button',
  ...rest
}) => {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';

  return (
    <button
      type={type}
      className={`btn btn-${variant} ${sizeClass} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <>
          <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
