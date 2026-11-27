import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Building2,
  Briefcase,
  ChevronRight,
  Package,
  Wrench,
  Users,
  Coins,
  MapPin,
  ExternalLink,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SearchResultItem, ParsedGoodsItem, ParsedServiceItem } from '../types/tender';
import { HighlightText } from './HighlightText';
import { parseGoodsInfo, parseServicesInfo, cleanQuantity } from '../utils/itemParser';
import { removeVietnameseAccents } from '../utils/textNormalizer';

interface ResultCardProps {
  item: SearchResultItem;
  onSelect: () => void;
  allMatchedTerms: string[];
}

export const ResultCard: React.FC<ResultCardProps> = ({
  item,
  onSelect,
  allMatchedTerms,
}) => {
  const { record, matches, snippets } = item;
  const [showAllGoods, setShowAllGoods] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);

  const goodsItems = useMemo(
    () => parseGoodsInfo(record.goods_info_str),
    [record.goods_info_str]
  );

  const servicesItems = useMemo(
    () => parseServicesInfo(record.services_info_str),
    [record.services_info_str]
  );

  // Helper to check if a goods item matches the search keywords
  const isGoodsItemMatched = (g: ParsedGoodsItem, terms: string[]): boolean => {
    if (!terms || terms.length === 0) return false;
    const targetText = removeVietnameseAccents(
      `${g.name || ''} ${g.origin || ''} ${g.quantity || ''} ${g.unit || ''} ${g.price || ''} ${g.rawText || ''}`
    ).toLowerCase();

    return terms.some((term) => {
      const cleanTerm = removeVietnameseAccents(term).toLowerCase().trim();
      return cleanTerm.length > 0 && targetText.includes(cleanTerm);
    });
  };

  // Helper to check if a service item matches search keywords
  const isServiceItemMatched = (s: ParsedServiceItem, terms: string[]): boolean => {
    if (!terms || terms.length === 0) return false;
    const targetText = removeVietnameseAccents(
      `${s.description || ''} ${s.item || ''} ${s.quantity || ''} ${s.unit || ''} ${s.price || ''} ${s.rawText || ''}`
    ).toLowerCase();

    return terms.some((term) => {
      const cleanTerm = removeVietnameseAccents(term).toLowerCase().trim();
      return cleanTerm.length > 0 && targetText.includes(cleanTerm);
    });
  };

  // Goods indexed and sorted to bring matching items to the top
  const indexedGoods = useMemo(() => {
    return goodsItems.map((g, idx) => ({
      ...g,
      originalIndex: idx + 1,
      isMatched: isGoodsItemMatched(g, allMatchedTerms),
    }));
  }, [goodsItems, allMatchedTerms]);

  const sortedGoods = useMemo(() => {
    return [...indexedGoods].sort((a, b) => {
      if (a.isMatched && !b.isMatched) return -1;
      if (!a.isMatched && b.isMatched) return 1;
      return a.originalIndex - b.originalIndex;
    });
  }, [indexedGoods]);

  const visibleGoods = showAllGoods ? sortedGoods : sortedGoods.slice(0, 3);
  const matchedGoodsCount = indexedGoods.filter((g) => g.isMatched).length;

  // Services indexed and sorted
  const indexedServices = useMemo(() => {
    return servicesItems.map((s, idx) => ({
      ...s,
      originalIndex: idx + 1,
      isMatched: isServiceItemMatched(s, allMatchedTerms),
    }));
  }, [servicesItems, allMatchedTerms]);

  const sortedServices = useMemo(() => {
    return [...indexedServices].sort((a, b) => {
      if (a.isMatched && !b.isMatched) return -1;
      if (!a.isMatched && b.isMatched) return 1;
      return a.originalIndex - b.originalIndex;
    });
  }, [indexedServices]);

  const visibleServices = showAllServices ? sortedServices : sortedServices.slice(0, 3);
  const matchedServicesCount = indexedServices.filter((s) => s.isMatched).length;

  const formatCurrency = (val?: number | string, defaultUnit = 'VND') => {
    if (val === undefined || val === null || val === '') return null;
    if (typeof val === 'number') {
      if (isNaN(val)) return null;
      return `${Math.trunc(val).toLocaleString('vi-VN')} ${defaultUnit}`.trim();
    }
    let str = String(val).trim();
    if (!str) return null;

    // Check if unit is attached at end (e.g., "150000000.00 VND")
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
    <div
      onClick={onSelect}
      className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group relative flex flex-col justify-between"
    >
      <div>
        {/* Top Badges & Plan No */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {record.plan_no && (
              <span className="font-mono text-sm font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {record.plan_no}
              </span>
            )}

            {/* Field Match Badges */}
            {matches.goods && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                Hàng hóa
              </span>
            )}

            {matches.services && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-md">
                <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                Dịch vụ
              </span>
            )}

            {matches.persons && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 px-2 py-0.5 rounded-md">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                Nhân sự
              </span>
            )}
          </div>

          {record.original_public_date && (
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {record.original_public_date}
            </span>
          )}
        </div>

        {/* Main Title: bid_name */}
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug line-clamp-2 mb-2">
          <HighlightText
            text={record.bid_name || 'Gói thầu không có tên tiêu đề'}
            matchedTerms={allMatchedTerms}
          />
        </h3>

        {/* Key Metadata Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 text-sm text-slate-600 mb-3 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
          {record.project_name && (
            <div className="flex items-start gap-1.5 col-span-1 sm:col-span-2">
              <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span className="line-clamp-1">
                <strong className="text-slate-700">Dự án:</strong>{' '}
                <HighlightText text={record.project_name} matchedTerms={allMatchedTerms} />
              </span>
            </div>
          )}

          {record.procuring_entity_name && (
            <div className="flex items-start gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span className="line-clamp-1">
                <strong className="text-slate-700">Bên mời thầu:</strong>{' '}
                {record.procuring_entity_name}
              </span>
            </div>
          )}

          {record.bid_price && (
            <div className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                <strong className="text-slate-700">Giá gói thầu:</strong>{' '}
                <span className="font-semibold text-emerald-700">
                  {formatCurrency(record.bid_price, record.bid_price_unit)}
                </span>
              </span>
            </div>
          )}
          {record.invest_field && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              <span>
                <strong className="text-slate-700">Lĩnh vực:</strong> {record.invest_field}
              </span>
            </div>
          )}

          {record.province_code && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                <strong className="text-slate-700">Tỉnh/thành:</strong> {record.province_code}
              </span>
            </div>
          )}
        </div>

        {/* Snippets with highlights and full goods list */}
        {snippets && snippets.length > 0 && (
          <div className="space-y-2.5 mb-2">
            {snippets.map((snip, idx) => {
              let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
              if (snip.field === 'goods')
                badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
              else if (snip.field === 'services')
                badgeColor = 'bg-indigo-50 text-indigo-800 border-indigo-200';
              else if (snip.field === 'persons')
                badgeColor = 'bg-purple-50 text-purple-800 border-purple-200';

              // GOODS BOX: Display all goods in the tender bid with keyword highlight on matching items
              if (snip.field === 'goods' && goodsItems.length > 0) {
                return (
                  <div
                    key={idx}
                    className="text-sm bg-slate-50/95 rounded-xl p-3 border border-emerald-200/90 shadow-2xs space-y-2"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-emerald-100/90 pb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeColor}`}
                        >
                          {snip.label}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          Danh sách hàng hóa trong hồ sơ ({goodsItems.length} mục)
                        </span>
                        {matchedGoodsCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {matchedGoodsCount} mục đáp ứng tìm kiếm
                          </span>
                        )}
                      </div>

                      {snip.matchedTerms.length > 0 && (
                        <span className="text-xs text-slate-500 italic">
                          Từ khóa: {snip.matchedTerms.join(', ')}
                        </span>
                      )}
                    </div>

                    {/* List of ALL goods items in tender */}
                    <div className="space-y-2">
                      {visibleGoods.map((g) => (
                        <div
                          key={g.originalIndex}
                          className={`p-2.5 rounded-xl border transition-all text-base ${
                            g.isMatched
                              ? 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-300/60 shadow-2xs'
                              : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-semibold text-slate-900 leading-snug">
                              <span
                                className={`inline-block mr-1.5 font-mono text-sm font-bold ${
                                  g.isMatched ? 'text-emerald-800' : 'text-slate-400'
                                }`}
                              >
                                #{g.originalIndex}
                              </span>
                              <HighlightText
                                text={g.name || g.rawText}
                                matchedTerms={allMatchedTerms}
                              />
                            </div>

                            {g.isMatched && (
                              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-1.5 py-0.5 rounded shrink-0 shadow-2xs">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Khớp</span>
                              </span>
                            )}
                          </div>

                          {/* Attributes: Price, Quantity, Unit, Origin */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-sm">
                            {g.price && (
                              <div className="inline-flex items-center gap-1 font-mono font-bold text-emerald-900 bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-300 shadow-2xs">
                                <Coins className="w-3 h-3 text-emerald-600" />
                                <span>Đơn giá:</span>
                                <span>{formatCurrency(g.price, record.bid_price_unit || 'VND')}</span>
                              </div>
                            )}

                            {(g.quantity || g.unit) && (
                              <div className="inline-flex items-center gap-1 text-slate-700 bg-slate-100/70 px-2 py-0.5 rounded border border-slate-200/70">
                                <span className="text-slate-400">Số lượng:</span>
                                <span className="font-semibold text-slate-800">
                                  <HighlightText
                                    text={`${cleanQuantity(g.quantity)} ${g.unit || ''}`.trim()}
                                    matchedTerms={allMatchedTerms}
                                  />
                                </span>
                              </div>
                            )}

                            {g.price && (
                              <div className="inline-flex items-center gap-1 font-mono font-bold text-emerald-900 bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-300 shadow-2xs">
                                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Số tiền:</span>
                                <span>
                                  {formatCurrency(
                                    parseNumericPrice(g.price) * parseQuantityNumber(g.quantity),
                                    record.bid_price_unit || 'VND'
                                  )}
                                </span>
                              </div>
                            )}

                            {g.origin && (
                              <div className="inline-flex items-center gap-1 text-slate-700 bg-slate-100/70 px-2 py-0.5 rounded border border-slate-200/70">
                                <span className="text-slate-400">Xuất xứ:</span>
                                <span className="font-semibold text-slate-800">
                                  <HighlightText
                                    text={g.origin}
                                    matchedTerms={allMatchedTerms}
                                  />
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Expand/Collapse Toggle Button for Goods */}
                    {goodsItems.length > 3 && (
                      <div className="pt-1 flex justify-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAllGoods(!showAllGoods);
                          }}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-100/80 hover:bg-emerald-200/90 px-3 py-1 rounded-lg border border-emerald-300 transition-colors cursor-pointer"
                        >
                          {showAllGoods ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              <span>Thu gọn danh sách hàng hóa</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>
                                Xem tất cả {goodsItems.length} hàng hóa trong hồ sơ ({goodsItems.length - 3} mục khác)
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              // SERVICES BOX: Display full services list if applicable
              if (snip.field === 'services' && servicesItems.length > 0) {
                return (
                  <div
                    key={idx}
                    className="text-sm bg-slate-50/95 rounded-xl p-3 border border-indigo-200/90 shadow-2xs space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-indigo-100/90 pb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeColor}`}
                        >
                          {snip.label}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          Danh sách dịch vụ trong hồ sơ ({servicesItems.length} mục)
                        </span>
                        {matchedServicesCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-800 bg-indigo-100 border border-indigo-300 px-1.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                            {matchedServicesCount} mục đáp ứng tìm kiếm
                          </span>
                        )}
                      </div>

                      {snip.matchedTerms.length > 0 && (
                        <span className="text-xs text-slate-500 italic">
                          Từ khóa: {snip.matchedTerms.join(', ')}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {visibleServices.map((s) => (
                        <div
                          key={s.originalIndex}
                          className={`p-2.5 rounded-xl border transition-all text-base ${
                            s.isMatched
                              ? 'bg-indigo-50/90 border-indigo-300 ring-1 ring-indigo-300/60 shadow-2xs'
                              : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-semibold text-slate-900 leading-snug">
                              <span
                                className={`inline-block mr-1.5 font-mono text-sm font-bold ${
                                  s.isMatched ? 'text-indigo-800' : 'text-slate-400'
                                }`}
                              >
                                #{s.originalIndex}
                              </span>
                              <HighlightText
                                text={s.description || s.rawText}
                                matchedTerms={allMatchedTerms}
                              />
                            </div>

                            {s.isMatched && (
                              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-indigo-800 bg-indigo-100/90 border border-indigo-300 px-1.5 py-0.5 rounded shrink-0 shadow-2xs">
                                <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                                <span>Khớp</span>
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-sm">
                            {s.price && (
                              <div className="inline-flex items-center gap-1 font-mono font-bold text-indigo-900 bg-indigo-100/90 px-2 py-0.5 rounded border border-indigo-300 shadow-2xs">
                                <Coins className="w-3 h-3 text-indigo-600" />
                                <span>Đơn giá:</span>
                                <span>{formatCurrency(s.price, record.bid_price_unit || 'VND')}</span>
                              </div>
                            )}

                            {(s.quantity || s.unit) && (
                              <div className="inline-flex items-center gap-1 text-slate-700 bg-slate-100/70 px-2 py-0.5 rounded border border-slate-200/70">
                                <span className="text-slate-400">Số lượng:</span>
                                <span className="font-semibold text-slate-800">
                                  <HighlightText
                                    text={`${cleanQuantity(s.quantity)} ${s.unit || ''}`.trim()}
                                    matchedTerms={allMatchedTerms}
                                  />
                                </span>
                              </div>
                            )}

                            {s.price && (
                              <div className="inline-flex items-center gap-1 font-mono font-bold text-indigo-900 bg-indigo-100/90 px-2 py-0.5 rounded border border-indigo-300 shadow-2xs">
                                <Coins className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Số tiền:</span>
                                <span>
                                  {formatCurrency(
                                    parseNumericPrice(s.price) * parseQuantityNumber(s.quantity),
                                    record.bid_price_unit || 'VND'
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {servicesItems.length > 3 && (
                      <div className="pt-1 flex justify-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAllServices(!showAllServices);
                          }}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-800 hover:text-indigo-950 bg-indigo-100/80 hover:bg-indigo-200/90 px-3 py-1 rounded-lg border border-indigo-300 transition-colors cursor-pointer"
                        >
                          {showAllServices ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              <span>Thu gọn danh sách dịch vụ</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>
                                Xem tất cả {servicesItems.length} dịch vụ trong hồ sơ ({servicesItems.length - 3} mục khác)
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              // Standard Snippet fallback (e.g. for persons, general or unparsed text)
              return (
                <div
                  key={idx}
                  className="text-base bg-slate-50/90 rounded-lg p-2.5 border border-slate-200/70"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badgeColor}`}
                    >
                      {snip.label}
                    </span>
                    <span className="text-sm text-slate-500">
                      Trích đoạn khớp ({snip.matchedTerms.join(', ')})
                    </span>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-sans">
                    <HighlightText text={snip.snippet} matchedTerms={allMatchedTerms} />
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer / Call to action */}
      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-sm">
        <div className="text-slate-500 flex items-center gap-2">
          {record.tbmt_url && (
            <a
              href={record.tbmt_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
            >
              <span>Muasamcong</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <button
          type="button"
          onClick={onSelect}
          className="inline-flex items-center gap-1 font-semibold text-blue-600 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all cursor-pointer"
        >
          <span>Xem chi tiết đầy đủ</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
