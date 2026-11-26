import React from 'react';
import { Package, Wrench, Users, Layers, CheckCircle2 } from 'lucide-react';
import { DatasetMeta } from '../types/tender';

interface StatsBarProps {
  meta: DatasetMeta;
  isSearching: boolean;
  matchCounts: {
    goods: number;
    services: number;
    persons: number;
    total: number;
  };
}

export const StatsBar: React.FC<StatsBarProps> = ({
  meta,
  isSearching,
  matchCounts,
}) => {
  return (
    <div className="bg-slate-100/80 border-b border-slate-200/80 px-3 sm:px-6 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-1.5">
        {/* Left: Search matching breakdown or overall database stats */}
        <div className="flex items-center gap-2 flex-wrap">
          {isSearching ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                Kết quả tìm kiếm:
              </span>
              <span className="bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded">
                {matchCounts.total.toLocaleString('vi-VN')} gói thầu
              </span>

              <span className="text-slate-400">|</span>
              <span className="text-slate-600">Khớp theo trường:</span>

              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                <Package className="w-3 h-3 text-emerald-600" />
                {matchCounts.goods} Hàng hóa
              </span>

              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 border border-indigo-200 px-1.5 py-0.5 rounded font-medium">
                <Wrench className="w-3 h-3 text-indigo-600" />
                {matchCounts.services} Dịch vụ
              </span>

              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded font-medium">
                <Users className="w-3 h-3 text-purple-600" />
                {matchCounts.persons} Nhân sự
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap text-slate-600">
              <span className="font-medium text-slate-900 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                Tổng kho dữ liệu:
              </span>
              <span className="font-bold text-slate-900">
                {meta.totalRecords.toLocaleString('vi-VN')} gói thầu
              </span>
              <span className="text-slate-400">|</span>
              <span className="inline-flex items-center gap-1 text-slate-700">
                <Package className="w-3 h-3 text-emerald-600" />
                {meta.goodsCount.toLocaleString('vi-VN')} có hàng hóa
              </span>
              <span className="text-slate-400">|</span>
              <span className="inline-flex items-center gap-1 text-slate-700">
                <Wrench className="w-3 h-3 text-indigo-600" />
                {meta.servicesCount.toLocaleString('vi-VN')} có dịch vụ
              </span>
              <span className="text-slate-400">|</span>
              <span className="inline-flex items-center gap-1 text-slate-700">
                <Users className="w-3 h-3 text-purple-600" />
                {meta.personsCount.toLocaleString('vi-VN')} có nhân sự
              </span>
            </div>
          )}
        </div>

        {/* Right: Storage & source status */}
        <div className="text-[11px] text-slate-500 flex items-center gap-2">
          <span>{meta.sourceName}</span>
          <span className="text-slate-300">•</span>
          <span>Nạp lúc: {new Date(meta.loadedAt).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>
    </div>
  );
};
