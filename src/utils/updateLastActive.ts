import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Updates the last_active_at field for a user
 * Uses updateDoc to ensure no other fields are affected
 * Silently fails to not interrupt user experience
 */
export const updateLastActiveAt = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      last_active_at: serverTimestamp()
    });
    console.log('✅ Updated last_active_at for user:', userId);
  } catch (error: any) {
    // Silent failure - don't interrupt user experience
    console.warn('⚠️ Failed to update last_active_at:', {
      userId,
      error: error.message,
      code: error.code
    });
  }
};
