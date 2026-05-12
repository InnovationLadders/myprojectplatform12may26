import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPointsCalculationDetails, PointsCalculationDetails } from '../services/pointsCalculationService';
import { Award, TrendingUp, FileText, MessageSquare, Upload, Calculator, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const PointsDetails: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [details, setDetails] = useState<PointsCalculationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    initiation: true,
    progress: true,
    weighted: true,
    other: true,
  });

  useEffect(() => {
    if (studentId) {
      fetchDetails();
    }
  }, [studentId]);

  const fetchDetails = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const data = await getPointsCalculationDetails(studentId);
      setDetails(data);
    } catch (error) {
      console.error('Error fetching points details:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <p>Unable to load points details. Please try again.</p>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: 'Project Activation', value: details.totalInitiationPoints, color: '#8B5CF6' },
    { name: 'Progress', value: details.totalProgressPoints, color: '#3B82F6' },
    { name: 'Evaluation Scores', value: details.totalWeightedScorePoints, color: '#EC4899' },
    { name: 'Chat Messages', value: details.totalChatPoints, color: '#10B981' },
    { name: 'File Uploads', value: details.totalFilePoints, color: '#F59E0B' },
  ].filter(item => item.value > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Points Calculation Details</h1>
        <p className="text-gray-600">Detailed breakdown for {details.studentName}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-600" />
            Points Calculation Formula
          </h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-mono text-blue-900 mb-3">
              <strong>Total Points</strong> = Initiation Points + Progress Points + Weighted Score Points + Chat Points + File Points
            </p>
            <p className="text-sm font-mono text-blue-800">
              = {details.totalInitiationPoints} + {details.totalProgressPoints} + {details.totalWeightedScorePoints} + {details.totalChatPoints} + {details.totalFilePoints}
            </p>
            <p className="text-lg font-mono font-bold text-blue-900 mt-3 pt-3 border-t border-blue-300">
              = {details.grandTotal} Points
            </p>
          </div>

          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span>Approved Project Points:</span>
              <span className="font-semibold">{details.config.approvedProjectPoints} pts per project</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span>Progress Points Multiplier:</span>
              <span className="font-semibold">{details.config.progressPointsPerPercent}x per percent</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span>Weighted Score Multiplier:</span>
              <span className="font-semibold">{details.config.weightedScorePointsPerUnit}x per unit</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span>Chat Message Points:</span>
              <span className="font-semibold">{details.config.chatMessagePoints} pts per message</span>
            </div>
            <div className="flex justify-between py-2">
              <span>File Upload Points:</span>
              <span className="font-semibold">{details.config.fileUploadPoints} pts per file</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Points Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('initiation')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900">Project Activation Points</h3>
                <p className="text-sm text-gray-600">
                  {details.initiationProjects.length} approved projects × {details.config.approvedProjectPoints} points
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-purple-600">{details.totalInitiationPoints}</span>
              {expandedSections.initiation ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {expandedSections.initiation && (
            <div className="px-6 pb-4 border-t border-gray-200">
              {details.initiationProjects.length > 0 ? (
                <div className="space-y-2 mt-4">
                  {details.initiationProjects.map((project) => (
                    <div key={project.projectId} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-gray-900">{project.projectTitle}</span>
                      <span className="font-semibold text-purple-600">+{project.points} pts</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm mt-4">No approved projects yet</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('progress')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900">Progress Points</h3>
                <p className="text-sm text-gray-600">
                  Sum of all project progress × {details.config.progressPointsPerPercent} multiplier
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-blue-600">{details.totalProgressPoints}</span>
              {expandedSections.progress ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {expandedSections.progress && (
            <div className="px-6 pb-4 border-t border-gray-200">
              {details.progressContributions.length > 0 ? (
                <div className="space-y-2 mt-4">
                  {details.progressContributions.map((contrib) => (
                    <div key={contrib.projectId} className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{contrib.projectTitle}</span>
                        <span className="font-semibold text-blue-600">+{contrib.points} pts</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${contrib.progressPercentage}%` }}
                          ></div>
                        </div>
                        <span className="font-mono">{contrib.progressPercentage}%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {contrib.progressPercentage}% × {details.config.progressPointsPerPercent} = {contrib.points} points
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm mt-4">No progress recorded yet</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('weighted')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-pink-600" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900">Evaluation Score Points</h3>
                <p className="text-sm text-gray-600">
                  Sum of all project weighted scores × {details.config.weightedScorePointsPerUnit} multiplier
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-pink-600">{details.totalWeightedScorePoints}</span>
              {expandedSections.weighted ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {expandedSections.weighted && (
            <div className="px-6 pb-4 border-t border-gray-200">
              {details.weightedScoreContributions.length > 0 ? (
                <div className="space-y-3 mt-4">
                  {details.weightedScoreContributions.map((contrib) => (
                    <div key={contrib.projectId} className="p-4 bg-pink-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900">{contrib.projectTitle}</span>
                        <span className="font-semibold text-pink-600">+{contrib.points} pts</span>
                      </div>
                      <div className="space-y-2">
                        {contrib.criteria.map((criterion, idx) => (
                          <div key={idx} className="text-sm">
                            <div className="flex items-center justify-between text-gray-700">
                              <span>{criterion.name}</span>
                              <span className="font-mono">
                                {criterion.score} × {criterion.weight} = {criterion.weightedScore.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-pink-200">
                        <div className="flex justify-between text-sm font-semibold text-gray-900">
                          <span>Total Weighted Score:</span>
                          <span>{contrib.totalWeightedScore.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {contrib.totalWeightedScore.toFixed(2)} × {details.config.weightedScorePointsPerUnit} = {contrib.points} points
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm mt-4">No evaluations completed yet</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('other')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900">Activity Points</h3>
                <p className="text-sm text-gray-600">Chat messages and file uploads</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-green-600">
                {details.totalChatPoints + details.totalFilePoints}
              </span>
              {expandedSections.other ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {expandedSections.other && (
            <div className="px-6 pb-4 border-t border-gray-200 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900">Chat Messages</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{details.totalChatPoints}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Earned from project chat participation
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="w-5 h-5 text-orange-600" />
                    <span className="font-medium text-gray-900">File Uploads</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{details.totalFilePoints}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Earned from uploading project files
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">How Points are Calculated</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>Current State Calculation:</strong> Progress and Evaluation points are calculated based on the current state of all your projects.
            This means the system looks at the current progress percentage and evaluation scores across all projects, not just incremental changes.
          </p>
          <p>
            <strong>Event-Based Points:</strong> Chat messages and file uploads earn points each time the action is performed and accumulate over time.
          </p>
          <p>
            <strong>Recalculation:</strong> When the "Update Points" button is clicked, the system recalculates Progress and Evaluation points from scratch
            based on current project data, ensuring accuracy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PointsDetails;
