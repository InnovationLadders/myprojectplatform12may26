import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertTriangle, Flag, User, Calendar, Edit, Trash2 } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { useAuth } from '../../contexts/AuthContext';
import { deleteProjectTask } from '../../lib/firebase';
import { EditTaskModal } from './EditTaskModal';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  progress: number;
  project_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface TasksListProps {
  projectId: string;
  tasks: Task[];
  students: any[];
  onTaskUpdated?: () => void;
}

const TasksList: React.FC<TasksListProps> = ({ tasks, students, projectId, onTaskUpdated }) => {
  const { user } = useAuth();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const canManageTask = () => {
    return user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'school';
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
      return;
    }

    setDeletingTaskId(taskId);
    try {
      await deleteProjectTask(taskId);
      if (onTaskUpdated) onTaskUpdated();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('حدث خطأ أثناء حذف المهمة');
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleTaskUpdated = () => {
    setEditingTask(null);
    if (onTaskUpdated) onTaskUpdated();
  };

  console.log('TasksList component received:', {
    tasksCount: tasks?.length || 0,
    studentsCount: students?.length || 0
  });
  
  // Ensure tasks is always an array
  const tasksList = Array.isArray(tasks) ? tasks : [];
  
  console.log('Tasks to render:', tasksList);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتملة';
      case 'in_progress': return 'قيد التنفيذ';
      case 'pending': return 'في الانتظار';
      default: return status;
    }
  };

  const getStudentName = (studentId: string | null) => {
    if (!studentId) return 'غير محدد';
    
    try {
      // Find the student in the provided students array
      // The students array now contains the full user objects
      const studentRecord = students.find(s => s.student_id === studentId);
      if (studentRecord?.student?.name) {
        return studentRecord.student.name;
      }
      
      // If not found in students array, check if the student object is directly in the array
      const directStudent = students.find(s => s.id === studentId);
      if (directStudent?.name) {
        return directStudent.name;
      }
      
      // Additional check for nested student object
      if (studentRecord?.student_id === studentId && studentRecord?.student) {
        return studentRecord.student.name || 'غير محدد';
      }
    } catch (error) {
      console.error('Error getting student name:', error, 'studentId:', studentId, 'students:', students);
    }
    
    return 'غير محدد';
  };

  return (
    <>
      <div className="space-y-4">
        {tasksList.length > 0 ? (
          tasksList.map((task) => (
            <div key={task.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-800">{task.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                    <span className={`flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs ${task.priority === 'high' ? 'text-red-600' : task.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                      <Flag className="w-4 h-4" />
                      <span>{task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}</span>
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>المسؤول: {getStudentName(task.assigned_to)}</span>
                    </div>
                    {task.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>الموعد النهائي: {formatDate(task.due_date)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>تاريخ الإنشاء: {formatDate(task.created_at)}</span>
                    </div>
                  </div>
                </div>

                {canManageTask() && (
                  <div className="flex items-center gap-2 mr-2">
                    <button
                      onClick={() => setEditingTask(task)}
                      className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                      title="تعديل المهمة"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={deletingTaskId === task.id}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="حذف المهمة"
                    >
                      {deletingTaskId === task.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}

                {/* Progress indicator */}
                {task.status !== 'completed' && (
                  <div className="w-16 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-4 border-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {task.status === 'in_progress' ? '50%' : '0%'}
                      </span>
                    </div>
                  </div>
                )}

                {task.status === 'completed' && (
                  <div className="w-16 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                )}
              </div>
            </div>
        ))
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">لا توجد مهام</h3>
          <p className="text-gray-600">لم يتم إضافة أي مهام لهذا المشروع بعد</p>
        </div>
      )}
      </div>

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          projectId={projectId}
          students={students}
          onClose={() => setEditingTask(null)}
          onSuccess={handleTaskUpdated}
        />
      )}
    </>
  );
};

export default TasksList;