const MOCK_VIDEO_IDS = [
  'dQw4w9WgXcQ',
  'VIDEO_ID_PLACEHOLDER',
  'SAMPLE_VIDEO_ID',
  'TEST_VIDEO_ID',
  'DEMO_VIDEO_ID'
];

const MOCK_KEYWORDS = [
  'example.com',
  'placeholder',
  'sample',
  'test',
  'demo',
  'mock'
];

export const isMockVideoUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;

  const lowerUrl = url.toLowerCase();

  if (MOCK_VIDEO_IDS.some(id => lowerUrl.includes(id.toLowerCase()))) {
    return true;
  }

  if (MOCK_KEYWORDS.some(keyword => lowerUrl.includes(keyword))) {
    return true;
  }

  return false;
};

export const isValidYouTubeUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    if (!hostname.includes('youtube.com') && !hostname.includes('youtu.be')) {
      return false;
    }

    if (url.includes('watch')) {
      const videoId = urlObj.searchParams.get('v');
      return videoId !== null && videoId.length > 0;
    }

    if (url.includes('embed')) {
      const pathParts = urlObj.pathname.split('/');
      const videoId = pathParts[pathParts.length - 1];
      return videoId !== null && videoId.length > 0;
    }

    if (hostname.includes('youtu.be')) {
      const videoId = urlObj.pathname.slice(1);
      return videoId !== null && videoId.length > 0;
    }

    return true;
  } catch (error) {
    return false;
  }
};

export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;

  try {
    const urlObj = new URL(url);

    if (url.includes('watch')) {
      return urlObj.searchParams.get('v');
    }

    if (url.includes('embed')) {
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1] || null;
    }

    if (urlObj.hostname.includes('youtu.be')) {
      return urlObj.pathname.slice(1) || null;
    }

    return null;
  } catch (error) {
    return null;
  }
};

export const validateVideoUrls = (videoUrl: string | null | undefined): {
  isValid: boolean;
  isMock: boolean;
  error?: string;
} => {
  if (!videoUrl) {
    return {
      isValid: false,
      isMock: false,
      error: 'رابط الفيديو مطلوب'
    };
  }

  if (isMockVideoUrl(videoUrl)) {
    return {
      isValid: false,
      isMock: true,
      error: 'هذا رابط وهمي، الرجاء إدخال رابط فيديو حقيقي'
    };
  }

  if (!isValidYouTubeUrl(videoUrl)) {
    return {
      isValid: false,
      isMock: false,
      error: 'رابط YouTube غير صالح'
    };
  }

  return {
    isValid: true,
    isMock: false
  };
};

export interface VideoUrls {
  videoUrl: string;
  watchUrl: string;
  embedUrl: string;
  contentUrl: string;
}

export const generateAllVideoUrls = (inputUrl: string): VideoUrls | null => {
  if (!inputUrl) return null;

  const videoId = extractYouTubeVideoId(inputUrl);
  if (!videoId) return null;

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return {
    videoUrl: watchUrl,
    watchUrl: watchUrl,
    embedUrl: embedUrl,
    contentUrl: watchUrl
  };
};
