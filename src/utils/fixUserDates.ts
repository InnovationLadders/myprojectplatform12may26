import { collection, getDocs, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase';

/**
 * Utility script to fix missing created_at and last_active_at dates for existing users
 * This should be run once to fix historical data
 */

export const fixUserDates = async () => {
  console.log('🔧 Starting user dates fix process...');

  try {
    // Get all users from Firestore
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    console.log(`📊 Found ${usersSnapshot.size} users to check`);

    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Check if user is missing dates
      const missingCreatedAt = !userData.created_at;
      const missingLastActiveAt = !userData.last_active_at;

      if (!missingCreatedAt && !missingLastActiveAt) {
        skippedCount++;
        continue;
      }

      console.log(`🔍 Fixing dates for user: ${userData.name} (${userId})`);

      try {
        const updates: any = {};

        // Try to get creation date from Firebase Auth metadata
        if (missingCreatedAt) {
          try {
            const firebaseUser = auth.currentUser;
            if (firebaseUser && firebaseUser.uid === userId) {
              // Use Firebase Auth creation time if available
              const creationTime = firebaseUser.metadata.creationTime;
              if (creationTime) {
                updates.created_at = Timestamp.fromDate(new Date(creationTime));
                console.log(`  ✅ Set created_at from Firebase Auth: ${creationTime}`);
              } else {
                // Fallback: use a default old date to indicate historical data
                updates.created_at = Timestamp.fromDate(new Date('2024-01-01'));
                console.log(`  ⚠️ Set created_at to default date (2024-01-01)`);
              }
            } else {
              // For other users, use a default old date
              updates.created_at = Timestamp.fromDate(new Date('2024-01-01'));
              console.log(`  ⚠️ Set created_at to default date (2024-01-01)`);
            }
          } catch (authError) {
            // Fallback to default date
            updates.created_at = Timestamp.fromDate(new Date('2024-01-01'));
            console.log(`  ⚠️ Set created_at to default date due to error`);
          }
        }

        // Set last_active_at to created_at if missing
        if (missingLastActiveAt) {
          if (updates.created_at) {
            updates.last_active_at = updates.created_at;
            console.log(`  ✅ Set last_active_at to match created_at`);
          } else if (userData.created_at) {
            updates.last_active_at = userData.created_at;
            console.log(`  ✅ Set last_active_at to existing created_at`);
          } else {
            updates.last_active_at = Timestamp.fromDate(new Date('2024-01-01'));
            console.log(`  ⚠️ Set last_active_at to default date`);
          }
        }

        // Update the user document
        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, 'users', userId), updates);
          fixedCount++;
          console.log(`  ✅ Successfully fixed user ${userId}`);
        }
      } catch (updateError) {
        errorCount++;
        console.error(`  ❌ Error fixing user ${userId}:`, updateError);
      }
    }

    console.log('\n📊 Fix Summary:');
    console.log(`  ✅ Fixed: ${fixedCount} users`);
    console.log(`  ⏭️ Skipped: ${skippedCount} users (already have dates)`);
    console.log(`  ❌ Errors: ${errorCount} users`);
    console.log('🎉 User dates fix process completed!');

    return {
      success: true,
      fixed: fixedCount,
      skipped: skippedCount,
      errors: errorCount
    };
  } catch (error) {
    console.error('❌ Critical error in fixUserDates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Fix dates for a specific user
 */
export const fixSingleUserDates = async (userId: string) => {
  console.log(`🔧 Fixing dates for user: ${userId}`);

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      console.error(`❌ User ${userId} not found`);
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const updates: any = {};

    if (!userData.created_at) {
      updates.created_at = Timestamp.fromDate(new Date('2024-01-01'));
      console.log('  ✅ Set created_at to default date');
    }

    if (!userData.last_active_at) {
      updates.last_active_at = userData.created_at || updates.created_at || Timestamp.fromDate(new Date('2024-01-01'));
      console.log('  ✅ Set last_active_at');
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, 'users', userId), updates);
      console.log(`✅ Successfully fixed user ${userId}`);
      return { success: true };
    } else {
      console.log(`⏭️ User ${userId} already has all required dates`);
      return { success: true, message: 'No fixes needed' };
    }
  } catch (error) {
    console.error(`❌ Error fixing user ${userId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
