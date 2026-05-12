import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Migration script to convert existing project ideas to multi-language format
 *
 * This script:
 * 1. Reads all existing project ideas from Firestore
 * 2. Converts single-language fields to multi-language format
 * 3. Places existing (Arabic) content in the 'ar' field
 * 4. Creates empty 'en' fields for future English translations
 * 5. Updates documents in Firestore safely
 *
 * IMPORTANT: Run this script only once to avoid data loss!
 */

interface OldProjectIdea {
  id: string;
  title: string;
  description: string;
  subject: string;
  duration: string;
  objectives: string[];
  materials: string[];
  steps: string[];
  tags: string[];
  [key: string]: any;
}

interface MultiLangField {
  ar: string | string[];
  en: string | string[];
}

export const migrateProjectIdeasToMultiLang = async () => {
  console.log('🚀 Starting migration of project ideas to multi-language format...');

  try {
    // Step 1: Get all project ideas
    const projectIdeasRef = collection(db, 'project_ideas');
    const snapshot = await getDocs(projectIdeasRef);

    if (snapshot.empty) {
      console.log('ℹ️  No project ideas found in database');
      return {
        success: true,
        total: 0,
        migrated: 0,
        skipped: 0,
        errors: 0
      };
    }

    console.log(`📊 Found ${snapshot.size} project ideas to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: Array<{ id: string; error: string }> = [];

    // Step 2: Process each document
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data() as OldProjectIdea;
      const ideaId = docSnapshot.id;

      try {
        // Check if already migrated (has multi-lang structure)
        if (typeof data.title === 'object' && data.title.ar) {
          console.log(`⏭️  Skipping "${ideaId}" - already migrated`);
          skipped++;
          continue;
        }

        console.log(`🔄 Migrating "${data.title || ideaId}"...`);

        // Step 3: Create multi-language structure
        const updates: any = {};

        // Convert text fields
        if (data.title) {
          updates.title = {
            ar: data.title,
            en: '' // Empty placeholder for English translation
          };
        }

        if (data.description) {
          updates.description = {
            ar: data.description,
            en: ''
          };
        }

        if (data.subject) {
          updates.subject = {
            ar: data.subject,
            en: ''
          };
        }

        if (data.duration) {
          updates.duration = {
            ar: data.duration,
            en: ''
          };
        }

        // Convert array fields
        if (Array.isArray(data.objectives)) {
          updates.objectives = {
            ar: data.objectives,
            en: [] // Empty array for English translations
          };
        }

        if (Array.isArray(data.materials)) {
          updates.materials = {
            ar: data.materials,
            en: []
          };
        }

        if (Array.isArray(data.steps)) {
          updates.steps = {
            ar: data.steps,
            en: []
          };
        }

        if (Array.isArray(data.tags)) {
          updates.tags = {
            ar: data.tags,
            en: []
          };
        }

        // Step 4: Update the document in Firestore
        const ideaRef = doc(db, 'project_ideas', ideaId);
        await updateDoc(ideaRef, updates);

        console.log(`✅ Successfully migrated "${data.title || ideaId}"`);
        migrated++;

      } catch (error) {
        console.error(`❌ Error migrating "${ideaId}":`, error);
        errors++;
        errorDetails.push({
          id: ideaId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Step 5: Report results
    console.log('\n' + '='.repeat(50));
    console.log('📋 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`Total ideas found: ${snapshot.size}`);
    console.log(`✅ Successfully migrated: ${migrated}`);
    console.log(`⏭️  Skipped (already migrated): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(50));

    if (errorDetails.length > 0) {
      console.log('\n❌ Error Details:');
      errorDetails.forEach(({ id, error }) => {
        console.log(`  - ${id}: ${error}`);
      });
    }

    return {
      success: errors === 0,
      total: snapshot.size,
      migrated,
      skipped,
      errors,
      errorDetails
    };

  } catch (error) {
    console.error('💥 Fatal error during migration:', error);
    throw error;
  }
};

/**
 * Helper function to check migration status
 * Returns statistics about how many ideas are migrated vs not migrated
 */
export const checkMigrationStatus = async () => {
  console.log('🔍 Checking migration status...');

  try {
    const projectIdeasRef = collection(db, 'project_ideas');
    const snapshot = await getDocs(projectIdeasRef);

    if (snapshot.empty) {
      console.log('ℹ️  No project ideas found in database');
      return {
        total: 0,
        migrated: 0,
        notMigrated: 0
      };
    }

    let migrated = 0;
    let notMigrated = 0;

    snapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();

      // Check if title has multi-lang structure
      if (typeof data.title === 'object' && (data.title.ar || data.title.en)) {
        migrated++;
      } else {
        notMigrated++;
      }
    });

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Status:');
    console.log('='.repeat(50));
    console.log(`Total ideas: ${snapshot.size}`);
    console.log(`✅ Migrated: ${migrated} (${((migrated / snapshot.size) * 100).toFixed(1)}%)`);
    console.log(`⏳ Not migrated: ${notMigrated} (${((notMigrated / snapshot.size) * 100).toFixed(1)}%)`);
    console.log('='.repeat(50));

    return {
      total: snapshot.size,
      migrated,
      notMigrated
    };

  } catch (error) {
    console.error('Error checking migration status:', error);
    throw error;
  }
};

// Export functions for use in admin panel or console
export default {
  migrateProjectIdeasToMultiLang,
  checkMigrationStatus
};
