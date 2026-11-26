import { TenderRecord, DatasetMeta } from '../types/tender';
import { buildNormalizedRecord } from './excelImporter';

export function isStaticHosting(): boolean {
  if (import.meta.env.VITE_STATIC_HOSTING === 'true') {
    return true;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.endsWith('.github.io') || window.location.protocol === 'file:') {
      return true;
    }
  }
  return false;
}

export async function fetchPublicDataset(): Promise<{
  success: boolean;
  records: TenderRecord[];
  meta: DatasetMeta | null;
}> {
  try {
    const res = await fetch('./data/dataset.json', { cache: 'no-cache' });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return { success: false, records: [], meta: null };
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.records) || data.records.length === 0) {
      return { success: false, records: [], meta: null };
    }

    const hydratedRecords: TenderRecord[] = data.records.map((r: TenderRecord) =>
      r._normalized ? r : buildNormalizedRecord(r)
    );

    const meta: DatasetMeta = {
      sourceName: data.meta?.sourceName || 'Dữ liệu công khai',
      loadedAt: data.meta?.loadedAt || new Date().toISOString(),
      isDemo: false,
      totalRecords: hydratedRecords.length,
      goodsCount:
        data.meta?.goodsCount ??
        hydratedRecords.filter((r) => r.goods_info_str?.trim()).length,
      servicesCount:
        data.meta?.servicesCount ??
        hydratedRecords.filter((r) => r.services_info_str?.trim()).length,
      personsCount:
        data.meta?.personsCount ??
        hydratedRecords.filter((r) => r.persons_info_str?.trim()).length,
      syncedToServer: false,
      isPublicStatic: true,
    };

    return {
      success: true,
      records: hydratedRecords,
      meta,
    };
  } catch (err) {
    console.warn('Could not fetch public static dataset:', err);
    return { success: false, records: [], meta: null };
  }
}

export function exportPublicDatasetJson(
  records: TenderRecord[],
  meta: DatasetMeta
): void {
  const compactRecords = records.map((r) => {
    const { _normalized, raw_data, ...rest } = r;
    let compactRaw: Record<string, any> | undefined;
    if (raw_data) {
      const {
        goods_info_str: _g,
        services_info_str: _s,
        persons_info_str: _p,
        ...otherRaw
      } = raw_data;
      if (Object.keys(otherRaw).length > 0) {
        compactRaw = otherRaw;
      }
    }
    return compactRaw ? { ...rest, raw_data: compactRaw } : rest;
  });

  const payload = {
    records: compactRecords,
    meta: {
      sourceName: meta.sourceName,
      loadedAt: meta.loadedAt || new Date().toISOString(),
      isDemo: false,
      totalRecords: compactRecords.length,
      goodsCount: meta.goodsCount,
      servicesCount: meta.servicesCount,
      personsCount: meta.personsCount,
      isPublicStatic: true,
    },
  };

  const blob = new Blob([JSON.stringify(payload)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'dataset.json');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function fetchServerDataset(): Promise<{
  success: boolean;
  records: TenderRecord[];
  meta: DatasetMeta | null;
}> {
  if (isStaticHosting()) {
    return { success: false, records: [], meta: null };
  }

  try {
    const res = await fetch('/api/tenders');
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
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
  if (isStaticHosting()) {
    return {
      success: false,
      message: 'Đang chạy trên GitHub Pages (web tĩnh), dữ liệu đã được lưu cục bộ trên trình duyệt.',
    };
  }

  try {
    const res = await fetch('/api/tenders/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records, meta }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return {
        success: false,
        message: 'Đang chạy trên máy chủ tĩnh (không có backend đồng bộ), dữ liệu được lưu cục bộ trên trình duyệt.',
      };
    }
    const data = await res.json();
    return {
      success: Boolean(data.success),
      message: data.message,
    };
  } catch (err: any) {
    console.warn('Failed to sync dataset to server:', err);
    return {
      success: false,
      message: 'Không kết nối được máy chủ đồng bộ, dữ liệu vẫn được lưu cục bộ trên trình duyệt.',
    };
  }
}

export async function clearServerDataset(): Promise<void> {
  if (isStaticHosting()) {
    return;
  }

  try {
    await fetch('/api/tenders', { method: 'DELETE' });
  } catch (err) {
    console.warn('Failed to clear server dataset:', err);
  }
}
