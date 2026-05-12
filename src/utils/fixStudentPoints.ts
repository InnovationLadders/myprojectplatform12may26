import { syncStudentPoints, checkPointsConsistency } from '../services/pointsSyncService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const fixAllStudentsWithInconsistentPoints = async (): Promise<{
  totalChecked: number;
  totalFixed: number;
  inconsistentStudents: Array<{
    studentId: string;
    name: string;
    storedPoints: number;
    calculatedPoints: number;
    difference: number;
  }>;
}> => {
  console.log('🔍 Starting to check all students for point inconsistencies...');

  const usersQuery = query(collection(db, 'users'), where('role', '==', 'student'));
  const usersSnapshot = await getDocs(usersQuery);

  const totalChecked = usersSnapshot.docs.length;
  let totalFixed = 0;
  const inconsistentStudents: Array<{
    studentId: string;
    name: string;
    storedPoints: number;
    calculatedPoints: number;
    difference: number;
  }> = [];

  for (const userDoc of usersSnapshot.docs) {
    const studentId = userDoc.id;
    const studentName = userDoc.data().name || 'Unknown';

    try {
      console.log(`\n📊 Checking student: ${studentName} (${studentId})`);

      const consistency = await checkPointsConsistency(studentId);

      if (!consistency.isConsistent) {
        console.log(`⚠️ Inconsistency detected for ${studentName}:`);
        console.log(`   Stored: ${consistency.storedPoints} points`);
        console.log(`   Calculated: ${consistency.calculatedPoints} points`);
        console.log(`   Difference: ${consistency.difference} points`);

        inconsistentStudents.push({
          studentId,
          name: studentName,
          storedPoints: consistency.storedPoints,
          calculatedPoints: consistency.calculatedPoints,
          difference: consistency.difference,
        });

        console.log(`🔧 Syncing points for ${studentName}...`);
        await syncStudentPoints(studentId);
        totalFixed++;
        console.log(`✅ Points synced successfully for ${studentName}`);
      } else {
        console.log(`✅ Points are consistent for ${studentName}`);
      }
    } catch (error) {
      console.error(`❌ Error processing student ${studentName}:`, error);
    }
  }

  console.log('\n🎉 Finished checking all students!');
  console.log(`📊 Summary: Checked ${totalChecked} students, fixed ${totalFixed} inconsistencies`);

  return {
    totalChecked,
    totalFixed,
    inconsistentStudents,
  };
};

export const fixSpecificStudent = async (studentId: string): Promise<{
  success: boolean;
  message: string;
  before?: number;
  after?: number;
}> => {
  try {
    console.log(`🔍 Checking student: ${studentId}`);

    const consistencyBefore = await checkPointsConsistency(studentId);

    if (!consistencyBefore.isConsistent) {
      console.log(`⚠️ Inconsistency detected:`);
      console.log(`   Stored: ${consistencyBefore.storedPoints} points`);
      console.log(`   Calculated: ${consistencyBefore.calculatedPoints} points`);
      console.log(`   Difference: ${consistencyBefore.difference} points`);

      console.log(`🔧 Syncing points...`);
      await syncStudentPoints(studentId);

      const consistencyAfter = await checkPointsConsistency(studentId);

      if (consistencyAfter.isConsistent) {
        console.log(`✅ Points synced successfully!`);
        return {
          success: true,
          message: `Points synced successfully! Updated from ${consistencyBefore.storedPoints} to ${consistencyAfter.storedPoints} points.`,
          before: consistencyBefore.storedPoints,
          after: consistencyAfter.storedPoints,
        };
      } else {
        console.log(`⚠️ Inconsistency still exists after sync`);
        return {
          success: false,
          message: `Inconsistency still exists after sync. Please check manually.`,
          before: consistencyBefore.storedPoints,
          after: consistencyAfter.storedPoints,
        };
      }
    } else {
      console.log(`✅ Points are already consistent`);
      return {
        success: true,
        message: `Points are already consistent (${consistencyBefore.storedPoints} points).`,
        before: consistencyBefore.storedPoints,
        after: consistencyBefore.storedPoints,
      };
    }
  } catch (error) {
    console.error(`❌ Error fixing student points:`, error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};
