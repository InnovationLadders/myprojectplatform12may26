import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import type { GalleryProject } from './useGallery';

export interface FeaturedVideo {
  id: string;
  projectId: string;
  title: string;
  description: string;
  mediaType: 'video' | 'youtube';
  mediaUrl: string;
  youtubeUrl?: string;
  order: 1 | 2 | 3;
}

export const useFeaturedVideos = () => {
  const [featuredVideos, setFeaturedVideos] = useState<FeaturedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedVideos = async () => {
    try {
      setLoading(true);
      const ref = collection(db, 'landing_featured_videos');
      const q = query(ref, orderBy('order', 'asc'));
      const snapshot = await getDocs(q);

      const videos: FeaturedVideo[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          projectId: data.projectId || '',
          title: data.title || '',
          description: data.description || '',
          mediaType: data.mediaType as 'video' | 'youtube',
          mediaUrl: data.mediaUrl || '',
          youtubeUrl: data.youtubeUrl,
          order: data.order as 1 | 2 | 3
        };
      });

      setFeaturedVideos(videos);
    } catch (err) {
      console.error('Error fetching featured videos:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل الفيديوهات المميزة');
    } finally {
      setLoading(false);
    }
  };

  const setFeaturedVideo = async (order: 1 | 2 | 3, project: GalleryProject) => {
    try {
      const docId = `slot_${order}`;
      const docRef = doc(db, 'landing_featured_videos', docId);

      const data = {
        projectId: project.id,
        title: project.title,
        description: project.description,
        mediaType: project.mediaType as 'video' | 'youtube',
        mediaUrl: project.mediaUrl || '',
        youtubeUrl: project.youtubeUrl || null,
        order,
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, data);

      const newEntry: FeaturedVideo = {
        id: docId,
        projectId: project.id,
        title: project.title,
        description: project.description,
        mediaType: project.mediaType as 'video' | 'youtube',
        mediaUrl: project.mediaUrl || '',
        youtubeUrl: project.youtubeUrl,
        order
      };

      setFeaturedVideos(prev => {
        const filtered = prev.filter(v => v.order !== order);
        return [...filtered, newEntry].sort((a, b) => a.order - b.order);
      });
    } catch (err) {
      console.error('Error setting featured video:', err);
      throw err;
    }
  };

  const removeFeaturedVideo = async (order: 1 | 2 | 3) => {
    try {
      const docId = `slot_${order}`;
      await deleteDoc(doc(db, 'landing_featured_videos', docId));
      setFeaturedVideos(prev => prev.filter(v => v.order !== order));
    } catch (err) {
      console.error('Error removing featured video:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchFeaturedVideos();
  }, []);

  return {
    featuredVideos,
    loading,
    error,
    fetchFeaturedVideos,
    setFeaturedVideo,
    removeFeaturedVideo
  };
};
