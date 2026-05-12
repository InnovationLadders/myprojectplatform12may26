export interface ProjectMeeting {
  id: string;
  project_id: string;
  meeting_code: string;
  meeting_link: string;
  meeting_status: 'active' | 'inactive';
  started_by_user_id: string;
  started_by_user_name: string | null;
  started_at: Date;
  updated_at: Date;
  created_at: Date;
}
