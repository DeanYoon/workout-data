'use client';

import { useState, useEffect } from 'react';
import { useProfileStore } from '@/app/stores/useProfileStore';
import { WeightChart } from './components/WeightChart';
import { SettingsModal } from './components/SettingsModal';
import { Edit2, Save, X, Settings } from 'lucide-react';

export default function ProfilePage() {
  const { profile, weightRecords, isLoading, isSaving, isProfileLoaded, isWeightRecordsLoaded, fetchProfile, updateProfile, fetchWeightRecords, addWeightRecord } = useProfileStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    height: '',
  });
  const [weightInput, setWeightInput] = useState('');
  const [isAddingWeight, setIsAddingWeight] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
        gender: profile.gender || '',
        height: profile.height?.toString() || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
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
        gender: profile.gender || '',
        height: profile.height?.toString() || '',
      });
    }
    setIsEditing(false);
  };

  const handleAddWeight = async () => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      alert('올바른 몸무게를 입력해주세요.');
      return;
    }
    await addWeightRecord(weight);
    setWeightInput('');
    setIsAddingWeight(false);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
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
        <h1 className="text-2xl font-bold">Profile</h1>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Settings className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </button>
      </div>

      {/* Profile Information Card */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">기본 정보</h2>
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

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              이름
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="이름을 입력하세요"
              />
            ) : (
              <div className="text-zinc-900 dark:text-zinc-100">
                {profile?.name || '미설정'}
              </div>
            )}
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              나이
            </label>
            {isEditing ? (
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="나이를 입력하세요"
                min="0"
                max="150"
              />
            ) : (
              <div className="text-zinc-900 dark:text-zinc-100">
                {profile?.age ? `${profile.age}세` : '미설정'}
              </div>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              성별
            </label>
            {isEditing ? (
              <div className="flex gap-2">
                {(['male', 'female', 'other'] as const).map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setFormData({ ...formData, gender })}
                    className={`flex-1 rounded-xl px-4 py-3 font-medium transition-colors ${
                      formData.gender === gender
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {gender === 'male' ? '남성' : gender === 'female' ? '여성' : '기타'}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-zinc-900 dark:text-zinc-100">
                {profile?.gender === 'male' ? '남성' : profile?.gender === 'female' ? '여성' : profile?.gender === 'other' ? '기타' : '미설정'}
              </div>
            )}
          </div>

          {/* Height */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              키 (cm)
            </label>
            {isEditing ? (
              <input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="키를 입력하세요"
                min="0"
                max="300"
                step="0.1"
              />
            ) : (
              <div className="text-zinc-900 dark:text-zinc-100">
                {profile?.height ? `${profile.height}cm` : '미설정'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weight Tracking Card */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">몸무게 기록</h2>
          {!isAddingWeight ? (
            <button
              onClick={() => setIsAddingWeight(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              추가
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleAddWeight}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                저장
              </button>
              <button
                onClick={() => {
                  setIsAddingWeight(false);
                  setWeightInput('');
                }}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                취소
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
              placeholder="몸무게를 입력하세요 (kg)"
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
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">현재 몸무게</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {weightRecords[0].weight} <span className="text-base font-normal">kg</span>
            </div>
          </div>
        )}

        {/* Weight Chart */}
        <WeightChart weightRecords={weightRecords} />
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
