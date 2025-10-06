/**
 * Loading spinner component
 */

const SPINNER_STYLES = `
.spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color, #2e4c86);
  border-top-color: var(--text-primary, #e7ecf5);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

/**
 * Creates a spinner element
 * @param label - Accessible label for screen readers
 */
export function createSpinner(label: string = 'טוען...'): HTMLElement {
  // Ensure styles are injected
  if (!document.getElementById('spinner-styles')) {
    const style = document.createElement('style');
    style.id = 'spinner-styles';
    style.textContent = SPINNER_STYLES;
    document.head.appendChild(style);
  }

  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  spinner.setAttribute('role', 'status');
  spinner.setAttribute('aria-label', label);

  return spinner;
}
