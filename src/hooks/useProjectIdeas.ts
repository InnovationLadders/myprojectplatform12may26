import { useState, useEffect } from 'react';
import { 
  getProjectIdeas, 
  getAllProjectIdeas,
  createProjectIdea, 
  updateProjectIdea, 
  deleteProjectIdea,
  incrementProjectIdeaViews,
  incrementProjectIdeaDownloads,
  getProjectIdeaById // Add this import
} from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export interface ProjectIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: string;
  subject: string;
  image: string;
  objectives: string[];
  materials: string[];
  steps: string[];
  tags: string[];
  views: number;
  downloads: number;
  rating: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
  feedback?: string; // For rejected ideas
}

export const useProjectIdeas = () => {
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const fetchProjectIdeas = async () => {
    try {
      setLoading(true);
      setError(null);      
      console.log("Fetching project ideas, user:", user?.id, "role:", user?.role, "isAdmin:", isAdmin);
      
      // If user is admin, fetch all ideas including pending and rejected
      // Otherwise, fetch only approved ideas
      const ideas = isAdmin 
        ? await getAllProjectIdeas() 
        : await getProjectIdeas();
      
      console.log("Project ideas fetched:", ideas?.length || 0);
      setProjectIdeas(ideas);
    } catch (err) {
      console.error('Error fetching project ideas:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل أفكار المشاريع');
    } finally {
      setLoading(false);
    }
  };

  const addIdea = async (ideaData: Omit<ProjectIdea, 'id' | 'views' | 'downloads' | 'rating' | 'status'>) => {
    try {
      setLoading(true);
      setError(null);
      
      // Set default values for views, downloads, rating, and status
      const newIdea = {
        ...ideaData,
        views: 0,
        downloads: 0,
        rating: 4.5, // Default rating
        status: 'pending' // New ideas are pending by default
      };
      
      const createdIdea = await createProjectIdea(newIdea);
      
      // Only add to local state if admin or if we're showing all ideas
      if (isAdmin) {
        setProjectIdeas(prev => [createdIdea, ...prev]);
      }
      
      return createdIdea;
    } catch (err) {
      console.error('Error adding project idea:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في إضافة فكرة المشروع');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const editIdea = async (id: string, updates: Partial<ProjectIdea>) => {
    try {
      setLoading(true);
      setError(null);
      await updateProjectIdea(id, updates);
      
      // Update the local state
      setProjectIdeas(prev => 
        prev.map(idea => 
          idea.id === id ? { ...idea, ...updates } : idea
        )
      );
      
      return true;
    } catch (err) {
      console.error('Error updating project idea:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحديث فكرة المشروع');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeIdea = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteProjectIdea(id);
      
      // Remove from local state
      setProjectIdeas(prev => prev.filter(idea => idea.id !== id));
      
      return true;
    } catch (err) {
      console.error('Error deleting project idea:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في حذف فكرة المشروع');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async (id: string) => {
    try {
      await incrementProjectIdeaViews(id);
      
      // Update local state
      setProjectIdeas(prevIdeas => 
        prevIdeas.map(idea => 
          idea.id === id ? { ...idea, views: idea.views + 1 } : idea
        )
      );
    } catch (err) {
      console.error('Error incrementing views:', err);
    }
  };

  const incrementDownloads = async (id: string) => {
    try {
      await incrementProjectIdeaDownloads(id);
      
      // Update local state
      setProjectIdeas(prevIdeas => 
        prevIdeas.map(idea => 
          idea.id === id ? { ...idea, downloads: idea.downloads + 1 } : idea
        )
      );
    } catch (err) {
      console.error('Error incrementing downloads:', err);
    }
  };

  const approveIdea = async (id: string) => {
    if (!isAdmin) {
      throw new Error('Only admins can approve ideas');
    }
    
    return await editIdea(id, { status: 'approved' });
  };

  const rejectIdea = async (id: string, feedback: string) => {
    if (!isAdmin) {
      throw new Error('Only admins can reject ideas');
    }
    
    return await editIdea(id, { status: 'rejected', feedback });
  };

  useEffect(() => {
    // Only fetch project ideas when user is available and after a short delay
    // to ensure Firebase is fully initialized
    if (user && user.id) {
      console.log("User available, fetching project ideas. User ID:", user.id, "Role:", user.role);
      fetchProjectIdeas();
    }
  }, [user?.id, user?.role]);

  return {
    projectIdeas,
    loading,
    error,
    fetchProjectIdeas,
    addIdea,
    editIdea,
    removeIdea,
    incrementViews,
    incrementDownloads,
    approveIdea,
    rejectIdea,
    isAdmin,
    getProjectIdeaById: async (id: string) => {
      try {
        const idea = await getProjectIdeaById(id);
        return idea;
      } catch (err) {
        console.error('Error fetching project idea by ID:', err);
        throw err;
      }
    }
  };
};