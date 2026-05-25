'use client';

import React, { useState, useEffect } from 'react';
import { getAttributeIconComponent } from '../_lib/iconRegistry';
import { Card, CardContent } from '../../../components/ui font-mono';
import { Button } from '../../../components/ui';
import { ChevronDown, Check } from 'lucide-react';

interface AttributeGroupPreviewProps {
  name: string;
  filterType: string;
  inputType: string;
  iconName?: string;
  iconColor?: string;
}

export function AttributeGroupPreview({
  name,
  filterType,
  inputType,
  iconName = 'Wine',
  iconColor = '#ea580c'
}: AttributeGroupPreviewProps) {
  // Lấy Icon component động
  const IconComponent = getAttributeIconComponent(iconName);

  // States giả lập chọn trị thuộc tính
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Reset selected terms when switching filter type
  useEffect(() => {
    setSelectedTerms([]);
    setIsDropdownOpen(false);
  }, [filterType, inputType]);

  const displayGroupName = name.trim() || 'Tên nhóm thuộc tính';

  // Mockup data cho từng loại
  const mockOptions = {
    select: [
      { id: '1', label: 'Tất cả', value: 'all' },
      { id: '2', label: 'Giá trị A', value: 'a' },
      { id: '3', label: 'Giá trị B', value: 'b' },
      { id: '4', label: 'Giá trị C', value: 'c' },
    ],
    buttons: [
      { id: 's', label: 'Size S', value: 'S' },
      { id: 'm', label: 'Size M', value: 'M' },
      { id: 'l', label: 'Size L', value: 'L' },
      { id: 'xl', label: 'Size XL', value: 'XL' },
    ],
    color: [
      { id: 'c1', label: 'Đỏ', color: '#ef4444' },
      { id: 'c2', label: 'Xanh', color: '#3b82f6' },
      { id: 'c3', label: 'Vàng', color: '#eab308' },
      { id: 'c4', label: 'Đen', color: '#0f172a' },
    ],
    radio: [
      { id: 'r1', label: 'Dưới 500k', value: 'under-500' },
      { id: 'r2', label: 'Từ 500k - 1tr', value: '500-1000' },
      { id: 'r3', label: 'Trên 1tr', value: 'over-1000' },
    ]
  };

  const handleSelectTerm = (id: string) => {
    if (filterType === 'multiple') {
      setSelectedTerms(prev => 
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    } else {
      setSelectedTerms(prev => prev.includes(id) ? [] : [id]);
    }
  };

  const getDropdownLabel = () => {
    if (selectedTerms.length === 0) return 'Chọn giá trị...';
    const found = mockOptions.select.filter(item => selectedTerms.includes(item.id));
    if (found.length === 0) return 'Chọn giá trị...';
    return found.map(f => f.label).join(', ');
  };

  return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full">
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Xem trước giao diện bộ lọc (Live Preview)</h3>
          <p className="text-xs text-slate-500">Mô phỏng cách bộ lọc này hoạt động ngoài trang chủ</p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase tracking-wider">Trực quan</span>
      </div>

      <CardContent className="p-6 space-y-6 flex flex-col justify-between h-[calc(100%-60px)]">
        {/* Giả lập Sidebar Filter Card */}
        <div className="border border-slate-100 dark:border-slate-800/80 rounded-xl p-5 bg-white dark:bg-slate-950 shadow-sm space-y-4 max-w-sm mx-auto w-full">
          
          {/* Header nhóm thuộc tính */}
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/50">
            <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <IconComponent size={18} style={{ color: iconColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{displayGroupName}</h4>
              <p className="text-[10px] text-slate-400 font-medium">
                {filterType === 'multiple' ? 'Cho phép chọn nhiều' : 'Chỉ chọn một'}
              </p>
            </div>
          </div>

          {/* Body các kiểu hiển thị */}
          <div className="pt-1">
            {/* Kiểu DROPDOWN SELECT */}
            {inputType === 'select' && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between h-10 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all font-medium text-slate-700 dark:text-slate-300"
                >
                  <span className="truncate">{getDropdownLabel()}</span>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 z-20 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-1 space-y-0.5">
                    {mockOptions.select.map(opt => {
                      const isSelected = selectedTerms.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            handleSelectTerm(opt.id);
                            if (filterType !== 'multiple') setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md text-left transition-all ${
                            isSelected 
                              ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-semibold' 
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check size={14} className="text-orange-500" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Kiểu BUTTONS */}
            {inputType === 'buttons' && (
              <div className="flex flex-wrap gap-2">
                {mockOptions.buttons.map(opt => {
                  const isSelected = selectedTerms.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectTerm(opt.id)}
                      className={`h-9 px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/30'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Kiểu COLOR */}
            {inputType === 'color' && (
              <div className="flex flex-wrap gap-3">
                {mockOptions.color.map(opt => {
                  const isSelected = selectedTerms.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectTerm(opt.id)}
                      title={opt.label}
                      className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-orange-500 scale-110 ring-2 ring-orange-500/40 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:scale-105'
                      }`}
                      style={{ backgroundColor: opt.color }}
                    >
                      {isSelected && (
                        <Check size={14} className={opt.color === '#eab308' ? 'text-slate-900' : 'text-white'} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Kiểu RADIO */}
            {inputType === 'radio' && (
              <div className="space-y-2">
                {mockOptions.radio.map(opt => {
                  const isSelected = selectedTerms.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectTerm(opt.id)}
                      className="w-full flex items-center gap-3 py-1.5 text-xs text-left text-slate-700 dark:text-slate-300 group hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    >
                      {/* Giả lập nút radio/checkbox */}
                      <div className={`w-4 h-4 flex items-center justify-center transition-all ${
                        filterType === 'multiple' 
                          ? 'rounded border' 
                          : 'rounded-full border'
                      } ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-500 text-white' 
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 group-hover:border-slate-400'
                      }`}>
                        {isSelected && (
                          <div className={filterType === 'multiple' ? '' : 'w-1.5 h-1.5 rounded-full bg-white'} >
                            {filterType === 'multiple' && <Check size={12} className="stroke-[3]" />}
                          </div>
                        )}
                      </div>
                      <span className={`${isSelected ? 'font-semibold text-slate-900 dark:text-slate-100' : ''}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Note chú thích bên dưới */}
        <div className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 rounded-lg p-3 max-w-sm mx-auto w-full italic">
          💡 **Mẹo:** Bạn có thể nhấp chuột trực tiếp vào các nút hoặc dropdown xem trước ở trên để trải nghiệm thử cách admin/khách hàng tương tác với bộ lọc.
        </div>
      </CardContent>
    </Card>
  );
}
