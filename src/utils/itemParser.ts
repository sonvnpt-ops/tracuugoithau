import { ParsedGoodsItem, ParsedServiceItem, ParsedPersonItem } from '../types/tender';

/**
 * Splits multiline or delimiter-separated text into individual item blocks.
 */
function splitRawBlocks(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  // Split on newlines first
  const lines = text
    .split(/\r?\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length > 1) {
    return lines;
  }

  // If it's a single block, check if it has multiple item patterns like "Tên :", "Mô tả :", "Tên vị trí yêu cầu:"
  const parts = text.split(/(?=(?:Tên\s*:|Mô tả\s*:|Tên vị trí yêu cầu\s*:|\b\d+[\.\)]\s+))/i);
  const cleanParts = parts.map((p) => p.trim()).filter((p) => p.length > 0);
  return cleanParts.length > 0 ? cleanParts : [text.trim()];
}

/**
 * Drops decimal zeros (.00, ,00, .0) from quantity strings
 * e.g. "2.00" -> "2", "2.00 Bộ" -> "2 Bộ", "10,00" -> "10"
 */
export function cleanQuantity(qtyStr?: string): string {
  if (!qtyStr) return '';
  let str = String(qtyStr).trim();
  str = str.replace(/([.,])00(?=\s|$|[^\d])/g, '');
  str = str.replace(/([.,])0(?=\s|$|[^\d])/g, '');
  return str;
}

/**
 * Parses goods_info_str
 * Pattern example: "Tên : Máy chủ rack 2U - Số lượng : 2 - Đơn vị tính : Bộ - Nguồn gốc : Mỹ/Châu Âu - Giá : 150000000"
 */
export function parseGoodsInfo(rawText?: string): ParsedGoodsItem[] {
  if (!rawText) return [];
  const blocks = splitRawBlocks(rawText);

  return blocks.map((block) => {
    const item: ParsedGoodsItem = { rawText: block };

    const nameMatch = block.match(/Tên\s*[:\-\.](.+?)(?=\s*-\s*(?:Số\s*lượng|SL|Đơn\s*vị|ĐVT|Nguồn\s*gốc|Xuất\s*xứ|Giá|Đơn\s*giá)|\s*$)/i);
    const qtyMatch = block.match(/(?:Số\s*lượng|SL)\s*[:\-\.](.+?)(?=\s*-\s*(?:Đơn\s*vị|ĐVT|Nguồn\s*gốc|Xuất\s*xứ|Giá|Đơn\s*giá)|\s*$)/i);
    const unitMatch = block.match(/(?:Đơn\s*vị\s*tính|ĐVT)\s*[:\-\.](.+?)(?=\s*-\s*(?:Nguồn\s*gốc|Xuất\s*xứ|Giá|Đơn\s*giá)|\s*$)/i);
    const originMatch = block.match(/(?:Nguồn\s*gốc|Xuất\s*xứ)\s*[:\-\.](.+?)(?=\s*-\s*(?:Giá|Đơn\s*giá|Thành\s*tiền|Số\s*tiền)|\s*$)/i);
    const priceMatch = block.match(/(?:Giá|Đơn\s*giá|Thành\s*tiền|Số\s*tiền|Tổng\s*tiền|Dự\s*toán)\s*[:\-\.](.+?)(?=\s*-\s*|\s*$)/i);

    if (nameMatch) item.name = nameMatch[1].trim();
    if (qtyMatch) item.quantity = cleanQuantity(qtyMatch[1]);
    if (unitMatch) item.unit = unitMatch[1].trim();
    if (originMatch) item.origin = originMatch[1].trim();
    if (priceMatch) item.price = priceMatch[1].trim();

    return item;
  });
}

/**
 * Parses services_info_str
 * Pattern example: "Mô tả: Dịch vụ bảo trì hệ thống phần mềm - Mục: 01 - Số lượng: 12 - Đơn vị tính: Tháng - Giá: 50.000.000"
 */
export function parseServicesInfo(rawText?: string): ParsedServiceItem[] {
  if (!rawText) return [];
  const blocks = splitRawBlocks(rawText);

  return blocks.map((block) => {
    const item: ParsedServiceItem = { rawText: block };

    const descMatch = block.match(/(?:Mô\s*tả|Tên\s*dịch\s*vụ|Hạng\s*mục)\s*[:\-\.]([^-\n\r]+?)(?=\s*-\s*|\s*Mục|\s*Số lượng|\s*$)/i);
    const subItemMatch = block.match(/(?:Mục|Mã\s*hạng\s*mục)\s*[:\-\.]([^-\n\r]+?)(?=\s*-\s*|\s*Số lượng|\s*$)/i);
    const qtyMatch = block.match(/(?:Số\s*lượng|SL)\s*[:\-\.]([^-\n\r]+?)(?=\s*-\s*|\s*Đơn vị|\s*$)/i);
    const unitMatch = block.match(/(?:Đơn\s*vị\s*tính|ĐVT)\s*[:\-\.]([^-\n\r]+?)(?=\s*-\s*|\s*Nguồn gốc|\s*Giá|\s*$)/i);
    const originMatch = block.match(/(?:Nguồn\s*gốc|Xuất\s*xứ)\s*[:\-\.]([^-\n\r]+?)(?=\s*-\s*|\s*Giá|\s*$)/i);
    const priceMatch = block.match(/(?:Giá|Đơn\s*giá|Thành\s*tiền)\s*[:\-\.]([^-\n\r]+?)(?=\s*-\s*|\s*$)/i);

    if (descMatch) item.description = descMatch[1].trim();
    if (subItemMatch) item.item = subItemMatch[1].trim();
    if (qtyMatch) item.quantity = cleanQuantity(qtyMatch[1]);
    if (unitMatch) item.unit = unitMatch[1].trim();
    if (originMatch) item.origin = originMatch[1].trim();
    if (priceMatch) item.price = priceMatch[1].trim();

    return item;
  });
}

/**
 * Parses persons_info_str
 * Pattern example: "Tên vị trí yêu cầu: Chỉ huy trưởng / Quản lý dự án - Số lượng: 01 - Số Năm: 5 - Số Hợp đồng: 2 - Chuyên ngành: Công nghệ thông tin / Điện tử viễn thông - Chứng chỉ: PMP hoặc tương đương"
 */
export function parsePersonsInfo(rawText?: string): ParsedPersonItem[] {
  if (!rawText) return [];
  const blocks = splitRawBlocks(rawText);

  return blocks.map((block) => {
    const item: ParsedPersonItem = { rawText: block };

    const posMatch = block.match(/(?:Tên\s*vị\s*trí\s*yêu\s*cầu|Vị\s*trí|Chức\s*danh)\s*[:\-\.]([^-\n\r]+?)(?=\s*-\s*|\s*Số lượng|\s*$)/i);
    const qtyMatch = block.match(/(?:Số\s*lượng|SL)\s*[:\-\.]([^-\n\r]+?)(?=\s*-\s*|\s*Số Năm|\s*Kinh nghiệm|\s*$)/i);
    const expMatch = block.match(/(?:Số\s*Năm(?:\s*kinh\s*nghiệm)?|Kinh\s*nghiệm)\s*[:\-\.]([^-\n\r]+?)(?=\s*-\s*|\s*Số Hợp đồng|\s*Chuyên ngành|\s*$)/i);
    const contractMatch = block.match(/(?:Số\s*Hợp\s*đồng|Hợp\s*đồng\s*tương\s*tự)\s*[:\-\.]([^-\n\r]+?)(?=\s*-\s*|\s*Chuyên ngành|\s*Chứng chỉ|\s*$)/i);
    const majorMatch = block.match(/(?:Chuyên\s*ngành|Bằng\s*cấp)\s*[:\-\.]([^-\n\r]+?)(?=\s*-\s*|\s*Chứng\s*chỉ|\s*Yêu\s*cầu|\s*$)/i);
    const certMatch = block.match(/(?:Chứng\s*chỉ|Chứng\s*nhận)\s*[:\-\.]([^-\n\r]+?)(?=\s*-\s*|\s*Yêu\s*cầu|\s*$)/i);
    const otherMatch = block.match(/(?:Yêu\s*cầu\s*khác|Ghi\s*chú|Điều\s*kiện)\s*[:\-\.]([^-\n\r]+?)(?=\s*-\s*|\s*$)/i);

    if (posMatch) item.position = posMatch[1].trim();
    if (qtyMatch) item.quantity = cleanQuantity(qtyMatch[1]);
    if (expMatch) item.yearsOfExp = expMatch[1].trim();
    if (contractMatch) item.contractCount = contractMatch[1].trim();
    if (majorMatch) item.major = majorMatch[1].trim();
    if (certMatch) item.certificates = certMatch[1].trim();
    if (otherMatch) item.otherRequirements = otherMatch[1].trim();

    return item;
  });
}
