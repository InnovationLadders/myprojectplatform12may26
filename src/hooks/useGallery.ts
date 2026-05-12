import { useState, useEffect } from 'react';
import { db, storage, firestoreDoc, addDoc } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  increment, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface GalleryProject {
  id: string;
  title: string;
  description: string;
  category: string;
  students: string[];
  school: string;
  schoolId: string;
  teacher: string;
  completedAt: string;
  rating: number;
  views: number;
  likes: number;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'youtube';
  youtubeUrl?: string;
  video?: string;
  tags: string[];
  awards?: string[];
  featured?: boolean;
}

export const useGallery = () => {
  const [projects, setProjects] = useState<GalleryProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGalleryProjects = async () => {
    try {
      setLoading(true);
      
      // Get gallery projects from Firestore
      const galleryRef = collection(db, 'gallery_projects');
      const q = query(galleryRef, orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      
      const galleryProjects: GalleryProject[] = await Promise.all(snapshot.docs.map(async doc => {
        const data = doc.data();
        
        // Fetch school name
        let schoolName = 'مدرسة غير معروفة';
        if (data.school_id) {
          try {
            const schoolDocRef = firestoreDoc(db, 'users', data.school_id);
            const schoolDoc = await getDoc(schoolDocRef);
            if (schoolDoc.exists() && schoolDoc.data().role === 'school') {
              schoolName = schoolDoc.data().name || 'مدرسة غير معروفة';
            }
          } catch (error) {
            console.error('Error fetching school name:', error);
          }
        }
        
        return {
          id: doc.id,
          title: data.title || 'مشروع بدون عنوان',
          description: data.description || 'لا يوجد وصف',
          category: data.category || 'عام',
          students: data.students || [],
          school: schoolName,
          schoolId: data.school_id || '',
          teacher: data.teacher || 'معلم غير معروف',
          completedAt: data.completed_at ? new Date(data.completed_at.toDate()).toISOString() : new Date().toISOString(),
          rating: data.rating || 4.5,
          views: data.views || 0,
          likes: data.likes || 0,
          mediaUrl: data.media_url || 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=600',
          mediaType: data.media_type || 'image',
          youtubeUrl: data.youtube_url,
          video: data.video,
          tags: data.tags || [],
          awards: data.awards || [],
          featured: data.featured || false
        };
      }));
      
      setProjects(galleryProjects);
    } catch (err) {
      console.error('Error fetching gallery projects:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل معرض المشاريع');
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async (id: string) => {
    try {
      const projectRef = doc(db, 'gallery_projects', id);
      await updateDoc(projectRef, {
        views: increment(1)
      });
      
      // Update local state
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === id ? { ...project, views: project.views + 1 } : project
        )
      );
    } catch (err) {
      console.error('Error incrementing views:', err);
    }
  };

  const incrementLikes = async (id: string) => {
    try {
      const projectRef = doc(db, 'gallery_projects', id);
      await updateDoc(projectRef, {
        likes: increment(1)
      });
      
      // Update local state
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === id ? { ...project, likes: project.likes + 1 } : project
        )
      );
    } catch (err) {
      console.error('Error incrementing likes:', err);
    }
  };

  const addGalleryProject = async (projectData: Partial<GalleryProject>) => {
    try {
      console.log('Adding gallery project with data:', projectData);
      
      // Add the project to Firestore
      const galleryRef = collection(db, 'gallery_projects');
      const docRef = await addDoc(galleryRef, {
        title: projectData.title,
        description: projectData.description,
        category: projectData.category,
        students: projectData.students,
        school_id: projectData.schoolId,
        teacher: projectData.teacher,
        completed_at: serverTimestamp(),
        rating: projectData.rating || 4.5,
        views: 0,
        likes: 0,
        media_url: projectData.mediaUrl,
        media_type: projectData.mediaType,
        youtube_url: projectData.youtubeUrl,
        video: projectData.video,
        tags: projectData.tags || [],
        awards: projectData.awards || [],
        featured: projectData.featured || false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      
      console.log('Gallery project added successfully with ID:', docRef.id);
      
      // Get the new project with its ID
      const newProject: GalleryProject = {
        id: docRef.id,
        title: projectData.title || 'مشروع بدون عنوان',
        description: projectData.description || 'لا يوجد وصف',
        category: projectData.category || 'عام',
        students: projectData.students || [],
        school: projectData.school || 'مدرسة غير معروفة',
        schoolId: projectData.schoolId || '',
        teacher: projectData.teacher || 'معلم غير معروف',
        completedAt: new Date().toISOString(),
        rating: projectData.rating || 4.5,
        views: 0,
        likes: 0,
        mediaUrl: projectData.mediaUrl || '',
        mediaType: projectData.mediaType || 'image',
        youtubeUrl: projectData.youtubeUrl,
        video: projectData.video, // Ensure video field is updated
        tags: projectData.tags || [],
        awards: projectData.awards || [],
        featured: projectData.featured || false
      };
      
      // Add to local state
      setProjects(prev => [newProject, ...prev]);
      
      return newProject;
    } catch (err) {
      console.error('Error adding gallery project:', err);
      throw err;
    }
  };

  const updateGalleryProject = async (id: string, projectData: Partial<GalleryProject>) => {
    try {
      const projectRef = doc(db, 'gallery_projects', id);
      
      // Update the document in Firestore
      await updateDoc(projectRef, { // Use updateDoc for partial updates
        title: projectData.title,
        description: projectData.description,
        category: projectData.category,
        students: projectData.students,
        school_id: projectData.schoolId,
        teacher: projectData.teacher,
        media_url: projectData.mediaUrl,
        media_type: projectData.mediaType,
        youtube_url: projectData.youtubeUrl,
        video: projectData.video,
        tags: projectData.tags,
        awards: projectData.awards,
        featured: projectData.featured,
        updated_at: serverTimestamp()
      });
      
      // Update local state
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === id ? { ...project, ...projectData } : project
        )
      );
      
      return { id, ...projectData };
    } catch (err) {
      console.error('Error updating gallery project:', err);
      throw err;
    }
  };

  const deleteGalleryProject = async (id: string) => {
    try {
      const projectRef = doc(db, 'gallery_projects', id);
      await deleteDoc(projectRef);
      
      // Update local state
      setProjects(prevProjects => prevProjects.filter(project => project.id !== id));
      
      return true;
    } catch (err) {
      console.error('Error deleting gallery project:', err);
      throw err;
    }
  };

  // Upload media to Firebase Storage with size validation
  const uploadMedia = async (file: File): Promise<{ url: string; type: 'image' | 'video' }> => {
    try {
      console.log('Uploading media file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      // Validate file size (100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB in bytes
      if (file.size > maxSize) {
        throw new Error('حجم الملف يتجاوز الحد الأقصى المسموح (100 ميجابايت)');
      }
      
      // Determine file type
      let mediaType: 'image' | 'video';
      if (file.type.startsWith('image/')) {
        mediaType = 'image';
      } else if (file.type.startsWith('video/')) {
        mediaType = 'video';
      } else {
        throw new Error('نوع الملف غير مدعوم. يرجى اختيار صورة أو فيديو');
      }
      
      const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
      console.log('Uploading to storage path:', `gallery/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      console.log('Media uploaded successfully, URL:', downloadUrl);
      return { url: downloadUrl, type: mediaType };
    } catch (err) {
      console.error('Error uploading media:', err);
      throw err;
    }
  };

  // Convert YouTube URL to embed URL
  const convertYouTubeUrl = (url: string): { embedUrl: string; watchUrl: string } => {
    try {
      console.log('Converting YouTube URL:', url);
      
      let videoId = '';
      
      // Handle different YouTube URL formats
      if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v') || '';
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('embed/')[1].split('?')[0];
      } else if (url.includes('youtube.com/shorts/')) {
        videoId = url.split('shorts/')[1].split('?')[0];
      }
      
      if (!videoId) {
        throw new Error('رابط يوتيوب غير صالح');
      }
      
      const result = {
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`
      };
      
      console.log('YouTube URL converted successfully:', result);
      return result;
    } catch (err) {
      console.error('Error converting YouTube URL:', err);
      throw new Error('رابط يوتيوب غير صالح');
    }
  };

  useEffect(() => {
    fetchGalleryProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    fetchGalleryProjects,
    incrementViews,
    incrementLikes,
    addGalleryProject,
    updateGalleryProject,
    deleteGalleryProject,
    uploadMedia,
    convertYouTubeUrl
  };
};