import React, { useState } from 'react';
import {
  X,
  ArrowLeft,
  Copy,
  Check,
  Package,
  Wrench,
  Users,
  FileText,
  Calendar,
  Building2,
  Coins,
  MapPin,
  ExternalLink,
  TableProperties,
} from 'lucide-react';
import { TenderRecord } from '../types/tender';
import {
  parseGoodsInfo,
  parseServicesInfo,
  parsePersonsInfo,
  cleanQuantity,
} from '../utils/itemParser';
import { HighlightText } from './HighlightText';

interface TenderDetailModalProps {
  record: TenderRecord | null;
  onClose: () => void;
  allMatchedTerms: string[];
}

export const TenderDetailModal: React.FC<TenderDetailModalProps> = ({
  record,
  onClose,
  allMatchedTerms,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'goods' | 'services' | 'persons' | 'raw'>(
    'all'
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState<{ [key: string]: boolean }>({});

  if (!record) return null;

  const goodsItems = parseGoodsInfo(record.goods_info_str);
  const serviceItems = parseServicesInfo(record.services_info_str);
  const personItems = parsePersonsInfo(record.persons_info_str);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleShowRaw = (key: string) => {
    setShowRawText((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatCurrency = (val?: number | string, defaultUnit = 'VND') => {
    if (val === undefined || val === null || val === '') return 'Không có';
    if (typeof val === 'number') {
      if (isNaN(val)) return 'Không có';
      return `${Math.trunc(val).toLocaleString('vi-VN')} ${defaultUnit}`.trim();
    }
    let str = String(val).trim();
    if (!str) return 'Không có';

    let unit = defaultUnit;
    const unitMatch = str.match(/\s+([A-Za-zÀ-ỹ]+)$/);
    if (unitMatch) {
      unit = unitMatch[1];
      str = str.slice(0, unitMatch.index).trim();
    }

    // Drop decimals before formatting (usually 1-2 digits after dot or comma)
    str = str.replace(/[.,]\d{1,2}$/, '');

    const cleanDigits = str.replace(/[,.\s]/g, '');
    if (!cleanDigits) return String(val);

    const num = parseInt(cleanDigits, 10);
    if (isNaN(num)) return String(val);

    return `${num.toLocaleString('vi-VN')} ${unit}`.trim();
  };

  const parseNumericPrice = (val?: number | string): number => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : Math.trunc(val);
    let str = String(val).trim();
    str = str.replace(/\s+[A-Za-zÀ-ỹ]+$/, '');
    str = str.replace(/[.,]\d{1,2}$/, '');
    const cleanDigits = str.replace(/[,.\s]/g, '');
    const num = parseInt(cleanDigits, 10);
    return isNaN(num) ? 0 : num;
  };

  const parseQuantityNumber = (qtyStr?: string): number => {
    if (!qtyStr) return 1;
    const match = qtyStr.match(/[\d.,]+/);
    if (!match) return 1;
    const clean = match[0].replace(/[,.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) || num <= 0 ? 1 : num;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-5xl sm:rounded-2xl shadow-2xl flex flex-col min-h-screen sm:min-h-0 sm:max-h-[92vh] overflow-hidden">
        {/* Sticky Top Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              aria-label="Quay lại danh sách"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[11px] font-mono font-semibold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800">
                {record.plan_no || 'MÃ GÓI THẦU'}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1 max-w-xl mt-0.5">
                {record.bid_name || 'Chi tiết gói thầu'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (Scrollable on smartphone) */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`py-3 px-3.5 border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-700 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Tổng quan đầy đủ
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('goods')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeTab === 'goods'
                ? 'border-emerald-600 text-emerald-800 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hàng hóa</span>
            {goodsItems.length > 0 && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {goodsItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeTab === 'services'
                ? 'border-indigo-600 text-indigo-800 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dịch vụ</span>
            {serviceItems.length > 0 && (
              <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {serviceItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('persons')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeTab === 'persons'
                ? 'border-purple-600 text-purple-800 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>Yêu cầu nhân sự</span>
            {personItems.length > 0 && (
              <span className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {personItems.length}
              </span>
            )}
          </button>

          {record.raw_data && (
            <button
              type="button"
              onClick={() => setActiveTab('raw')}
              className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                activeTab === 'raw'
                  ? 'border-slate-800 text-slate-900 font-bold bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5 text-slate-600" />
              <span>Toàn bộ 51 cột</span>
            </button>
          )}
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-sm">
          {/* SECTION A: General Info (Shown on 'all' or default) */}
          {(activeTab === 'all' || activeTab === 'raw') && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  A. Thông tin chung gói thầu
                </h3>

                {record.tbmt_url && (
                  <a
                    href={record.tbmt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium underline"
                  >
                    <span>Mở link Muasamcong</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-500 block text-xs">Tên gói thầu (bid_name):</span>
                  <span className="font-semibold text-slate-900 block mt-0.5">
                    <HighlightText
                      text={record.bid_name || 'Không có dữ liệu'}
                      matchedTerms={allMatchedTerms}
                    />
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">Mã KHLCNT (plan_no):</span>
                  <span className="font-mono font-medium text-slate-900 block mt-0.5">
                    {record.plan_no || 'Không có dữ liệu'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">Tên dự án (project_name):</span>
                  <span className="font-medium text-slate-800 block mt-0.5">
                    <HighlightText
                      text={record.project_name || 'Không có dữ liệu'}
                      matchedTerms={allMatchedTerms}
                    />
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">Tên kế hoạch (plan_name):</span>
                  <span className="font-medium text-slate-800 block mt-0.5">
                    {record.plan_name || 'Không có dữ liệu'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">
                    Bên mời thầu (procuring_entity_name):
                  </span>
                  <span className="font-medium text-slate-800 block mt-0.5">
                    {record.procuring_entity_name || 'Không có dữ liệu'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">
                    Chủ đầu tư / Nhà đầu tư (investor_name):
                  </span>
                  <span className="font-medium text-slate-800 block mt-0.5">
                    {record.investor_name || 'Không có dữ liệu'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">Giá gói thầu (bid_price):</span>
                  <span className="font-bold text-emerald-700 block mt-0.5">
                    {formatCurrency(record.bid_price, record.bid_price_unit)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">
                    Giá dự toán (bid_estimate_price):
                  </span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {formatCurrency(record.bid_estimate_price, record.bid_price_unit)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">Hình thức LCNT (bid_form):</span>
                  <span className="font-medium text-slate-800 block mt-0.5">
                    {record.bid_form || 'Không có dữ liệu'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">Loại hợp đồng (contract_type):</span>
                  <span className="font-medium text-slate-800 block mt-0.5">
                    {record.contract_type || 'Không có dữ liệu'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">
                    Thời gian thực hiện (contract_period):
                  </span>
                  <span className="font-medium text-slate-800 block mt-0.5">
                    {record.contract_period
                      ? `${record.contract_period} ${record.contract_period_unit || 'ngày'}`
                      : 'Không có dữ liệu'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">
                    Ngày đăng tải TBMT (original_public_date):
                  </span>
                  <span className="font-medium text-slate-800 block mt-0.5">
                    {record.original_public_date || 'Không có dữ liệu'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION B: Goods Info */}
          {(activeTab === 'all' || activeTab === 'goods') && (
            <div className="bg-white rounded-xl border border-emerald-200 p-4 sm:p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      B. Thông tin hàng hóa (goods_info_str)
                    </h3>
                    <span className="text-xs text-slate-500">
                      {goodsItems.length > 0
                        ? `Nhận diện ${goodsItems.length} mục hàng hóa/thiết bị`
                        : 'Không có thông tin hàng hóa trong gói thầu này'}
                    </span>
                  </div>
                </div>

                {record.goods_info_str && (
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => toggleShowRaw('goods')}
                      className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                    >
                      {showRawText['goods'] ? 'Hiện dạng thẻ' : 'Xem nguyên văn'}
                    </button>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(record.goods_info_str || '', 'goods')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium transition-colors cursor-pointer"
                    >
                      {copiedField === 'goods' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {!record.goods_info_str?.trim() ? (
                <div className="p-4 bg-slate-50 rounded-lg text-slate-500 text-xs text-center">
                  Không có dữ liệu hàng hóa cho gói thầu này.
                </div>
              ) : showRawText['goods'] ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
                  <HighlightText
                    text={record.goods_info_str}
                    matchedTerms={allMatchedTerms}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {goodsItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/30 text-xs space-y-1.5"
                    >
                      <div className="font-bold text-slate-900 text-sm flex items-start justify-between gap-2">
                        <span>
                          <span className="text-emerald-700 mr-1.5">#{idx + 1}</span>
                          <HighlightText
                            text={item.name || item.rawText}
                            matchedTerms={allMatchedTerms}
                          />
                        </span>
                        {item.price && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300 shrink-0 flex items-center gap-1 text-xs">
                              <Coins className="w-3.5 h-3.5 text-slate-500" />
                              <span>Đơn giá: {formatCurrency(item.price, record.bid_price_unit || 'VND')}</span>
                            </span>
                            <span className="font-mono font-bold text-emerald-900 bg-emerald-100/90 px-2.5 py-1 rounded-md border border-emerald-300 shrink-0 flex items-center gap-1 shadow-2xs text-xs">
                              <Coins className="w-3.5 h-3.5 text-emerald-600" />
                              <span>
                                Số tiền:{' '}
                                {formatCurrency(
                                  parseNumericPrice(item.price) * parseQuantityNumber(item.quantity),
                                  record.bid_price_unit || 'VND'
                                )}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 pt-1">
                        {item.quantity && (
                          <div>
                            <span className="text-slate-400 block text-[11px]">Số lượng:</span>
                            <span className="font-medium text-slate-800">
                              <HighlightText
                                text={cleanQuantity(item.quantity)}
                                matchedTerms={allMatchedTerms}
                              />
                            </span>
                          </div>
                        )}
                        {item.unit && (
                          <div>
                            <span className="text-slate-400 block text-[11px]">Đơn vị tính:</span>
                            <span className="font-medium text-slate-800">
                              <HighlightText
                                text={item.unit}
                                matchedTerms={allMatchedTerms}
                              />
                            </span>
                          </div>
                        )}
                        {item.origin && (
                          <div className="col-span-2">
                            <span className="text-slate-400 block text-[11px]">Nguồn gốc:</span>
                            <span className="font-medium text-slate-800">
                              <HighlightText
                                text={item.origin}
                                matchedTerms={allMatchedTerms}
                              />
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 pt-1 border-t border-emerald-100/60 font-mono">
                        <HighlightText
                          text={item.rawText}
                          matchedTerms={allMatchedTerms}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION C: Services Info */}
          {(activeTab === 'all' || activeTab === 'services') && (
            <div className="bg-white rounded-xl border border-indigo-200 p-4 sm:p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      C. Thông tin dịch vụ (services_info_str)
                    </h3>
                    <span className="text-xs text-slate-500">
                      {serviceItems.length > 0
                        ? `Nhận diện ${serviceItems.length} hạng mục dịch vụ`
                        : 'Không có thông tin dịch vụ trong gói thầu này'}
                    </span>
                  </div>
                </div>

                {record.services_info_str && (
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => toggleShowRaw('services')}
                      className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                    >
                      {showRawText['services'] ? 'Hiện dạng thẻ' : 'Xem nguyên văn'}
                    </button>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(record.services_info_str || '', 'services')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-medium transition-colors cursor-pointer"
                    >
                      {copiedField === 'services' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {!record.services_info_str?.trim() ? (
                <div className="p-4 bg-slate-50 rounded-lg text-slate-500 text-xs text-center">
                  Không có dữ liệu dịch vụ cho gói thầu này.
                </div>
              ) : showRawText['services'] ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
                  <HighlightText
                    text={record.services_info_str}
                    matchedTerms={allMatchedTerms}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {serviceItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/30 text-xs space-y-1.5"
                    >
                      <div className="font-bold text-slate-900 text-sm flex items-start justify-between gap-2">
                        <span>
                          <span className="text-indigo-700 mr-1.5">#{idx + 1}</span>
                          <HighlightText
                            text={item.description || item.rawText}
                            matchedTerms={allMatchedTerms}
                          />
                        </span>
                        {item.price && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300 shrink-0 flex items-center gap-1 text-xs">
                              <Coins className="w-3.5 h-3.5 text-slate-500" />
                              <span>Đơn giá: {formatCurrency(item.price, record.bid_price_unit || 'VND')}</span>
                            </span>
                            <span className="font-mono font-bold text-indigo-900 bg-indigo-100/90 px-2.5 py-1 rounded-md border border-indigo-300 shrink-0 flex items-center gap-1 shadow-2xs text-xs">
                              <Coins className="w-3.5 h-3.5 text-indigo-600" />
                              <span>
                                Số tiền:{' '}
                                {formatCurrency(
                                  parseNumericPrice(item.price) * parseQuantityNumber(item.quantity),
                                  record.bid_price_unit || 'VND'
                                )}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 pt-1">
                        {item.item && (
                          <div>
                            <span className="text-slate-400 block text-[11px]">Hạng mục/Mục:</span>
                            <span className="font-medium text-slate-800">
                              <HighlightText
                                text={item.item}
                                matchedTerms={allMatchedTerms}
                              />
                            </span>
                          </div>
                        )}
                        {item.quantity && (
                          <div>
                            <span className="text-slate-400 block text-[11px]">Số lượng:</span>
                            <span className="font-medium text-slate-800">
                              <HighlightText
                                text={cleanQuantity(item.quantity)}
                                matchedTerms={allMatchedTerms}
                              />
                            </span>
                          </div>
                        )}
                        {item.unit && (
                          <div>
                            <span className="text-slate-400 block text-[11px]">Đơn vị tính:</span>
                            <span className="font-medium text-slate-800">
                              <HighlightText
                                text={item.unit}
                                matchedTerms={allMatchedTerms}
                              />
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 pt-1 border-t border-indigo-100/60 font-mono">
                        <HighlightText
                          text={item.rawText}
                          matchedTerms={allMatchedTerms}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION D: Personnel Requirements */}
          {(activeTab === 'all' || activeTab === 'persons') && (
            <div className="bg-white rounded-xl border border-purple-200 p-4 sm:p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      D. Yêu cầu nhân sự (persons_info_str)
                    </h3>
                    <span className="text-xs text-slate-500">
                      {personItems.length > 0
                        ? `Nhận diện ${personItems.length} vị trí nhân sự chủ chốt`
                        : 'Không có yêu cầu nhân sự trong gói thầu này'}
                    </span>
                  </div>
                </div>

                {record.persons_info_str && (
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => toggleShowRaw('persons')}
                      className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                    >
                      {showRawText['persons'] ? 'Hiện dạng thẻ' : 'Xem nguyên văn'}
                    </button>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(record.persons_info_str || '', 'persons')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-medium transition-colors cursor-pointer"
                    >
                      {copiedField === 'persons' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-purple-600" />
                          <span>Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {!record.persons_info_str?.trim() ? (
                <div className="p-4 bg-slate-50 rounded-lg text-slate-500 text-xs text-center">
                  Không có dữ liệu nhân sự cho gói thầu này.
                </div>
              ) : showRawText['persons'] ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
                  <HighlightText
                    text={record.persons_info_str}
                    matchedTerms={allMatchedTerms}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {personItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-purple-200/90 bg-purple-50/30 text-xs space-y-2.5 shadow-xs"
                    >
                      {/* Position Title */}
                      <div className="flex items-start justify-between gap-2 border-b border-purple-100 pb-2">
                        <div className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <HighlightText
                            text={item.position || item.rawText}
                            matchedTerms={allMatchedTerms}
                          />
                        </div>

                        {item.quantity && (
                          <span className="font-semibold text-purple-900 bg-purple-100 px-2 py-0.5 rounded text-xs shrink-0">
                            SL: {cleanQuantity(item.quantity)}
                          </span>
                        )}
                      </div>

                      {/* Criteria Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1 text-slate-700">
                        {item.yearsOfExp && (
                          <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                            <span className="text-slate-400 block text-[11px] font-medium">
                              Số năm kinh nghiệm:
                            </span>
                            <span className="font-semibold text-slate-900">
                              <HighlightText
                                text={item.yearsOfExp}
                                matchedTerms={allMatchedTerms}
                              />
                            </span>
                          </div>
                        )}

                        {item.contractCount && (
                          <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                            <span className="text-slate-400 block text-[11px] font-medium">
                              Số hợp đồng tương tự:
                            </span>
                            <span className="font-semibold text-slate-900">
                              <HighlightText
                                text={item.contractCount}
                                matchedTerms={allMatchedTerms}
                              />
                            </span>
                          </div>
                        )}

                        {item.major && (
                          <div className="bg-white p-2.5 rounded-lg border border-purple-100 sm:col-span-2 md:col-span-1">
                            <span className="text-slate-400 block text-[11px] font-medium">
                              Chuyên ngành / Bằng cấp:
                            </span>
                            <span className="font-semibold text-slate-900">
                              <HighlightText
                                text={item.major}
                                matchedTerms={allMatchedTerms}
                              />
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Certificates */}
                      {item.certificates && (
                        <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-2.5 text-amber-950">
                          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide block mb-0.5">
                            Chứng chỉ & Bằng cấp yêu cầu:
                          </span>
                          <span className="font-medium text-xs leading-relaxed">
                            <HighlightText
                              text={item.certificates}
                              matchedTerms={allMatchedTerms}
                            />
                          </span>
                        </div>
                      )}

                      {/* Other Requirements */}
                      {item.otherRequirements && (
                        <div className="bg-white p-2.5 rounded-lg border border-purple-100 text-slate-700">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-0.5">
                            Yêu cầu khác / Điều kiện năng lực:
                          </span>
                          <span className="text-xs leading-relaxed">
                            <HighlightText
                              text={item.otherRequirements}
                              matchedTerms={allMatchedTerms}
                            />
                          </span>
                        </div>
                      )}

                      {/* Raw block preservation */}
                      <div className="text-[11px] text-slate-500 pt-1.5 border-t border-purple-100/70 font-mono">
                        <HighlightText
                          text={item.rawText}
                          matchedTerms={allMatchedTerms}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION RAW: 51 columns viewer */}
          {activeTab === 'raw' && record.raw_data && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
              <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
                <TableProperties className="w-4 h-4 text-slate-600" />
                Toàn bộ dữ liệu gốc Excel ({Object.keys(record.raw_data).length} cột)
              </h3>
              <div className="overflow-x-auto max-h-96 border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0">
                    <tr>
                      <th className="p-2 border-b border-slate-200 font-semibold w-1/3">
                        Tên cột gốc
                      </th>
                      <th className="p-2 border-b border-slate-200 font-semibold">Giá trị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(record.raw_data).map(([col, val], idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-mono text-slate-600 font-medium">{col}</td>
                        <td className="p-2 text-slate-800 break-words max-w-md">
                          {String(val ?? '')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Dữ liệu gói thầu: <span className="font-medium text-slate-700">{record.plan_no}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Đóng chi tiết
          </button>
        </div>
      </div>
    </div>
  );
};
