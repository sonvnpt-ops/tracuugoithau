import React, { useState, useEffect, useMemo } from 'react';
import {
  TenderRecord,
  SearchScope,
  SearchOperator,
  SortOption,
  FilterCriteria,
  DatasetMeta,
} from './types/tender';
import { getSampleDataset } from './data/sampleDataset';
import { executeSearch } from './utils/searchEngine';
import { parseSearchQuery } from './utils/textNormalizer';
import {
  saveDatasetToIndexedDB,
  loadDatasetFromIndexedDB,
  clearIndexedDB,
} from './utils/dbStorage';
import {
  fetchServerDataset,
  syncDatasetToServer,
  clearServerDataset,
  isStaticHosting,
} from './utils/apiSync';

import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { StatsBar } from './components/StatsBar';
import { ResultCard } from './components/ResultCard';
import { FilterDrawer } from './components/FilterDrawer';
import { TenderDetailModal } from './components/TenderDetailModal';
import { FileUploadModal } from './components/FileUploadModal';
import { ExportModal } from './components/ExportModal';

import {
  ArrowUpDown,
  SearchX,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  Sparkles,
  Smartphone,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function App() {
  // Core Data States
  const [records, setRecords] = useState<TenderRecord[]>([]);
  const [meta, setMeta] = useState<DatasetMeta>({
    sourceName: 'Dữ liệu mẫu',
    loadedAt: new Date().toISOString(),
    isDemo: true,
    totalRecords: 0,
    goodsCount: 0,
    servicesCount: 0,
    personsCount: 0,
    syncedToServer: false,
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Search & Filter States
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('all');
  const [operator, setOperator] = useState<SearchOperator>('AND');
  const [searchMode, setSearchMode] = useState<'phrase' | 'words'>('phrase');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [filters, setFilters] = useState<FilterCriteria>({
    scope: 'all',
    operator: 'AND',
    searchMode: 'phrase',
    has_goods: false,
    has_services: false,
    has_persons: false,
  });

  // Modal / Drawer visibility
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TenderRecord | null>(null);

  // Floating scroll-to-top button
  const [showScrollTop, setShowScrollTop] = useState(false);

  // 1. Initial Load: Server-first multi-device sync, then IndexedDB, then fallback to demo
  useEffect(() => {
    async function init() {
      setIsInitializing(true);
      try {
        // Step 1: Check server dataset first (so phone gets data immediately from server!)
        const serverData = await fetchServerDataset();
        if (serverData.success && serverData.records.length > 0 && serverData.meta) {
          console.log(`[Init] Loaded ${serverData.records.length} records from server!`);
          const metaWithSync: DatasetMeta = {
            ...serverData.meta,
            syncedToServer: true,
          };
          setRecords(serverData.records);
          setMeta(metaWithSync);
          // Cache in local IndexedDB for lightning fast local search
          await saveDatasetToIndexedDB(serverData.records, metaWithSync);
          return;
        }

        // Step 2: Check local IndexedDB
        const cached = await loadDatasetFromIndexedDB();
        if (cached && cached.records.length > 0 && cached.meta) {
          setRecords(cached.records);
          setMeta(cached.meta);

          // If this device has real data but server didn't, auto-sync it to server so phone can access!
          if (!cached.meta.isDemo) {
            setIsSyncing(true);
            syncDatasetToServer(cached.records, cached.meta).then((res) => {
              setIsSyncing(false);
              if (res.success) {
                setMeta((prev) => ({ ...prev, syncedToServer: true }));
                setToastMsg({
                  text: 'Dữ liệu đã tự động đồng bộ lên máy chủ cho điện thoại!',
                  type: 'success',
                });
                setTimeout(() => setToastMsg(null), 4000);
              }
            });
          }
          return;
        }

        // Step 3: Neither has data, load demo dataset
        const samples = getSampleDataset();
        let gCount = 0;
        let sCount = 0;
        let pCount = 0;
        for (const r of samples) {
          if (r.goods_info_str?.trim()) gCount++;
          if (r.services_info_str?.trim()) sCount++;
          if (r.persons_info_str?.trim()) pCount++;
        }
        const demoMeta: DatasetMeta = {
          sourceName: 'Dữ liệu mẫu chuẩn (10 gói thầu tiêu chuẩn)',
          loadedAt: new Date().toISOString(),
          isDemo: true,
          totalRecords: samples.length,
          goodsCount: gCount,
          servicesCount: sCount,
          personsCount: pCount,
          syncedToServer: false,
        };
        setRecords(samples);
        setMeta(demoMeta);
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsInitializing(false);
      }
    }
    init();
  }, []);

  // Monitor scroll for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Compute available filter options dynamically from data
  const availableOptions = useMemo(() => {
    const investFieldsSet = new Set<string>();
    const contractTypesSet = new Set<string>();
    const provincesSet = new Set<string>();

    for (const r of records) {
      if (r.invest_field?.trim()) investFieldsSet.add(r.invest_field.trim());
      if (r.contract_type?.trim()) contractTypesSet.add(r.contract_type.trim());
      if (r.province_code?.trim()) provincesSet.add(r.province_code.trim());
    }

    return {
      investFields: Array.from(investFieldsSet).sort(),
      contractTypes: Array.from(contractTypesSet).sort(),
      provinces: Array.from(provincesSet).sort(),
    };
  }, [records]);

  // Sync scope, operator, and searchMode changes into filter criteria
  useEffect(() => {
    setFilters((prev) => ({ ...prev, scope, operator, searchMode }));
    setCurrentPage(1);
  }, [scope, operator, searchMode]);

  // Decouple synchronous input query from search computation for buttery-smooth Vietnamese typing
  const deferredQuery = React.useDeferredValue(query);

  // 3. Search Execution
  const searchStartTime = performance.now();
  const { results: searchResults, matchCounts } = useMemo(() => {
    return executeSearch(records, deferredQuery, filters, sortBy);
  }, [records, deferredQuery, filters, sortBy]);
  const searchDurationMs = Math.round((performance.now() - searchStartTime) * 10) / 10;

  // Extracted terms for persistent highlighting in cards and modal
  const allMatchedTerms = useMemo(() => {
    const pq = parseSearchQuery(deferredQuery, operator, filters.searchMode || 'phrase');
    return [...pq.exactPhrases, ...pq.normalTokens];
  }, [deferredQuery, operator, filters.searchMode]);

  // Active filter count indicator for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.plan_no) count++;
    if (filters.bid_name) count++;
    if (filters.project_name) count++;
    if (filters.procuring_entity_name) count++;
    if (filters.investor_name) count++;
    if (filters.invest_field) count++;
    if (filters.contract_type) count++;
    if (filters.province_code) count++;
    if (filters.date_from || filters.date_to) count++;
    if (filters.has_goods) count++;
    if (filters.has_services) count++;
    if (filters.has_persons) count++;
    return count;
  }, [filters]);

  // 4. Pagination
  const totalPages = Math.max(1, Math.ceil(searchResults.length / pageSize));
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return searchResults.slice(start, start + pageSize);
  }, [searchResults, currentPage, pageSize]);

  // Handlers
  const handleQueryChange = (q: string) => {
    setQuery(q);
    setCurrentPage(1);
  };

  const handleSearchSubmit = () => {
    setCurrentPage(1);
  };

  const handleApplyFilters = (newFilters: FilterCriteria) => {
    setFilters(newFilters);
    setScope(newFilters.scope);
    setOperator(newFilters.operator);
    if (newFilters.searchMode) setSearchMode(newFilters.searchMode);
    setCurrentPage(1);
  };

  // Called when user uploads an Excel file from EITHER computer or phone
  const handleImportSuccess = async (importedRecords: TenderRecord[], newMeta: DatasetMeta) => {
    setRecords(importedRecords);
    setMeta(newMeta);
    setQuery('');
    setScope('all');
    setCurrentPage(1);

    // 1. Save to local device's IndexedDB
    try {
      await saveDatasetToIndexedDB(importedRecords, newMeta);
    } catch (e) {
      console.warn('Could not save to IndexedDB:', e);
    }

    // 2. If static hosting (e.g. GitHub Pages), finish cleanly with local storage message
    if (isStaticHosting()) {
      setToastMsg({
        text: `Đã nạp thành công ${importedRecords.length} gói thầu (lưu cục bộ trên trình duyệt)!`,
        type: 'success',
      });
      setTimeout(() => setToastMsg(null), 5000);
      return;
    }

    // 3. Automatically sync to backend server disk so phone & all other devices get it!
    setIsSyncing(true);
    setToastMsg({ text: 'Đang lưu và đồng bộ lên máy chủ...', type: 'info' });

    try {
      const syncRes = await syncDatasetToServer(importedRecords, newMeta);
      setIsSyncing(false);
      if (syncRes.success) {
        setMeta((prev) => ({ ...prev, syncedToServer: true }));
        setToastMsg({
          text: `Đã lưu thành công ${importedRecords.length} gói thầu! Điện thoại và các thiết bị khác hiện có thể truy cập đầy đủ.`,
          type: 'success',
        });
      } else {
        setToastMsg({
          text: 'Đã lưu trên thiết bị này. Lưu ý: ' + (syncRes.message || 'Chưa đồng bộ được máy chủ'),
          type: 'info',
        });
      }
    } catch (err) {
      setIsSyncing(false);
      console.error('Server sync error:', err);
    } finally {
      setTimeout(() => setToastMsg(null), 6000);
    }
  };

  // Force sync from local device to server
  const handleManualSyncToServer = async () => {
    if (records.length === 0 || meta.isDemo) return;
    setIsSyncing(true);
    setToastMsg({ text: 'Đang tải dữ liệu lên máy chủ cho điện thoại...', type: 'info' });
    try {
      const res = await syncDatasetToServer(records, meta);
      setIsSyncing(false);
      if (res.success) {
        setMeta((prev) => ({ ...prev, syncedToServer: true }));
        setToastMsg({
          text: 'Đã đồng bộ lên máy chủ thành công! Giờ đây bạn mở ứng dụng trên điện thoại sẽ có đủ dữ liệu.',
          type: 'success',
        });
      } else {
        setToastMsg({
          text: 'Lỗi đồng bộ: ' + (res.message || 'Không thể kết nối máy chủ'),
          type: 'error',
        });
      }
    } catch (e: any) {
      setIsSyncing(false);
      setToastMsg({ text: 'Lỗi đồng bộ: ' + e.message, type: 'error' });
    } finally {
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  // Pull fresh data from server (useful on phone if user just synced on PC)
  const handlePullFromServer = async () => {
    setIsSyncing(true);
    setToastMsg({ text: 'Đang kiểm tra dữ liệu từ máy chủ...', type: 'info' });
    try {
      const res = await fetchServerDataset();
      setIsSyncing(false);
      if (res.success && res.records.length > 0 && res.meta) {
        setRecords(res.records);
        setMeta({ ...res.meta, syncedToServer: true });
        await saveDatasetToIndexedDB(res.records, { ...res.meta, syncedToServer: true });
        setToastMsg({
          text: `Đã nhận thành công ${res.records.length.toLocaleString('vi-VN')} gói thầu từ máy chủ!`,
          type: 'success',
        });
      } else {
        setToastMsg({
          text: 'Máy chủ chưa có file dữ liệu thật. Hãy mở app trên máy tính (nơi bạn đã tải file) để đồng bộ, hoặc tải file trực tiếp trên điện thoại.',
          type: 'info',
        });
      }
    } catch (e: any) {
      setIsSyncing(false);
      setToastMsg({ text: 'Lỗi tải dữ liệu: ' + e.message, type: 'error' });
    } finally {
      setTimeout(() => setToastMsg(null), 6000);
    }
  };

  const handleResetToDemo = async () => {
    if (confirm('Bạn có muốn nạp lại bộ dữ liệu mẫu chuẩn?')) {
      const samples = getSampleDataset();
      let gCount = 0;
      let sCount = 0;
      let pCount = 0;
      for (const r of samples) {
        if (r.goods_info_str?.trim()) gCount++;
        if (r.services_info_str?.trim()) sCount++;
        if (r.persons_info_str?.trim()) pCount++;
      }
      const demoMeta: DatasetMeta = {
        sourceName: 'Dữ liệu mẫu chuẩn (10 gói thầu tiêu chuẩn)',
        loadedAt: new Date().toISOString(),
        isDemo: true,
        totalRecords: samples.length,
        goodsCount: gCount,
        servicesCount: sCount,
        personsCount: pCount,
        syncedToServer: false,
      };
      setRecords(samples);
      setMeta(demoMeta);
      setQuery('');
      setScope('all');
      setCurrentPage(1);
      await clearIndexedDB();
      await clearServerDataset();
      setToastMsg({ text: 'Đã quay về chế độ dữ liệu mẫu.', type: 'info' });
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-semibold text-slate-700">Đang đồng bộ và khởi tạo cơ sở dữ liệu tra cứu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-medium flex items-center justify-between gap-2 ${
              toastMsg.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : toastMsg.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-700'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{toastMsg.text}</span>
            </div>
            <button
              onClick={() => setToastMsg(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 1. Top Header */}
      <Header
        meta={meta}
        onOpenUpload={() => setIsUploadOpen(true)}
        onResetToDemo={handleResetToDemo}
        onOpenExport={() => setIsExportOpen(true)}
        totalFilteredCount={searchResults.length}
        isSyncing={isSyncing}
        onSyncToServer={isStaticHosting() ? undefined : handleManualSyncToServer}
      />

      {/* Demo Mode Device Guidance Banner */}
      {meta.isDemo && !isStaticHosting() && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-3 sm:px-6 py-2.5 text-xs border-b border-indigo-800/80 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-start sm:items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-bold text-amber-300 mr-1.5">Thông báo đồng bộ điện thoại:</span>
                <span className="text-slate-200">
                  Thiết bị này đang hiển thị 10 gói thầu mẫu. Để xem trọn vẹn dữ liệu đã nạp từ máy tính:
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePullFromServer}
                disabled={isSyncing}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold transition-colors cursor-pointer text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Lấy dữ liệu từ máy chủ</span>
              </button>

              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-medium transition-colors cursor-pointer text-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tải file Excel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Sticky Search Bar */}
      <SearchBar
        query={query}
        onQueryChange={handleQueryChange}
        scope={scope}
        onScopeChange={setScope}
        operator={operator}
        onOperatorChange={setOperator}
        searchMode={searchMode}
        onSearchModeChange={setSearchMode}
        onSearchSubmit={handleSearchSubmit}
        onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
        isFilterOpen={isFilterOpen}
        activeFilterCount={activeFilterCount}
      />

      {/* 3. Live Stats & Breakdown */}
      <StatsBar
        meta={meta}
        isSearching={Boolean(query.trim() || activeFilterCount > 0)}
        matchCounts={matchCounts}
      />

      {/* 4. Main Body */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex-1 w-full">
        {/* Results Toolbar: Count, Speed, Sorting, Page Size */}
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200/90 shadow-xs mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="font-bold text-slate-900">
              {searchResults.length.toLocaleString('vi-VN')} kết quả
            </span>
            {query && (
              <span className="text-slate-500 hidden sm:inline">
                cho cụm từ &quot;<strong className="text-slate-800">{query}</strong>&quot;
              </span>
            )}
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 text-xs">
              {searchDurationMs}ms
            </span>
          </div>

          <div className="flex items-center gap-2 justify-between sm:justify-end flex-wrap text-xs">
            {/* Sort Options */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <label htmlFor="sort-select" className="text-slate-500 hidden sm:inline">
                Sắp xếp:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortOption);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="relevance">Phù hợp nhất</option>
                <option value="price_desc">Giá gói thầu: Cao đến Thấp</option>
                <option value="price_asc">Giá gói thầu: Thấp đến Cao</option>
                <option value="date_desc">Ngày công bố (Mới nhất)</option>
                <option value="date_asc">Ngày công bố (Cũ nhất)</option>
                <option value="bid_name_asc">Tên gói thầu (A-Z)</option>
              </select>
            </div>

            {/* Page Size */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="page-size-select" className="text-slate-500 hidden sm:inline">
                Hiển thị:
              </label>
              <select
                id="page-size-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
                <option value={100}>100 / trang</option>
              </select>
            </div>
          </div>
        </div>

        {/* 5. Results Cards List */}
        {searchResults.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs my-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <SearchX className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
              Không tìm thấy gói thầu phù hợp
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
              Không có bản ghi nào khớp với điều kiện tra cứu hiện tại.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-left text-xs space-y-2 text-slate-700 mb-6">
              <span className="font-semibold text-slate-900 block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Gợi ý tìm kiếm:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Thử tìm bằng tiếng Việt không dấu (ví dụ: <code className="bg-white px-1 rounded border">toan tin ung dung</code>).</li>
                <li>Chuyển phạm vi tìm kiếm sang <strong className="text-slate-800">Tất cả</strong> thay vì từng trường riêng.</li>
                <li>Đổi điều kiện ghép từ sang <strong className="text-slate-800">OR (Một trong các từ)</strong>.</li>
                <li>Bớt bớt các tiêu chí trong <strong className="text-slate-800">Bộ lọc nâng cao</strong>.</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => {
                setQuery('');
                setScope('all');
                setFilters({
                  scope: 'all',
                  operator: 'AND',
                  searchMode: 'phrase',
                  has_goods: false,
                  has_services: false,
                  has_persons: false,
                });
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Xóa toàn bộ bộ lọc & Xem tất cả
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {paginatedResults.map((item) => (
              <ResultCard
                key={item.record.id}
                item={item}
                onSelect={() => setSelectedRecord(item.record)}
                allMatchedTerms={allMatchedTerms}
              />
            ))}
          </div>
        )}

        {/* 6. Pagination Bar */}
        {searchResults.length > 0 && totalPages > 1 && (
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200/90 shadow-xs mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500">
              Trang <strong className="text-slate-900">{currentPage}</strong> / {totalPages} (tổng cộng{' '}
              {searchResults.length.toLocaleString('vi-VN')} gói thầu)
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Trang đầu"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Trước</span>
              </button>

              {/* Numbered page pills */}
              <div className="flex items-center gap-1 mx-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  const active = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Trang cuối"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Scroll to Top button for mobile & desktop */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Cuộn lên đầu trang"
          className="fixed bottom-5 right-5 z-40 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all cursor-pointer"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Modals & Drawers */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        availableOptions={availableOptions}
      />

      <TenderDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        allMatchedTerms={allMatchedTerms}
      />

      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        results={searchResults}
        query={query}
      />
    </div>
  );
}
