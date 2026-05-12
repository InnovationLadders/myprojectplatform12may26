/**
 * Migration script to add is_public field to existing gallery projects
 *
 * This script updates all existing gallery_projects documents to include
 * the new is_public field, defaulting to true for backward compatibility
 * (since all projects were previously public by default).
 *
 * Run this once after deploying the new code.
 */

import { db } from '../lib/firebase';
import { collection, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';

export const migrateGalleryProjectsToPublic = async () => {
  try {
    console.log('🔄 بدء ترحيل مشاريع المعرض لإضافة حقل is_public...');

    const galleryRef = collection(db, 'gallery_projects');
    const snapshot = await getDocs(galleryRef);

    if (snapshot.empty) {
      console.log('✅ لا توجد مشاريع للترحيل');
      return {
        success: true,
        message: 'لا توجد مشاريع للترحيل',
        updated: 0
      };
    }

    console.log(`📊 تم العثور على ${snapshot.docs.length} مشروع`);

    // Use batched writes for better performance (max 500 per batch)
    const batchSize = 500;
    let batchCount = 0;
    let batch = writeBatch(db);
    let updatedCount = 0;

    for (const projectDoc of snapshot.docs) {
      const data = projectDoc.data();

      // Only update if is_public field doesn't exist
      if (data.is_public === undefined) {
        const projectRef = doc(db, 'gallery_projects', projectDoc.id);

        // Set is_public to true for all existing projects (backward compatibility)
        // since all projects were previously shown to everyone
        batch.update(projectRef, {
          is_public: true,
          updated_at: new Date()
        });

        updatedCount++;
        batchCount++;

        // Commit batch when reaching batch size
        if (batchCount >= batchSize) {
          await batch.commit();
          console.log(`✅ تم تحديث ${updatedCount} مشروع حتى الآن...`);
          batch = writeBatch(db);
          batchCount = 0;
        }
      }
    }

    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`✅ اكتمل الترحيل بنجاح! تم تحديث ${updatedCount} مشروع`);

    return {
      success: true,
      message: `تم تحديث ${updatedCount} مشروع بنجاح`,
      updated: updatedCount,
      total: snapshot.docs.length
    };

  } catch (error) {
    console.error('❌ خطأ في ترحيل مشاريع المعرض:', error);
    throw error;
  }
};

/**
 * Verify migration results
 */
export const verifyGalleryProjectsMigration = async () => {
  try {
    console.log('🔍 التحقق من نتائج الترحيل...');

    const galleryRef = collection(db, 'gallery_projects');
    const snapshot = await getDocs(galleryRef);

    let withIsPublic = 0;
    let withoutIsPublic = 0;
    let publicProjects = 0;
    let privateProjects = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.is_public !== undefined) {
        withIsPublic++;
        if (data.is_public === true) {
          publicProjects++;
        } else {
          privateProjects++;
        }
      } else {
        withoutIsPublic++;
      }
    });

    console.log('📊 نتائج التحقق:');
    console.log(`  - إجمالي المشاريع: ${snapshot.docs.length}`);
    console.log(`  - مشاريع بحقل is_public: ${withIsPublic}`);
    console.log(`  - مشاريع بدون حقل is_public: ${withoutIsPublic}`);
    console.log(`  - مشاريع عامة (is_public = true): ${publicProjects}`);
    console.log(`  - مشاريع خاصة (is_public = false): ${privateProjects}`);

    return {
      total: snapshot.docs.length,
      withIsPublic,
      withoutIsPublic,
      publicProjects,
      privateProjects,
      success: withoutIsPublic === 0
    };

  } catch (error) {
    console.error('❌ خطأ في التحقق من الترحيل:', error);
    throw error;
  }
};
