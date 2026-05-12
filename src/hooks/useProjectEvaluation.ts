import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db, addDoc } from '../lib/firebase';
import { ProjectEvaluation, EvaluationCriterion } from '../types/evaluation';

export const useProjectEvaluation = (projectId: string | undefined) => {
  const [evaluation, setEvaluation] = useState<ProjectEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentEvaluation, setCurrentEvaluation] = useState<ProjectEvaluation | null>(null);
  const [evaluationExists, setEvaluationExists] = useState(false);

  const fetchEvaluation = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      // First check if there's an evaluation for this project
      const evaluationsQuery = query(
        collection(db, 'project_evaluations'),
        where('projectId', '==', projectId)
      );
      const evaluationsSnapshot = await getDocs(evaluationsQuery);

      if (!evaluationsSnapshot.empty) {
        // Use the first evaluation found
        const evaluationDoc = evaluationsSnapshot.docs[0];
        const evaluationData = { 
          id: evaluationDoc.id, 
          ...evaluationDoc.data() 
        } as ProjectEvaluation;
        
        if (evaluationData) {
          setEvaluation(evaluationData);
          setCurrentEvaluation(evaluationData);
          setEvaluationExists(true);
        }
      } else {
        // Create a default evaluation structure
        const defaultCriteria: EvaluationCriterion[] = [
          { id: '1', name: 'نسبة الإنجاز', weight: 0.4, score: 0, maxScore: 10 },
          { id: '2', name: 'جودة العمل', weight: 0.2, score: 0, maxScore: 10 },
          { id: '3', name: 'التواصل والتعاون', weight: 0.15, score: 0, maxScore: 10 },
          { id: '4', name: 'الإبداع والابتكار', weight: 0.15, score: 0, maxScore: 10 },
          { id: '5', name: 'جودة العرض والتوثيق', weight: 0.1, score: 0, maxScore: 10 }
        ];
        
        const defaultEvaluation: ProjectEvaluation = {
          id: '', // Will be set when saved
          projectId: projectId,
          criteria: defaultCriteria,
          feedback: '',
          totalScore: 0,
          percentage: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: ''
        };
        
        setCurrentEvaluation(defaultEvaluation);
        setEvaluationExists(false);
      }
    } catch (err) {
      console.error('Error fetching evaluation:', err);
      setError('حدث خطأ في تحميل التقييم');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalScore = (criteria: EvaluationCriterion[]) => {
    const total = criteria.reduce((sum, criterion) => sum + criterion.score, 0);
    const maxScore = criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0);
    const percentage = maxScore > 0 ? (total / maxScore) * 100 : 0;
    
    return { total, percentage };
  };

  const updateCriterionScore = (index: number, score: number, comments?: string) => {
    if (!currentEvaluation) return;

    const updatedCriteria = [...currentEvaluation.criteria];
    updatedCriteria[index] = {
      ...updatedCriteria[index],
      score,
      comments: comments !== undefined ? comments : updatedCriteria[index].comments
    };

    setCurrentEvaluation({
      ...currentEvaluation,
      criteria: updatedCriteria
    });
  };

  const updateFeedback = (feedback: string) => {
    if (!currentEvaluation) return;

    setCurrentEvaluation({
      ...currentEvaluation,
      feedback
    });
  };

  const saveEvaluation = async () => {
    if (!projectId || !currentEvaluation) return;

    try {
      // Find the completion criterion (درجة الإنجاز)
      const completionCriterion = currentEvaluation.criteria.find(c => c.name === 'نسبة الإنجاز');
      
      // Get the project progress value (score of the completion criterion)
      const projectProgressValue = completionCriterion ? completionCriterion.score : 0;

      // Calculate total score
      const { total, percentage } = calculateTotalScore(currentEvaluation.criteria);

      // Clean criteria to ensure no undefined values are sent to Firestore
      const cleanedCriteria = currentEvaluation.criteria.map(criterion => ({
        ...criterion,
        description: criterion.description || null,
        comments: criterion.comments || null
      }));

      if (evaluationExists) {
        // Update existing evaluation
        const evaluationRef = doc(db, 'project_evaluations', currentEvaluation.id);
        await updateDoc(evaluationRef, {
          criteria: cleanedCriteria,
          feedback: currentEvaluation.feedback,
          totalScore: total,
          percentage: percentage,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new evaluation
        const evaluationData = {
          projectId: projectId,
          criteria: cleanedCriteria,
          feedback: currentEvaluation.feedback,
          totalScore: total,
          percentage: percentage,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: null
        };
        
        const docRef = await addDoc(collection(db, 'project_evaluations'), evaluationData);
        setEvaluationExists(true);
        currentEvaluation.id = docRef.id;
      }

      // Update the project's progress in Firestore
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        progress: projectProgressValue,
        updated_at: serverTimestamp()
      });

      // Refresh the evaluation data
      await fetchEvaluation();
      
      return true;
    } catch (error) {
      console.error('Error saving evaluation:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchEvaluation();
  }, [projectId]);

  return {
    evaluation,
    currentEvaluation,
    loading,
    error,
    evaluationExists,
    updateCriterionScore,
    updateFeedback,
    saveEvaluation,
    calculateTotalScore
  };
};