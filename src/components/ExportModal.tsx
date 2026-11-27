import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { X, Download, FileSpreadsheet, FileJson, Check, Globe } from 'lucide-react';
import { SearchResultItem } from '../types/tender';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: SearchResultItem[];
  query: string;
  isDemo?: boolean;
  totalRecords?: number;
  onExportPublicJson?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  results,
  query,
  isDemo = true,
  totalRecords = 0,
  onExportPublicJson,
}) => {
  const [exportType, setExportType] = useState<'xlsx' | 'csv' | 'json'>('xlsx');
  const [isExporting, setIsExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);

    const exportRows = results.map((item, idx) => {
      const r = item.record;
      return {
        STT: idx + 1,
        'Mã KHLCNT': r.plan_no || '',
        'Tên gói thầu': r.bid_name || '',
        'Tên dự án': r.project_name || '',
        'Bên mời thầu': r.procuring_entity_name || '',
        'Chủ đầu tư / Nhà đầu tư': r.investor_name || '',
        'Giá gói thầu': r.bid_price || '',
        'Đơn vị tính giá': r.bid_price_unit || '',
        'Lĩnh vực': r.invest_field || '',
        'Loại hợp đồng': r.contract_type || '',
        'Hình thức LCNT': r.bid_form || '',
        'Ngày đăng tải': r.original_public_date || '',
        'Thông tin Hàng hóa (goods_info_str)': r.goods_info_str || '',
        'Thông tin Dịch vụ (services_info_str)': r.services_info_str || '',
        'Yêu cầu Nhân sự (persons_info_str)': r.persons_info_str || '',
        'Điểm phù hợp': item.score,
        'Trường khớp': item.matchedSummary.join('; '),
      };
    });

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cleanQuery = (query || 'all').replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
    const baseName = `Ket_qua_tra_cuu_nha_thau_${cleanQuery}_${timestamp}`;

    if (exportType === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'KetQuaTraCuu');
      XLSX.writeFile(wb, `${baseName}.xlsx`);
    } else if (exportType === 'csv') {
      const ws = XLSX.utils.json_to_sheet(exportRows);
      const csvContent = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${baseName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (exportType === 'json') {
      const blob = new Blob([JSON.stringify(exportRows, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${baseName}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setIsExporting(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-base sm:text-lg">Xuất kết quả tìm kiếm</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          <p className="text-slate-600">
            Xuất <strong className="text-slate-900">{results.length} gói thầu</strong> đang hiển thị
            theo bộ lọc và từ khóa hiện tại.
          </p>

          <div className="space-y-2">
            <label className="font-semibold text-slate-700 block uppercase tracking-wide text-xs">
              Chọn định dạng xuất
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setExportType('xlsx')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  exportType === 'xlsx'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => setExportType('csv')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  exportType === 'csv'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <span>CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setExportType('json')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  exportType === 'json'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <FileJson className="w-5 h-5 text-amber-600" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {!isDemo && onExportPublicJson && (
            <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Công khai dữ liệu lên GitHub Pages ({totalRecords.toLocaleString('vi-VN')} gói)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tải file <code className="bg-white px-1 py-0.5 rounded border border-blue-200 font-mono">dataset.json</code> và đưa vào <code className="bg-white px-1 py-0.5 rounded border border-blue-200 font-mono">public/data/dataset.json</code> trên GitHub để mọi người truy cập đều thấy dữ liệu bạn đã nạp.
              </p>
              <button
                type="button"
                onClick={() => {
                  onExportPublicJson();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Tải dataset.json công khai</span>
              </button>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2 text-sm">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs cursor-pointer"
          >
            {success ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã xuất thành công!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Tải tập tin về máy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
