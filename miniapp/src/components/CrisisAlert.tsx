// 星寰海 v2.0 - 高危干预弹窗组件
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { HOTLINE_INFO } from '../data/crisisKeywords';
import type { CrisisLevel } from '../utils/crisisDetector';
import './CrisisAlert.scss';

interface CrisisAlertProps {
  level: CrisisLevel;
  onClose: () => void;
  onHotlineClick?: () => void;
}

export default function CrisisAlert({ level, onClose, onHotlineClick }: CrisisAlertProps) {
  const isSevere = level === 'severe';
  const isModerate = level === 'moderate';

  // 拨打热线
  const handleHotlineClick = async () => {
    if (onHotlineClick) {
      onHotlineClick();
    } else {
      // 尝试拨打电话（小程序环境）
      try {
        await Taro.makePhoneCall({
          phoneNumber: HOTLINE_INFO.number.replace(/-/g, ''),
        });
      } catch (err) {
        console.error('[CrisisAlert] Failed to call hotline:', err);
        // 如果拨打电话失败，显示提示
        Taro.showModal({
          title: '拨打热线',
          content: `${HOTLINE_INFO.name}: ${HOTLINE_INFO.number}`,
          confirmText: '复制号码',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              // 复制到剪贴板
              Taro.setClipboardData({
                data: HOTLINE_INFO.number,
                success: () => {
                  Taro.showToast({
                    title: '已复制号码',
                    icon: 'success',
                  });
                },
              });
            }
          },
        });
      }
    }
  };

  // 关闭弹窗（重度模式需要确认）
  const handleClose = () => {
    if (isSevere) {
      // 重度危机：要求用户确认
      Taro.showModal({
        title: '请确认',
        content: '你确定要继续吗？建议先拨打热线寻求帮助。',
        confirmText: '我确定',
        cancelText: '拨打热线',
        success: (res) => {
          if (res.confirm) {
            onClose();
          } else if (res.cancel) {
            handleHotlineClick();
          }
        },
      });
    } else {
      onClose();
    }
  };

  return (
    <View className={`crisis-alert crisis-${level}`}>
      <View className='crisis-overlay' />
      <View className='crisis-content'>
        {/* 标题 */}
        <Text className='crisis-title'>
          {isSevere ? '我听到了你的信号' : isModerate ? '你的感受很重要' : '我想告诉你一件事'}
        </Text>

        {/* 内容 */}
        <Text className='crisis-body'>
          {isSevere
            ? `你现在可能处于非常危险的状态。请立即拨打${HOTLINE_INFO.number}或120/110。你不是一个人，有人愿意帮助你。`
            : isModerate
            ? `你的感受是真实的，也是重要的。如果需要帮助，可以拨打${HOTLINE_INFO.number}，这是一条24小时免费热线。`
            : `如果这种感觉持续困扰你，可以拨打${HOTLINE_INFO.number}寻求专业帮助。`}
        </Text>

        {/* 操作按钮 */}
        <View className='crisis-actions'>
          <View className='crisis-btn hotline' onClick={handleHotlineClick}>
            <Text>拨打热线</Text>
          </View>
          <View className='crisis-btn close' onClick={handleClose}>
            <Text>{isSevere ? '我确定' : '继续'}</Text>
          </View>
        </View>

        {/* 额外资源链接（仅中度和重度） */}
        {(isModerate || isSevere) && (
          <View className='crisis-resources'>
            <Text className='crisis-resource-text'>其他求助方式：</Text>
            <View className='crisis-resource-list'>
              <View className='crisis-resource-item'>
                <Text>• 北京心理危机研究与干预中心：010-82951332</Text>
              </View>
              <View className='crisis-resource-item'>
                <Text>• 全国24小时心理援助热线：400-161-9995</Text>
              </View>
              {isSevere && (
                <View className='crisis-resource-item urgent'>
                  <Text>• 紧急情况请拨打：120（急救）/ 110（报警）</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
