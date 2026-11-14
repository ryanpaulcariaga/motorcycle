(function () {
  var script = document.createElement('script');
  var css = window.CSS;
  if (
    'noModule' in script &&
    typeof window.Promise === 'function' &&
    typeof window.fetch === 'function' &&
    typeof window.URL === 'function' &&
    typeof window.URLSearchParams === 'function' &&
    typeof window.AbortController === 'function' &&
    typeof window.ResizeObserver === 'function' &&
    css &&
    typeof css.supports === 'function' &&
    typeof css.registerProperty === 'function' &&
    css.supports('color', 'oklch(50% 0.1 180)')
  ) {
    document.documentElement.className = document.documentElement.className.replace(
      /\bbrowser-pending\b/,
      'browser-supported'
    );
  }
}());
