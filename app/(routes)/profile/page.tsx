'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProfileStore, useUserStore } from '@/stores';
import { Edit2, Save, X, Settings, User, Calendar, Users, Ruler } from 'lucide-react';
import { WeightChart, SettingsModal, LoginRequiredModal } from '@/components';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { profile, weightRecords, isLoading, isSaving, isProfileLoaded, isWeightRecordsLoaded, fetchProfile, updateProfile, fetchWeightRecords, addWeightRecord } = useProfileStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '' as 'male' | 'female' | '',
    height: '',
  });
  const [weightInput, setWeightInput] = useState('');
  const [isAddingWeight, setIsAddingWeight] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    // Only fetch if not already loaded
    if (!isProfileLoaded) {
      fetchProfile();
    }
    if (!isWeightRecordsLoaded) {
      fetchWeightRecords();
    }
  }, [isProfileLoaded, isWeightRecordsLoaded, fetchProfile, fetchWeightRecords]);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        age: profile.age?.toString() || '',
        gender: profile.gender as 'male' | 'female' | '',
        height: profile.height?.toString() || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    const userId = await useUserStore.getState().getUserId();
    if (userId === 'anon_user') {
      setIsEditing(false);
      setIsLoginModalOpen(true);
      return;
    }

    await updateProfile({
      name: formData.name || null,
      age: formData.age ? parseInt(formData.age) : null,
      gender: formData.gender || null,
      height: formData.height ? parseFloat(formData.height) : null,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        age: profile.age?.toString() || '',
        gender: profile.gender as 'male' | 'female' | '',
        height: profile.height?.toString() || '',
      });
    }
    setIsEditing(false);
  };

  const handleAddWeight = async () => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      alert(t('profile.enterValidWeight'));
      return;
    }

    const userId = await useUserStore.getState().getUserId();
    if (userId === 'anon_user') {
      setIsAddingWeight(false);
      setIsLoginModalOpen(true);
      return;
    }

    await addWeightRecord(weight);
    setWeightInput('');
    setIsAddingWeight(false);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">{t('profile.title')}</h1>
        <div className="space-y-4">
          <div className="h-20 bg-zinc-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />
          <div className="h-20 bg-zinc-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t('profile.title')}</h1>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Settings className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </button>
      </div>

      {/* Profile Information Card */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('profile.basicInfo')}</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Edit2 className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
              </button>
              <button
                onClick={handleCancel}
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Name */}
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                {t('profile.name')}
              </label>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
                placeholder={t('profile.namePlaceholder')}
              />
            ) : (
              <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {profile?.name || <span className="text-zinc-400 dark:text-zinc-500">{t('profile.notSet')}</span>}
              </div>
            )}
          </div>

          {/* Age */}
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                {t('profile.age')}
              </label>
            </div>
            {isEditing ? (
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
                placeholder={t('profile.agePlaceholder')}
                min="0"
                max="150"
              />
            ) : (
              <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {profile?.age ? (
                  <>
                    {profile.age} <span className="text-xs font-normal text-zinc-500">{t('profile.years')}</span>
                  </>
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-500">{t('profile.notSet')}</span>
                )}
              </div>
            )}
          </div>

          {/* Gender */}
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                {t('profile.gender')}
              </label>
            </div>
            {isEditing ? (
              <div className="flex gap-2">
                {(['male', 'female'] as const).map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setFormData({ ...formData, gender })}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${formData.gender === gender
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                      : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                      }`}
                  >
                    {t(`profile.${gender}`)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {profile?.gender ? t(`profile.${profile.gender}`) : <span className="text-zinc-400 dark:text-zinc-500">{t('profile.notSet')}</span>}
              </div>
            )}
          </div>

          {/* Height */}
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <Ruler className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                {t('profile.height')}
              </label>
            </div>
            {isEditing ? (
              <input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="w-full rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
                placeholder={t('profile.heightPlaceholder')}
                min="0"
                max="300"
                step="0.1"
              />
            ) : (
              <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {profile?.height ? (
                  <>
                    {profile.height} <span className="text-xs font-normal text-zinc-500">cm</span>
                  </>
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-500">{t('profile.notSet')}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weight Tracking Card */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('profile.weightRecords')}</h2>
          {!isAddingWeight ? (
            <button
              onClick={() => setIsAddingWeight(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {t('profile.add')}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleAddWeight}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {t('profile.save')}
              </button>
              <button
                onClick={() => {
                  setIsAddingWeight(false);
                  setWeightInput('');
                }}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          )}
        </div>

        {isAddingWeight && (
          <div className="mb-4">
            <input
              type="number"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('profile.weightPlaceholder')}
              min="0"
              max="500"
              step="0.1"
              autoFocus
            />
          </div>
        )}

        {/* Current Weight Display */}
        {weightRecords.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">{t('profile.currentWeight')}</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {weightRecords[0].weight} <span className="text-base font-normal">kg</span>
            </div>
          </div>
        )}

        {/* Weight Chart */}
        <WeightChart weightRecords={weightRecords} />
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <LoginRequiredModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}



