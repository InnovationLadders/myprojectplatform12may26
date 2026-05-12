import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ProjectDiagnosis {
  projectId: string;
  projectTitle: string;
  projectStatus: string;
  projectSchoolId: string;
  projectTeacherId: string;
  teacherExists: boolean;
  teacherName: string;
  teacherSchoolId: string;
  teacherRole: string;
  schoolExists: boolean;
  schoolName: string;
  schoolRole: string;
  issues: string[];
  severity: 'none' | 'warning' | 'critical';
  recommendations: string[];
}

export interface DiagnosisResult {
  totalProjects: number;
  healthyProjects: number;
  projectsWithWarnings: number;
  projectsWithCriticalIssues: number;
  projects: ProjectDiagnosis[];
}

export const diagnoseSchoolIdMismatch = async (): Promise<DiagnosisResult> => {
  console.log('🔍 [Diagnosis] Starting school ID mismatch diagnosis...');

  const result: DiagnosisResult = {
    totalProjects: 0,
    healthyProjects: 0,
    projectsWithWarnings: 0,
    projectsWithCriticalIssues: 0,
    projects: []
  };

  try {
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    result.totalProjects = projectsSnapshot.size;

    console.log(`📊 [Diagnosis] Found ${result.totalProjects} projects to analyze`);

    for (const projectDoc of projectsSnapshot.docs) {
      const projectData = projectDoc.data();
      const diagnosis: ProjectDiagnosis = {
        projectId: projectDoc.id,
        projectTitle: projectData.title || 'Untitled',
        projectStatus: projectData.status || 'unknown',
        projectSchoolId: projectData.school_id || '',
        projectTeacherId: projectData.teacher_id || '',
        teacherExists: false,
        teacherName: '',
        teacherSchoolId: '',
        teacherRole: '',
        schoolExists: false,
        schoolName: '',
        schoolRole: '',
        issues: [],
        severity: 'none',
        recommendations: []
      };

      if (!diagnosis.projectSchoolId) {
        diagnosis.issues.push('Missing school_id in project');
        diagnosis.recommendations.push('Set school_id based on teacher school or manually assign');
        diagnosis.severity = 'critical';
      }

      if (!diagnosis.projectTeacherId) {
        diagnosis.issues.push('Missing teacher_id in project');
        diagnosis.recommendations.push('Assign a teacher to this project');
        if (diagnosis.severity === 'none') {
          diagnosis.severity = 'warning';
        }
      }

      if (diagnosis.projectTeacherId) {
        try {
          const teacherDoc = await getDoc(doc(db, 'users', diagnosis.projectTeacherId));
          if (teacherDoc.exists()) {
            const teacherData = teacherDoc.data();
            diagnosis.teacherExists = true;
            diagnosis.teacherName = teacherData.name || '';
            diagnosis.teacherSchoolId = teacherData.school_id || '';
            diagnosis.teacherRole = teacherData.role || '';

            if (teacherData.role !== 'teacher') {
              diagnosis.issues.push(`teacher_id points to user with role '${teacherData.role}' instead of 'teacher'`);
              diagnosis.recommendations.push('Update teacher_id to point to an actual teacher user');
              diagnosis.severity = 'critical';
            }

            if (!diagnosis.teacherSchoolId) {
              diagnosis.issues.push('Teacher has no school_id assigned');
              diagnosis.recommendations.push('Assign school_id to teacher account');
              if (diagnosis.severity === 'none') {
                diagnosis.severity = 'warning';
              }
            } else if (diagnosis.projectSchoolId && diagnosis.teacherSchoolId !== diagnosis.projectSchoolId) {
              diagnosis.issues.push(
                `School ID mismatch: Project (${diagnosis.projectSchoolId.substring(0, 8)}...) vs Teacher (${diagnosis.teacherSchoolId.substring(0, 8)}...)`
              );
              diagnosis.recommendations.push('Update project school_id to match teacher school_id');
              diagnosis.severity = 'critical';
            }
          } else {
            diagnosis.issues.push('Teacher ID references non-existent user');
            diagnosis.recommendations.push('Remove invalid teacher_id or create missing teacher user');
            diagnosis.severity = 'critical';
          }
        } catch (error) {
          console.error(`Error fetching teacher ${diagnosis.projectTeacherId}:`, error);
          diagnosis.issues.push('Error fetching teacher data');
          diagnosis.severity = 'critical';
        }
      }

      if (diagnosis.projectSchoolId) {
        try {
          const schoolDoc = await getDoc(doc(db, 'users', diagnosis.projectSchoolId));
          if (schoolDoc.exists()) {
            const schoolData = schoolDoc.data();
            diagnosis.schoolExists = true;
            diagnosis.schoolName = schoolData.name || '';
            diagnosis.schoolRole = schoolData.role || '';

            if (schoolData.role !== 'school') {
              diagnosis.issues.push(`school_id points to user with role '${schoolData.role}' instead of 'school'`);
              diagnosis.recommendations.push('Update school_id to point to an actual school user');
              diagnosis.severity = 'critical';
            }
          } else {
            diagnosis.issues.push('School ID references non-existent user');
            diagnosis.recommendations.push('Create missing school user or update school_id');
            diagnosis.severity = 'critical';
          }
        } catch (error) {
          console.error(`Error fetching school ${diagnosis.projectSchoolId}:`, error);
          diagnosis.issues.push('Error fetching school data');
          diagnosis.severity = 'critical';
        }
      }

      result.projects.push(diagnosis);

      if (diagnosis.severity === 'none') {
        result.healthyProjects++;
      } else if (diagnosis.severity === 'warning') {
        result.projectsWithWarnings++;
      } else if (diagnosis.severity === 'critical') {
        result.projectsWithCriticalIssues++;
      }
    }

    console.log('✅ [Diagnosis] Diagnosis completed:', {
      total: result.totalProjects,
      healthy: result.healthyProjects,
      warnings: result.projectsWithWarnings,
      critical: result.projectsWithCriticalIssues
    });

    return result;
  } catch (error) {
    console.error('❌ [Diagnosis] Error during diagnosis:', error);
    throw error;
  }
};

export const fixProjectSchoolId = async (projectId: string, correctSchoolId: string): Promise<void> => {
  console.log(`🔧 [Fix] Fixing project ${projectId} with school_id ${correctSchoolId}`);

  try {
    const { updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'projects', projectId), {
      school_id: correctSchoolId
    });

    console.log(`✅ [Fix] Successfully updated project ${projectId}`);
  } catch (error) {
    console.error(`❌ [Fix] Error updating project ${projectId}:`, error);
    throw error;
  }
};

export const fixProjectTeacherId = async (projectId: string, correctTeacherId: string): Promise<void> => {
  console.log(`🔧 [Fix] Fixing project ${projectId} with teacher_id ${correctTeacherId}`);

  try {
    const { updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'projects', projectId), {
      teacher_id: correctTeacherId
    });

    console.log(`✅ [Fix] Successfully updated project ${projectId}`);
  } catch (error) {
    console.error(`❌ [Fix] Error updating project ${projectId}:`, error);
    throw error;
  }
};

export const autoFixProjectSchoolIds = async (): Promise<{ fixed: number; failed: number; errors: string[] }> => {
  console.log('🤖 [Auto Fix] Starting automatic school ID fix...');

  const result = {
    fixed: 0,
    failed: 0,
    errors: [] as string[]
  };

  try {
    const diagnosis = await diagnoseSchoolIdMismatch();

    for (const project of diagnosis.projects) {
      if (project.severity === 'critical' && project.teacherExists && project.teacherSchoolId) {
        if (project.projectSchoolId !== project.teacherSchoolId) {
          try {
            await fixProjectSchoolId(project.projectId, project.teacherSchoolId);
            result.fixed++;
            console.log(`✅ [Auto Fix] Fixed project ${project.projectTitle}`);
          } catch (error) {
            result.failed++;
            const errorMsg = `Failed to fix ${project.projectTitle}: ${error instanceof Error ? error.message : String(error)}`;
            result.errors.push(errorMsg);
            console.error(`❌ [Auto Fix] ${errorMsg}`);
          }
        }
      }
    }

    console.log('✅ [Auto Fix] Auto-fix completed:', result);
    return result;
  } catch (error) {
    console.error('❌ [Auto Fix] Error during auto-fix:', error);
    throw error;
  }
};
