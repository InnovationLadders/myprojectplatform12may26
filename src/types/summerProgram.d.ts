export interface SummerProgramRegistrationData {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  parentPhone: string;
  city: string;
  idNumber: string;
  school: string;
  grade: string;
  educationAdministration: string;
  hasParticipatedBefore: boolean;
  previousProjects?: string;
  interests: string[];
  howDidYouHear: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string | Date;
  updatedAt: string | Date;
}