export type SearchScope = 'all' | 'goods' | 'services' | 'persons';

export type SearchOperator = 'AND' | 'OR';

export type SortOption =
  | 'relevance'
  | 'price_desc'
  | 'price_asc'
  | 'date_desc'
  | 'date_asc'
  | 'bid_name_asc';

export interface ParsedGoodsItem {
  name?: string;
  quantity?: string;
  unit?: string;
  origin?: string;
  price?: string;
  rawText: string;
}

export interface ParsedServiceItem {
  description?: string;
  item?: string;
  quantity?: string;
  unit?: string;
  origin?: string;
  price?: string;
  rawText: string;
}

export interface ParsedPersonItem {
  position?: string;
  quantity?: string;
  yearsOfExp?: string;
  contractCount?: string;
  major?: string;
  certificates?: string;
  otherRequirements?: string;
  rawText: string;
}

export interface TenderRecord {
  id: string; // Unique internal key
  plan_no?: string; // Mã KHLCNT
  bid_name?: string; // Tên gói thầu
  plan_name?: string; // Tên KHLCNT
  project_name?: string; // Tên dự án
  procuring_entity_name?: string; // Bên mời thầu
  investor_code?: string;
  investor_name?: string; // Chủ đầu tư / Nhà đầu tư
  contract_type?: string; // Loại hợp đồng
  bid_form?: string; // Hình thức LCNT
  bid_mode?: string; // Phương thức LCNT
  invest_field?: string; // Lĩnh vực
  bid_price?: number | string; // Giá gói thầu
  bid_price_unit?: string; // Đơn vị tiền tệ (VND)
  bid_estimate_price?: number | string; // Giá dự toán
  contract_period?: string | number; // Thời gian thực hiện hợp đồng
  contract_period_unit?: string; // Đơn vị thời gian
  original_public_date?: string; // Ngày đăng tải TBMT
  public_kq_date?: string; // Ngày công bố KQ
  province_code?: string; // Mã tỉnh thành
  tbmt_url?: string; // Liên kết thông báo mời thầu

  // Core three search text fields
  goods_info_str?: string;
  services_info_str?: string;
  persons_info_str?: string;

  // Raw data map for all other columns
  raw_data?: Record<string, any>;

  // Precomputed normalized fields for lightning search
  _normalized?: {
    goods: string;
    goods_no_accent: string;
    services: string;
    services_no_accent: string;
    persons: string;
    persons_no_accent: string;
    metadata: string;
    metadata_no_accent: string;
  };
}

export interface FieldSnippet {
  field: 'goods' | 'services' | 'persons';
  label: string;
  count: number;
  snippet: string;
  matchedTerms: string[];
}

export interface SearchResultItem {
  record: TenderRecord;
  score: number;
  matches: {
    goods: boolean;
    services: boolean;
    persons: boolean;
    metadata: boolean;
  };
  snippets: FieldSnippet[];
  matchedSummary: string[];
}

export interface FilterCriteria {
  scope: SearchScope;
  operator: SearchOperator;
  plan_no?: string;
  bid_name?: string;
  project_name?: string;
  procuring_entity_name?: string;
  investor_name?: string;
  invest_field?: string;
  contract_type?: string;
  province_code?: string;
  date_from?: string;
  date_to?: string;
  has_goods?: boolean;
  has_services?: boolean;
  has_persons?: boolean;
  searchMode?: 'phrase' | 'words';
}

export interface DatasetMeta {
  sourceName: string;
  loadedAt: string;
  isDemo: boolean;
  totalRecords: number;
  goodsCount: number;
  servicesCount: number;
  personsCount: number;
  syncedToServer?: boolean;
  isPublicStatic?: boolean;
}
