import React from 'react';
import {
  FileSpreadsheet,
  Upload,
  RefreshCw,
  Database,
  Download,
  CloudCheck,
  CloudUpload,
  Loader2,
  Smartphone,
} from 'lucide-react';
import { DatasetMeta } from '../types/tender';

interface HeaderProps {
  meta: DatasetMeta;
  onOpenUpload: () => void;
  onResetToDemo: () => void;
  onOpenExport: () => void;
  totalFilteredCount: number;
  isSyncing?: boolean;
  onSyncToServer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  meta,
  onOpenUpload,
  onResetToDemo,
  onOpenExport,
  totalFilteredCount,
  isSyncing = false,
  onSyncToServer,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          {/* Logo & Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-inner font-bold text-lg">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                    Tra Cứu Thông Tin Nhà Thầu
                  </h1>
                  {meta.isDemo ? (
                    <span className="text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      Dữ liệu mẫu
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Dữ liệu thật ({meta.totalRecords.toLocaleString('vi-VN')})
                    </span>
                  )}

                  {/* Cloud Multi-device status */}
                  {!meta.isDemo && (
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                        meta.syncedToServer
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                      title={
                        meta.syncedToServer
                          ? 'Dữ liệu đã được lưu trên máy chủ, điện thoại và mọi thiết bị đều tra cứu được'
                          : 'Dữ liệu đang ở trình duyệt máy tính, hãy nhấn Đồng bộ để điện thoại xem được'
                      }
                    >
                      <Smartphone className="w-3 h-3 text-blue-400" />
                      <span>{meta.syncedToServer ? 'Đã đồng bộ ĐT' : 'Chưa đồng bộ ĐT'}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Tra cứu chuyên sâu trong Hàng hóa, Dịch vụ & Yêu cầu nhân sự
                </p>
              </div>
            </div>

            {/* Mobile quick action buttons */}
            <div className="flex sm:hidden items-center gap-1.5">
              <button
                onClick={onOpenUpload}
                aria-label="Tải file Excel"
                className="p-2 rounded-lg bg-blue-600 active:bg-blue-700 text-white shadow-xs"
                title="Nạp file Excel"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action buttons (Desktop & Tablet) */}
          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
            {/* Source info pill */}
            <div className="hidden lg:flex items-center gap-1.5 text-slate-300 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span className="truncate max-w-[160px] font-medium text-slate-200">
                {meta.sourceName}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-blue-300 font-semibold">
                {meta.totalRecords.toLocaleString('vi-VN')} gói
              </span>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {/* Force sync to server button if on real data but not synced yet */}
              {!meta.isDemo && onSyncToServer && (
                <button
                  onClick={onSyncToServer}
                  disabled={isSyncing}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                    meta.syncedToServer
                      ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700'
                      : 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 animate-pulse'
                  }`}
                  title="Đồng bộ toàn bộ dữ liệu lên máy chủ để xem trên điện thoại"
                >
                  {isSyncing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : meta.syncedToServer ? (
                    <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <CloudUpload className="w-3.5 h-3.5 text-white" />
                  )}
                  <span className="hidden sm:inline">
                    {isSyncing ? 'Đang đồng bộ...' : meta.syncedToServer ? 'Đã đồng bộ' : 'Đồng bộ sang ĐT'}
                  </span>
                </button>
              )}

              <button
                onClick={onOpenUpload}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Nạp Excel (.xlsx)</span>
              </button>

              <button
                onClick={onOpenExport}
                disabled={totalFilteredCount === 0}
                className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
                title="Xuất kết quả tìm kiếm"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xuất</span>
              </button>

              {!meta.isDemo && (
                <button
                  onClick={onResetToDemo}
                  className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  title="Dùng dữ liệu mẫu"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mẫu</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
