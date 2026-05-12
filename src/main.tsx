import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import App from './App.tsx';
import './index.css';
import { initializeWithSampleData } from './lib/firebase';
import { addLearningVideosToDatabase } from './lib/addLearningVideos';
import i18n from './i18n'; // Import i18n instance

// Initialize sample data for development with better error handling and longer delay
if (import.meta.env.DEV) {
  // Add a delay to ensure Firebase is properly initialized
  setTimeout(() => {
    console.log('Starting sample data initialization...');
    initializeWithSampleData()
      .then(() => console.log('Sample data initialization process completed'))
      .catch(error => {
        // Suppress network-related errors in development
        if (error.code === 'unavailable' || error.message?.includes('Could not reach Cloud Firestore backend')) {
          console.warn('Firebase Firestore is not available - this is normal if not using emulators or if offline');
        } else {
          console.warn('Sample data initialization failed:', error.message);
        }
      });
      
    // Add educational videos to the database
    console.log('Starting educational videos initialization...');
    addLearningVideosToDatabase()
      .then((result) => {
        console.log('Educational videos process completed', result ? 'successfully' : 'with no changes');
      })
      .catch(error => {
        console.warn('Failed to process educational videos:', error.message);
        // Don't throw error to prevent app from crashing
      });
  }, 8000); // Increased delay to 8 seconds to ensure Firebase is fully initialized
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </StrictMode>
);