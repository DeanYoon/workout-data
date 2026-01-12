'use client';

import { useState, useEffect } from 'react';
import { X, Moon, Sun, Monitor, Globe, Database, User, Info, LogOut, Mail } from 'lucide-react';
import { useSettingsStore, ThemeMode } from '@/app/stores/useSettingsStore';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useWorkoutHistoryStore } from '@/app/stores/useWorkoutHistoryStore';
import { useWorkoutAnalyticsStore } from '@/app/stores/useWorkoutAnalyticsStore';
import { useExerciseHistoryStore } from '@/app/stores/useExerciseHistoryStore';
import { useHomeDataStore } from '@/app/stores/useHomeDataStore';
import { useProfileStore } from '@/app/stores/useProfileStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, language, setTheme, setLanguage } = useSettingsStore();
  const [activeSection, setActiveSection] = useState<'main' | 'theme' | 'language' | 'data' | 'account' | 'info'>('main');
  const [userInfo, setUserInfo] = useState<{ id: string; email?: string; fullName?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && activeSection === 'account') {
      fetchUserInfo();
    }
  }, [isOpen, activeSection]);

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserInfo({
          id: session.user.id,
          email: session.user.email,
          fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
        });
      } else {
        setUserInfo({
          id: 'anon_user',
        });
        // Close modal when user signs out
        if (event === 'SIGNED_OUT') {
          onClose();
        }
      }
      if (activeSection === 'account') {
        fetchUserInfo();
      }
    });

    return () => subscription.unsubscribe();
  }, [activeSection, onClose]);

  const fetchUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserInfo({
          id: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name || user.user_metadata?.name,
        });
      } else {
        setUserInfo({
          id: 'anon_user',
        });
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUserInfo({
        id: 'anon_user',
      });
    }
  };

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/profile`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging in:', error);
      alert('로그인에 실패했습니다.');
    }
  };

  const clearWorkoutHistory = useWorkoutHistoryStore((state) => state.clearWorkoutHistory);
  const clearAnalytics = useWorkoutAnalyticsStore((state) => state.clearAnalytics);
  const clearExerciseCache = useExerciseHistoryStore((state) => state.clearCache);
  const clearHomeData = useHomeDataStore((state) => state.clearHomeData);
  const clearProfile = useProfileStore((state) => state.clearProfile);

  const handleLogout = async () => {
    try {
      // Clear all store data before logout
      clearWorkoutHistory();
      clearAnalytics();
      clearExerciseCache();
      clearHomeData();
      clearProfile();

      // Sign out from Supabase
      await supabase.auth.signOut();

      setUserInfo({ id: 'anon_user' });
      router.refresh();

      // Close the modal after logout
      onClose();
    } catch (error) {
      console.error('Error logging out:', error);
      alert('로그아웃에 실패했습니다.');
    }
  };

  if (!isOpen) return null;

  const themeOptions: { value: ThemeMode; label: string; icon: typeof Moon }[] = [
    { value: 'light', label: '라이트', icon: Sun },
    { value: 'dark', label: '다크', icon: Moon },
    { value: 'system', label: '시스템', icon: Monitor },
  ];

  const languageOptions: { value: 'ko' | 'en'; label: string }[] = [
    { value: 'ko', label: '한국어' },
    { value: 'en', label: 'English' },
  ];

  const renderMainMenu = () => (
    <div className="space-y-2">
      <button
        onClick={() => setActiveSection('theme')}
        className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-left"
      >
        <Moon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        <div className="flex-1">
          <div className="font-medium text-zinc-900 dark:text-zinc-100">다크모드</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {theme === 'light' ? '라이트' : theme === 'dark' ? '다크' : '시스템'}
          </div>
        </div>
      </button>

      <button
        onClick={() => setActiveSection('language')}
        className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-left"
      >
        <Globe className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        <div className="flex-1">
          <div className="font-medium text-zinc-900 dark:text-zinc-100">언어</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {language === 'ko' ? '한국어' : 'English'}
          </div>
        </div>
      </button>

      <button
        onClick={() => setActiveSection('data')}
        className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-left"
      >
        <Database className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        <div className="flex-1">
          <div className="font-medium text-zinc-900 dark:text-zinc-100">데이터 관리</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">데이터 내보내기 및 삭제</div>
        </div>
      </button>

      <button
        onClick={() => setActiveSection('account')}
        className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-left"
      >
        <User className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        <div className="flex-1">
          <div className="font-medium text-zinc-900 dark:text-zinc-100">계정</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">로그아웃 및 계정 관리</div>
        </div>
      </button>

      <button
        onClick={() => setActiveSection('info')}
        className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-left"
      >
        <Info className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        <div className="flex-1">
          <div className="font-medium text-zinc-900 dark:text-zinc-100">정보</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">앱 버전 및 정보</div>
        </div>
      </button>
    </div>
  );

  const renderThemeSettings = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setActiveSection('main')}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </button>
        <h2 className="text-lg font-semibold">다크모드</h2>
      </div>

      <div className="space-y-2">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-left ${theme === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{option.label}</span>
              {theme === option.value && (
                <div className="ml-auto w-2 h-2 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderLanguageSettings = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setActiveSection('main')}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </button>
        <h2 className="text-lg font-semibold">언어</h2>
      </div>

      <div className="space-y-2">
        {languageOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setLanguage(option.value)}
            className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors text-left ${language === option.value
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
              }`}
          >
            <span className="font-medium">{option.label}</span>
            {language === option.value && (
              <div className="w-2 h-2 rounded-full bg-white" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setActiveSection('main')}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </button>
        <h2 className="text-lg font-semibold">데이터 관리</h2>
      </div>
      <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
        데이터 관리 기능은 준비 중입니다.
      </div>
    </div>
  );

  const renderAccountSettings = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setActiveSection('main')}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </button>
        <h2 className="text-lg font-semibold">계정</h2>
      </div>

      <div className="space-y-4">
        {/* Full Name */}
        {userInfo?.fullName && (
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-4">
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              이름
            </div>
            <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {userInfo.fullName}
            </div>
          </div>
        )}

        {/* Email */}
        {userInfo?.email && (
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-4">
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              이메일
            </div>
            <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100 break-all">
              {userInfo.email}
            </div>
          </div>
        )}

        {/* Login Button for Anonymous Users */}
        {userInfo?.id === 'anon_user' && (
          <>
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-500/20"
            >
              <Mail className="h-5 w-5" />
              <span>Gmail로 로그인</span>
            </button>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4">
              <div className="text-sm text-blue-600 dark:text-blue-400">
                로그인하여 데이터를 안전하게 보관하세요.
              </div>
            </div>
          </>
        )}

        {/* Logout Button for Logged-in Users */}
        {userInfo?.id !== 'anon_user' && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium"
          >
            <LogOut className="h-5 w-5" />
            <span>로그아웃</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderInfoSettings = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setActiveSection('main')}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </button>
        <h2 className="text-lg font-semibold">정보</h2>
      </div>
      <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
        정보 섹션은 준비 중입니다.
      </div>
    </div>
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 "
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-[100] bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto ">
        <div className="p-4">
          {activeSection === 'main' && (
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">설정</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              </button>
            </div>
          )}

          {activeSection === 'main' && renderMainMenu()}
          {activeSection === 'theme' && renderThemeSettings()}
          {activeSection === 'language' && renderLanguageSettings()}
          {activeSection === 'data' && renderDataSettings()}
          {activeSection === 'account' && renderAccountSettings()}
          {activeSection === 'info' && renderInfoSettings()}
        </div>
      </div>
    </>
  );
}
