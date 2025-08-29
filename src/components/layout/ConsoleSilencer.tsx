'use client';

import { useEffect } from 'react';

export default function ConsoleSilencer() {
  useEffect(() => {
    try {
      const noop = () => {};
      // Preserve references if needed later
      (window as any).__original_console__ = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
        debug: console.debug,
      };
      console.log = noop as any;
      console.warn = noop as any;
      console.error = noop as any;
      console.info = noop as any;
      console.debug = noop as any;
    } catch {}
  }, []);
  return null;
}


