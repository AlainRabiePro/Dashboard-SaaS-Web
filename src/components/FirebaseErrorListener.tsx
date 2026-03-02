
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function FirebaseErrorListener() {
  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // On jette l'erreur pour qu'elle soit capturée par l'overlay de Next.js
      // Cela fournit un contexte riche pour le débogage des Security Rules.
      throw error;
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, []);

  return null;
}
