import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * DEPRECATED: This file previously contained mock educational video data.
 * Mock data has been removed to prevent accidental addition of placeholder content.
 *
 * To add educational videos, use the admin panel interface:
 * Admin Dashboard > Manage Videos > Add New Video
 *
 * Important: Always use real YouTube URLs when adding videos.
 * Do NOT use placeholder or demo URLs like:
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - Any URL containing 'example', 'demo', 'test', 'sample', or 'placeholder'
 */

/**
 * This function is permanently disabled to prevent mock data insertion
 * @deprecated Use the admin panel interface to manage videos
 */
export const addLearningVideosToDatabase = async () => {
  console.log('⛔ Learning videos initialization is DISABLED - Production mode active');
  console.log('⛔ No mock video data will be added to the database');
  console.log('ℹ️ Use the admin panel to add real educational videos with valid YouTube URLs');
  return false;
};