'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2, GripVertical, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { Badge, Button, Card, CardContent, Input, Label, cn } from '../../../components/ui';
import { IconPopoverPicker } from '../../../home-components/_shared/components/IconPopoverPicker';
import { ATTRIBUTE_ICON_OPTIONS } from '../../_lib/iconRegistry';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AttributeGroupPreview, getSmartRangeConfig, normalizeRangeConfig } from '../../_components/AttributeGroupPreview';
import { useUnsavedGuard } from '../../../home-components/_shared/hooks/useUnsavedGuard';
import { HomeComponentStickyFooter } from '../../../home-components/_shared/components/HomeComponentStickyFooter';


export default function AttributeGroupEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const groupData = useQuery(api.attributeGroups.getById, { id: id as Id<"attributeGroups"> });
  const updateGroup = useMutation(api.attributeGroups.update);
  const assignedTypes = useQuery(api.attributeGroups.listAssignedProductTypes, { groupId: id as Id<"attributeGroups"> });
  const assignedType = assignedTypes?.find(type => type.active) ?? assignedTypes?.[0] ?? null;

  // Query site brand colors
  const primarySetting = useQuery(api.settings.getByKey, { key: 'site_brand_primary' });
  const secondarySetting = useQuery(api.settings.getByKey, { key: 'site_brand_secondary' });
  
  // Query terms thực tế của nhóm thuộc tính
  const terms = useQuery(api.attributeTerms.listByGroup, { groupId: id as Id<"attributeGroups"> });

  const brandPrimary = (primarySetting?.value as string) || '#ea580c';
  const brandSecondary = (secondarySetting?.value as string) || '#475569';

  const colorPresets = [
    { label: 'Đen', value: '#000000', class: 'bg-black border-black text-white' },
    { label: 'Trắng', value: '#ffffff', class: 'bg-white border-slate-200 text-slate-800' },
    { label: 'Màu chính', value: brandPrimary, class: 'text-white', style: { backgroundColor: brandPrimary, borderColor: brandPrimary } },
    { label: 'Màu phụ', value: brandSecondary, class: 'text-white', style: { backgroundColor: brandSecondary, borderColor: brandSecondary } }
  ];

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [slug, setSlug] = useState('');
  const [filterType, setFilterType] = useState('single');
  const [inputType, setInputType] = useState('select');
  const [isFilterable, setIsFilterable] = useState(true);
  const [iconName, setIconName] = useState('Wine');
  const [iconColor, setIconColor] = useState('#ea580c');
  const [rangeMin, setRangeMin] = useState(0);
  const [rangeMax, setRangeMax] = useState(100);
  const [rangeStep, setRangeStep] = useState(1);
  const [rangeUnit, setRangeUnit] = useState('');
  const [rangeDefaultMin, setRangeDefaultMin] = useState(0);
  const [rangeDefaultMax, setRangeDefaultMax] = useState(100);
  const [rangeTouched, setRangeTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const savedDisplayConfig = groupData?.displayConfig && typeof groupData.displayConfig === 'object' && !Array.isArray(groupData.displayConfig)
    ? groupData.displayConfig as Record<string, unknown>
    : {};
  const savedRangeConfig = savedDisplayConfig.range && typeof savedDisplayConfig.range === 'object' && !Array.isArray(savedDisplayConfig.range)
    ? savedDisplayConfig.range
    : undefined;
  const smartRangeConfig = useMemo(() => getSmartRangeConfig(name, terms ?? []), [name, terms]);
  const rangeConfig = useMemo(() => normalizeRangeConfig({
    min: rangeMin,
    max: rangeMax,
    step: rangeStep,
    unit: rangeUnit,
    defaultMin: rangeDefaultMin,
    defaultMax: rangeDefaultMax,
  }, smartRangeConfig), [rangeDefaultMax, rangeDefaultMin, rangeMax, rangeMin, rangeStep, rangeUnit, smartRangeConfig]);
  const savedNormalizedRangeConfig = useMemo(
    () => normalizeRangeConfig(savedRangeConfig, smartRangeConfig),
    [savedRangeConfig, smartRangeConfig]
  );
  const rangeHasChanges = filterType === 'range' && (
    rangeTouched || (savedRangeConfig !== undefined && JSON.stringify(rangeConfig) !== JSON.stringify(savedNormalizedRangeConfig))
  );

  const hasChanges = groupData ? (
    name !== groupData.name ||
    slug !== groupData.slug ||
    code !== groupData.code ||
    filterType !== groupData.filterType ||
    inputType !== groupData.inputType ||
    isFilterable !== (groupData.isFilterable ?? true) ||
    iconName !== (groupData.iconPath ?? 'Wine') ||
    iconColor !== (groupData.displayConfig?.iconColor ?? groupData.displayConfig?.color ?? '#ea580c') ||
    rangeHasChanges
  ) : false;

  useUnsavedGuard(hasChanges);

  useEffect(() => {
    if (groupData) {
      setName(groupData.name);
      setCode(groupData.code);
      setSlug(groupData.slug);
      setFilterType(groupData.filterType);
      setInputType(groupData.inputType);
      setIsFilterable(groupData.isFilterable ?? true);
      setIconName(groupData.iconPath ?? 'Wine');
      setIconColor(groupData.displayConfig?.iconColor ?? groupData.displayConfig?.color ?? '#ea580c');
      const initialRange = normalizeRangeConfig(
        groupData.displayConfig?.range && typeof groupData.displayConfig.range === 'object' ? groupData.displayConfig.range : undefined,
        getSmartRangeConfig(groupData.name)
      );
      setRangeMin(initialRange.min);
      setRangeMax(initialRange.max);
      setRangeStep(initialRange.step);
      setRangeUnit(initialRange.unit);
      setRangeDefaultMin(initialRange.defaultMin);
      setRangeDefaultMax(initialRange.defaultMax);
      setRangeTouched(Boolean(groupData.displayConfig?.range));
    }
  }, [groupData]);

  useEffect(() => {
    if (filterType !== 'range' || rangeTouched || savedRangeConfig !== undefined) {return;}
    setRangeMin(smartRangeConfig.min);
    setRangeMax(smartRangeConfig.max);
    setRangeStep(smartRangeConfig.step);
    setRangeUnit(smartRangeConfig.unit);
    setRangeDefaultMin(smartRangeConfig.defaultMin);
    setRangeDefaultMax(smartRangeConfig.defaultMax);
  }, [filterType, rangeTouched, savedRangeConfig, smartRangeConfig]);

  const markRangeTouched = () => setRangeTouched(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {return;}

    setIsSubmitting(true);
    try {
      const { range: _range, ...displayConfigWithoutRange } = savedDisplayConfig;
      await updateGroup({
        id: id as Id<"attributeGroups">,
        name: name.trim(),
        code: code.trim(),
        slug: slug.trim(),
        filterType,
        inputType,
        isFilterable,
        iconPath: iconName,
        displayConfig: {
          ...displayConfigWithoutRange,
          iconColor,
          color: iconColor,
          ...(filterType === 'range' ? { range: rangeConfig } : {}),
        },
      });
      toast.success('Cập nhật nhóm thuộc tính thành công');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể cập nhật nhóm thuộc tính'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (groupData === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (groupData === null) {
    return (
      <div className="text-center py-8 text-slate-500">
        Không tìm thấy nhóm thuộc tính
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa nhóm thuộc tính</h1>
          <Link href="/admin/attribute-groups" className="text-sm text-orange-600 hover:underline">
            Quay lại danh sách
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5">
          <Card className="w-full">
            <form onSubmit={handleSubmit}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Tên nhóm thuộc tính <span className="text-red-500">*</span></Label>
                  <Input 
                    value={name} 
                    onChange={(e) =>{  setName(e.target.value); }} 
                    required 
                    placeholder="Nhập tên nhóm thuộc tính..." 
                    autoFocus 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input 
                    value={slug} 
                    onChange={(e) =>{  setSlug(e.target.value); }} 
                    placeholder="slug" 
                    className="font-mono text-sm" 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mã (Code) <span className="text-red-500">*</span></Label>
                  <Input 
                    value={code} 
                    onChange={(e) => setCode(e.target.value)} 
                    required 
                    placeholder="VD: color, size..." 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Kiểu lọc</Label>
                  <select 
                    value={filterType}
                    onChange={(e) => {
                      const nextFilterType = e.target.value;
                      setFilterType(nextFilterType);
                      if (nextFilterType === 'range' && savedRangeConfig === undefined) {
                        setRangeTouched(false);
                      }
                    }}
                    className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    <option value="single">Một lựa chọn (Single)</option>
                    <option value="multiple">Nhiều lựa chọn (Multiple)</option>
                    <option value="range">Khoảng giá trị (Range)</option>
                  </select>
                </div>

                {filterType !== 'range' && (
                  <div className="space-y-2">
                    <Label>Kiểu hiển thị</Label>
                    <select 
                      value={inputType}
                      onChange={(e) => setInputType(e.target.value)}
                      className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    >
                      <option value="select">Dropdown (Select)</option>
                      <option value="buttons">Các nút bấm (Buttons)</option>
                      <option value="radio">Nút tròn (Radio)</option>
                    </select>
                  </div>
                )}

                {filterType === 'range' && (
                  <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/40">
                    <div>
                      <Label>Cấu hình khoảng giá trị</Label>
                      <p className="text-xs text-slate-500">Tự gợi ý theo tên nhóm, nhưng bạn có thể chỉnh cho dung tích, nồng độ, giá, điểm số...</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Min</Label>
                        <Input type="number" value={rangeMin} onChange={(e) => { markRangeTouched(); setRangeMin(Number(e.target.value)); }} />
                      </div>
                      <div className="space-y-1">
                        <Label>Max</Label>
                        <Input type="number" value={rangeMax} onChange={(e) => { markRangeTouched(); setRangeMax(Number(e.target.value)); }} />
                      </div>
                      <div className="space-y-1">
                        <Label>Bước nhảy</Label>
                        <Input type="number" value={rangeStep} onChange={(e) => { markRangeTouched(); setRangeStep(Number(e.target.value)); }} />
                      </div>
                      <div className="space-y-1">
                        <Label>Đơn vị</Label>
                        <Input value={rangeUnit} onChange={(e) => { markRangeTouched(); setRangeUnit(e.target.value); }} placeholder="ml, %, ₫, điểm..." />
                      </div>
                      <div className="space-y-1">
                        <Label>Mặc định từ</Label>
                        <Input type="number" value={rangeDefaultMin} onChange={(e) => { markRangeTouched(); setRangeDefaultMin(Number(e.target.value)); }} />
                      </div>
                      <div className="space-y-1">
                        <Label>Mặc định đến</Label>
                        <Input type="number" value={rangeDefaultMax} onChange={(e) => { markRangeTouched(); setRangeDefaultMax(Number(e.target.value)); }} />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRangeTouched(true);
                        setRangeMin(smartRangeConfig.min);
                        setRangeMax(smartRangeConfig.max);
                        setRangeStep(smartRangeConfig.step);
                        setRangeUnit(smartRangeConfig.unit);
                        setRangeDefaultMin(smartRangeConfig.defaultMin);
                        setRangeDefaultMax(smartRangeConfig.defaultMax);
                      }}
                    >
                      Gợi ý lại theo tên nhóm
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Icon đại diện</Label>
                  <IconPopoverPicker 
                    value={iconName}
                    onChange={setIconName}
                    options={ATTRIBUTE_ICON_OPTIONS}
                    brandColor={iconColor}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Màu sắc icon</Label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {colorPresets.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setIconColor(p.value)}
                        style={p.style}
                        className={`px-3 py-1.5 rounded text-xs font-medium border transition-all ${p.class} ${iconColor === p.value ? 'ring-2 ring-orange-500 scale-105 shadow-md' : 'opacity-80 hover:opacity-100'}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="color" 
                      value={iconColor} 
                      onChange={(e) => setIconColor(e.target.value)} 
                      className="w-12 h-10 p-1 cursor-pointer border border-slate-200 rounded-md"
                    />
                    <Input 
                      type="text" 
                      value={iconColor} 
                      onChange={(e) => setIconColor(e.target.value)}
                      placeholder="#ea580c"
                      className="font-mono text-sm uppercase flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 h-10 border border-slate-100 dark:border-slate-800/50 rounded-md px-3 bg-white dark:bg-slate-900/50">
                    <input
                      type="checkbox"
                      id="isFilterable"
                      checked={isFilterable}
                      onChange={(e) => setIsFilterable(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <Label htmlFor="isFilterable" className="text-sm font-medium cursor-pointer select-none">
                      Hiển thị trong bộ lọc (Filter)
                    </Label>
                  </div>
                </div>
              </CardContent>
              
              <HomeComponentStickyFooter
                isSubmitting={isSubmitting}
                hasChanges={hasChanges}
                submitLabel="Lưu thay đổi"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => { router.push('/admin/attribute-groups'); }} 
                      disabled={isSubmitting}
                    >
                      Hủy bỏ
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Mở nhóm thuộc tính ngoài site"
                      onClick={() => {
                        const baseSlug = assignedType?.slug || 'products';
                        const url = `/${baseSlug}/${slug}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <ExternalLink size={16} />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={hasChanges === false || isSubmitting}
                      variant="accent"
                      className={cn(
                        hasChanges === false && !isSubmitting
                          ? 'bg-slate-300 hover:bg-slate-300 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-800 dark:text-slate-400'
                          : undefined
                      )}
                    >
                      {isSubmitting ? 'Đang lưu...' : hasChanges === false ? 'Đã lưu' : 'Lưu thay đổi'}
                    </Button>
                  </div>
                </div>
              </HomeComponentStickyFooter>
            </form>
          </Card>

          <Card className="mt-6">
            <CardContent className="p-6 space-y-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Loại sản phẩm đang dùng nhóm này</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nhóm thuộc tính chỉ tạo route SEO khi được gán vào ít nhất một loại sản phẩm.
                </p>
              </div>

              {assignedTypes === undefined ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 size={14} className="animate-spin" />
                  Đang tải loại sản phẩm...
                </div>
              ) : assignedTypes.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                  Chưa được gán vào loại sản phẩm nào. Route SEO dạng <span className="font-mono">/loai-san-pham/{slug}</span> chưa sẵn sàng để mở ngoài site.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {assignedTypes.map(type => (
                    <Link
                      key={type._id}
                      href={`/admin/product-types/${type._id}/edit`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-orange-300 hover:text-orange-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                    >
                      {type.name}
                      {!type.active && <Badge variant="secondary" className="text-[10px]">Ẩn</Badge>}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7 lg:sticky lg:top-6">
          <AttributeGroupPreview
            name={name}
            filterType={filterType}
            inputType={inputType}
            iconName={iconName}
            iconColor={iconColor}
            rangeConfig={filterType === 'range' ? rangeConfig : undefined}
            terms={terms}
          />
        </div>
      </div>

      <AttributeTermsManager groupId={id as Id<"attributeGroups">} terms={terms} groupSlug={slug} assignedTypeSlug={assignedType?.slug || null} />
    </div>
  );
}

interface SortableTermRowProps {
  term: {
    _id: Id<"attributeTerms">;
    name: string;
    slug: string;
    order: number;
  };
  onRemove: (id: Id<"attributeTerms">) => void;
  groupSlug: string;
  assignedTypeSlug: string | null;
}

function SortableTermRow({ term, onRemove, groupSlug, assignedTypeSlug }: SortableTermRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: term._id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex justify-between items-center p-3 border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/50",
        isDragging && "bg-slate-100 dark:bg-slate-800 opacity-80"
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>
        <div>
          <div className="font-medium text-slate-900 dark:text-slate-100">{term.name}</div>
          <div className="text-xs text-slate-500 font-mono">{term.slug}</div>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-orange-600 hover:text-orange-700 flex items-center gap-1"
          onClick={() => {
            const baseSlug = assignedTypeSlug || 'products';
            const url = `/${baseSlug}/${groupSlug}/${term.slug}`;
            window.open(url, '_blank');
          }}
        >
          <ExternalLink size={12} /> Mở ngoài site
        </Button>
        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => onRemove(term._id)}>Xóa</Button>
      </div>
    </div>
  );
}

function AttributeTermsManager({ groupId, terms, groupSlug, assignedTypeSlug }: { groupId: Id<"attributeGroups">; terms?: any[]; groupSlug: string; assignedTypeSlug: string | null }) {
  const createTerm = useMutation(api.attributeTerms.create);
  const removeTerm = useMutation(api.attributeTerms.remove);
  const reorderTerms = useMutation(api.attributeTerms.reorder);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleTermNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    const generatedSlug = val.toLowerCase()
      .normalize("NFD").replaceAll(/[\u0300-\u036F]/g, "")
      .replaceAll(/[đĐ]/g, "d")
      .replaceAll(/[^a-z0-9\s]/g, '')
      .replaceAll(/\s+/g, '-');
    setSlug(generatedSlug);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await createTerm({
        groupId,
        name: name.trim(),
        slug: slug.trim(),
        active: true,
      });
      setName('');
      setSlug('');
      toast.success('Đã thêm giá trị thuộc tính');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Lỗi khi thêm giá trị thuộc tính'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: Id<"attributeTerms">) => {
    if (!confirm('Bạn có chắc chắn muốn xóa giá trị này?')) return;
    try {
      await removeTerm({ id });
      toast.success('Đã xóa giá trị thuộc tính');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Lỗi khi xóa giá trị thuộc tính'));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !terms) return;

    const oldIndex = terms.findIndex(item => item._id === active.id);
    const newIndex = terms.findIndex(item => item._id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(terms, oldIndex, newIndex);
    try {
      await reorderTerms({ items: reordered.map((item, index) => ({ id: item._id, order: index })) });
      toast.success('Đã cập nhật thứ tự');
    } catch (error) {
      toast.error('Không thể cập nhật thứ tự');
    }
  };

  if (terms === undefined) return <div className="text-center py-4"><Loader2 className="animate-spin mx-auto text-slate-400" /></div>;

  return (
    <Card className="max-w-4xl mx-auto md:mx-0 mt-8">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-lg font-semibold">Các giá trị thuộc tính</h2>
      </div>
      <CardContent className="p-6">
        <form onSubmit={handleCreate} className="flex gap-4 items-end mb-6">
          <div className="space-y-1 flex-1">
            <Label className="text-xs">Tên giá trị</Label>
            <Input value={name} onChange={handleTermNameChange} required placeholder="VD: Đỏ, XL..." />
          </div>
          <div className="space-y-1 flex-1">
            <Label className="text-xs">Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="do, xl..." className="font-mono" />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Thêm'}
          </Button>
        </form>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={terms.map(item => item._id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {terms.length === 0 ? (
                <p className="text-slate-500 text-sm italic">Chưa có giá trị nào.</p>
              ) : (
                terms.map(term => (
                  <SortableTermRow key={term._id} term={term} onRemove={handleRemove} groupSlug={groupSlug} assignedTypeSlug={assignedTypeSlug} />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}
