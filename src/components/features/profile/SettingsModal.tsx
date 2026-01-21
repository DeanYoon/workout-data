'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Moon, Sun, Monitor, Globe, Database, User, Info, LogOut, Mail, ChevronRight, Trash2 } from 'lucide-react';
import {
    useSettingsStore,
    useWorkoutHistoryStore,
    useWorkoutAnalyticsStore,
    useExerciseHistoryStore,
    useHomeDataStore,
    useProfileStore,
    useUserStore,
    type ThemeMode,
} from '@/stores';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { getWorkoutsWithDetails, deleteWorkout } from '@/services';
import { WorkoutWithDetails } from '@/types/workout';
import { formatDate, formatDuration } from '@/utils';
import { DeleteConfirmModal } from '@/components';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { t } = useTranslation();
    const { theme, language, setTheme, setLanguage } = useSettingsStore();
    const [activeSection, setActiveSection] = useState<'main' | 'theme' | 'language' | 'data' | 'account' | 'info'>('main');
    const [userInfo, setUserInfo] = useState<{ id: string; email?: string; fullName?: string } | null>(null);
    const router = useRouter();

    // Data management state
    const [workouts, setWorkouts] = useState<WorkoutWithDetails[]>([]);
    const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false);
    const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const refreshWorkoutHistory = useWorkoutHistoryStore((state) => state.refreshWorkoutHistory);

    useEffect(() => {
        if (isOpen && activeSection === 'account') {
            fetchUserInfo();
        }
        if (isOpen && activeSection === 'data') {
            fetchAllWorkouts();
        }
    }, [isOpen, activeSection]);

    const fetchAllWorkouts = async () => {
        setIsLoadingWorkouts(true);
        try {
            const userId = await useUserStore.getState().getUserId();
            const data = await getWorkoutsWithDetails(userId);
            setWorkouts(data);
        } catch (error) {
            console.error('Error fetching workouts:', error);
        } finally {
            setIsLoadingWorkouts(false);
        }
    };

    const handleDeleteWorkout = async () => {
        if (!deleteTarget) return;
        try {
            await deleteWorkout(deleteTarget.id);
            setWorkouts((prev) => prev.filter((w) => w.id !== deleteTarget.id));
            setDeleteTarget(null);
            refreshWorkoutHistory();
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('workoutDeleted'));
            }
        } catch (error) {
            console.error('Error deleting workout:', error);
            alert(t('settings.deleteFailed'));
        }
    };

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
                setUserInfo({ id: 'anon_user' });
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
            setUserInfo({ id: 'anon_user' });
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
            alert(t('settings.loginFailed'));
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
            alert(t('settings.logoutFailed'));
        }
    };

    if (!isOpen) return null;

    const themeOptions: { value: ThemeMode; label: string; icon: typeof Moon }[] = [
        { value: 'light', label: t('settings.light'), icon: Sun },
        { value: 'dark', label: t('settings.dark'), icon: Moon },
        { value: 'system', label: t('settings.system'), icon: Monitor },
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
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{t('settings.darkMode')}</div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {theme === 'light' ? t('settings.light') : theme === 'dark' ? t('settings.dark') : t('settings.system')}
                    </div>
                </div>
            </button>

            <button
                onClick={() => setActiveSection('language')}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-left"
            >
                <Globe className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                <div className="flex-1">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{t('settings.language')}</div>
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
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{t('settings.dataManagement')}</div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">{t('settings.dataManagementDesc')}</div>
                </div>
            </button>

            <button
                onClick={() => setActiveSection('account')}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-left"
            >
                <User className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                <div className="flex-1">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{t('settings.account')}</div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">{t('settings.accountDesc')}</div>
                </div>
            </button>

            <button
                onClick={() => setActiveSection('info')}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-left"
            >
                <Info className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                <div className="flex-1">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{t('settings.info')}</div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">{t('settings.infoDesc')}</div>
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
                <h2 className="text-lg font-semibold">{t('settings.darkMode')}</h2>
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
                <h2 className="text-lg font-semibold">{t('settings.language')}</h2>
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
                    onClick={() => {
                        setActiveSection('main');
                        setExpandedWorkoutId(null);
                    }}
                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <X className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                </button>
                <h2 className="text-lg font-semibold">{t('settings.dataManagement')}</h2>
                <span className="ml-auto text-sm text-zinc-500">{t('settings.count', { n: workouts.length })}</span>
            </div>

            {isLoadingWorkouts ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : workouts.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                    {t('settings.noWorkouts')}
                </div>
            ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {workouts.map((workout) => (
                        <div key={workout.id} className="rounded-xl bg-zinc-50 dark:bg-zinc-800 overflow-hidden">
                            <button
                                onClick={() => setExpandedWorkoutId(expandedWorkoutId === workout.id ? null : workout.id)}
                                className="w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                        {workout.name || 'Untitled'}
                                    </div>
                                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                        {formatDate(workout.start_time)} · {formatDuration(workout.start_time, workout.end_time)}
                                    </div>
                                </div>
                                <ChevronRight className={`h-5 w-5 text-zinc-400 transition-transform ${expandedWorkoutId === workout.id ? 'rotate-90' : ''}`} />
                            </button>

                            {expandedWorkoutId === workout.id && (
                                <div className="px-4 pb-4 space-y-3 border-t border-zinc-200 dark:border-zinc-700">
                                    <div className="pt-3 grid grid-cols-2 gap-2 text-sm">
                                        <div className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-2">
                                            <div className="text-zinc-500 dark:text-zinc-400">{t('settings.totalVolume')}</div>
                                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">{workout.total_weight.toLocaleString()}kg</div>
                                        </div>
                                        <div className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-2">
                                            <div className="text-zinc-500 dark:text-zinc-400">{t('settings.totalSets')}</div>
                                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">{workout.total_sets} {t('workout.sets')}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">{t('settings.exerciseList')}</div>
                                        {workout.exercises.map((exercise) => (
                                            <div key={exercise.id} className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-3">
                                                <div className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">{exercise.name}</div>
                                                <div className="space-y-1">
                                                    {exercise.sets.map((set, idx) => (
                                                        <div key={set.id} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                                            <span className="w-5 h-5 flex items-center justify-center rounded bg-zinc-200 dark:bg-zinc-800 text-xs font-medium">
                                                                {idx + 1}
                                                            </span>
                                                            <span>{set.weight}kg × {set.reps}회</span>
                                                            {set.is_completed && <span className="text-green-500 text-xs">✓</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setDeleteTarget({ id: workout.id, name: workout.name || t('workout.untitled') })}
                                        className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        {t('settings.delete')}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
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
                <h2 className="text-lg font-semibold">{t('settings.account')}</h2>
            </div>

            <div className="space-y-4">
                {/* Full Name */}
                {userInfo?.fullName && (
                    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-4">
                        <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                            {t('settings.fullName')}
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
                            {t('settings.email')}
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
                            <span>{t('settings.signInGmail')}</span>
                        </button>
                        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4">
                            <div className="text-sm text-blue-600 dark:text-blue-400">
                                {t('settings.signInPrompt')}
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
                        <span>{t('settings.signOut')}</span>
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
                <h2 className="text-lg font-semibold">{t('settings.info')}</h2>
            </div>
            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                {t('settings.infoPlaceholder')}
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
                            <h2 className="text-xl font-bold">{t('settings.title')}</h2>
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

            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                title={t('settings.deleteWorkoutTitle')}
                message={t('settings.deleteWorkoutMessage', { name: deleteTarget?.name ?? '' })}
                confirmText={t('settings.delete')}
                cancelText={t('common.cancel')}
                onConfirm={handleDeleteWorkout}
                onCancel={() => setDeleteTarget(null)}
            />
        </>
    );
}



