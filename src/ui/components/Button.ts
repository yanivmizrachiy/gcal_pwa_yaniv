/**
 * Reusable button component factory
 */

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonOptions {
  variant?: ButtonVariant;
  disabled?: boolean;
  ariaLabel?: string;
  onClick?: (event: MouseEvent) => void;
}

const BUTTON_STYLES = `
.btn {
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  font-family: inherit;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-primary {
  background: #1b3a6b;
  color: #fff;
  border-color: #2e4c86;
}
.btn-primary:hover:not(:disabled) {
  background: #2e4c86;
}
.btn-secondary {
  background: transparent;
  color: var(--text-primary, #e7ecf5);
  border-color: var(--border-color, #2e4c86);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--bg-card, #1a2a48);
}
.btn-danger {
  background: #dc2626;
  color: #fff;
  border-color: #b91c1c;
}
.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}
`;

/**
 * Creates a button element
 * @param text - Button text content
 * @param options - Button configuration
 */
export function createButton(text: string, options: ButtonOptions = {}): HTMLButtonElement {
  const { variant = 'primary', disabled = false, ariaLabel, onClick } = options;

  // Ensure styles are injected
  if (!document.getElementById('button-styles')) {
    const style = document.createElement('style');
    style.id = 'button-styles';
    style.textContent = BUTTON_STYLES;
    document.head.appendChild(style);
  }

  const button = document.createElement('button');
  button.className = `btn btn-${variant}`;
  button.textContent = text;
  button.disabled = disabled;

  if (ariaLabel) {
    button.setAttribute('aria-label', ariaLabel);
  }

  if (onClick) {
    button.addEventListener('click', onClick);
  }

  return button;
}
