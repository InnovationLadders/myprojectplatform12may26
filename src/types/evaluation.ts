export interface EvaluationCriterion {
  id: string;
  name: string;
  description?: string;
  weight: number;
  score: number;
  maxScore: number;
  comments?: string;
}

export interface ProjectEvaluation {
  id: string;
  projectId: string;
  criteria: EvaluationCriterion[];
  feedback: string;
  totalScore: number;
  percentage: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}