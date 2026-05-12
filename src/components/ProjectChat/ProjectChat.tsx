import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Video, 
  File, 
  X, 
  User,
  Bot,
  Users,
  MoreVertical,
  Edit as EditIcon,
  Trash2,
  Check,
  Eye,
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, firestoreDoc, addProjectResource } from '../../lib/firebase';

interface ChatMessage {
  id: string;
  project_id: string;
  user_id: string;
  message: string;
  message_type: 'text' | 'image' | 'video' | 'file';
  media_url?: string;
  reply_to?: string;
  created_at: Date;
  updated_at?: Date;
  seen_by?: string[];
  user?: {
    name: string;
    avatar_url?: string;
    role?: string;
  };
}

interface ProjectChatProps {
  projectId: string;
}

export const ProjectChat: React.FC<ProjectChatProps> = ({ projectId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showSeenBy, setShowSeenBy] = useState<string | null>(null);
  const [seenByUsers, setSeenByUsers] = useState<any[]>([]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for messages
  useEffect(() => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);

    const messagesRef = collection(db, 'chat_messages');
    // Use a simpler query that only filters by project_id to avoid index requirements
    const q = query(
      messagesRef,
      where('project_id', '==', projectId)
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const messagesData: ChatMessage[] = [];
        
        for (const doc of snapshot.docs) {
          const data = doc.data();
          
          // Get user info - FIXED: Use direct document reference instead of query
          let userInfo = undefined;
          try {
            if (data.user_id) {
              const userDocRef = firestoreDoc(db, 'users', data.user_id);
              const userDoc = await getDoc(userDocRef);
              
              if (userDoc.exists()) {
                const userData = userDoc.data();
                userInfo = {
                  name: userData.name || 'مستخدم غير معروف',
                  avatar_url: userData.avatar_url,
                  role: userData.role
                };
              }
            }
          } catch (err) {
            console.error('Error fetching user info:', err);
          }
          
          messagesData.push({
            id: doc.id,
            project_id: data.project_id,
            user_id: data.user_id,
            message: data.message,
            message_type: data.message_type || 'text',
            media_url: data.media_url,
            reply_to: data.reply_to,
            created_at: data.created_at?.toDate() || new Date(),
            updated_at: data.updated_at?.toDate(),
            seen_by: data.seen_by || [],
            user: userInfo
          });
        }
        
        // Sort messages by created_at on the client side
        messagesData.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
        
        setMessages(messagesData);
        setIsLoading(false);

        // Mark messages as seen
        if (user && messagesData.length > 0) {
          const lastMessage = messagesData[messagesData.length - 1];
          if (lastMessage.user_id !== user.id) {
            markMessageAsSeen(lastMessage.id);
          }
        }
      },
      (err) => {
        console.error('Error fetching messages:', err);
        setError('حدث خطأ في تحميل الرسائل');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId, user]);

  const handleSendMessage = async () => {
    if (!user || !projectId) return;
    if (!newMessage.trim() && !selectedFile) return;

    setIsSending(true);
    setError(null);

    try {
      let mediaUrl = '';
      let messageType: 'text' | 'image' | 'video' | 'file' = 'text';

      // If there's a file, upload it first
      if (selectedFile) {
        setIsUploading(true);
        
        // Determine file type
        if (selectedFile.type.startsWith('image/')) {
          messageType = 'image';
        } else if (selectedFile.type.startsWith('video/')) {
          messageType = 'video';
        } else {
          messageType = 'file';
        }
        
        // Create storage reference
        const storageRef = ref(storage, `project_chats/${projectId}/${Date.now()}_${selectedFile.name}`);
        
        // Upload file
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);
        
        // Listen for upload progress
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error('Error uploading file:', error);
            setError('حدث خطأ في رفع الملف');
            setIsUploading(false);
          },
          async () => {
            // Upload completed successfully, get download URL
            mediaUrl = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Add resource to project document
            const resourceData = {
              name: selectedFile.name,
              url: mediaUrl,
              type: messageType, // 'image', 'video', or 'file'
              uploadedBy: user?.name || 'مستخدم',
             uploadedAt: new Date(),
            };
            console.log("Adding resource to project:", projectId, resourceData);
            await addProjectResource(projectId, resourceData);
            console.log("Resource successfully added to project document.");
            
            // Now send the message with the file URL
            await addDoc(collection(db, 'chat_messages'), {
              project_id: projectId,
              user_id: user.id,
              message: newMessage.trim() || `تم إرسال ${messageType === 'image' ? 'صورة' : messageType === 'video' ? 'فيديو' : 'ملف'}`,
              message_type: messageType,
              media_url: mediaUrl,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp(),
              seen_by: [user.id]
            });
            
            setNewMessage('');
            setSelectedFile(null);
            setUploadProgress(0);
            setIsUploading(false);
            setIsSending(false);
          }
        );
      } else {
        // Just send a text message
        await addDoc(collection(db, 'chat_messages'), {
          project_id: projectId,
          user_id: user.id,
          message: newMessage.trim(),
          message_type: 'text',
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          seen_by: [user.id]
        });
        
        setNewMessage('');
        setIsSending(false);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('حدث خطأ في إرسال الرسالة');
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditMessage = (messageId: string, currentContent: string) => {
    setEditingMessage(messageId);
    setEditedContent(currentContent);
  };

  const saveEditedMessage = async (messageId: string) => {
    if (!editedContent.trim()) return;
    
    try {
      const messageRef = firestoreDoc(db, 'chat_messages', messageId);
      await updateDoc(messageRef, {
        message: editedContent,
        updated_at: serverTimestamp()
      });
      
      setEditingMessage(null);
      setEditedContent('');
    } catch (err) {
      console.error('Error updating message:', err);
      setError('حدث خطأ في تحديث الرسالة');
    }
  };

  const cancelEditMessage = () => {
    setEditingMessage(null);
    setEditedContent('');
  };

  const confirmDeleteMessage = (messageId: string) => {
    setShowDeleteConfirm(messageId);
  };

  const deleteMessage = async (messageId: string) => {
    try {
      // Find the message to get its media_url if it has one
      const messageToDelete = messages.find(m => m.id === messageId);
      
      // Delete the message document from Firestore
      const messageRef = firestoreDoc(db, 'chat_messages', messageId);
      await deleteDoc(messageRef);
      
      // If the message had a media file, delete it from Storage
      if (messageToDelete?.media_url) {
        try {
          // Extract the path from the URL
          const url = new URL(messageToDelete.media_url);
          const pathWithQuery = url.pathname;
          const path = pathWithQuery.split('?')[0]; // Remove query parameters
          
          // The path should be something like /v0/b/bucket-name.appspot.com/o/path%2Fto%2Ffile.jpg
          // We need to extract the actual file path and decode it
          const match = path.match(/\/o\/(.+)$/);
          if (match && match[1]) {
            const decodedPath = decodeURIComponent(match[1]);
            const storageRef = ref(storage, decodedPath);
            await deleteObject(storageRef);
          }
        } catch (storageErr) {
          console.error('Error deleting file from storage:', storageErr);
          // Continue with the function even if file deletion fails
        }
      }
      
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('حدث خطأ في حذف الرسالة');
    }
  };

  const cancelDeleteMessage = () => {
    setShowDeleteConfirm(null);
  };

  const markMessageAsSeen = async (messageId: string) => {
    if (!user) return;
    
    try {
      const messageRef = firestoreDoc(db, 'chat_messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const messageData = messageDoc.data();
        const seenBy = messageData.seen_by || [];
        
        // Only update if the user hasn't already seen the message
        if (!seenBy.includes(user.id)) {
          await updateDoc(messageRef, {
            seen_by: [...seenBy, user.id]
          });
        }
      }
    } catch (err) {
      console.error('Error marking message as seen:', err);
    }
  };

  const showMessageSeenBy = async (messageId: string) => {
    try {
      const messageRef = firestoreDoc(db, 'chat_messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const messageData = messageDoc.data();
        const seenBy = messageData.seen_by || [];
        
        // Fetch user details for each user ID in seenBy
        const users = [];
        for (const userId of seenBy) {
          const userRef = firestoreDoc(db, 'users', userId);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            users.push({
              id: userId,
              name: userData.name || 'مستخدم غير معروف',
              avatar_url: userData.avatar_url,
              role: userData.role
            });
          }
        }
        
        setSeenByUsers(users);
        setShowSeenBy(messageId);
      }
    } catch (err) {
      console.error('Error fetching seen by users:', err);
    }
  };

  const hideMessageSeenBy = () => {
    setShowSeenBy(null);
    setSeenByUsers([]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      calendar: 'gregory'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory'
    });
  };

  // Group messages by date
  const groupedMessages: { [date: string]: ChatMessage[] } = {};
  messages.forEach(message => {
    const dateStr = formatDate(message.created_at);
    if (!groupedMessages[dateStr]) {
      groupedMessages[dateStr] = [];
    }
    groupedMessages[dateStr].push(message);
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          محادثة الفريق
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500">
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Bot className="w-12 h-12 text-gray-300 mb-2" />
            <p>لا توجد رسائل بعد</p>
            <p className="text-sm">ابدأ المحادثة مع فريق المشروع</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                <div className="flex justify-center mb-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {date}
                  </span>
                </div>
                <div className="space-y-4">
                  {dateMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[80%] ${message.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {message.user?.avatar_url ? (
                            <img 
                              src={message.user.avatar_url} 
                              alt={message.user.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className={`w-full h-full ${
                              message.user_id === user?.id 
                                ? 'bg-blue-500' 
                                : 'bg-gradient-to-r from-purple-500 to-pink-500'
                            } flex items-center justify-center`}>
                              <User className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="relative group">
                          <div className={`rounded-2xl p-4 ${
                            message.user_id === user?.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {/* User name */}
                            {message.user_id !== user?.id && (
                              <p className="font-medium text-sm mb-1">
                                {message.user?.name || 'مستخدم غير معروف'}
                              </p>
                            )}
                            
                            {/* Message content */}
                            {editingMessage === message.id ? (
                              <div className="mb-2">
                                <textarea
                                  value={editedContent}
                                  onChange={(e) => setEditedContent(e.target.value)}
                                  className={`w-full p-2 rounded border ${
                                    message.user_id === user?.id
                                      ? 'bg-blue-50 text-gray-800 border-blue-300'
                                      : 'bg-white border-gray-300'
                                  }`}
                                  rows={2}
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                  <button
                                    onClick={() => saveEditedMessage(message.id)}
                                    className="p-1 bg-green-500 text-white rounded"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={cancelEditMessage}
                                    className="p-1 bg-gray-500 text-white rounded"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {message.message_type === 'text' && (
                                  <p className="whitespace-pre-line">{message.message}</p>
                                )}
                                
                                {message.message_type === 'image' && message.media_url && (
                                  <div className="mb-2">
                                    <img 
                                      src={message.media_url} 
                                      alt="صورة" 
                                      className="rounded-lg max-w-full max-h-60 object-contain"
                                    />
                                    {message.message && <p className="mt-2">{message.message}</p>}
                                  </div>
                                )}
                                
                                {message.message_type === 'video' && message.media_url && (
                                  <div className="mb-2">
                                    <video 
                                      src={message.media_url} 
                                      controls 
                                      className="rounded-lg max-w-full max-h-60"
                                    />
                                    {message.message && <p className="mt-2">{message.message}</p>}
                                  </div>
                                )}
                                
                                {message.message_type === 'file' && message.media_url && (
                                  <div className="mb-2">
                                    <a 
                                      href={message.media_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 bg-white bg-opacity-20 p-2 rounded-lg"
                                    >
                                      <File className="w-4 h-4" />
                                      <span className="truncate">تحميل الملف</span>
                                    </a>
                                    {message.message && <p className="mt-2">{message.message}</p>}
                                  </div>
                                )}
                              </>
                            )}
                            
                            {/* Message timestamp and edit indicator */}
                            <div className={`flex items-center justify-between text-xs mt-2 ${
                              message.user_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              <span>
                                {formatTime(message.created_at)}
                                {message.updated_at && ' (معدل)'}
                              </span>
                              
                              {/* Seen indicator */}
                              {message.user_id === user?.id && message.seen_by && message.seen_by.length > 1 && (
                                <button 
                                  onClick={() => showMessageSeenBy(message.id)}
                                  className="flex items-center gap-1 hover:underline"
                                >
                                  <Eye className="w-3 h-3" />
                                  {message.seen_by.length - 1}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Message actions */}
                          {message.user_id === user?.id && (
                            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="relative">
                                <button 
                                  className={`p-1 rounded-full ${
                                    message.user_id === user?.id
                                      ? 'bg-blue-400 hover:bg-blue-600'
                                      : 'bg-gray-200 hover:bg-gray-300'
                                  } text-white`}
                                >
                                  <MoreVertical className="w-3 h-3" />
                                </button>
                                
                                <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 hidden group-hover:block">
                                  <button 
                                    onClick={() => handleEditMessage(message.id, message.message)}
                                    className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 w-full text-right text-sm text-gray-700"
                                  >
                                    <EditIcon className="w-3 h-3" />
                                    تعديل
                                  </button>
                                  <button 
                                    onClick={() => confirmDeleteMessage(message.id)}
                                    className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 w-full text-right text-sm text-red-600"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    حذف
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد من حذف هذه الرسالة؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteMessage}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => deleteMessage(showDeleteConfirm)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seen By Modal */}
      {showSeenBy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">شاهد الرسالة</h3>
              <button
                onClick={hideMessageSeenBy}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {seenByUsers.length > 0 ? (
                <div className="space-y-3">
                  {seenByUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.role || 'مستخدم'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">لم يشاهد أحد هذه الرسالة بعد</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="px-4 py-2 border-t border-gray-200">
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
            <div className="flex items-center gap-2">
              {selectedFile.type.startsWith('image/') ? (
                <ImageIcon className="w-4 h-4 text-blue-500" />
              ) : selectedFile.type.startsWith('video/') ? (
                <Video className="w-4 h-4 text-purple-500" />
              ) : (
                <File className="w-4 h-4 text-gray-500" />
              )}
              <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
              {isUploading && (
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
            <button 
              onClick={handleRemoveFile}
              className="p-1 hover:bg-gray-200 rounded-full"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isSending}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <Paperclip className="w-5 h-5 text-gray-500" />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="اكتب رسالتك هنا..."
              disabled={isUploading || isSending}
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && !selectedFile) || isUploading || isSending}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:bg-gray-300"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};