import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Database,
  ArrowRight,
} from 'lucide-react';
import { parseExcelFile, ImportResult } from '../utils/excelImporter';
import { TenderRecord, DatasetMeta } from '../types/tender';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (records: TenderRecord[], meta: DatasetMeta) => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setImportResult({
        success: false,
        records: [],
        fileName: file.name,
        sheetName: '',
        totalRows: 0,
        validRows: 0,
        goodsCount: 0,
        servicesCount: 0,
        personsCount: 0,
        error: 'Định dạng file không hợp lệ. Vui lòng chọn file Excel có đuôi .xlsx.',
      });
      return;
    }

    setLoading(true);
    setImportResult(null);

    const result = await parseExcelFile(file, (percent, status) => {
      setProgressPercent(percent);
      setProgressMsg(status);
    });

    setLoading(false);
    setImportResult(result);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleApplyImport = () => {
    if (importResult && importResult.success) {
      const meta: DatasetMeta = {
        sourceName: importResult.fileName,
        loadedAt: new Date().toISOString(),
        isDemo: false,
        totalRecords: importResult.validRows,
        goodsCount: importResult.goodsCount,
        servicesCount: importResult.servicesCount,
        personsCount: importResult.personsCount,
      };
      onImportSuccess(importResult.records, meta);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Nạp dữ liệu từ file Excel</h3>
              <p className="text-xs text-slate-400">File nguồn view_notifys_report_202611061000(1).xlsx</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Upload className="w-6 h-6" />
            </div>

            <p className="text-base font-semibold text-slate-800 mb-1">
              Kéo & thả file Excel vào đây hoặc <span className="text-blue-600 underline">chọn từ thiết bị</span>
            </p>
            <p className="text-sm text-slate-500">
              Hỗ trợ file .xlsx (ví dụ: view_notifys_report_202611061000(1).xlsx)
            </p>
          </div>

          {/* Loading status */}
          {loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center space-y-2">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-blue-900">{progressMsg}</p>
              <div className="w-full bg-blue-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Result */}
          {importResult && !importResult.success && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-900 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Lỗi kiểm tra cấu trúc dữ liệu:</p>
                  <p className="mt-1">{importResult.error}</p>
                </div>
              </div>
              {importResult.missingColumns && importResult.missingColumns.length > 0 && (
                <div className="bg-white/80 p-2.5 rounded-lg border border-rose-200">
                  <span className="font-semibold block mb-1">Cột bắt buộc bị thiếu trong file:</span>
                  <ul className="list-disc list-inside space-y-0.5 font-mono text-rose-700">
                    {importResult.missingColumns.map((col, idx) => (
                      <li key={idx}>{col}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Success Result */}
          {importResult && importResult.success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-950 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Đọc file thành công!</span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-100 space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tên file:</span>
                  <span className="font-semibold">{importResult.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sheet đã đọc:</span>
                  <span className="font-semibold">{importResult.sheetName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tổng số dòng bản ghi:</span>
                  <span className="font-bold text-blue-700">
                    {importResult.validRows.toLocaleString('vi-VN')} gói thầu
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1 text-xs">
                  <span>Có thông tin Hàng hóa:</span>
                  <span className="font-semibold">{importResult.goodsCount.toLocaleString('vi-VN')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Có thông tin Dịch vụ:</span>
                  <span className="font-semibold">{importResult.servicesCount.toLocaleString('vi-VN')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Có yêu cầu Nhân sự:</span>
                  <span className="font-semibold">{importResult.personsCount.toLocaleString('vi-VN')}</span>
                </div>
              </div>

              <p className="text-xs text-emerald-700 flex items-center gap-1">
                <Database className="w-3.5 h-3.5" />
                Dữ liệu sẽ được lưu tự động vào bộ nhớ IndexedDB của trình duyệt.
              </p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2 text-sm">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
          >
            Đóng
          </button>

          {importResult && importResult.success && (
            <button
              type="button"
              onClick={handleApplyImport}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Áp dụng & Bắt đầu tra cứu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
