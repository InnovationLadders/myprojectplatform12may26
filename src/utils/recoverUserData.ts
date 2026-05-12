import { collection, getDocs, doc, updateDoc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UserRecoveryReport {
  totalUsers: number;
  usersWithMissingRole: number;
  usersRecovered: number;
  usersFailed: number;
  details: Array<{
    uid: string;
    email: string;
    name: string;
    issue: string;
    recovered: boolean;
  }>;
}

/**
 * Scans all users and identifies those with missing or invalid data
 */
export const scanUsersForIssues = async (): Promise<UserRecoveryReport> => {
  console.log('🔍 Starting user data scan...');

  const report: UserRecoveryReport = {
    totalUsers: 0,
    usersWithMissingRole: 0,
    usersRecovered: 0,
    usersFailed: 0,
    details: []
  };

  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    report.totalUsers = snapshot.size;
    console.log(`📊 Found ${report.totalUsers} users`);

    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      const uid = userDoc.id;

      // Check for missing role
      if (!userData.role) {
        report.usersWithMissingRole++;
        report.details.push({
          uid,
          email: userData.email || 'N/A',
          name: userData.name || 'N/A',
          issue: 'Missing role',
          recovered: false
        });
        console.warn(`⚠️ User ${uid} (${userData.email}) missing role`);
      }

      // Check for invalid role
      const validRoles = ['student', 'teacher', 'school', 'admin', 'consultant'];
      if (userData.role && !validRoles.includes(userData.role)) {
        report.usersWithMissingRole++;
        report.details.push({
          uid,
          email: userData.email || 'N/A',
          name: userData.name || 'N/A',
          issue: `Invalid role: ${userData.role}`,
          recovered: false
        });
        console.warn(`⚠️ User ${uid} (${userData.email}) has invalid role: ${userData.role}`);
      }

      // Check for missing email
      if (!userData.email) {
        report.details.push({
          uid,
          email: 'MISSING',
          name: userData.name || 'N/A',
          issue: 'Missing email',
          recovered: false
        });
        console.warn(`⚠️ User ${uid} missing email`);
      }

      // Check for missing name
      if (!userData.name || userData.name === '') {
        report.details.push({
          uid,
          email: userData.email || 'N/A',
          name: 'MISSING',
          issue: 'Missing name',
          recovered: false
        });
        console.warn(`⚠️ User ${uid} (${userData.email}) missing name`);
      }
    }

    console.log('✅ User data scan completed');
    console.log(`📊 Summary: ${report.usersWithMissingRole} users with issues found`);

    return report;
  } catch (error) {
    console.error('❌ Error scanning users:', error);
    throw error;
  }
};

/**
 * Attempts to recover a specific user's data
 */
export const recoverUserData = async (
  uid: string,
  recoveryData: {
    role?: 'student' | 'teacher' | 'school' | 'admin' | 'consultant';
    email?: string;
    name?: string;
    status?: string;
  }
): Promise<boolean> => {
  try {
    console.log(`🔧 Attempting to recover data for user: ${uid}`);

    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.error(`❌ User ${uid} not found`);
      return false;
    }

    const currentData = userDoc.data();
    console.log('📄 Current user data:', currentData);

    // Prepare update data - only update missing fields
    const updateData: any = {};

    if (!currentData.role && recoveryData.role) {
      updateData.role = recoveryData.role;
      console.log(`✏️ Setting role to: ${recoveryData.role}`);
    }

    if (!currentData.email && recoveryData.email) {
      updateData.email = recoveryData.email;
      console.log(`✏️ Setting email to: ${recoveryData.email}`);
    }

    if (!currentData.name && recoveryData.name) {
      updateData.name = recoveryData.name;
      console.log(`✏️ Setting name to: ${recoveryData.name}`);
    }

    if (!currentData.status && recoveryData.status) {
      updateData.status = recoveryData.status;
      console.log(`✏️ Setting status to: ${recoveryData.status}`);
    }

    // If no updates needed, return success
    if (Object.keys(updateData).length === 0) {
      console.log('✅ No updates needed for this user');
      return true;
    }

    // Perform the update
    await updateDoc(userRef, updateData);
    console.log(`✅ Successfully recovered data for user: ${uid}`);
    console.log('📝 Updated fields:', Object.keys(updateData).join(', '));

    return true;
  } catch (error) {
    console.error(`❌ Failed to recover data for user ${uid}:`, error);
    return false;
  }
};

/**
 * Bulk recovery - attempts to recover all users with issues
 * Only safe to run with manual confirmation
 */
export const bulkRecoverUsers = async (
  usersToRecover: Array<{
    uid: string;
    recoveryData: {
      role?: 'student' | 'teacher' | 'school' | 'admin' | 'consultant';
      email?: string;
      name?: string;
      status?: string;
    };
  }>
): Promise<UserRecoveryReport> => {
  console.log(`🔧 Starting bulk recovery for ${usersToRecover.length} users...`);

  const report: UserRecoveryReport = {
    totalUsers: usersToRecover.length,
    usersWithMissingRole: usersToRecover.length,
    usersRecovered: 0,
    usersFailed: 0,
    details: []
  };

  for (const { uid, recoveryData } of usersToRecover) {
    try {
      const success = await recoverUserData(uid, recoveryData);

      if (success) {
        report.usersRecovered++;
        report.details.push({
          uid,
          email: recoveryData.email || 'N/A',
          name: recoveryData.name || 'N/A',
          issue: 'Recovered',
          recovered: true
        });
      } else {
        report.usersFailed++;
        report.details.push({
          uid,
          email: recoveryData.email || 'N/A',
          name: recoveryData.name || 'N/A',
          issue: 'Recovery failed',
          recovered: false
        });
      }
    } catch (error) {
      console.error(`❌ Error recovering user ${uid}:`, error);
      report.usersFailed++;
      report.details.push({
        uid,
        email: recoveryData.email || 'N/A',
        name: recoveryData.name || 'N/A',
        issue: `Error: ${error}`,
        recovered: false
      });
    }
  }

  console.log('✅ Bulk recovery completed');
  console.log(`📊 Summary: ${report.usersRecovered} recovered, ${report.usersFailed} failed`);

  return report;
};
