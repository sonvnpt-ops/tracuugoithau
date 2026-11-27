import React, { useState, useRef } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  Package,
  Wrench,
  Users,
  Layers,
  CornerDownLeft,
  Keyboard,
  FileText,
} from 'lucide-react';
import { SearchScope, SearchOperator } from '../types/tender';
import { processTelexInput } from '../utils/vietnameseIME';

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  scope: SearchScope;
  onScopeChange: (scope: SearchScope) => void;
  operator: SearchOperator;
  onOperatorChange: (op: SearchOperator) => void;
  searchMode: 'phrase' | 'words';
  onSearchModeChange: (mode: 'phrase' | 'words') => void;
  onSearchSubmit: () => void;
  onToggleFilter: () => void;
  isFilterOpen: boolean;
  activeFilterCount: number;
  isHidden?: boolean;
  hasVisibleHeader?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onInputFocus?: () => void;
}

const TEST_QUERIES = [
  { label: 'quản lý dự án', query: 'quản lý dự án', scope: 'persons' as SearchScope },
  { label: 'đường truyền Internet', query: 'đường truyền Internet', scope: 'services' as SearchScope },
  { label: 'máy chủ ảo', query: 'máy chủ ảo', scope: 'all' as SearchScope },
  { label: 'Toán tin ứng dụng', query: 'Toán tin ứng dụng', scope: 'persons' as SearchScope },
  { label: 'toan tin ung dung (không dấu)', query: 'toan tin ung dung', scope: 'persons' as SearchScope },
  { label: 'PMP', query: 'PMP', scope: 'persons' as SearchScope },
  { label: 'CISSP OR PMP', query: 'CISSP OR PMP', scope: 'persons' as SearchScope },
  { label: 'CISSP AND PMP', query: 'CISSP AND PMP', scope: 'persons' as SearchScope },
  { label: 'kiểm thử phần mềm', query: 'kiểm thử phần mềm', scope: 'all' as SearchScope },
];

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  scope,
  onScopeChange,
  operator,
  onOperatorChange,
  searchMode,
  onSearchModeChange,
  onSearchSubmit,
  onToggleFilter,
  isFilterOpen,
  activeFilterCount,
  isHidden = false,
  hasVisibleHeader = false,
  inputRef,
  onInputFocus,
}) => {
  // Built-in Vietnamese Telex typing engine toggle (defaults to true)
  const [useBuiltinTelex, setUseBuiltinTelex] = useState(true);
  const isComposingRef = useRef(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearchSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (useBuiltinTelex && !isComposingRef.current) {
      val = processTelexInput(val);
    }
    onQueryChange(val);
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    let val = e.currentTarget.value;
    if (useBuiltinTelex) {
      val = processTelexInput(val);
    }
    onQueryChange(val);
  };

  const handleSelectSample = (sampleQuery: string, sampleScope: SearchScope) => {
    onQueryChange(sampleQuery);
    onScopeChange(sampleScope);
    setTimeout(() => {
      onSearchSubmit();
    }, 50);
  };

  const scopes: { key: SearchScope; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'all', label: 'Tất cả', icon: <Layers className="w-4 h-4" />, color: 'blue' },
    { key: 'goods', label: 'Hàng hóa', icon: <Package className="w-4 h-4" />, color: 'emerald' },
    { key: 'services', label: 'Dịch vụ', icon: <Wrench className="w-4 h-4" />, color: 'indigo' },
    { key: 'persons', label: 'Nhân sự', icon: <Users className="w-4 h-4" />, color: 'purple' },
  ];

  return (
    <div
      className={`bg-white border-b border-slate-200 sticky z-20 shadow-xs transition-transform duration-300 ease-out will-change-transform ${
        hasVisibleHeader ? 'top-[101px] sm:top-[74px]' : 'top-0'
      } ${isHidden ? '-translate-y-[180%] pointer-events-none' : 'translate-y-0'}`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
        {/* Main Search Input Box */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5 text-blue-600" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={onInputFocus}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              lang="vi"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="off"
              inputMode="search"
              title="Tìm toàn văn nội dung trong ô này (khớp nguyên cụm từ)"
              placeholder="Tìm toàn văn: quản lý dự án, đường truyền Internet, máy chủ ảo, PMP..."
              className="w-full pl-11 pr-28 sm:pr-32 py-2.5 sm:py-3 text-base sm:text-lg bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all outline-none font-normal text-slate-900 placeholder:text-slate-400 shadow-inner"
            />

            {/* Inner input controls: Clear button, Telex switch, submit icon */}
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
              {/* Telex Toggle button inside input */}
              <button
                type="button"
                onClick={() => setUseBuiltinTelex(!useBuiltinTelex)}
                className={`flex items-center gap-1 px-1.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  useBuiltinTelex
                    ? 'bg-blue-100/80 text-blue-800 border border-blue-300'
                    : 'bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
                title={
                  useBuiltinTelex
                    ? 'Bộ gõ Telex đang BẬT (gõ toans -> toán, dduowfng -> đường)'
                    : 'Bộ gõ Telex đang TẮT (dùng bộ gõ Unikey / Gboard của hệ thống)'
                }
              >
                <Keyboard className="w-3 h-3 text-blue-600" />
                <span className="hidden sm:inline font-mono">Telex</span>
                <span className="text-[10px] font-bold">
                  {useBuiltinTelex ? 'Bật' : 'Tắt'}
                </span>
              </button>

              {query && (
                <button
                  type="button"
                  onClick={() => onQueryChange('')}
                  aria-label="Xóa từ khóa"
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onSearchSubmit}
                aria-label="Tìm kiếm"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors cursor-pointer"
                title="Nhấn Enter để tìm"
              >
                <span>Tìm</span>
                <CornerDownLeft className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Toggle Filter Button */}
          <button
            type="button"
            onClick={onToggleFilter}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 sm:py-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer shrink-0 ${
              isFilterOpen || activeFilterCount > 0
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
                : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden md:inline">Bộ lọc</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Scope Selector, Search Mode (Full-text phrase vs words) & Logic Operator Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-1">
          {/* Scope Radio / Buttons (Mobile scrollable) */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            <span className="text-xs text-slate-500 font-medium mr-1 shrink-0 hidden sm:inline">
              Phạm vi:
            </span>
            {scopes.map((item) => {
              const active = scope === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onScopeChange(item.key)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium shrink-0 transition-all cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Mode & AND/OR operator */}
          <div className="flex items-center gap-2 ml-auto text-sm flex-wrap justify-end">
            {/* Mode: Toàn văn cụm từ (Khớp nguyên khối) vs Tách từng từ */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-medium hidden md:inline">Chế độ:</span>
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-slate-600">
                <button
                  type="button"
                  onClick={() => onSearchModeChange('phrase')}
                  className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                    searchMode === 'phrase'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Tìm toàn văn: khớp nguyên vẹn cả cụm từ liên tục"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Toàn văn cụm từ</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSearchModeChange('words')}
                  className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    searchMode === 'words'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Tìm từng từ rời rạc"
                >
                  Từng từ
                </button>
              </div>
            </div>

            {/* AND / OR logic toggle (when using multiple terms) */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-medium hidden lg:inline">Điều kiện:</span>
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-slate-600">
                <button
                  type="button"
                  onClick={() => onOperatorChange('AND')}
                  className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    operator === 'AND'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Tất cả các cụm từ phải cùng xuất hiện"
                >
                  AND
                </button>
                <button
                  type="button"
                  onClick={() => onOperatorChange('OR')}
                  className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    operator === 'OR'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Chỉ cần một trong các cụm từ xuất hiện"
                >
                  OR
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick test query chips - horizontal scroll on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-slate-400 shrink-0 font-medium">Gợi ý test:</span>
          {TEST_QUERIES.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSample(item.query, item.scope)}
              className="px-2 py-1 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 hover:border-blue-200 border border-transparent shrink-0 transition-colors cursor-pointer font-mono text-xs"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
