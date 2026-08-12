import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * Initiates KFUPM SSO login by calling the initKfupmSso Cloud Function
 * which returns a redirect URL to KFUPM's ADFS login page.
 */
export const initiateKfupmSso = async (returnUrl?: string): Promise<void> => {
  const initSso = httpsCallable<{ returnUrl?: string }, { redirectUrl: string }>(
    functions,
    'initKfupmSso'
  );

  const result = await initSso({ returnUrl: returnUrl || '/home' });
  const { redirectUrl } = result.data;

  window.location.href = redirectUrl;
};
