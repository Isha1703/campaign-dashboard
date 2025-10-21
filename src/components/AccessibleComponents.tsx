import React, { forwardRef, useId, useEffect } from 'react';
import { AccessibilityUtils, KeyboardUtils, accessibilityManager } from '../utils/accessibility';
import { ThemeUtils, cn } from '../styles/theme';
import { LoadingSpinner } from './LoadingStates';

// Accessible Button Component
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    children,
    ariaLabel,
    ariaDescribedBy,
    disabled,
    onClick,
    className,
    ...props
  }, ref) => {
    const buttonId = useId();
    const isDisabled = disabled || loading;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled && onClick) {
        onClick(e);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      KeyboardUtils.handleActivation(e.nativeEvent, () => {
        if (!isDisabled && onClick) {
          onClick(e as any);
        }
      });
    };

    const accessibilityProps = AccessibilityUtils.getButtonProps(
      ariaLabel || (typeof children === 'string' ? children : 'Button'),
      {
        disabled: isDisabled,
        describedBy: ariaDescribedBy
      }
    );

    return (
      <button
        ref={ref}
        id={buttonId}
        className={cn(
          ThemeUtils.getButtonClasses(variant, size),
          className
        )}
        disabled={isDisabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...accessibilityProps}
        {...props}
      >
        {loading && <LoadingSpinner size="sm" color="white" className="mr-2" />}
        {children}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

// Accessible Input Component
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: string;
  helpText?: string;
  showLabel?: boolean;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({
    label,
    error,
    success,
    helpText,
    showLabel = true,
    required,
    className,
    ...props
  }, ref) => {
    const inputId = useId();
    const errorId = useId();
    const helpId = useId();
    const successId = useId();

    const state = error ? 'error' : success ? 'success' : 'default';
    const describedBy = [
      error ? errorId : null,
      success ? successId : null,
      helpText ? helpId : null
    ].filter(Boolean).join(' ');

    const accessibilityProps = AccessibilityUtils.getInputProps(label, {
      required,
      invalid: !!error,
      describedBy: describedBy || undefined
    });

    return (
      <div className="space-y-1">
        {showLabel && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            ThemeUtils.getInputClasses(state),
            className
          )}
          {...accessibilityProps}
          {...props}
        />

        {error && (
          <p
            id={errorId}
            className="text-sm text-red-600"
            {...AccessibilityUtils.getErrorProps(error)}
          >
            {error}
          </p>
        )}

        {success && (
          <p
            id={successId}
            className="text-sm text-green-600"
            {...AccessibilityUtils.getSuccessProps(success)}
          >
            {success}
          </p>
        )}

        {helpText && (
          <p
            id={helpId}
            className="text-sm text-gray-500"
          >
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

// Accessible Tab Component
interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

interface AccessibleTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  ariaLabel?: string;
  className?: string;
}

export const AccessibleTabs: React.FC<AccessibleTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel = 'Tabs',
  className
}) => {
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    KeyboardUtils.handleTabListKeydown(
      e.nativeEvent,
      activeIndex,
      tabs.length,
      (newIndex) => {
        const newTab = tabs[newIndex];
        if (newTab && !newTab.disabled) {
          onTabChange(newTab.id);
        }
      }
    );
  };

  return (
    <div className={className}>
      {/* Tab List */}
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex space-x-1 bg-gray-100 p-1 rounded-lg"
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
                isActive
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200',
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              {...AccessibilityUtils.getTabProps(tab.label, {
                selected: isActive,
                disabled: tab.disabled,
                controls: `${tab.id}-panel`
              })}
            >
              {Icon && <Icon className="w-4 h-4 mr-2" />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`${tab.id}-panel`}
            className={tab.id === activeTab ? 'block' : 'hidden'}
            {...AccessibilityUtils.getTabPanelProps(
              `${tab.label} panel`,
              {
                labelledBy: tab.id,
                hidden: tab.id !== activeTab
              }
            )}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

// Accessible Modal Component
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className
}) => {
  const modalId = useId();
  const titleId = useId();

  useEffect(() => {
    if (isOpen) {
      // Announce modal opening
      accessibilityManager.announce(`${title} dialog opened`);

      // Trap focus
      const modal = document.getElementById(modalId);
      if (modal) {
        const cleanup = KeyboardUtils.trapFocus(modal);
        return cleanup;
      }
    }
  }, [isOpen, title, modalId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      KeyboardUtils.handleEscapeKey(e, onClose);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          id={modalId}
          className={cn(
            'relative bg-white rounded-lg shadow-xl transform transition-all w-full',
            sizeClasses[size],
            className
          )}
          {...AccessibilityUtils.getDialogProps(title, {
            describedBy: `${modalId}-content`
          })}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2
              id={titleId}
              className="text-lg font-semibold text-gray-900"
            >
              {title}
            </h2>
          </div>

          {/* Content */}
          <div
            id={`${modalId}-content`}
            className="px-6 py-4"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Accessible Progress Component
interface AccessibleProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'red' | 'yellow';
  className?: string;
}

export const AccessibleProgress: React.FC<AccessibleProgressProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = 'md',
  color = 'blue',
  className
}) => {
  const progressId = useId();
  const percentage = Math.round((value / max) * 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  };

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm font-medium text-gray-700">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm text-gray-500">
              {percentage}%
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          'w-full bg-gray-200 rounded-full',
          sizeClasses[size]
        )}
      >
        <div
          id={progressId}
          className={cn(
            'rounded-full transition-all duration-300 ease-out',
            sizeClasses[size],
            colorClasses[color]
          )}
          style={{ width: `${percentage}%` }}
          {...AccessibilityUtils.getProgressProps(value, max, label)}
        />
      </div>
    </div>
  );
};

// Accessible Alert Component
interface AccessibleAlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export const AccessibleAlert: React.FC<AccessibleAlertProps> = ({
  type,
  title,
  children,
  dismissible = false,
  onDismiss,
  className
}) => {
  const alertId = useId();

  const isError = type === 'error';
  const accessibilityProps = isError
    ? AccessibilityUtils.getErrorProps(typeof children === 'string' ? children : 'Alert')
    : AccessibilityUtils.getSuccessProps(typeof children === 'string' ? children : 'Alert');

  return (
    <div
      id={alertId}
      className={cn(
        ThemeUtils.getAlertClasses(type),
        className
      )}
      {...accessibilityProps}
    >
      <div className="flex items-start">
        <div className="flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          <div className="text-sm">
            {children}
          </div>
        </div>

        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
            aria-label="Dismiss alert"
          >
            <span className="sr-only">Dismiss</span>
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default {
  AccessibleButton,
  AccessibleInput,
  AccessibleTabs,
  AccessibleModal,
  AccessibleProgress,
  AccessibleAlert
};