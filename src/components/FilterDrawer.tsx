import React, { useState } from 'react';
import { X, RotateCcw, Check, Filter } from 'lucide-react';
import { FilterCriteria, SearchScope } from '../types/tender';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterCriteria;
  onApplyFilters: (newFilters: FilterCriteria) => void;
  availableOptions: {
    investFields: string[];
    contractTypes: string[];
    provinces: string[];
  };
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  availableOptions,
}) => {
  const [localFilters, setLocalFilters] = useState<FilterCriteria>({ ...filters });

  // Update local filters when props change
  React.useEffect(() => {
    setLocalFilters({ ...filters });
  }, [filters]);

  if (!isOpen) return null;

  const handleReset = () => {
    const resetVal: FilterCriteria = {
      scope: 'all',
      operator: 'AND',
      plan_no: '',
      bid_name: '',
      project_name: '',
      procuring_entity_name: '',
      investor_name: '',
      invest_field: '',
      contract_type: '',
      province_code: '',
      date_from: '',
      date_to: '',
      has_goods: false,
      has_services: false,
      has_persons: false,
    };
    setLocalFilters(resetVal);
    onApplyFilters(resetVal);
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      {/* Background click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer content: slide from right or full width on small mobile */}
      <div className="w-full sm:w-[420px] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Bộ lọc nâng cao</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable filter form body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm">
          {/* Scope selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Trường dữ liệu tra cứu
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'Tất cả 3 trường' },
                { id: 'goods', label: 'Hàng hóa' },
                { id: 'services', label: 'Dịch vụ' },
                { id: 'persons', label: 'Nhân sự' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setLocalFilters({ ...localFilters, scope: opt.id as SearchScope })
                  }
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                    localFilters.scope === opt.id
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Existence checkboxes */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Yêu cầu có dữ liệu trong trường
            </label>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(localFilters.has_goods)}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, has_goods: e.target.checked })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Có thông tin Hàng hóa (goods_info_str)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(localFilters.has_services)}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, has_services: e.target.checked })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Có thông tin Dịch vụ (services_info_str)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(localFilters.has_persons)}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, has_persons: e.target.checked })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Có yêu cầu Nhân sự (persons_info_str)</span>
              </label>
            </div>
          </div>

          {/* Plan No */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mã kế hoạch LCNT (plan_no)
            </label>
            <input
              type="text"
              value={localFilters.plan_no || ''}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, plan_no: e.target.value })
              }
              placeholder="VD: PL2300089123"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Bid Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên gói thầu (bid_name)
            </label>
            <input
              type="text"
              value={localFilters.bid_name || ''}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, bid_name: e.target.value })
              }
              placeholder="VD: Cung cấp thiết bị..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Procuring Entity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bên mời thầu (procuring_entity_name)
            </label>
            <input
              type="text"
              value={localFilters.procuring_entity_name || ''}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, procuring_entity_name: e.target.value })
              }
              placeholder="VD: Sở Thông tin, Trung tâm..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Investor Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chủ đầu tư / Nhà đầu tư (investor_name)
            </label>
            <input
              type="text"
              value={localFilters.investor_name || ''}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, investor_name: e.target.value })
              }
              placeholder="VD: Ủy ban Nhân dân, Tập đoàn..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Invest Field */}
          {availableOptions.investFields.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lĩnh vực đầu tư (invest_field)
              </label>
              <select
                value={localFilters.invest_field || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, invest_field: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Tất cả lĩnh vực --</option>
                {availableOptions.investFields.map((fld) => (
                  <option key={fld} value={fld}>
                    {fld}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Contract Type */}
          {availableOptions.contractTypes.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loại hợp đồng (contract_type)
              </label>
              <select
                value={localFilters.contract_type || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, contract_type: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Tất cả loại hợp đồng --</option>
                {availableOptions.contractTypes.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date range */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Thời gian công bố (original_public_date)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-slate-500">Từ ngày:</span>
                <input
                  type="date"
                  value={localFilters.date_from || ''}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, date_from: e.target.value })
                  }
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Đến ngày:</span>
                <input
                  type="date"
                  value={localFilters.date_to || ''}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, date_to: e.target.value })
                  }
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors flex-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors flex-1 shadow-xs cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Áp dụng bộ lọc</span>
          </button>
        </div>
      </div>
    </div>
  );
};
