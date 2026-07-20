import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import type { VaccineRecord } from '../../services/vaccineService';

interface VaccineRecordCardProps {
  record: VaccineRecord;
  onComplete?: (id: string) => void;
  onEdit?: (record: VaccineRecord) => void;
  onDelete?: (id: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  vaccine: '疫苗',
  deworm: '驱虫',
};

const CATEGORY_LABELS: Record<string, string> = {
  DHPP: 'DHPP（犬四联）',
  FVRCP: 'FVRCP（猫三联）',
  rabies: '狂犬疫苗',
  bordetella: '犬窝咳',
  leptospirosis: '钩端螺旋体',
  lyme: '莱姆病',
  felv: '猫白血病',
  internal_deworm: '体内驱虫',
  external_deworm: '体外驱虫',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  completed: { label: '已完成', color: '#52C41A', bg: '#F6FFED' },
  pending: { label: '待接种', color: '#FF8C42', bg: '#FFF2E8' },
  overdue: { label: '已逾期', color: '#FF4D4F', bg: '#FFF1F0' },
};

export default function VaccineRecordCard({ record, onComplete, onEdit, onDelete }: VaccineRecordCardProps) {
  const statusConfig = STATUS_CONFIG[record.status] || STATUS_CONFIG.pending;

  const handleDelete = () => {
    Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      confirmColor: '#FF4D4F',
      success: (res) => {
        if (res.confirm && onDelete) {
          onDelete(record.id);
        }
      },
    });
  };

  return (
    <View className='vaccine-record-card'>
      <View className='vaccine-record-card__header'>
        <View className='vaccine-record-card__type'>
          <Text className='vaccine-record-card__type-icon'>
            {record.type === 'vaccine' ? '💉' : '🔰'}
          </Text>
          <Text className='vaccine-record-card__type-label'>
            {TYPE_LABELS[record.type] || record.type}
          </Text>
        </View>
        <View
          className='vaccine-record-card__status'
          style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
        >
          <Text className='vaccine-record-card__status-text'>{statusConfig.label}</Text>
        </View>
      </View>

      <View className='vaccine-record-card__body'>
        <Text className='vaccine-record-card__category'>
          {CATEGORY_LABELS[record.category] || record.category}
        </Text>

        <View className='vaccine-record-card__info'>
          <View className='vaccine-record-card__info-row'>
            <Text className='vaccine-record-card__info-label'>接种日期</Text>
            <Text className='vaccine-record-card__info-value'>{record.date}</Text>
          </View>
          <View className='vaccine-record-card__info-row'>
            <Text className='vaccine-record-card__info-label'>下次接种</Text>
            <Text
              className={`vaccine-record-card__info-value${
                record.status === 'overdue' ? ' vaccine-record-card__info-value--overdue' : ''
              }`}
            >
              {record.nextDate}
            </Text>
          </View>
          {record.hospital && (
            <View className='vaccine-record-card__info-row'>
              <Text className='vaccine-record-card__info-label'>医院</Text>
              <Text className='vaccine-record-card__info-value'>{record.hospital}</Text>
            </View>
          )}
          {record.doctor && (
            <View className='vaccine-record-card__info-row'>
              <Text className='vaccine-record-card__info-label'>医生</Text>
              <Text className='vaccine-record-card__info-value'>{record.doctor}</Text>
            </View>
          )}
          {record.notes && (
            <View className='vaccine-record-card__info-row'>
              <Text className='vaccine-record-card__info-label'>备注</Text>
              <Text className='vaccine-record-card__info-value'>{record.notes}</Text>
            </View>
          )}
        </View>
      </View>

      <View className='vaccine-record-card__actions'>
        {record.status !== 'completed' && onComplete && (
          <View
            className='vaccine-record-card__btn vaccine-record-card__btn--primary'
            onClick={() => onComplete(record.id)}
          >
            <Text className='vaccine-record-card__btn-text'>标记完成</Text>
          </View>
        )}
        {onEdit && (
          <View
            className='vaccine-record-card__btn vaccine-record-card__btn--secondary'
            onClick={() => onEdit(record)}
          >
            <Text className='vaccine-record-card__btn-text'>编辑</Text>
          </View>
        )}
        {onDelete && (
          <View
            className='vaccine-record-card__btn vaccine-record-card__btn--danger'
            onClick={handleDelete}
          >
            <Text className='vaccine-record-card__btn-text'>删除</Text>
          </View>
        )}
      </View>
    </View>
  );
}
