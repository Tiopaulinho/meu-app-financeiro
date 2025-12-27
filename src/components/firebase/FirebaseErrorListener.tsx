'use client';

import { useEffect } from 'react';
import { errorEmitter } from './error-emitter';

// This is a client-side component that will listen for permission errors
// and throw them in a way that Next.js dev overlay can pick them up.
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: Error) => {
      // Throwing the error here will cause it to be picked up by
      // the Next.js development error overlay.
      // This is for development-time debugging of security rules.
      setTimeout(() => {
        throw error;
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null; // This component does not render anything.
}
