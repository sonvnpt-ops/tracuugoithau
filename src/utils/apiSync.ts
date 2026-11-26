import { TenderRecord, DatasetMeta } from '../types/tender';

export async function fetchServerDataset(): Promise<{
  success: boolean;
  records: TenderRecord[];
  meta: DatasetMeta | null;
}> {
  try {
    const res = await fetch('/api/tenders');
    if (!res.ok) {
      return { success: false, records: [], meta: null };
    }
    const data = await res.json();
    return {
      success: Boolean(data.success && data.records && data.records.length > 0),
      records: data.records || [],
      meta: data.meta || null,
    };
  } catch (err) {
    console.warn('Could not fetch server dataset:', err);
    return { success: false, records: [], meta: null };
  }
}

export async function syncDatasetToServer(
  records: TenderRecord[],
  meta: DatasetMeta
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/tenders/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records, meta }),
    });
    const data = await res.json();
    return {
      success: Boolean(data.success),
      message: data.message,
    };
  } catch (err: any) {
    console.error('Failed to sync dataset to server:', err);
    return {
      success: false,
      message: err.message || 'Lỗi kết nối máy chủ',
    };
  }
}

export async function clearServerDataset(): Promise<void> {
  try {
    await fetch('/api/tenders', { method: 'DELETE' });
  } catch (err) {
    console.warn('Failed to clear server dataset:', err);
  }
}
