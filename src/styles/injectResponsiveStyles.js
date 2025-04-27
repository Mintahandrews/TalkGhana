/**
 * This script injects responsive styles into the application
 * to improve mobile and desktop compatibility
 */

export const injectResponsiveStyles = () => {
  // Check if the viewport meta tag is correct
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (!viewportMeta) {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.head.appendChild(meta);
  } else if (!viewportMeta.content.includes('maximum-scale=1.0')) {
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  }
  
  // Dynamically detect device type
  const isMobile = window.innerWidth < 768;
  document.body.classList.toggle('mobile-device', isMobile);
  document.body.classList.toggle('desktop-device', !isMobile);
  
  // Fix tap delay on mobile
  if ('ontouchstart' in document.documentElement) {
    document.body.style.touchAction = 'manipulation';
  }
  
  // Listen for resize events to update device classes
  window.addEventListener('resize', () => {
    const isMobile = window.innerWidth < 768;
    document.body.classList.toggle('mobile-device', isMobile);
    document.body.classList.toggle('desktop-device', !isMobile);
  });
  
  // Fix input focusing issues on iOS
  const fixIOSInputs = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (!isIOS) return;
    
    document.addEventListener('touchstart', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        const scrollY = window.scrollY;
        setTimeout(() => {
          window.scrollTo(0, scrollY);
        }, 300);
      }
    });
  };
  
  fixIOSInputs();
  
  console.log('Responsive styles and behaviors initialized');
};

export default injectResponsiveStyles;
