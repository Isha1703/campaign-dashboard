/**
 * Accessibility utilities and helpers
 * Provides ARIA labels, keyboard navigation, and screen reader support
 */

export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-disabled'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  role?: string;
  tabIndex?: number;
}

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private announcements: HTMLElement | null = null;

  constructor() {
    this.initializeAnnouncements();
  }

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  /**
   * Initialize screen reader announcement region
   */
  private initializeAnnouncements(): void {
    if (typeof window === 'undefined') return;

    this.announcements = document.createElement('div');
    this.announcements.setAttribute('aria-live', 'polite');
    this.announcements.setAttribute('aria-atomic', 'true');
    this.announcements.setAttribute('class', 'sr-only');
    this.announcements.style.position = 'absolute';
    this.announcements.style.left = '-10000px';
    this.announcements.style.width = '1px';
    this.announcements.style.height = '1px';
    this.announcements.style.overflow = 'hidden';
    
    document.body.appendChild(this.announcements);
  }

  /**
   * Announce message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announcements) return;

    this.announcements.setAttribute('aria-live', priority);
    this.announcements.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.announcements) {
        this.announcements.textContent = '';
      }
    }, 1000);
  }

  /**
   * Generate unique ID for accessibility
   */
  generateId(prefix: string = 'element'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Check if user is using keyboard navigation
   */
  isKeyboardUser(): boolean {
    if (typeof window === 'undefined') return false;
    return document.body.classList.contains('keyboard-navigation');
  }

  /**
   * Enable keyboard navigation detection
   */
  enableKeyboardDetection(): void {
    if (typeof window === 'undefined') return;

    let isTabPressed = false;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        isTabPressed = true;
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      if (isTabPressed) {
        document.body.classList.remove('keyboard-navigation');
        isTabPressed = false;
      }
    });
  }
}

// Accessibility utility functions
export const AccessibilityUtils = {
  /**
   * Get ARIA props for buttons
   */
  getButtonProps: (
    label: string,
    options: {
      disabled?: boolean;
      pressed?: boolean;
      expanded?: boolean;
      describedBy?: string;
    } = {}
  ): AccessibilityProps => ({
    'aria-label': label,
    'aria-disabled': options.disabled,
    'aria-pressed': options.pressed,
    'aria-expanded': options.expanded,
    'aria-describedby': options.describedBy,
    role: 'button',
    tabIndex: options.disabled ? -1 : 0
  }),

  /**
   * Get ARIA props for form inputs
   */
  getInputProps: (
    label: string,
    options: {
      required?: boolean;
      invalid?: boolean;
      describedBy?: string;
      placeholder?: string;
    } = {}
  ): AccessibilityProps => ({
    'aria-label': label,
    'aria-required': options.required,
    'aria-invalid': options.invalid,
    'aria-describedby': options.describedBy
  }),

  /**
   * Get ARIA props for tabs
   */
  getTabProps: (
    label: string,
    options: {
      selected?: boolean;
      disabled?: boolean;
      controls?: string;
    } = {}
  ): AccessibilityProps => ({
    'aria-label': label,
    'aria-selected': options.selected,
    'aria-disabled': options.disabled,
    'aria-controls': options.controls,
    role: 'tab',
    tabIndex: options.selected ? 0 : -1
  }),

  /**
   * Get ARIA props for tab panels
   */
  getTabPanelProps: (
    label: string,
    options: {
      labelledBy?: string;
      hidden?: boolean;
    } = {}
  ): AccessibilityProps => ({
    'aria-label': label,
    'aria-labelledby': options.labelledBy,
    'aria-hidden': options.hidden,
    role: 'tabpanel',
    tabIndex: 0
  }),

  /**
   * Get ARIA props for loading states
   */
  getLoadingProps: (
    label: string = 'Loading'
  ): AccessibilityProps => ({
    'aria-label': label,
    'aria-busy': true,
    'aria-live': 'polite',
    role: 'status'
  }),

  /**
   * Get ARIA props for error messages
   */
  getErrorProps: (
    message: string
  ): AccessibilityProps => ({
    'aria-label': `Error: ${message}`,
    'aria-live': 'assertive',
    role: 'alert'
  }),

  /**
   * Get ARIA props for success messages
   */
  getSuccessProps: (
    message: string
  ): AccessibilityProps => ({
    'aria-label': `Success: ${message}`,
    'aria-live': 'polite',
    role: 'status'
  }),

  /**
   * Get ARIA props for progress indicators
   */
  getProgressProps: (
    value: number,
    max: number = 100,
    label?: string
  ): AccessibilityProps => ({
    'aria-label': label || `Progress: ${Math.round((value / max) * 100)}%`,
    'aria-valuenow': value,
    'aria-valuemin': 0,
    'aria-valuemax': max,
    role: 'progressbar'
  }),

  /**
   * Get ARIA props for dialogs/modals
   */
  getDialogProps: (
    title: string,
    options: {
      describedBy?: string;
      modal?: boolean;
    } = {}
  ): AccessibilityProps => ({
    'aria-label': title,
    'aria-describedby': options.describedBy,
    'aria-modal': options.modal ?? true,
    role: 'dialog',
    tabIndex: -1
  }),

  /**
   * Get ARIA props for navigation
   */
  getNavigationProps: (
    label: string
  ): AccessibilityProps => ({
    'aria-label': label,
    role: 'navigation'
  }),

  /**
   * Get ARIA props for lists
   */
  getListProps: (
    label?: string,
    itemCount?: number
  ): AccessibilityProps => ({
    'aria-label': label || `List with ${itemCount || 0} items`,
    role: 'list'
  }),

  /**
   * Get ARIA props for list items
   */
  getListItemProps: (
    position?: number,
    total?: number
  ): AccessibilityProps => ({
    'aria-label': position && total ? `Item ${position} of ${total}` : undefined,
    role: 'listitem'
  })
};

// Keyboard navigation utilities
export const KeyboardUtils = {
  /**
   * Handle keyboard navigation for tab lists
   */
  handleTabListKeydown: (
    event: KeyboardEvent,
    currentIndex: number,
    totalTabs: number,
    onTabChange: (index: number) => void
  ): void => {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : totalTabs - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        newIndex = currentIndex < totalTabs - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = totalTabs - 1;
        break;
      default:
        return;
    }

    onTabChange(newIndex);
  },

  /**
   * Handle escape key for modals/dialogs
   */
  handleEscapeKey: (
    event: KeyboardEvent,
    onEscape: () => void
  ): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onEscape();
    }
  },

  /**
   * Handle enter/space for button-like elements
   */
  handleActivation: (
    event: KeyboardEvent,
    onActivate: () => void
  ): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onActivate();
    }
  },

  /**
   * Trap focus within an element
   */
  trapFocus: (container: HTMLElement): (() => void) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }
};

// Initialize accessibility manager
export const accessibilityManager = AccessibilityManager.getInstance();

export default AccessibilityManager;