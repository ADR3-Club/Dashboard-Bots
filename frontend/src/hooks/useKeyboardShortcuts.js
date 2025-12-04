import { useEffect, useCallback } from 'react';

/**
 * Hook for handling keyboard shortcuts
 * @param {Object} shortcuts - Object mapping keys to callback functions
 * @param {boolean} enabled - Whether shortcuts are enabled (default: true)
 *
 * Example usage:
 * useKeyboardShortcuts({
 *   'r': () => refetch(),
 *   'Escape': () => closeModal(),
 *   'ctrl+s': () => save(),
 * });
 */
export default function useKeyboardShortcuts(shortcuts, enabled = true) {
  const handleKeyDown = useCallback((event) => {
    // Don't trigger shortcuts when typing in inputs
    const tagName = event.target.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      // Still allow Escape in inputs
      if (event.key !== 'Escape') return;
    }

    // Build the key combo string
    let keyCombo = '';
    if (event.ctrlKey) keyCombo += 'ctrl+';
    if (event.altKey) keyCombo += 'alt+';
    if (event.shiftKey) keyCombo += 'shift+';
    keyCombo += event.key.toLowerCase();

    // Check for exact match first (with modifiers)
    if (shortcuts[keyCombo]) {
      event.preventDefault();
      shortcuts[keyCombo](event);
      return;
    }

    // Check for simple key match (without modifiers, except Escape)
    const simpleKey = event.key.toLowerCase();
    if (!event.ctrlKey && !event.altKey && shortcuts[simpleKey]) {
      event.preventDefault();
      shortcuts[simpleKey](event);
    }

    // Special handling for Escape (always trigger)
    if (event.key === 'Escape' && shortcuts['escape']) {
      event.preventDefault();
      shortcuts['escape'](event);
    }
  }, [shortcuts]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}
