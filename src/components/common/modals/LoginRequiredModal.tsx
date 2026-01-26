'use client';

import { useTranslation } from 'react-i18next';
import { Mail, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function LoginRequiredModal({ isOpen, onClose, message }: LoginRequiredModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging in:', error);
      alert(t('settings.loginFailed'));
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[200]"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[201] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md mx-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {t('loginRequired.title')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>

          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            {message || t('loginRequired.message')}
          </p>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-colors font-medium"
          >
            <Mail className="h-5 w-5" />
            <span>{t('settings.signInGmail')}</span>
          </button>
        </div>
      </div>
    </>
  );
}
