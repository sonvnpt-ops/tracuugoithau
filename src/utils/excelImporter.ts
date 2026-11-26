import * as XLSX from 'xlsx';
import { TenderRecord } from '../types/tender';
import { normalizeSearchText, removeVietnameseAccents } from './textNormalizer';

export interface ImportResult {
  success: boolean;
  records: TenderRecord[];
  fileName: string;
  sheetName: string;
  totalRows: number;
  validRows: number;
  goodsCount: number;
  servicesCount: number;
  personsCount: number;
  error?: string;
  missingColumns?: string[];
  warning?: string;
}

const REQUIRED_COLUMNS = ['goods_info_str', 'services_info_str', 'persons_info_str'];

/**
 * Pre-computes normalized text strings for fast client-side indexing.
 */
export function buildNormalizedRecord(rec: TenderRecord): TenderRecord {
  const goods = normalizeSearchText(rec.goods_info_str || '');
  const goodsNoAcc = removeVietnameseAccents(goods);

  const serv = normalizeSearchText(rec.services_info_str || '');
  const servNoAcc = removeVietnameseAccents(serv);

  const pers = normalizeSearchText(rec.persons_info_str || '');
  const persNoAcc = removeVietnameseAccents(pers);

  const meta = normalizeSearchText(
    `${rec.bid_name || ''} ${rec.plan_no || ''} ${rec.project_name || ''} ${rec.procuring_entity_name || ''}`
  );
  const metaNoAcc = removeVietnameseAccents(meta);

  return {
    ...rec,
    _normalized: {
      goods,
      goods_no_accent: goodsNoAcc,
      services: serv,
      services_no_accent: servNoAcc,
      persons: pers,
      persons_no_accent: persNoAcc,
      metadata: meta,
      metadata_no_accent: metaNoAcc,
    },
  };
}

/**
 * Parse an uploaded .xlsx file from ArrayBuffer
 */
export async function parseExcelFile(
  file: File,
  onProgress?: (percent: number, status: string) => void
): Promise<ImportResult> {
  try {
    if (onProgress) onProgress(10, 'Đang đọc tập tin Excel...');

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        records: [],
        fileName: file.name,
        sheetName: '',
        totalRows: 0,
        validRows: 0,
        goodsCount: 0,
        servicesCount: 0,
        personsCount: 0,
        error: 'File Excel không có bất kỳ sheet dữ liệu nào.',
      };
    }

    // Prefer Sheet0 if it exists, otherwise take first sheet
    const targetSheetName = workbook.SheetNames.includes('Sheet0')
      ? 'Sheet0'
      : workbook.SheetNames[0];

    const worksheet = workbook.Sheets[targetSheetName];
    if (!worksheet) {
      return {
        success: false,
        records: [],
        fileName: file.name,
        sheetName: targetSheetName,
        totalRows: 0,
        validRows: 0,
        goodsCount: 0,
        servicesCount: 0,
        personsCount: 0,
        error: `Không tìm thấy sheet "${targetSheetName}".`,
      };
    }

    if (onProgress) onProgress(35, 'Đang trích xuất dữ liệu dòng & cột...');
    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      defval: '',
      raw: false,
    });

    if (rawData.length === 0) {
      return {
        success: false,
        records: [],
        fileName: file.name,
        sheetName: targetSheetName,
        totalRows: 0,
        validRows: 0,
        goodsCount: 0,
        servicesCount: 0,
        personsCount: 0,
        error: 'Sheet dữ liệu không có dòng bản ghi nào.',
      };
    }

    // Validate headers
    const sampleRow = rawData[0];
    const availableKeys = Object.keys(sampleRow).map((k) => k.trim());
    const missingColumns = REQUIRED_COLUMNS.filter(
      (reqCol) => !availableKeys.includes(reqCol)
    );

    if (missingColumns.length > 0) {
      return {
        success: false,
        records: [],
        fileName: file.name,
        sheetName: targetSheetName,
        totalRows: rawData.length,
        validRows: 0,
        goodsCount: 0,
        servicesCount: 0,
        personsCount: 0,
        missingColumns,
        error: `File thiếu các cột bắt buộc: ${missingColumns.join(', ')}. Vui lòng kiểm tra lại cấu trúc file.`,
      };
    }

    if (onProgress) onProgress(60, 'Đang chuẩn hóa và lập chỉ mục tra cứu...');

    let goodsCount = 0;
    let servicesCount = 0;
    let personsCount = 0;

    const parsedRecords: TenderRecord[] = [];

    for (let index = 0; index < rawData.length; index++) {
      const row = rawData[index];

      // Format date if it's an object or string
      let publicDate = row['original_public_date'] || row['public_date'] || '';
      if (publicDate instanceof Date) {
        publicDate = publicDate.toISOString().split('T')[0];
      }

      const goodsInfo = String(row['goods_info_str'] || '').trim();
      const servicesInfo = String(row['services_info_str'] || '').trim();
      const personsInfo = String(row['persons_info_str'] || '').trim();

      if (goodsInfo) goodsCount++;
      if (servicesInfo) servicesCount++;
      if (personsInfo) personsCount++;

      // Create stable unique ID
      const planNo = String(row['plan_no'] || '').trim();
      const bidName = String(row['bid_name'] || '').trim();
      const uniqueId = `rec_${index + 1}_${planNo || 'auto'}_${Math.random().toString(36).substring(2, 7)}`;

      const rec: TenderRecord = {
        id: uniqueId,
        plan_no: planNo || undefined,
        bid_name: bidName || undefined,
        plan_name: String(row['plan_name'] || '').trim() || undefined,
        project_name: String(row['project_name'] || '').trim() || undefined,
        procuring_entity_name: String(row['procuring_entity_name'] || '').trim() || undefined,
        investor_code: String(row['investor_code'] || '').trim() || undefined,
        investor_name: String(row['investor_name'] || '').trim() || undefined,
        contract_type: String(row['contract_type'] || '').trim() || undefined,
        bid_form: String(row['bid_form'] || '').trim() || undefined,
        bid_mode: String(row['bid_mode'] || '').trim() || undefined,
        invest_field: String(row['invest_field'] || '').trim() || undefined,
        bid_price: row['bid_price'] || undefined,
        bid_price_unit: String(row['bid_price_unit'] || 'VND').trim(),
        bid_estimate_price: row['bid_estimate_price'] || undefined,
        contract_period: row['contract_period'] || undefined,
        contract_period_unit: String(row['contract_period_unit'] || 'Ngày').trim(),
        original_public_date: publicDate || undefined,
        public_kq_date: String(row['public_kq_date'] || '').trim() || undefined,
        province_code: String(row['province_code'] || '').trim() || undefined,
        tbmt_url: String(row['tbmt_url'] || '').trim() || undefined,

        goods_info_str: goodsInfo || undefined,
        services_info_str: servicesInfo || undefined,
        persons_info_str: personsInfo || undefined,
        raw_data: row,
      };

      parsedRecords.push(buildNormalizedRecord(rec));
    }

    if (onProgress) onProgress(100, 'Hoàn tất xử lý dữ liệu!');

    return {
      success: true,
      records: parsedRecords,
      fileName: file.name,
      sheetName: targetSheetName,
      totalRows: rawData.length,
      validRows: parsedRecords.length,
      goodsCount,
      servicesCount,
      personsCount,
    };
  } catch (err: any) {
    return {
      success: false,
      records: [],
      fileName: file.name,
      sheetName: '',
      totalRows: 0,
      validRows: 0,
      goodsCount: 0,
      servicesCount: 0,
      personsCount: 0,
      error: `Lỗi đọc file Excel: ${err.message || 'Không thể giải mã nội dung file.'}`,
    };
  }
}
