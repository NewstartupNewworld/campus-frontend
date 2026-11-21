import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { apiRequest } from './api';

export type StudyProfileData = {
  stream: string;
  streamLabel: string;
  label: string;
  icon: string;
  customField: string | null;
  program: string | null;
  specialization: string | null;
  semester: string | null;
  subjects: string[];
  customSubjects: string[];
  careers: string[];
  skills: string[];
  interests: string[];
  autoDetected: boolean;
};

export type CatalogStream = { id: string; label: string; icon: string; subjects: string[]; careers: string[] };

/** The student's own field (guessed from the course until they confirm it), with its subjects and careers. */
export function useStudyProfile() {
  const [profile, setProfile] = useState<StudyProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    const result = await apiRequest<{ profile: StudyProfileData }>('/api/study/profile');
    if (result.ok) {
      setProfile(result.data.profile);
      setError('');
    } else {
      setError(result.message);
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  return { profile, loading, error, reload, setProfile };
}
// END OF FILE