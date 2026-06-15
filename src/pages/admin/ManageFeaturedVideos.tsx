import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Trash2, CircleCheck as CheckCircle, Youtube, Video, ChevronDown } from 'lucide-react';
import { useFeaturedVideos } from '../../hooks/useFeaturedVideos';
import { useGallery, GalleryProject } from '../../hooks/useGallery';

const SLOTS: { order: 1 | 2 | 3; label: string }[] = [
  { order: 1, label: 'الفيديو الأول' },
  { order: 2, label: 'الفيديو الثاني' },
  { order: 3, label: 'الفيديو الثالث' }
];

const ManageFeaturedVideos: React.FC = () => {
  const { featuredVideos, loading: fvLoading, setFeaturedVideo, removeFeaturedVideo } = useFeaturedVideos();
  const { projects, loading: galleryLoading } = useGallery(null, null, 'admin');
  const [savingSlot, setSavingSlot] = useState<number | null>(null);
  const [removingSlot, setRemovingSlot] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<Record<number, string>>({});

  const videoProjects = projects.filter(
    p => p.isPublic && (p.mediaType === 'video' || p.mediaType === 'youtube')
  );

  const getSlotVideo = (order: 1 | 2 | 3) =>
    featuredVideos.find(v => v.order === order) ?? null;

  const handleSave = async (order: 1 | 2 | 3) => {
    const projectId = selectedProject[order];
    if (!projectId) return;
    const project = videoProjects.find(p => p.id === projectId);
    if (!project) return;

    setSavingSlot(order);
    try {
      await setFeaturedVideo(order, project);
      setSelectedProject(prev => ({ ...prev, [order]: '' }));
    } catch {
      // error handled in hook
    } finally {
      setSavingSlot(null);
    }
  };

  const handleRemove = async (order: 1 | 2 | 3) => {
    setRemovingSlot(order);
    try {
      await removeFeaturedVideo(order);
    } catch {
      // error handled in hook
    } finally {
      setRemovingSlot(null);
    }
  };

  const loading = fvLoading || galleryLoading;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <Play className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">فيديوهات الصفحة الرئيسية</h1>
            <p className="opacity-90 text-sm">اختر 3 فيديوهات من معرض المشاريع العامة لعرضها للزوار</p>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {SLOTS.map(({ order, label }) => {
            const current = getSlotVideo(order);
            return (
              <motion.div
                key={order}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: order * 0.1 }}
                className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100"
              >
                {/* Slot Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-bold text-gray-800">{label}</span>
                  {current && (
                    <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                      <CheckCircle className="w-4 h-4" />
                      محدد
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-4">
                  {/* Current selection preview */}
                  {current ? (
                    <div className="space-y-3">
                      <div className="aspect-video rounded-xl overflow-hidden bg-gray-900">
                        {current.mediaType === 'youtube' && current.youtubeUrl ? (
                          <iframe
                            src={current.youtubeUrl}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={current.title}
                          />
                        ) : (
                          <video
                            src={current.mediaUrl}
                            className="w-full h-full object-cover"
                            controls
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm truncate">{current.title}</p>
                        <p className="text-gray-500 text-xs line-clamp-2 mt-1">{current.description}</p>
                      </div>
                      <button
                        onClick={() => handleRemove(order)}
                        disabled={removingSlot === order}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {removingSlot === order ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        حذف الاختيار
                      </button>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2">
                      <Play className="w-8 h-8 text-gray-300" />
                      <span className="text-gray-400 text-sm">لم يتم الاختيار بعد</span>
                    </div>
                  )}

                  {/* Project selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">
                      {current ? 'تغيير الفيديو' : 'اختر مشروع'}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedProject[order] || ''}
                        onChange={e => setSelectedProject(prev => ({ ...prev, [order]: e.target.value }))}
                        className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">-- اختر مشروع --</option>
                        {videoProjects.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.mediaType === 'youtube' ? '[يوتيوب] ' : '[فيديو] '}
                            {p.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {videoProjects.length === 0 && (
                      <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                        لا توجد مشاريع عامة تحتوي على فيديو في المعرض حتى الآن.
                      </p>
                    )}

                    {selectedProject[order] && (
                      <SelectedPreview
                        project={videoProjects.find(p => p.id === selectedProject[order]) ?? null}
                      />
                    )}

                    <button
                      onClick={() => handleSave(order)}
                      disabled={!selectedProject[order] || savingSlot === order}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {savingSlot === order ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      حفظ الاختيار
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Available videos summary */}
      {!loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-500" />
            مشاريع المعرض المتاحة للاختيار ({videoProjects.length})
          </h2>
          {videoProjects.length === 0 ? (
            <p className="text-gray-500 text-sm">
              لا توجد مشاريع عامة تحتوي على فيديو. أضف مشاريع للمعرض وتأكد من تعيينها كـ"عامة".
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {videoProjects.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  {p.mediaType === 'youtube' ? (
                    <Youtube className="w-5 h-5 text-red-500 shrink-0" />
                  ) : (
                    <Video className="w-5 h-5 text-blue-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.title}</p>
                    <p className="text-xs text-gray-500 truncate">{p.school}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SelectedPreview: React.FC<{ project: GalleryProject | null }> = ({ project }) => {
  if (!project) return null;
  return (
    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
      {project.mediaType === 'youtube' ? (
        <Youtube className="w-4 h-4 text-red-500 shrink-0" />
      ) : (
        <Video className="w-4 h-4 text-blue-500 shrink-0" />
      )}
      <span className="text-xs text-gray-700 truncate">{project.title}</span>
    </div>
  );
};

export default ManageFeaturedVideos;
