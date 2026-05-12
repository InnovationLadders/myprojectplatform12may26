import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Calendar, RefreshCw, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, addDays, differenceInDays, startOfDay, parseISO, isValid } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

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
}

interface GanttChartProps {
  tasks: Task[];
  students: any[];
  projectStartDate: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  students,
  projectStartDate,
  onRefresh,
  isRefreshing = false
}) => {
  const { t, i18n } = useTranslation();
  const chartRef = useRef<HTMLDivElement>(null);
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const currentLanguage = i18n.language;
  const dateLocale = currentLanguage === 'ar' ? ar : enUS;

  const getStudentName = (studentId: string | null) => {
    if (!studentId) return t('gantt.notAssigned');

    const studentRecord = students.find(s => s.student_id === studentId);
    if (studentRecord?.student?.name) {
      return studentRecord.student.name;
    }

    const directStudent = students.find(s => s.id === studentId);
    if (directStudent?.name) {
      return directStudent.name;
    }

    return t('gantt.notAssigned');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return t('gantt.status.completed');
      case 'in_progress': return t('gantt.status.inProgress');
      case 'pending': return t('gantt.status.pending');
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return t('gantt.priority.high');
      case 'medium': return t('gantt.priority.medium');
      case 'low': return t('gantt.priority.low');
      default: return priority;
    }
  };

  const timelineData = useMemo(() => {
    if (!tasks.length || !projectStartDate) {
      return null;
    }

    try {
      const startDate = startOfDay(parseISO(projectStartDate));
      if (!isValid(startDate)) {
        console.error('Invalid project start date:', projectStartDate);
        return null;
      }

      const tasksWithDates = tasks.filter(task => task.due_date);

      if (tasksWithDates.length === 0) {
        const endDate = addDays(startDate, 30);
        return {
          startDate,
          endDate,
          totalDays: 30,
          taskBars: []
        };
      }

      const endDate = tasksWithDates.reduce((latest, task) => {
        try {
          const taskEnd = startOfDay(parseISO(task.due_date!));
          if (isValid(taskEnd)) {
            return taskEnd > latest ? taskEnd : latest;
          }
        } catch (e) {
          console.error('Invalid task due date:', task.due_date);
        }
        return latest;
      }, startDate);

      const finalEndDate = addDays(endDate, 7);
      const totalDays = differenceInDays(finalEndDate, startDate);

      const taskBars = tasks.map(task => {
        if (!task.due_date) {
          return null;
        }

        try {
          const taskDueDate = startOfDay(parseISO(task.due_date));
          if (!isValid(taskDueDate)) {
            return null;
          }

          const daysFromStart = 0;
          const duration = differenceInDays(taskDueDate, startDate);

          const leftPercent = (daysFromStart / totalDays) * 100;
          const widthPercent = (duration / totalDays) * 100;

          const progressPercent = task.status === 'completed' ? 100 :
                                 task.status === 'in_progress' ? 50 : 0;

          return {
            task,
            leftPercent,
            widthPercent,
            progressPercent,
            duration
          };
        } catch (e) {
          console.error('Error processing task:', task.title, e);
          return null;
        }
      }).filter(Boolean);

      return {
        startDate,
        endDate: finalEndDate,
        totalDays,
        taskBars
      };
    } catch (error) {
      console.error('Error calculating timeline:', error);
      return null;
    }
  }, [tasks, projectStartDate]);

  useEffect(() => {
    if (chartRef.current && timelineData) {
      const today = startOfDay(new Date());
      const daysFromStart = differenceInDays(today, timelineData.startDate);

      if (daysFromStart >= 0 && daysFromStart <= timelineData.totalDays) {
        const scrollPercent = (daysFromStart / timelineData.totalDays);
        const scrollPosition = (chartRef.current.scrollWidth - chartRef.current.clientWidth) * scrollPercent;
        chartRef.current.scrollLeft = Math.max(0, scrollPosition - 200);
      }
    }
  }, [timelineData]);

  const handleMouseEnter = (task: Task, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setTooltipData(task);
  };

  const handleMouseLeave = () => {
    setTooltipData(null);
  };

  const renderTimeline = () => {
    if (!timelineData) {
      return null;
    }

    const { startDate, totalDays } = timelineData;
    const dayWidth = 100 / totalDays;
    const dateMarkers = [];

    const interval = totalDays > 60 ? 7 : totalDays > 30 ? 3 : 1;

    for (let i = 0; i <= totalDays; i += interval) {
      const currentDate = addDays(startDate, i);
      const leftPercent = (i / totalDays) * 100;

      dateMarkers.push(
        <div
          key={i}
          className="absolute flex flex-col items-center"
          style={{ left: `${leftPercent}%` }}
        >
          <div className="h-2 w-px bg-gray-300"></div>
          <span className="text-xs text-gray-600 mt-1 whitespace-nowrap">
            {format(currentDate, 'MMM dd', { locale: dateLocale })}
          </span>
        </div>
      );
    }

    const today = startOfDay(new Date());
    const daysFromStart = differenceInDays(today, startDate);

    if (daysFromStart >= 0 && daysFromStart <= totalDays) {
      const todayPercent = (daysFromStart / totalDays) * 100;
      dateMarkers.push(
        <div
          key="today"
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
          style={{ left: `${todayPercent}%` }}
        >
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {t('gantt.today')}
          </div>
        </div>
      );
    }

    return dateMarkers;
  };

  if (!timelineData || timelineData.taskBars.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            {t('gantt.title')}
          </h3>
        </div>
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">{t('gantt.noTasksWithDates')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          {t('gantt.title')}
        </h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('gantt.refresh')}
          </button>
        )}
      </div>

      <div className="overflow-x-auto" ref={chartRef}>
        <div className="min-w-[800px]">
          <div className="relative h-12 border-b border-gray-200 mb-4">
            {renderTimeline()}
          </div>

          <div className="space-y-3">
            {timelineData.taskBars.map((taskBar: any) => {
              const { task, leftPercent, widthPercent, progressPercent } = taskBar;

              return (
                <div key={task.id} className="relative h-16 border-b border-gray-100 group">
                  <div className="absolute left-0 top-0 h-full flex items-center pr-4 w-48 z-10 bg-white">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {getStudentName(task.assigned_to)}
                      </p>
                    </div>
                  </div>

                  <div className="absolute left-48 right-0 top-1/2 transform -translate-y-1/2 h-10">
                    <div className="relative h-full">
                      <div
                        className="absolute h-full rounded-lg cursor-pointer transition-all group-hover:shadow-lg"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${Math.max(widthPercent, 2)}%`
                        }}
                        onMouseEnter={(e) => handleMouseEnter(task, e)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className={`h-full rounded-lg ${getStatusColor(task.status)} opacity-80`}>
                          {progressPercent > 0 && (
                            <div
                              className="h-full bg-white bg-opacity-30 rounded-l-lg transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          )}
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs text-white font-medium px-2 truncate">
                            {task.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {tooltipData && (
        <div
          className="fixed z-50 bg-gray-900 text-white rounded-lg shadow-xl p-4 max-w-xs transform -translate-x-1/2 -translate-y-full pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`
          }}
        >
          <div className="space-y-2">
            <h4 className="font-semibold text-sm border-b border-gray-700 pb-2">
              {tooltipData.title}
            </h4>
            {tooltipData.description && (
              <p className="text-xs text-gray-300">{tooltipData.description}</p>
            )}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">{t('gantt.assignedTo')}:</span>
                <span>{getStudentName(tooltipData.assigned_to)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('gantt.dueDate')}:</span>
                <span>
                  {tooltipData.due_date ? format(parseISO(tooltipData.due_date), 'PP', { locale: dateLocale }) : t('gantt.notSet')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('gantt.statusLabel')}:</span>
                <span>{getStatusText(tooltipData.status)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('gantt.priorityLabel')}:</span>
                <span>{getPriorityText(tooltipData.priority)}</span>
              </div>
            </div>
          </div>
          <div
            className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900"
            style={{ bottom: '-8px' }}
          />
        </div>
      )}

      <div className="mt-6 flex items-center gap-6 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>{t('gantt.status.pending')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>{t('gantt.status.inProgress')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>{t('gantt.status.completed')}</span>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
