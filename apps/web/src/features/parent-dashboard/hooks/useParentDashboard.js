import { useCallback, useEffect, useRef, useState } from 'react';
import { loadParentDashboard } from '../api/parentDashboardApi.js';

export function useParentDashboard({ student, parentToken, onError }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const onErrorRef = useRef(onError);
  const studentId = student?.id ?? null;
  const authenticated = Boolean(parentToken);

  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const reload = useCallback(async () => {
    if (!studentId || !authenticated) {
      setDashboard(null);
      return;
    }
    setLoading(true);
    try {
      setDashboard(await loadParentDashboard(studentId, parentToken));
    } catch (error) {
      onErrorRef.current(error);
    } finally {
      setLoading(false);
    }
  }, [authenticated, parentToken, studentId]);

  useEffect(() => { reload(); }, [reload]);
  return { dashboard, loading, reload };
}
