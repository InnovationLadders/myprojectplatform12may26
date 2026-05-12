export type ActivityType = 'chat' | 'file_upload' | 'evaluation_update';

export interface ChatActivityData {
  messagePreview: string;
}

export interface FileUploadActivityData {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileCategory: 'image' | 'video' | 'document';
}

export interface EvaluationChange {
  criterionName: string;
  oldScore: number;
  newScore: number;
}

export interface EvaluationActivityData {
  changes: EvaluationChange[];
}

export interface Activity {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string;
  activity_type: ActivityType;
  activity_data: ChatActivityData | FileUploadActivityData | EvaluationActivityData;
  created_at: Date;
  project_title: string;
}

export function isChatActivity(activity: Activity): activity is Activity & { activity_data: ChatActivityData } {
  return activity.activity_type === 'chat';
}

export function isFileUploadActivity(activity: Activity): activity is Activity & { activity_data: FileUploadActivityData } {
  return activity.activity_type === 'file_upload';
}

export function isEvaluationActivity(activity: Activity): activity is Activity & { activity_data: EvaluationActivityData } {
  return activity.activity_type === 'evaluation_update';
}

export function formatActivityDescription(activity: Activity): string {
  if (isChatActivity(activity)) {
    return `sent a message in ${activity.project_title}`;
  } else if (isFileUploadActivity(activity)) {
    return `uploaded ${activity.activity_data.fileName} to ${activity.project_title}`;
  } else if (isEvaluationActivity(activity)) {
    const changeCount = activity.activity_data.changes.length;
    return `updated ${changeCount} evaluation ${changeCount === 1 ? 'criterion' : 'criteria'} for ${activity.project_title}`;
  }
  return '';
}
