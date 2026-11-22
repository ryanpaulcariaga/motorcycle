import { useEffect } from 'react';

export default function BrowserSupportReady() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.className.indexOf('browser-capable') >= 0) {
      root.className = root.className.replace(
        /\bbrowser-capable\b/,
        'browser-supported',
      );
    }
  }, []);

  return null;
}
