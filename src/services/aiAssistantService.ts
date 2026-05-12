import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AIAssistantConfig {
  id?: string;
  apiKey: string;
  serviceEnabled: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  dailyLimitPerUser: number;
  globalDailyLimit: number;
  systemPrompt: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface AIUsageLog {
  id?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  prompt: string;
  response: string;
  tokensUsed: number;
  model: string;
  timestamp: Date;
  costEstimate: number;
}

export interface AIUsageStats {
  totalRequests: number;
  totalTokensUsed: number;
  totalCostEstimate: number;
  activeUsers: number;
  todayRequests: number;
  todayTokens: number;
  todayCost: number;
}

const CONFIG_DOC_ID = 'main';
const CONFIG_COLLECTION = 'ai_assistant_config';
const USAGE_COLLECTION = 'ai_assistant_usage';

const DEFAULT_CONFIG: AIAssistantConfig = {
  apiKey: '',
  serviceEnabled: false,
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 500,
  dailyLimitPerUser: 50,
  globalDailyLimit: 1000,
  systemPrompt: 'أنت مساعد ذكي مفيد ومتخصص في مساعدة الطلاب والمعلمين في المشاريع التعليمية. تجيب باللغة العربية بطريقة واضحة ومفيدة.'
};

export const getAIConfig = async (): Promise<AIAssistantConfig> => {
  try {
    const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    const configSnap = await getDoc(configRef);

    if (configSnap.exists()) {
      const data = configSnap.data();
      return {
        id: configSnap.id,
        apiKey: data.apiKey || '',
        serviceEnabled: data.serviceEnabled ?? false,
        model: data.model || DEFAULT_CONFIG.model,
        temperature: data.temperature ?? DEFAULT_CONFIG.temperature,
        maxTokens: data.maxTokens || DEFAULT_CONFIG.maxTokens,
        dailyLimitPerUser: data.dailyLimitPerUser || DEFAULT_CONFIG.dailyLimitPerUser,
        globalDailyLimit: data.globalDailyLimit || DEFAULT_CONFIG.globalDailyLimit,
        systemPrompt: data.systemPrompt || DEFAULT_CONFIG.systemPrompt,
        updatedAt: data.updatedAt?.toDate(),
        updatedBy: data.updatedBy
      };
    }

    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Error fetching AI config:', error);
    return DEFAULT_CONFIG;
  }
};

export const updateAIConfig = async (
  config: Partial<AIAssistantConfig>,
  updatedBy: string
): Promise<void> => {
  try {
    const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);

    await setDoc(configRef, {
      ...config,
      updatedAt: serverTimestamp(),
      updatedBy
    }, { merge: true });

    console.log('AI config updated successfully');
  } catch (error) {
    console.error('Error updating AI config:', error);
    throw error;
  }
};

export const validateOpenAIKey = async (apiKey: string): Promise<boolean> => {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Error validating OpenAI key:', error);
    return false;
  }
};

export const logAIUsage = async (
  userId: string,
  userName: string,
  userEmail: string,
  prompt: string,
  response: string,
  tokensUsed: number,
  model: string
): Promise<void> => {
  try {
    const costPerToken = model.includes('gpt-4') ? 0.00003 : 0.0000015;
    const costEstimate = tokensUsed * costPerToken;

    await addDoc(collection(db, USAGE_COLLECTION), {
      userId,
      userName,
      userEmail,
      prompt: prompt.substring(0, 500),
      response: response.substring(0, 1000),
      tokensUsed,
      model,
      costEstimate,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging AI usage:', error);
  }
};

export const getUserDailyUsage = async (userId: string): Promise<number> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usageQuery = query(
      collection(db, USAGE_COLLECTION),
      where('userId', '==', userId),
      where('timestamp', '>=', Timestamp.fromDate(today))
    );

    const usageSnap = await getDocs(usageQuery);
    return usageSnap.size;
  } catch (error) {
    console.error('Error getting user daily usage:', error);
    return 0;
  }
};

export const getGlobalDailyUsage = async (): Promise<number> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usageQuery = query(
      collection(db, USAGE_COLLECTION),
      where('timestamp', '>=', Timestamp.fromDate(today))
    );

    const usageSnap = await getDocs(usageQuery);
    return usageSnap.size;
  } catch (error) {
    console.error('Error getting global daily usage:', error);
    return 0;
  }
};

export const getAIUsageStats = async (): Promise<AIUsageStats> => {
  try {
    const usageRef = collection(db, USAGE_COLLECTION);
    const allUsageSnap = await getDocs(usageRef);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalRequests = 0;
    let totalTokensUsed = 0;
    let totalCostEstimate = 0;
    let todayRequests = 0;
    let todayTokens = 0;
    let todayCost = 0;
    const uniqueUsers = new Set<string>();

    allUsageSnap.forEach(doc => {
      const data = doc.data();
      totalRequests++;
      totalTokensUsed += data.tokensUsed || 0;
      totalCostEstimate += data.costEstimate || 0;
      uniqueUsers.add(data.userId);

      const timestamp = data.timestamp?.toDate();
      if (timestamp && timestamp >= today) {
        todayRequests++;
        todayTokens += data.tokensUsed || 0;
        todayCost += data.costEstimate || 0;
      }
    });

    return {
      totalRequests,
      totalTokensUsed,
      totalCostEstimate,
      activeUsers: uniqueUsers.size,
      todayRequests,
      todayTokens,
      todayCost
    };
  } catch (error) {
    console.error('Error getting AI usage stats:', error);
    return {
      totalRequests: 0,
      totalTokensUsed: 0,
      totalCostEstimate: 0,
      activeUsers: 0,
      todayRequests: 0,
      todayTokens: 0,
      todayCost: 0
    };
  }
};

export const getRecentAIUsage = async (limitCount: number = 50): Promise<AIUsageLog[]> => {
  try {
    const usageQuery = query(
      collection(db, USAGE_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const usageSnap = await getDocs(usageQuery);

    return usageSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        prompt: data.prompt,
        response: data.response,
        tokensUsed: data.tokensUsed,
        model: data.model,
        costEstimate: data.costEstimate,
        timestamp: data.timestamp?.toDate() || new Date()
      };
    });
  } catch (error) {
    console.error('Error getting recent AI usage:', error);
    return [];
  }
};

export const getAIUsageByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<AIUsageLog[]> => {
  try {
    const usageQuery = query(
      collection(db, USAGE_COLLECTION),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate)),
      orderBy('timestamp', 'desc')
    );

    const usageSnap = await getDocs(usageQuery);

    return usageSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        prompt: data.prompt,
        response: data.response,
        tokensUsed: data.tokensUsed,
        model: data.model,
        costEstimate: data.costEstimate,
        timestamp: data.timestamp?.toDate() || new Date()
      };
    });
  } catch (error) {
    console.error('Error getting AI usage by date range:', error);
    return [];
  }
};
