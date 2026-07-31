/**
 * 疫苗/驱虫记录添加弹窗组件
 * 支持新增和编辑疫苗/驱虫记录，包含类型选择、种类选择、日期设置和补充信息
 */
import { View, Text, Input, Textarea, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import type { VaccineRecord, CreateVaccineData } from '../../services/vaccineService';
import { calculateNextDate } from '../../services/vaccineService';

interface VaccineAddModalProps {
  visible: boolean;
  petId: string;
  userId: string;
  editRecord?: VaccineRecord | null;
  onClose: () => void;
  onSubmit: (data: CreateVaccineData) => void;
  onUpdate?: (id: string, data: Partial<Omit<VaccineRecord, 'id' | 'petId' | 'createdAt'>>) => void;
}

const TYPE_OPTIONS = [
  { value: 'vaccine' as const, label: '疫苗' },
  { value: 'deworm' as const, label: '驱虫' },
];

const VACCINE_CATEGORIES = [
  { value: 'DHPP', label: 'DHPP（犬四联）' },
  { value: 'FVRCP', label: 'FVRCP（猫三联）' },
  { value: 'rabies', label: '狂犬疫苗' },
  { value: 'bordetella', label: '犬窝咳' },
  { value: 'leptospirosis', label: '钩端螺旋体' },
  { value: 'lyme', label: '莱姆病' },
  { value: 'felv', label: '猫白血病' },
];

const DEWORM_CATEGORIES = [
  { value: 'internal_deworm', label: '体内驱虫' },
  { value: 'external_deworm', label: '体外驱虫' },
];

export default function VaccineAddModal({
  visible,
  petId,
  userId,
  editRecord,
  onClose,
  onSubmit,
  onUpdate,
}: VaccineAddModalProps) {
  const [formData, setFormData] = useState<CreateVaccineData>({
    petId,
    userId,
    type: 'vaccine',
    category: 'DHPP',
    date: new Date().toISOString().slice(0, 10),
    hospital: '',
    doctor: '',
    notes: '',
  });

  const [nextDate, setNextDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editRecord) {
      setFormData({
        petId: editRecord.petId,
        userId,
        type: editRecord.type,
        category: editRecord.category,
        date: editRecord.date,
        hospital: editRecord.hospital || '',
        doctor: editRecord.doctor || '',
        notes: editRecord.notes || '',
      });
      setNextDate(editRecord.nextDate);
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setFormData({
        petId,
        userId,
        type: 'vaccine',
        category: 'DHPP',
        date: today,
        hospital: '',
        doctor: '',
        notes: '',
      });
      setNextDate(calculateNextDate('DHPP', today));
    }
  }, [editRecord, petId, userId, visible]);

  useEffect(() => {
    if (formData.category && formData.date) {
      setNextDate(calculateNextDate(formData.category, formData.date));
    }
  }, [formData.category, formData.date]);

  const categories = formData.type === 'vaccine' ? VACCINE_CATEGORIES : DEWORM_CATEGORIES;

  const handleTypeChange = (type: 'vaccine' | 'deworm') => {
    const newCategory = type === 'vaccine' ? VACCINE_CATEGORIES[0].value : DEWORM_CATEGORIES[0].value;
    setFormData((prev) => ({ ...prev, type, category: newCategory }));
  };

  const handleDateChange = (e: { detail: { value: string } }) => {
    setFormData((prev) => ({ ...prev, date: e.detail.value }));
  };

  const handleNextDateChange = (e: { detail: { value: string } }) => {
    setNextDate(e.detail.value);
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.date) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    setSubmitting(true);
    try {
      if (editRecord && onUpdate) {
        await onUpdate(editRecord.id, {
          type: formData.type,
          category: formData.category,
          date: formData.date,
          nextDate,
          hospital: formData.hospital || undefined,
          doctor: formData.doctor || undefined,
          notes: formData.notes || undefined,
        });
        Taro.showToast({ title: '更新成功', icon: 'success' });
      } else {
        await onSubmit(formData);
        Taro.showToast({ title: '添加成功', icon: 'success' });
      }
      onClose();
    } catch {
      Taro.showToast({ title: '操作失败，请重试', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <View className='vaccine-modal__overlay' onClick={onClose}>
      <View className='vaccine-modal' onClick={(e) => e.stopPropagation()}>
        <View className='vaccine-modal__header'>
          <Text className='vaccine-modal__title'>
            {editRecord ? '编辑记录' : '添加记录'}
          </Text>
          <View className='vaccine-modal__close' onClick={onClose}>
            <Text className='vaccine-modal__close-icon'>✕</Text>
          </View>
        </View>

        <View className='vaccine-modal__body'>
          <View className='vaccine-modal__section'>
            <Text className='vaccine-modal__label'>类型</Text>
            <View className='vaccine-modal__type-selector'>
              {TYPE_OPTIONS.map((option) => (
                <View
                  key={option.value}
                  className={`vaccine-modal__type-btn${
                    formData.type === option.value ? ' vaccine-modal__type-btn--active' : ''
                  }`}
                  onClick={() => handleTypeChange(option.value)}
                >
                  <Text className='vaccine-modal__type-text'>{option.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className='vaccine-modal__section'>
            <Text className='vaccine-modal__label'>种类</Text>
            <Picker
              mode='selector'
              range={categories.map((c) => c.label)}
              value={categories.findIndex((c) => c.value === formData.category)}
              onChange={(e) => {
                const index = e.detail.value as number;
                setFormData((prev) => ({ ...prev, category: categories[index].value }));
              }}
            >
              <View className='vaccine-modal__picker'>
                <Text className='vaccine-modal__picker-value'>
                  {categories.find((c) => c.value === formData.category)?.label || '请选择'}
                </Text>
                <Text className='vaccine-modal__picker-arrow'>›</Text>
              </View>
            </Picker>
          </View>

          <View className='vaccine-modal__section'>
            <Text className='vaccine-modal__label'>接种日期</Text>
            <Picker mode='date' value={formData.date} onChange={handleDateChange}>
              <View className='vaccine-modal__picker'>
                <Text className='vaccine-modal__picker-value'>{formData.date}</Text>
                <Text className='vaccine-modal__picker-arrow'>›</Text>
              </View>
            </Picker>
          </View>

          <View className='vaccine-modal__section'>
            <Text className='vaccine-modal__label'>下次日期（自动计算）</Text>
            <Picker mode='date' value={nextDate} onChange={handleNextDateChange}>
              <View className='vaccine-modal__picker'>
                <Text className='vaccine-modal__picker-value'>{nextDate}</Text>
                <Text className='vaccine-modal__picker-arrow'>›</Text>
              </View>
            </Picker>
          </View>

          <View className='vaccine-modal__section'>
            <Text className='vaccine-modal__label'>医院（选填）</Text>
            <Input
              className='vaccine-modal__input'
              placeholder='请输入医院名称'
              placeholderClass='vaccine-modal__input-placeholder'
              value={formData.hospital}
              onInput={(e) => setFormData((prev) => ({ ...prev, hospital: e.detail.value }))}
            />
          </View>

          <View className='vaccine-modal__section'>
            <Text className='vaccine-modal__label'>医生（选填）</Text>
            <Input
              className='vaccine-modal__input'
              placeholder='请输入医生姓名'
              placeholderClass='vaccine-modal__input-placeholder'
              value={formData.doctor}
              onInput={(e) => setFormData((prev) => ({ ...prev, doctor: e.detail.value }))}
            />
          </View>

          <View className='vaccine-modal__section'>
            <Text className='vaccine-modal__label'>备注（选填）</Text>
            <Textarea
              className='vaccine-modal__textarea'
              placeholder='添加备注信息...'
              placeholderClass='vaccine-modal__textarea-placeholder'
              maxlength={200}
              value={formData.notes}
              onInput={(e) => setFormData((prev) => ({ ...prev, notes: e.detail.value }))}
            />
            <Text className='vaccine-modal__count'>{formData.notes?.length ?? 0}/200</Text>
          </View>
        </View>

        <View className='vaccine-modal__footer'>
          <View
            className={`vaccine-modal__submit${submitting ? ' vaccine-modal__submit--disabled' : ''}`}
            onClick={submitting ? undefined : handleSubmit}
          >
            <Text className='vaccine-modal__submit-text'>
              {submitting ? '提交中...' : editRecord ? '保存修改' : '添加记录'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
