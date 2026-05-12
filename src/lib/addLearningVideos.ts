import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Sample educational videos data
const educationalVideos = [
  {
    title: "كيف تجد فكرة لمشروعك؟",
    description: "دليل شامل لاكتشاف وتطوير أفكار مشاريع مبتكرة وقابلة للتنفيذ. يتناول الفيديو طرق العصف الذهني، تحليل المشكلات، ودراسة احتياجات المستخدمين.",
    type: "video",
    category: "project-management",
    author: "د. محمد العتيبي",
    duration: "15 دقيقة",
    difficulty: "beginner",
    thumbnail: "https://images.pexels.com/photos/7376/startup-photos.jpg?auto=compress&cs=tinysrgb&w=600",
    contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    watchUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tags: ["أفكار المشاريع", "الإبداع", "حل المشكلات", "العصف الذهني"],
    featured: true
  },
  {
    title: "كيف تصمم مشروعك؟",
    description: "خطوات عملية لتصميم مشروعك بطريقة احترافية. يشرح الفيديو مراحل التصميم من الفكرة الأولية إلى النموذج الأولي، مع التركيز على تجربة المستخدم والجوانب الفنية.",
    type: "video",
    category: "design",
    author: "م. سارة الشمري",
    duration: "20 دقيقة",
    difficulty: "intermediate",
    thumbnail: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=600",
    contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    watchUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tags: ["تصميم المشاريع", "نماذج أولية", "تجربة المستخدم", "التصميم التفاعلي"],
    featured: true
  },
  {
    title: "كيف توفر المواد والأدوات لمشروعك؟",
    description: "استراتيجيات فعالة للحصول على المواد والأدوات اللازمة لمشروعك بأقل تكلفة وأعلى جودة. يتضمن الفيديو نصائح للشراء، البدائل المناسبة، وطرق إعادة التدوير.",
    type: "video",
    category: "project-management",
    author: "أ. خالد السعيد",
    duration: "18 دقيقة",
    difficulty: "beginner",
    thumbnail: "https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=600",
    contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    watchUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tags: ["المواد والأدوات", "الميزانية", "التوريد", "إدارة الموارد"],
    featured: false
  },
  {
    title: "كيف تنفذ مشروعك؟",
    description: "دليل خطوة بخطوة لتنفيذ المشروع من البداية إلى النهاية. يغطي الفيديو جدولة المهام، تقسيم العمل، التغلب على التحديات، وضمان جودة التنفيذ.",
    type: "video",
    category: "project-management",
    author: "د. فاطمة الزهراني",
    duration: "25 دقيقة",
    difficulty: "intermediate",
    thumbnail: "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=600",
    contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    watchUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tags: ["تنفيذ المشاريع", "إدارة المهام", "حل المشكلات", "ضمان الجودة"],
    featured: false
  },
  {
    title: "كيف تصمم فيديو قصير لمشروعك؟",
    description: "أساسيات إنتاج فيديو احترافي لعرض مشروعك. يشرح الفيديو تقنيات التصوير البسيطة، المونتاج، إضافة المؤثرات والصوت، وأفضل الممارسات لجذب المشاهدين.",
    type: "video",
    category: "design",
    author: "أ. عمر الحربي",
    duration: "22 دقيقة",
    difficulty: "intermediate",
    thumbnail: "https://images.pexels.com/photos/2510428/pexels-photo-2510428.jpeg?auto=compress&cs=tinysrgb&w=600",
    contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    watchUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tags: ["تصميم فيديو", "مونتاج", "تسويق المشاريع", "العرض المرئي"],
    featured: false
  },
  {
    title: "كيف تعرض مشروعك؟",
    description: "مهارات وتقنيات عرض المشاريع بطريقة مقنعة وجذابة. يتناول الفيديو إعداد العروض التقديمية، لغة الجسد، الإجابة على الأسئلة، والتعامل مع الجمهور.",
    type: "video",
    category: "soft-skills",
    author: "د. نورة القحطاني",
    duration: "20 دقيقة",
    difficulty: "intermediate",
    thumbnail: "https://images.pexels.com/photos/7439141/pexels-photo-7439141.jpeg?auto=compress&cs=tinysrgb&w=600",
    contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    watchUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tags: ["مهارات العرض", "التحدث أمام الجمهور", "العروض التقديمية", "الإقناع"],
    featured: false
  },
  {
    title: "ما هي إدارة المشاريع؟",
    description: "مقدمة شاملة لمفهوم إدارة المشاريع وأهميتها. يستعرض الفيديو المبادئ الأساسية، المنهجيات المختلفة، والمهارات اللازمة لإدارة المشاريع بنجاح.",
    type: "video",
    category: "project-management",
    author: "د. أحمد العمري",
    duration: "15 دقيقة",
    difficulty: "beginner",
    thumbnail: "https://images.pexels.com/photos/1181345/pexels-photo-1181345.jpeg?auto=compress&cs=tinysrgb&w=600",
    contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    watchUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tags: ["إدارة المشاريع", "التخطيط", "القيادة", "تنظيم العمل"],
    featured: true
  },
  {
    title: "ما هو التعلم القائم على المشاريع؟",
    description: "شرح مفصل لمنهجية التعلم القائم على المشاريع وفوائدها التعليمية. يوضح الفيديو كيفية تطبيق هذه المنهجية، أمثلة ناجحة، وتأثيرها على تطوير مهارات الطلاب.",
    type: "video",
    category: "education",
    author: "د. هدى المالكي",
    duration: "18 دقيقة",
    difficulty: "beginner",
    thumbnail: "https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=600",
    contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    watchUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tags: ["التعلم بالمشاريع", "طرق التدريس", "تطوير المهارات", "التعليم الحديث"],
    featured: false
  },
  {
    title: "ما هي برامج ستيم؟",
    description: "تعريف شامل ببرامج ستيم (العلوم، التكنولوجيا، الهندسة، الرياضيات) وأهميتها في التعليم المعاصر. يستعرض الفيديو مكونات ستيم، تطبيقاتها، وتأثيرها على مستقبل التعليم والعمل.",
    type: "video",
    category: "stem",
    author: "د. محمد الشهري",
    duration: "17 دقيقة",
    difficulty: "beginner",
    thumbnail: "https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=600",
    contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    watchUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tags: ["ستيم", "العلوم والتكنولوجيا", "التعليم المتكامل", "المهارات المستقبلية"],
    featured: true
  },
  {
    title: "كيف أحمي فكرة مشروعي؟",
    description: "دليل عملي لحماية الملكية الفكرية لمشروعك. يتناول الفيديو أنواع حقوق الملكية الفكرية، خطوات التسجيل، وأفضل الممارسات لحماية أفكارك ومنتجاتك.",
    type: "video",
    category: "intellectual-property",
    author: "أ. سلطان الغامدي",
    duration: "23 دقيقة",
    difficulty: "intermediate",
    thumbnail: "https://images.pexels.com/photos/5668473/pexels-photo-5668473.jpeg?auto=compress&cs=tinysrgb&w=600",
    contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    watchUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tags: ["الملكية الفكرية", "براءات الاختراع", "حقوق النشر", "حماية الأفكار"],
    featured: false
  }
];

/**
 * Adds educational videos to the Firestore database
 */
export const addLearningVideosToDatabase = async () => {
  try {
    console.log('Starting to add educational videos to database...');

    // Skip in production or if not in development mode
    if (!import.meta.env.DEV) {
      console.log('Skipping adding educational videos in production');
      return false;
    }
    
    // Check if videos already exist to avoid duplicates
    const resourcesRef = collection(db, 'learning_resources');
    const q = query(resourcesRef, where('type', '==', 'video'));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      console.log(`Found ${snapshot.size} existing videos. Skipping addition.`);
      return false;
    }
    
    // Add each video to the database
    for (const video of educationalVideos) {
      await addDoc(collection(db, 'learning_resources'), {
        ...video,
        views_count: 0,
        likes_count: 0,
        content_url: video.watchUrl, // Use watchUrl for content_url
        watch_url: video.watchUrl,
        embed_url: video.embedUrl,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    }
    
    console.log(`Successfully added ${educationalVideos.length} educational videos to the database!`);
    return true;
  } catch (error: any) {
    // Log the error but don't crash the app
    console.warn('Error adding educational videos:', error.message);
    console.log('This is expected in production or without admin rights and can be safely ignored.');
    return false;
  }
};