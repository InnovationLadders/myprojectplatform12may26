import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy, limit, updateDoc, doc, increment, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { deleteDuplicateLearningResources } from '../lib/firebase';

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  author: string;
  duration: string | null;
  difficulty: string | null;
  rating: number;
  views: number;
  likes: number;
  thumbnail: string | null;
  contentUrl: string | null;
  watchUrl?: string;
  embedUrl?: string;
  tags: string[];
  featured: boolean;
  createdAt: string;
  lessons?: number;
  certificate?: boolean;
  fileSize?: string;
  episodes?: number;
  downloadUrl?: string;
  videoUrl?: string;
}

export const useLearningResources = () => {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = async (resourceType?: string) => {
    try {
      setLoading(true);
      const resourcesRef = collection(db, 'learning_resources');
      
      // Create query based on whether a specific type is requested
      let q;
      if (resourceType) {
        // When filtering by type, we need to order by the same field or use a composite index
        // Let's order by type first, then by created_at to avoid index issues
        q = query(
          resourcesRef,
          where('type', '==', resourceType),
          limit(50)
        );
      } else {
        // For general queries, just order by created_at
        q = query(
          resourcesRef,
          orderBy('created_at', 'desc'),
          limit(50)
        );
      }
      
      const snapshot = await getDocs(q);
      
      let resourcesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          type: data.type,
          category: data.category,
          author: data.author,
          duration: data.duration,
          difficulty: data.difficulty,
          rating: data.rating || 4.5,
          views: data.views_count || 0,
          likes: data.likes_count || 0,
          thumbnail: data.thumbnail,
          contentUrl: data.contentUrl || data.content_url,
          watchUrl: data.watch_url || data.contentUrl || data.content_url,
          embedUrl: data.embed_url || data.videoUrl || data.video_url,
          tags: data.tags || [],
          featured: data.featured || false,
          createdAt: data.created_at ? new Date(data.created_at.toDate()).toISOString() : new Date().toISOString(),
          lessons: data.lessons,
          certificate: data.certificate,
          fileSize: data.fileSize || data.file_size,
          episodes: data.episodes,
          downloadUrl: data.downloadUrl || data.download_url,
          videoUrl: data.videoUrl || data.video_url
        };
      });
      
      // If we filtered by type, sort the results by created_at in memory
      if (resourceType) {
        resourcesData = resourcesData.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      
      setResources(resourcesData);
    } catch (err) {
      console.error('Error fetching learning resources:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل المصادر التعليمية');
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async (id: string) => {
    try {
      const resourceRef = doc(db, 'learning_resources', id);
      await updateDoc(resourceRef, {
        views_count: increment(1)
      });
      
      // Update local state
      setResources(prevResources => 
        prevResources.map(resource => 
          resource.id === id ? { ...resource, views: resource.views + 1 } : resource
        )
      );
    } catch (err) {
      console.error('Error incrementing views:', err);
    }
  };

  const incrementLikes = async (id: string) => {
    try {
      const resourceRef = doc(db, 'learning_resources', id);
      await updateDoc(resourceRef, {
        likes_count: increment(1)
      });
      
      // Update local state
      setResources(prevResources => 
        prevResources.map(resource => 
          resource.id === id ? { ...resource, likes: resource.likes + 1 } : resource
        )
      );
    } catch (err) {
      console.error('Error incrementing likes:', err);
    }
  };

  // Create a new learning resource
  const createResource = async (resourceData: Partial<LearningResource>) => {
    try {
      const resourceRef = collection(db, 'learning_resources');
      
      // Extract watch and embed URLs for videos
      let watchUrl = resourceData.watchUrl;
      let embedUrl = resourceData.embedUrl;
      
      // If it's a video and we have videoUrl but not watchUrl/embedUrl, try to derive them
      if (resourceData.type === 'video' && resourceData.videoUrl) {
        // If videoUrl is an embed URL (contains 'embed'), convert to watch URL
        if (resourceData.videoUrl.includes('embed') && !watchUrl) {
          // Convert from embed format to watch format
          // Example: https://www.youtube.com/embed/dQw4w9WgXcQ -> https://www.youtube.com/watch?v=dQw4w9WgXcQ
          const videoId = resourceData.videoUrl.split('/').pop();
          if (videoId) {
            watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
          }
        }
        
        // If videoUrl is a watch URL (contains 'watch'), convert to embed URL
        if (resourceData.videoUrl.includes('watch') && !embedUrl) {
          // Convert from watch format to embed format
          // Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ -> https://www.youtube.com/embed/dQw4w9WgXcQ
          const videoId = new URL(resourceData.videoUrl).searchParams.get('v');
          if (videoId) {
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
          }
        }
      }
      
      // Prepare data for Firestore
      const newResource = {
        title: resourceData.title || '',
        description: resourceData.description || '',
        type: resourceData.type || 'video',
        category: resourceData.category || '',
        author: resourceData.author || '',
        duration: resourceData.duration || null,
        difficulty: resourceData.difficulty || null,
        rating: resourceData.rating || 4.5,
        views_count: 0,
        likes_count: 0,
        thumbnail: resourceData.thumbnail || null,
        content_url: watchUrl || resourceData.contentUrl || null,
        video_url: embedUrl || resourceData.videoUrl || null,
        watch_url: watchUrl || resourceData.watchUrl || resourceData.contentUrl || null,
        embed_url: embedUrl || resourceData.embedUrl || resourceData.videoUrl || null,
        tags: resourceData.tags || [],
        featured: resourceData.featured || false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      // Add additional fields based on resource type
      if (resourceData.type === 'course') {
        newResource.lessons = resourceData.lessons;
        newResource.certificate = resourceData.certificate;
      } else if (resourceData.type === 'template') {
        newResource.file_size = resourceData.fileSize;
        newResource.download_url = resourceData.downloadUrl;
      } else if (resourceData.type === 'podcast') {
        newResource.episodes = resourceData.episodes;
      }
      
      const docRef = await addDoc(resourceRef, newResource);
      
      // Fetch resources again to update the list
      await fetchResources();
      
      return { id: docRef.id, ...newResource };
    } catch (err) {
      console.error('Error creating learning resource:', err);
      throw err;
    }
  };

  // Update an existing learning resource
  const updateResource = async (id: string, resourceData: Partial<LearningResource>) => {
    try {
      const resourceRef = doc(db, 'learning_resources', id);
      
      // Extract watch and embed URLs for videos
      let watchUrl = resourceData.watchUrl;
      let embedUrl = resourceData.embedUrl;
      
      // If it's a video and we have videoUrl but not watchUrl/embedUrl, try to derive them
      if (resourceData.type === 'video' && resourceData.videoUrl) {
        // If videoUrl is an embed URL (contains 'embed'), convert to watch URL
        if (resourceData.videoUrl.includes('embed') && !watchUrl) {
          // Convert from embed format to watch format
          const videoId = resourceData.videoUrl.split('/').pop();
          if (videoId) {
            watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
          }
        }
        
        // If videoUrl is a watch URL (contains 'watch'), convert to embed URL
        if (resourceData.videoUrl.includes('watch') && !embedUrl) {
          // Convert from watch format to embed format
          const videoId = new URL(resourceData.videoUrl).searchParams.get('v');
          if (videoId) {
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
          }
        }
      }
      
      // Prepare data for Firestore
      const updateData: any = {
        updated_at: serverTimestamp()
      };
      
      // Only include fields that are provided
      if (resourceData.title !== undefined) updateData.title = resourceData.title;
      if (resourceData.description !== undefined) updateData.description = resourceData.description;
      if (resourceData.type !== undefined) updateData.type = resourceData.type;
      if (resourceData.category !== undefined) updateData.category = resourceData.category;
      if (resourceData.author !== undefined) updateData.author = resourceData.author;
      if (resourceData.duration !== undefined) updateData.duration = resourceData.duration;
      if (resourceData.difficulty !== undefined) updateData.difficulty = resourceData.difficulty;
      if (resourceData.thumbnail !== undefined) updateData.thumbnail = resourceData.thumbnail;
      if (resourceData.contentUrl !== undefined) updateData.content_url = resourceData.contentUrl;
      if (resourceData.videoUrl !== undefined) updateData.video_url = resourceData.videoUrl;
      if (watchUrl !== undefined) updateData.watch_url = watchUrl;
      if (embedUrl !== undefined) updateData.embed_url = embedUrl;
      if (resourceData.tags !== undefined) updateData.tags = resourceData.tags;
      if (resourceData.featured !== undefined) updateData.featured = resourceData.featured;
      
      // Additional fields based on resource type
      if (resourceData.type === 'course') {
        if (resourceData.lessons !== undefined) updateData.lessons = resourceData.lessons;
        if (resourceData.certificate !== undefined) updateData.certificate = resourceData.certificate;
      } else if (resourceData.type === 'template') {
        if (resourceData.fileSize !== undefined) updateData.file_size = resourceData.fileSize;
        if (resourceData.downloadUrl !== undefined) updateData.download_url = resourceData.downloadUrl;
      } else if (resourceData.type === 'podcast') {
        if (resourceData.episodes !== undefined) updateData.episodes = resourceData.episodes;
      }
      
      await updateDoc(resourceRef, updateData);
      
      // Fetch resources again to update the list
      await fetchResources();
      
      return { id, ...resourceData };
    } catch (err) {
      console.error('Error updating learning resource:', err);
      throw err;
    }
  };

  // Delete a learning resource
  const deleteResource = async (id: string) => {
    try {
      const resourceRef = doc(db, 'learning_resources', id);
      await deleteDoc(resourceRef);
      
      // Update local state
      setResources(prevResources => prevResources.filter(resource => resource.id !== id));
      
      return true;
    } catch (err) {
      console.error('Error deleting learning resource:', err);
      throw err;
    }
  };

  // Clean up duplicate resources
  const cleanupDuplicateResources = async () => {
    try {
      const deletedCount = await deleteDuplicateLearningResources();
      
      // Refresh the resources list after cleanup
      await fetchResources();
      
      return deletedCount;
    } catch (err) {
      console.error('Error cleaning up duplicate resources:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  return {
    resources,
    loading,
    error,
    fetchResources,
    incrementViews,
    incrementLikes,
    createResource,
    updateResource,
    deleteResource,
    cleanupDuplicateResources
  };
};