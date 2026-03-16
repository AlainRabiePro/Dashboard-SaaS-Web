/**
 * Copie du texte vers le presse-papiers de manière sécurisée
 * Gère les erreurs de permissions navigateur
 */
export async function copyToClipboard(
  text: string,
  onSuccess?: () => void,
  onError?: (error: string) => void
): Promise<boolean> {
  // Vérifier qu'on est dans le navigateur
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('Clipboard API not available in this context');
    return false;
  }

  try {
    // Vérifier que la Clipboard API est disponible
    if (navigator.clipboard && window.isSecureContext) {
      // Essayer la Clipboard API (sécurisée HTTPS)
      await navigator.clipboard.writeText(text);
      onSuccess?.();
      return true;
    }

    throw new Error('Secure context required');
  } catch (error: any) {
    console.warn('Clipboard API failed, falling back to old method:', error.message);

    // Fallback: utiliser la méthode ancienne
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (success) {
        onSuccess?.();
        return true;
      } else {
        throw new Error('execCommand failed');
      }
    } catch (fallbackError: any) {
      console.error('Both clipboard methods failed:', fallbackError);
      onError?.(fallbackError.message);
      return false;
    }
  }
}
