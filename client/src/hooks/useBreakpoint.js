import { useState, useEffect } from 'react';

const BREAKPOINTS = {
  mobile:  0,
  tablet:  640,
  laptop:  1024,
  desktop: 1280,
  xl:      1536,
};

/**
 * Returns the current active breakpoint name.
 * Values: 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'xl'
 */
const useBreakpoint = () => {
  const getBreakpoint = () => {
    const w = window.innerWidth;
    if (w >= BREAKPOINTS.xl)      return 'xl';
    if (w >= BREAKPOINTS.desktop) return 'desktop';
    if (w >= BREAKPOINTS.laptop)  return 'laptop';
    if (w >= BREAKPOINTS.tablet)  return 'tablet';
    return 'mobile';
  };

  const [bp, setBp] = useState(getBreakpoint);

  useEffect(() => {
    const mql = Object.entries(BREAKPOINTS)
      .filter(([, v]) => v > 0)
      .map(([name, px]) => {
        const mq = window.matchMedia(`(min-width: ${px}px)`);
        const handler = () => setBp(getBreakpoint());
        mq.addEventListener('change', handler);
        return { mq, handler };
      });

    return () => mql.forEach(({ mq, handler }) => mq.removeEventListener('change', handler));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    bp,
    isMobile:  bp === 'mobile',
    isTablet:  bp === 'tablet',
    isLaptop:  bp === 'laptop',
    isDesktop: bp === 'desktop' || bp === 'xl',
    isAtLeastTablet:  bp !== 'mobile',
    isAtLeastLaptop:  bp === 'laptop' || bp === 'desktop' || bp === 'xl',
    isAtLeastDesktop: bp === 'desktop' || bp === 'xl',
  };
};

export default useBreakpoint;
