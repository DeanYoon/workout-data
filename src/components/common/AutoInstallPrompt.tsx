'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share, Plus, Check } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useTranslation } from 'react-i18next';

export function AutoInstallPrompt() {
  const { t } = useTranslation();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      return;
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if user has dismissed the prompt before (localStorage)
    const hasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (hasDismissed) {
      const dismissedTime = parseInt(hasDismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setDismissed(true);
        return;
      }
    }

    // Show prompt after a short delay (better UX)
    const timer = setTimeout(() => {
      if (isInstallable && !isInstalled && !dismissed) {
        setIsOpen(true);
      }
    }, 2000); // 2초 후 표시

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, dismissed]);

  const handleInstall = async () => {
    if (isIOS) {
      // iOS는 자동 설치 불가, 안내만 표시
      return;
    }

    const success = await promptInstall();
    if (success) {
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setDismissed(true);
  };

  if (isStandalone || !isOpen || dismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-4 pointer-events-none">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 pointer-events-auto animate-slide-up">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                <Download className="h-6 w-6 text-white dark:text-zinc-900" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {t('pwa.installTitle', '앱 설치하기')}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t('pwa.installSubtitle', '홈 화면에 추가하여 더 빠르게 접근하세요')}
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>

          {isIOS ? (
            /* iOS 설치 안내 */
            <div className="space-y-4">
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {t('pwa.iosInstructions', 'iOS에서 앱을 설치하는 방법:')}
                </p>
                <ol className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <span>
                      {t('pwa.iosStep1', 'Safari 브라우저 하단의 공유 버튼')}
                      <Share className="inline-block h-4 w-4 mx-1" />
                      {t('pwa.iosStep1End', '을 탭하세요')}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <span>
                      {t('pwa.iosStep2', '스크롤하여 "홈 화면에 추가"')}
                      <Plus className="inline-block h-4 w-4 mx-1" />
                      {t('pwa.iosStep2End', '옵션을 찾으세요')}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <span>
                      {t('pwa.iosStep3', '"추가" 버튼을 탭하여 설치를 완료하세요')}
                    </span>
                  </li>
                </ol>
              </div>
              <button
                onClick={handleDismiss}
                className="w-full py-3 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                {t('pwa.iosGotIt', '알겠습니다')}
              </button>
            </div>
          ) : (
            /* Android/Desktop 설치 */
            <div className="space-y-4">
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {t('pwa.installBenefits', '앱을 설치하면 오프라인에서도 사용할 수 있고, 더 빠른 성능을 경험할 수 있습니다.')}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  {t('common.later', '나중에')}
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {t('pwa.installNow', '지금 설치')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
