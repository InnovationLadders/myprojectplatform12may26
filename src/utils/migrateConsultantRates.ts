import { collection, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function migrateConsultantRatesToZero() {
  console.log('🔄 Starting consultant hourly rate migration to 0 riyals...');

  try {
    const usersRef = collection(db, 'users');
    const consultantsQuery = query(usersRef, where('role', '==', 'consultant'));

    const querySnapshot = await getDocs(consultantsQuery);

    if (querySnapshot.empty) {
      console.log('ℹ️ No consultant users found in the database');
      return {
        success: true,
        updated: 0,
        message: 'No consultants to update'
      };
    }

    console.log(`📊 Found ${querySnapshot.size} consultant(s) to update`);

    let updatedCount = 0;
    const errors: string[] = [];

    for (const docSnapshot of querySnapshot.docs) {
      try {
        const userData = docSnapshot.data();
        const consultantId = docSnapshot.id;

        console.log(`📝 Updating consultant: ${userData.name || consultantId}`);
        console.log(`   Current hourly rate: ${userData.hourly_rate ?? 'not set'}`);

        await updateDoc(doc(db, 'users', consultantId), {
          hourly_rate: 0,
          updated_at: serverTimestamp()
        });

        console.log(`✅ Successfully updated ${userData.name || consultantId} to 0 riyals/hour`);
        updatedCount++;
      } catch (error) {
        const errorMsg = `Failed to update consultant ${docSnapshot.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`   Total consultants found: ${querySnapshot.size}`);
    console.log(`   Successfully updated: ${updatedCount}`);
    console.log(`   Failed: ${errors.length}`);

    if (errors.length > 0) {
      console.error(`\n⚠️ Errors encountered:`);
      errors.forEach(err => console.error(`   - ${err}`));
    }

    return {
      success: errors.length === 0,
      updated: updatedCount,
      total: querySnapshot.size,
      errors: errors,
      message: `Updated ${updatedCount} of ${querySnapshot.size} consultant(s)`
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

export async function ensureAllConsultantsHaveHourlyRate(defaultRate: number = 0) {
  console.log('🔄 Ensuring all consultants have hourly_rate field...');

  try {
    const usersRef = collection(db, 'users');
    const consultantsQuery = query(usersRef, where('role', '==', 'consultant'));

    const querySnapshot = await getDocs(consultantsQuery);

    if (querySnapshot.empty) {
      console.log('ℹ️ No consultant users found in the database');
      return {
        success: true,
        updated: 0,
        message: 'No consultants to update'
      };
    }

    console.log(`📊 Found ${querySnapshot.size} consultant(s) to check`);

    let updatedCount = 0;
    const errors: string[] = [];

    for (const docSnapshot of querySnapshot.docs) {
      try {
        const userData = docSnapshot.data();
        const consultantId = docSnapshot.id;

        // Only update if hourly_rate is missing or not a number
        if (typeof userData.hourly_rate !== 'number') {
          console.log(`📝 Setting hourly rate for consultant: ${userData.name || consultantId}`);
          console.log(`   Current hourly rate: ${userData.hourly_rate ?? 'not set'}`);

          await updateDoc(doc(db, 'users', consultantId), {
            hourly_rate: defaultRate,
            updated_at: serverTimestamp()
          });

          console.log(`✅ Successfully set ${userData.name || consultantId} to ${defaultRate} riyals/hour`);
          updatedCount++;
        } else {
          console.log(`✓ Consultant ${userData.name || consultantId} already has hourly_rate: ${userData.hourly_rate}`);
        }
      } catch (error) {
        const errorMsg = `Failed to update consultant ${docSnapshot.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`   Total consultants found: ${querySnapshot.size}`);
    console.log(`   Updated with hourly_rate: ${updatedCount}`);
    console.log(`   Failed: ${errors.length}`);

    if (errors.length > 0) {
      console.error(`\n⚠️ Errors encountered:`);
      errors.forEach(err => console.error(`   - ${err}`));
    }

    return {
      success: errors.length === 0,
      updated: updatedCount,
      total: querySnapshot.size,
      errors: errors,
      message: `Updated ${updatedCount} of ${querySnapshot.size} consultant(s)`
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}
