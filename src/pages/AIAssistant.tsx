import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, 
  Send, 
  Mic, 
  Paperclip, 
  Lightbulb,
  BookOpen,
  Code,
  Calculator,
  Palette,
  Globe,
  Zap,
  MessageCircle,
  User,
  Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const assistantFeatures = [
  {
    icon: Lightbulb,
    titleKey: 'aiAssistant.features.projectIdeas.title',
    descriptionKey: 'aiAssistant.features.projectIdeas.description',
    color: 'from-yellow-400 to-orange-500'
  },
  {
    icon: Code,
    titleKey: 'aiAssistant.features.programming.title',
    descriptionKey: 'aiAssistant.features.programming.description',
    color: 'from-blue-500 to-purple-600'
  },
  {
    icon: Calculator,
    titleKey: 'aiAssistant.features.problemSolving.title',
    descriptionKey: 'aiAssistant.features.problemSolving.description',
    color: 'from-green-500 to-teal-600'
  },
  {
    icon: BookOpen,
    titleKey: 'aiAssistant.features.research.title',
    descriptionKey: 'aiAssistant.features.research.description',
    color: 'from-indigo-500 to-blue-600'
  },
  {
    icon: Palette,
    titleKey: 'aiAssistant.features.design.title',
    descriptionKey: 'aiAssistant.features.design.description',
    color: 'from-pink-500 to-rose-600'
  },
  {
    icon: Globe,
    titleKey: 'aiAssistant.features.languages.title',
    descriptionKey: 'aiAssistant.features.languages.description',
    color: 'from-purple-500 to-pink-600'
  }
];

const quickPrompts = [
  'aiAssistant.quickPrompts.aiProject',
  'aiAssistant.quickPrompts.programming',
  'aiAssistant.quickPrompts.mathProblem',
  'aiAssistant.quickPrompts.entrepreneurship',
  'aiAssistant.quickPrompts.presentation',
  'aiAssistant.quickPrompts.timeManagement'
];

const mockConversation = [
  {
    id: '1',
    type: 'user',
    message: 'aiAssistant.mockConversation.user1',
    timestamp: '2024-01-21T10:00:00Z'
  },
  {
    id: '2',
    type: 'assistant',
    message: 'aiAssistant.mockConversation.assistant1',
    timestamp: '2024-01-21T10:00:30Z'
  },
  {
    id: '3',
    type: 'user',
    message: 'aiAssistant.mockConversation.user2',
    timestamp: '2024-01-21T10:01:00Z'
  },
  {
    id: '4',
    type: 'assistant',
    message: 'aiAssistant.mockConversation.assistant2',
    timestamp: '2024-01-21T10:01:45Z'
  }
];

export const AIAssistant: React.FC = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState(mockConversation.map(msg => ({
    ...msg,
    message: t(msg.message)
  })));
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // تحذير: هذا المفتاح سيكون مرئياً في الواجهة الأمامية. لا يُنصح بهذا في بيئات الإنتاج!
  // استبدل YOUR_OPENAI_API_KEY بمفتاح API الفعلي الخاص بك
  const OPENAI_API_KEY = "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";

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      message: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsTyping(true); // لتظهر مؤشر الكتابة أثناء انتظار الاستجابة

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { 
              role: "system", 
              content: "أنت مساعد ذكي مفيد ومتخصص في مساعدة الطلاب والمعلمين في المشاريع التعليمية. تجيب باللغة العربية بطريقة واضحة ومفيدة." 
            },
            { role: "user", content: newMessage.message }
          ],
          max_tokens: 500,
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'فشل في الحصول على استجابة من OpenAI');
      }

      const data = await response.json();
      const aiResponseText = data.choices[0].message.content;

      const aiResponse = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        message: aiResponseText,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        message: "حدث خطأ في الاتصال بالمساعد الذكي: " + (error as any).message,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false); // إخفاء مؤشر الكتابة
    }
  };

  const handleQuickPrompt = (promptKey: string) => {
    setInputMessage(t(promptKey));
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('aiAssistant.title')}</h1>
            <p className="opacity-90">{t('aiAssistant.subtitle')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">24/7</div>
            <div className="text-sm opacity-80">{t('aiAssistant.stats.alwaysAvailable')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">∞</div>
            <div className="text-sm opacity-80">{t('aiAssistant.stats.unlimitedQuestions')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">6</div>
            <div className="text-sm opacity-80">{t('aiAssistant.stats.specializations')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">AI</div>
            <div className="text-sm opacity-80">{t('aiAssistant.stats.artificialIntelligence')}</div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Features Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-1 space-y-4"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              {t('aiAssistant.howCanIHelp')}
            </h3>
            <div className="space-y-3">
              {assistantFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group cursor-pointer"
                >
                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 group-hover:text-purple-600 transition-colors">
                        {t(feature.titleKey)}
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {t(feature.descriptionKey)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{t('aiAssistant.quickPrompts.title')}</h3>
            <div className="space-y-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="w-full text-right p-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors"
                >
                  {t(prompt)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Chat Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-3"
        >
          <div className="bg-white rounded-2xl shadow-lg h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{t('aiAssistant.chatHeader.title')}</h3>
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {t('aiAssistant.chatHeader.online')}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-blue-500' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={`rounded-2xl p-4 ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="whitespace-pre-line leading-relaxed">{message.message}</p>
                      <p className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-4">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <button className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={t('aiAssistant.inputPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <button className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                  <Mic className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim()}
                  className="p-3 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
              
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">
                  {t('aiAssistant.disclaimer')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-purple-600" />
          {t('aiAssistant.tips.title')}
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4">
            <h4 className="font-semibold text-gray-800 mb-2">{t('aiAssistant.tips.beSpecific.title')}</h4>
            <p className="text-gray-600 text-sm">{t('aiAssistant.tips.beSpecific.description')}</p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <h4 className="font-semibold text-gray-800 mb-2">{t('aiAssistant.tips.provideContext.title')}</h4>
            <p className="text-gray-600 text-sm">{t('aiAssistant.tips.provideContext.description')}</p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <h4 className="font-semibold text-gray-800 mb-2">{t('aiAssistant.tips.askForExamples.title')}</h4>
            <p className="text-gray-600 text-sm">{t('aiAssistant.tips.askForExamples.description')}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
