import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Search, 
  UserPlus, 
  User, 
  Mail, 
  GraduationCap, 
  Building,
  Users
} from 'lucide-react';
import { useStudents } from '../../hooks/useStudents';
import { addStudentToProject, getProjectStudents } from '../../lib/firebase';

interface AddTeamMemberModalProps {
  projectId: string;
  maxStudents: number;
  currentStudents: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({
  projectId,
  maxStudents,
  currentStudents,
  onClose,
  onSuccess
}) => {
  const { students, loading, error } = useStudents();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentProjectStudents, setCurrentProjectStudents] = useState<any[]>([]);

  useEffect(() => {
    const fetchCurrentProjectStudents = async () => {
      const students = await getProjectStudents(projectId);
      setCurrentProjectStudents(students);
    };
    fetchCurrentProjectStudents();
  }, [projectId]);

  // Filter out students who are already in the project
  const currentStudentIds = currentProjectStudents.map(s => s.student_id);
  const availableStudents = students.filter(student => !currentStudentIds.includes(student.id)); // Use students from useStudents hook
  
  // Filter students based on search term
  const filteredStudents = availableStudents.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.grade && student.grade.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        // Check if we've reached the maximum number of students using currentProjectStudents
        if (currentProjectStudents.length + prev.length >= maxStudents) {
          return prev;
        }
        return [...prev, studentId];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedStudentIds.length === 0) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Add each selected student to the project
      for (const studentId of selectedStudentIds) {
        await addStudentToProject({
          project_id: projectId,
          student_id: studentId,
          role: 'member', // Default role is member
          created_at: new Date().toISOString(),
          status: 'active'
        });
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding students to project:', err);
      setSubmitError(err instanceof Error ? err.message : 'حدث خطأ في إضافة الطلاب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-blue-600" />
            إضافة طلاب للمشروع
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {submitError}
          </div>
        )}

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="البحث بالاسم أو البريد الإلكتروني..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Selected Students Summary */}
        {selectedStudentIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                تم اختيار {selectedStudentIds.length} طالب
                {currentStudents.length > 0 && ` (${currentStudents.length} موجود بالفعل)`}
              </span>
              <button
                onClick={() => setSelectedStudentIds([])}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                إلغاء الكل
              </button>
            </div>
          </div>
        )}

        {/* Students List */}
        <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                className={`flex items-center gap-4 p-4 border rounded-xl transition-all cursor-pointer hover:shadow-md ${
                  selectedStudentIds.includes(student.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleStudentToggle(student.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedStudentIds.includes(student.id)}
                  onChange={() => handleStudentToggle(student.id)}
                  disabled={!selectedStudentIds.includes(student.id) && currentStudents.length + selectedStudentIds.length >= maxStudents}
                  className="text-blue-600"
                />
                
                <img
                  src={student.avatar_url || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150`}
                  alt={student.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{student.name}</h3>
                    {selectedStudentIds.includes(student.id) && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        محدد
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {student.email}
                    </div>
                    {student.grade && (
                      <div className="flex items-center gap-1">
                        <GraduationCap className="w-4 h-4" />
                        {student.grade}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">لا يوجد طلاب</h3>
              <p className="text-gray-600">
                {searchTerm ? 'لم يتم العثور على طلاب يطابقون البحث' : 'لا يوجد طلاب متاحين للإضافة'}
              </p>
            </div>
          )}
        </div>

        {/* Students Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h4 className="font-medium text-gray-800 mb-2">معلومات مهمة:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• يمكنك اختيار حتى {maxStudents - currentStudents.length} طلاب إضافيين</li>
            <li>• يوجد حالياً {currentStudents.length} طالب في المشروع</li>
            <li>• الحد الأقصى للطلاب في هذا المشروع هو {maxStudents}</li>
            <li>• يمكنك تعديل دور الطالب لاحقاً (قائد/عضو)</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedStudentIds.length === 0 || isSubmitting}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                جاري الإضافة...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                إضافة الطلاب ({selectedStudentIds.length})
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};