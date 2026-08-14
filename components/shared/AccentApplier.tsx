'use client';

import { useEffect } from 'react';
import { useStudent } from '@/lib/hooks';
import { DEFAULT_ACCENT, applyAccent } from '@/lib/accents';

export default function AccentApplier() {
  const { student } = useStudent();

  useEffect(() => {
    applyAccent(student?.settings?.accent || DEFAULT_ACCENT);
  }, [student?.settings?.accent]);

  return null;
}
