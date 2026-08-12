import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, ExternalLink, Loader as Loader2, CircleAlert as AlertCircle } from 'lucide-react';
import { initiateKfupmSso } from '../../lib/kfupmSso';

interface KfupmLoginButtonProps {
  returnUrl?: string;
  className?: string;
}

export const KfupmLoginButton: React.FC<KfupmLoginButtonProps> = ({
  returnUrl,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setIsLoading(true);
      setError(null);
      await initiateKfupmSso(returnUrl);
    } catch (err) {
      console.error('[KfupmLoginButton] Login failed:', err);
      setError('فشل في بدء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <motion.button
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        onClick={handleLogin}
        disabled={isLoading}
        className={`w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>جاري التحويل...</span>
          </>
        ) : (
          <>
            <GraduationCap className="w-5 h-5" />
            <span>تسجيل الدخول بحساب جامعة الملك فهد</span>
            <ExternalLink className="w-4 h-4" />
          </>
        )}
      </motion.button>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </motion.div>
      )}
    </div>
  );
};
