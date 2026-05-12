import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db, addDoc, getProjectStudents } from '../lib/firebase';
import { ProjectEvaluation, EvaluationCriterion } from '../types/evaluation';
import { awardProgressPoints, awardWeightedScorePoints } from '../services/rewardPointsService';
import { logEvaluationActivity } from '../services/activityService';

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

  const saveEvaluation = async (userId?: string, userName?: string, projectTitle?: string) => {
    if (!projectId || !currentEvaluation) return;

    try {
      // Get previous evaluation data to calculate progress increase
      let previousProgress = 0;
      let previousTotalScore = 0;

      if (evaluationExists && evaluation) {
        const completionCriterion = evaluation.criteria.find(c => c.name === 'نسبة الإنجاز');
        previousProgress = completionCriterion ? completionCriterion.score : 0;
        previousTotalScore = evaluation.totalScore || 0;
      }

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

      // Log evaluation activity if user info provided
      if (userId && userName && projectTitle && evaluation) {
        try {
          const changes = currentEvaluation.criteria
            .map((criterion, index) => {
              const oldCriterion = evaluation.criteria[index];
              const oldScore = oldCriterion?.score || 0;
              const newScore = criterion.score;

              if (oldScore !== newScore) {
                return {
                  criterionName: criterion.name,
                  oldScore,
                  newScore
                };
              }
              return null;
            })
            .filter((change): change is { criterionName: string; oldScore: number; newScore: number } => change !== null);

          if (changes.length > 0) {
            await logEvaluationActivity(projectId, userId, userName, changes, projectTitle);
          }
        } catch (error) {
          console.error('Error logging evaluation activity:', error);
        }
      }

      // Award points to students
      try {
        console.log('🎯 Starting to award points for project:', projectId);
        const projectStudents = await getProjectStudents(projectId);
        console.log('👥 Found project students:', projectStudents.length, projectStudents);

        if (!projectStudents || projectStudents.length === 0) {
          console.warn('⚠️ No students found for project:', projectId);
          return true;
        }

        for (const student of projectStudents) {
          console.log('\n📊 Processing student:', student.student_id);

          // Award progress points if progress increased
          const progressIncrease = Math.max(0, projectProgressValue - previousProgress);
          console.log('📈 Progress - Current:', projectProgressValue, 'Previous:', previousProgress, 'Increase:', progressIncrease);

          if (progressIncrease > 0) {
            console.log('✅ Awarding', progressIncrease, 'progress points to student:', student.student_id);
            try {
              await awardProgressPoints(student.student_id, projectId, progressIncrease);
              console.log('✅ Progress points awarded successfully');
            } catch (progressError) {
              console.error('❌ Error awarding progress points:', progressError);
            }
          } else {
            console.log('⏭️ No progress increase, skipping progress points');
          }

          // Award weighted score points if weighted score increased
          const weightedScore = currentEvaluation.criteria.reduce((sum, criterion) =>
            sum + (criterion.score * criterion.weight), 0
          );
          const previousWeightedScore = evaluation?.criteria.reduce((sum, criterion) =>
            sum + (criterion.score * criterion.weight), 0
          ) || 0;

          console.log('⚖️ Weighted Score - Current:', weightedScore.toFixed(2), 'Previous:', previousWeightedScore.toFixed(2));

          if (weightedScore > previousWeightedScore) {
            console.log('✅ Awarding weighted score points to student:', student.student_id);
            try {
              await awardWeightedScorePoints(student.student_id, projectId, weightedScore, previousWeightedScore);
              console.log('✅ Weighted score points awarded successfully');
            } catch (weightedError) {
              console.error('❌ Error awarding weighted score points:', weightedError);
            }
          } else {
            console.log('⏭️ Weighted score did not increase, skipping weighted score points');
          }
        }
        console.log('\n🎉 Finished awarding points for all students');
      } catch (error) {
        console.error('❌ Error in points awarding process:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }

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