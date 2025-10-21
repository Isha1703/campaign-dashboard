/**
 * Professional theme system for consistent styling
 * Provides design tokens, component variants, and responsive utilities
 */

export interface ThemeColors {
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  secondary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  success: {
    50: string;
    100: string;
    500: string;
    600: string;
    700: string;
  };
  warning: {
    50: string;
    100: string;
    500: string;
    600: string;
    700: string;
  };
  error: {
    50: string;
    100: string;
    500: string;
    600: string;
    700: string;
  };
  gray: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ThemeBreakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export const theme = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    }
  } as ThemeColors,

  spacing: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    '3xl': '4rem',  // 64px
  } as ThemeSpacing,

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  } as ThemeShadows,

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  } as ThemeBreakpoints,

  borderRadius: {
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },

  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  }
};

// Component variant system
export const componentVariants = {
  button: {
    primary: {
      base: 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
      colors: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
      sizes: {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
      }
    },
    secondary: {
      base: 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
      colors: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
      sizes: {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
      }
    },
    danger: {
      base: 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
      colors: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
      sizes: {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
      }
    },
    ghost: {
      base: 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
      colors: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
      sizes: {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
      }
    }
  },

  card: {
    default: 'bg-white rounded-lg border border-gray-200 shadow-sm',
    elevated: 'bg-white rounded-lg border border-gray-200 shadow-md',
    interactive: 'bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer',
  },

  input: {
    default: 'block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm',
    error: 'block w-full rounded-md border-red-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm',
    success: 'block w-full rounded-md border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm',
  },

  badge: {
    primary: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
    success: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800',
    warning: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
    error: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800',
    gray: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800',
  },

  alert: {
    info: 'rounded-md bg-blue-50 p-4 border-l-4 border-blue-400',
    success: 'rounded-md bg-green-50 p-4 border-l-4 border-green-400',
    warning: 'rounded-md bg-yellow-50 p-4 border-l-4 border-yellow-400',
    error: 'rounded-md bg-red-50 p-4 border-l-4 border-red-400',
  }
};

// Animation utilities
export const animations = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
  
  // Custom animations with reduced motion support
  fadeInSafe: (prefersReducedMotion: boolean) => 
    prefersReducedMotion ? 'opacity-100' : 'animate-fade-in',
  slideUpSafe: (prefersReducedMotion: boolean) => 
    prefersReducedMotion ? 'transform-none' : 'animate-slide-up',
  pulseSafe: (prefersReducedMotion: boolean) => 
    prefersReducedMotion ? '' : 'animate-pulse',
};

// Responsive utilities
export const responsive = {
  // Mobile-first breakpoint utilities
  sm: (classes: string) => `sm:${classes}`,
  md: (classes: string) => `md:${classes}`,
  lg: (classes: string) => `lg:${classes}`,
  xl: (classes: string) => `xl:${classes}`,
  '2xl': (classes: string) => `2xl:${classes}`,

  // Container utilities
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  containerSm: 'max-w-3xl mx-auto px-4 sm:px-6',
  containerLg: 'max-w-full mx-auto px-4 sm:px-6 lg:px-8',

  // Grid utilities
  grid: {
    cols1: 'grid grid-cols-1',
    cols2: 'grid grid-cols-1 md:grid-cols-2',
    cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    gap: 'gap-4 md:gap-6',
  },

  // Flex utilities
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end',
    col: 'flex flex-col',
    colCenter: 'flex flex-col items-center justify-center',
  }
};

// Utility function to combine classes
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Theme utility functions
export const ThemeUtils = {
  /**
   * Get button classes for variant and size
   */
  getButtonClasses: (
    variant: keyof typeof componentVariants.button = 'primary',
    size: 'sm' | 'md' | 'lg' = 'md'
  ): string => {
    const variantConfig = componentVariants.button[variant];
    return cn(
      variantConfig.base,
      variantConfig.colors,
      variantConfig.sizes[size]
    );
  },

  /**
   * Get card classes for variant
   */
  getCardClasses: (
    variant: keyof typeof componentVariants.card = 'default'
  ): string => {
    return componentVariants.card[variant];
  },

  /**
   * Get input classes for state
   */
  getInputClasses: (
    state: keyof typeof componentVariants.input = 'default'
  ): string => {
    return componentVariants.input[state];
  },

  /**
   * Get badge classes for variant
   */
  getBadgeClasses: (
    variant: keyof typeof componentVariants.badge = 'primary'
  ): string => {
    return componentVariants.badge[variant];
  },

  /**
   * Get alert classes for type
   */
  getAlertClasses: (
    type: keyof typeof componentVariants.alert = 'info'
  ): string => {
    return componentVariants.alert[type];
  },

  /**
   * Get responsive grid classes
   */
  getGridClasses: (
    columns: keyof typeof responsive.grid = 'cols3'
  ): string => {
    return cn(responsive.grid[columns], responsive.grid.gap);
  },

  /**
   * Get animation classes with reduced motion support
   */
  getAnimationClasses: (
    animation: keyof typeof animations,
    prefersReducedMotion: boolean = false
  ): string => {
    if (animation === 'fadeInSafe') return animations.fadeInSafe(prefersReducedMotion);
    if (animation === 'slideUpSafe') return animations.slideUpSafe(prefersReducedMotion);
    if (animation === 'pulseSafe') return animations.pulseSafe(prefersReducedMotion);
    
    return prefersReducedMotion ? '' : animations[animation];
  }
};

export default theme;