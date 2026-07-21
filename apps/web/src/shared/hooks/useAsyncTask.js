import { useCallback, useState } from 'react';

export function useAsyncTask() {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (task) => {
    setBusy(true);
    try { return await task(); }
    finally { setBusy(false); }
  }, []);
  return { busy, run };
}
