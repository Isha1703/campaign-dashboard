import React, { useEffect, useRef, useCallback } from 'react';
import { accessibilityManager, AccessibilityUtils } from '../utils/accessibility';
import { useUserPreferences } from './useResponsive';

/**
 * Hook for accessibility features and utilities
 */
export const useAccessibility = () => {
  const preferences = useUserPreferences();
  const announcementTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Enable keyboard navigation detection
    accessibilityManager.enableKeyboardDetection();
  }, []);

  const announce = useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite',
    delay: number = 0
  ) => {
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
    }

    if (delay > 0) {
      announcementTimeoutRef.current = setTimeout(() => {
        accessibilityManager.announce(message, priority);
      }, delay);
    } else {
      accessibilityManager.announce(message, priority);
    }
  }, []);

  const generateId = useCallback((prefix?: string) => {
    return accessibilityManager.generateId(prefix);
  }, []);

  const isKeyboardUser = useCallback(() => {
    return accessibilityManager.isKeyboardUser();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (announcementTimeoutRef.current) {
        clearTimeout(announcementTimeoutRef.current);
      }
    };
  }, []);

  return {
    announce,
    generateId,
    isKeyboardUser,
    preferences,
    utils: AccessibilityUtils
  };
};

/**
 * Hook for managing focus
 */
export const useFocusManagement = () => {
  const focusedElementRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    focusedElementRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (focusedElementRef.current && typeof focusedElementRef.current.focus === 'function') {
      focusedElementRef.current.focus();
    }
  }, []);

  const focusElement = useCallback((element: HTMLElement | string) => {
    if (typeof element === 'string') {
      const targetElement = document.getElementById(element) || document.querySelector(element);
      if (targetElement && typeof (targetElement as HTMLElement).focus === 'function') {
        (targetElement as HTMLElement).focus();
      }
    } else if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }, []);

  const focusFirstFocusable = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
    }
  }, []);

  return {
    saveFocus,
    restoreFocus,
    focusElement,
    focusFirstFocusable
  };
};

/**
 * Hook for keyboard navigation
 */
export const useKeyboardNavigation = () => {
  const handleTabNavigation = useCallback((
    event: KeyboardEvent,
    currentIndex: number,
    totalItems: number,
    onNavigate: (index: number) => void,
    options: {
      loop?: boolean;
      vertical?: boolean;
    } = {}
  ) => {
    const { loop = true, vertical = false } = options;
    let newIndex = currentIndex;

    const nextKeys = vertical ? ['ArrowDown'] : ['ArrowRight'];
    const prevKeys = vertical ? ['ArrowUp'] : ['ArrowLeft'];

    if (nextKeys.includes(event.key)) {
      event.preventDefault();
      if (currentIndex < totalItems - 1) {
        newIndex = currentIndex + 1;
      } else if (loop) {
        newIndex = 0;
      }
    } else if (prevKeys.includes(event.key)) {
      event.preventDefault();
      if (currentIndex > 0) {
        newIndex = currentIndex - 1;
      } else if (loop) {
        newIndex = totalItems - 1;
      }
    } else if (event.key === 'Home') {
      event.preventDefault();
      newIndex = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      newIndex = totalItems - 1;
    }

    if (newIndex !== currentIndex) {
      onNavigate(newIndex);
    }
  }, []);

  const handleEscape = useCallback((
    event: KeyboardEvent,
    onEscape: () => void
  ) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onEscape();
    }
  }, []);

  const handleEnterSpace = useCallback((
    event: KeyboardEvent,
    onActivate: () => void
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onActivate();
    }
  }, []);

  return {
    handleTabNavigation,
    handleEscape,
    handleEnterSpace
  };
};

/**
 * Hook for live regions and announcements
 */
export const useLiveRegion = () => {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const announceToRegion = useCallback((
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  const LiveRegion = useCallback(() => {
    return React.createElement('div', {
      ref: liveRegionRef,
      'aria-live': 'polite',
      'aria-atomic': 'true',
      className: 'sr-only'
    });
  }, []);

  return {
    announceToRegion,
    LiveRegion
  };
};

/**
 * Hook for skip links
 */
export const useSkipLinks = () => {
  const SkipLinks = () => null; // Simplified for now

  return {
    SkipLinks
  };
};

/**
 * Hook for form accessibility
 */
export const useFormAccessibility = () => {
  const getFieldProps = useCallback((
    label: string,
    options: {
      required?: boolean;
      invalid?: boolean;
      describedBy?: string;
    } = {}
  ) => {
    return AccessibilityUtils.getInputProps(label, options);
  }, []);

  const getErrorProps = useCallback((message: string) => {
    return AccessibilityUtils.getErrorProps(message);
  }, []);

  const getSuccessProps = useCallback((message: string) => {
    return AccessibilityUtils.getSuccessProps(message);
  }, []);

  return {
    getFieldProps,
    getErrorProps,
    getSuccessProps
  };
};

/**
 * Hook for modal accessibility
 */
export const useModalAccessibility = (isOpen: boolean) => {
  const { saveFocus, restoreFocus } = useFocusManagement();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      saveFocus();
      
      // Trap focus in modal
      const modal = modalRef.current;
      if (modal) {
        const focusableElements = modal.querySelectorAll(
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

        modal.addEventListener('keydown', handleTabKey);
        
        // Focus first element
        if (firstElement) {
          firstElement.focus();
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        return () => {
          modal.removeEventListener('keydown', handleTabKey);
          document.body.style.overflow = 'unset';
        };
      }
    } else {
      restoreFocus();
    }
  }, [isOpen, saveFocus, restoreFocus]);

  return {
    modalRef
  };
};

export default useAccessibility;