import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DATA_DIR = path.join(ROOT_DIR, 'public', 'data');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const OUT_FILE = path.join(PUBLIC_DATA_DIR, 'dataset.json');

if (!fs.existsSync(PUBLIC_DATA_DIR)) {
  fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
}

// 1. If public/data/dataset.json already has records, keep it!
if (fs.existsSync(OUT_FILE)) {
  try {
    const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf-8'));
    if (Array.isArray(existing?.records) && existing.records.length > 0) {
      console.log(
        `[prepare-public-data] Keeping existing public/data/dataset.json (${existing.records.length} records).`
      );
      process.exit(0);
    }
  } catch {
    // Re-generate if invalid JSON
  }
}

// 2. Otherwise search for any .xlsx / .xls file in public/data/ or data/
const candidateDirs = [PUBLIC_DATA_DIR, DATA_DIR];
let excelPath = null;

for (const dir of candidateDirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.(xlsx|xls)$/i.test(f) && !f.startsWith('~$'));
  if (files.length > 0) {
    excelPath = path.join(dir, files[0]);
    break;
  }
}

if (excelPath) {
  console.log(`[prepare-public-data] Converting Excel file: ${path.relative(ROOT_DIR, excelPath)}`);
  const workbook = XLSX.readFile(excelPath, { cellDates: true });
  const targetSheetName = workbook.SheetNames.includes('Sheet0')
    ? 'Sheet0'
    : workbook.SheetNames[0];
  const worksheet = workbook.Sheets[targetSheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

  let goodsCount = 0;
  let servicesCount = 0;
  let personsCount = 0;

  const records = rawData.map((row, index) => {
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

    const planNo = String(row['plan_no'] || '').trim();
    const bidName = String(row['bid_name'] || '').trim();

    const {
      goods_info_str: _g,
      services_info_str: _s,
      persons_info_str: _p,
      ...compactRaw
    } = row;

    return {
      id: `rec_${index + 1}_${planNo || 'auto'}`,
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
      raw_data: Object.keys(compactRaw).length > 0 ? compactRaw : undefined,
    };
  });

  const payload = {
    records,
    meta: {
      sourceName: path.basename(excelPath),
      loadedAt: new Date().toISOString(),
      isDemo: false,
      totalRecords: records.length,
      goodsCount,
      servicesCount,
      personsCount,
      isPublicStatic: true,
    },
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(payload), 'utf-8');
  console.log(`[prepare-public-data] Wrote ${records.length} records to public/data/dataset.json.`);
  process.exit(0);
}

// 3. Fallback empty placeholder so ./data/dataset.json returns 200 OK
if (!fs.existsSync(OUT_FILE)) {
  fs.writeFileSync(OUT_FILE, JSON.stringify({ records: [], meta: null }, null, 2), 'utf-8');
}
console.log('[prepare-public-data] No Excel/JSON dataset found; using empty placeholder.');
