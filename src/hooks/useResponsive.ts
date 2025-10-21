import { useState, useEffect } from 'react';

export interface BreakpointValues {
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  '2xl': boolean;
}

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  breakpoints: BreakpointValues;
  width: number;
  height: number;
}

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Hook for responsive design utilities
 * Provides breakpoint detection and responsive state management
 */
export const useResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeDesktop: false,
        breakpoints: {
          sm: false,
          md: false,
          lg: true,
          xl: false,
          '2xl': false,
        },
        width: 1024,
        height: 768,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      isMobile: width < breakpoints.md,
      isTablet: width >= breakpoints.md && width < breakpoints.lg,
      isDesktop: width >= breakpoints.lg && width < breakpoints.xl,
      isLargeDesktop: width >= breakpoints.xl,
      breakpoints: {
        sm: width >= breakpoints.sm,
        md: width >= breakpoints.md,
        lg: width >= breakpoints.lg,
        xl: width >= breakpoints.xl,
        '2xl': width >= breakpoints['2xl'],
      },
      width,
      height,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setState({
        isMobile: width < breakpoints.md,
        isTablet: width >= breakpoints.md && width < breakpoints.lg,
        isDesktop: width >= breakpoints.lg && width < breakpoints.xl,
        isLargeDesktop: width >= breakpoints.xl,
        breakpoints: {
          sm: width >= breakpoints.sm,
          md: width >= breakpoints.md,
          lg: width >= breakpoints.lg,
          xl: width >= breakpoints.xl,
          '2xl': width >= breakpoints['2xl'],
        },
        width,
        height,
      });
    };

    // Debounce resize events
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return state;
};

/**
 * Hook for media query matching
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handleChange = (e: MediaQueryListEvent) => setMatches(e.matches);

    mediaQuery.addEventListener('change', handleChange);
    setMatches(mediaQuery.matches);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
};

/**
 * Hook for detecting user preferences
 */
export const useUserPreferences = () => {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const prefersHighContrast = useMediaQuery('(prefers-contrast: high)');
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const prefersLargeText = useMediaQuery('(prefers-reduced-data: reduce)');

  return {
    prefersReducedMotion,
    prefersHighContrast,
    prefersDarkMode,
    prefersLargeText,
  };
};

/**
 * Responsive utility functions
 */
export const ResponsiveUtils = {
  /**
   * Get responsive classes based on breakpoint
   */
  getResponsiveClasses: (
    classes: {
      base?: string;
      sm?: string;
      md?: string;
      lg?: string;
      xl?: string;
      '2xl'?: string;
    }
  ): string => {
    const classArray = [];
    
    if (classes.base) classArray.push(classes.base);
    if (classes.sm) classArray.push(`sm:${classes.sm}`);
    if (classes.md) classArray.push(`md:${classes.md}`);
    if (classes.lg) classArray.push(`lg:${classes.lg}`);
    if (classes.xl) classArray.push(`xl:${classes.xl}`);
    if (classes['2xl']) classArray.push(`2xl:${classes['2xl']}`);
    
    return classArray.join(' ');
  },

  /**
   * Get grid columns based on breakpoint
   */
  getGridColumns: (
    columns: {
      base?: number;
      sm?: number;
      md?: number;
      lg?: number;
      xl?: number;
      '2xl'?: number;
    }
  ): string => {
    const classArray = [];
    
    if (columns.base) classArray.push(`grid-cols-${columns.base}`);
    if (columns.sm) classArray.push(`sm:grid-cols-${columns.sm}`);
    if (columns.md) classArray.push(`md:grid-cols-${columns.md}`);
    if (columns.lg) classArray.push(`lg:grid-cols-${columns.lg}`);
    if (columns.xl) classArray.push(`xl:grid-cols-${columns.xl}`);
    if (columns['2xl']) classArray.push(`2xl:grid-cols-${columns['2xl']}`);
    
    return `grid ${classArray.join(' ')}`;
  },

  /**
   * Get responsive spacing
   */
  getResponsiveSpacing: (
    spacing: {
      base?: string;
      sm?: string;
      md?: string;
      lg?: string;
      xl?: string;
      '2xl'?: string;
    }
  ): string => {
    const classArray = [];
    
    if (spacing.base) classArray.push(spacing.base);
    if (spacing.sm) classArray.push(`sm:${spacing.sm}`);
    if (spacing.md) classArray.push(`md:${spacing.md}`);
    if (spacing.lg) classArray.push(`lg:${spacing.lg}`);
    if (spacing.xl) classArray.push(`xl:${spacing.xl}`);
    if (spacing['2xl']) classArray.push(`2xl:${spacing['2xl']}`);
    
    return classArray.join(' ');
  },

  /**
   * Get responsive text size
   */
  getResponsiveTextSize: (
    sizes: {
      base?: string;
      sm?: string;
      md?: string;
      lg?: string;
      xl?: string;
      '2xl'?: string;
    }
  ): string => {
    const classArray = [];
    
    if (sizes.base) classArray.push(`text-${sizes.base}`);
    if (sizes.sm) classArray.push(`sm:text-${sizes.sm}`);
    if (sizes.md) classArray.push(`md:text-${sizes.md}`);
    if (sizes.lg) classArray.push(`lg:text-${sizes.lg}`);
    if (sizes.xl) classArray.push(`xl:text-${sizes.xl}`);
    if (sizes['2xl']) classArray.push(`2xl:text-${sizes['2xl']}`);
    
    return classArray.join(' ');
  }
};

export default useResponsive;