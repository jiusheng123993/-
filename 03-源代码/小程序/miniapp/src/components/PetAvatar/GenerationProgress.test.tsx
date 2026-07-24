import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GenerationProgress from './GenerationProgress';

describe('GenerationProgress 组件', () => {
  describe('处理中状态', () => {
    it('应显示进度百分比', () => {
      render(
        <GenerationProgress progress={45} status='processing' type='2d' />
      );

      expect(screen.getByText('45%')).toBeTruthy();
      expect(screen.getByText('正在生成2D 形象...')).toBeTruthy();
    });

    it('2D 类型应显示对应提示文案', () => {
      render(
        <GenerationProgress progress={30} status='processing' type='2d' />
      );

      expect(screen.getByText('正在绘制多角度形象，请耐心等待')).toBeTruthy();
    });

    it('3D 类型应显示对应提示文案', () => {
      render(
        <GenerationProgress progress={60} status='processing' type='3d' />
      );

      expect(screen.getByText('正在构建 3D 模型，可能需要 2-5 分钟')).toBeTruthy();
    });

    it('pending 状态也应显示进度', () => {
      render(
        <GenerationProgress progress={0} status='pending' type='2d' />
      );

      expect(screen.getByText('0%')).toBeTruthy();
    });
  });

  describe('完成状态', () => {
    it('2D 完成应显示成功图标和文案', () => {
      render(
        <GenerationProgress progress={100} status='completed' type='2d' />
      );

      expect(screen.getByText('✅')).toBeTruthy();
      expect(screen.getByText('2D 形象生成完成')).toBeTruthy();
    });

    it('3D 完成应显示成功图标和文案', () => {
      render(
        <GenerationProgress progress={100} status='completed' type='3d' />
      );

      expect(screen.getByText('✅')).toBeTruthy();
      expect(screen.getByText('3D 模型生成完成')).toBeTruthy();
    });
  });

  describe('失败状态', () => {
    it('应显示错误图标和错误信息', () => {
      render(
        <GenerationProgress
          progress={50}
          status='failed'
          type='2d'
          error='网络超时'
        />
      );

      expect(screen.getByText('❌')).toBeTruthy();
      expect(screen.getByText('网络超时')).toBeTruthy();
    });

    it('未传 error 时应显示默认失败文案', () => {
      render(
        <GenerationProgress progress={50} status='failed' type='3d' />
      );

      expect(screen.getByText('3D 模型生成失败')).toBeTruthy();
    });

    it('传入 onRetry 时应显示重试按钮', () => {
      const onRetry = vi.fn();
      render(
        <GenerationProgress
          progress={50}
          status='failed'
          type='2d'
          error='失败'
          onRetry={onRetry}
        />
      );

      const retryBtn = screen.getByText('重试');
      expect(retryBtn).toBeTruthy();

      fireEvent.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('未传 onRetry 时不应显示重试按钮', () => {
      render(
        <GenerationProgress progress={50} status='failed' type='2d' error='失败' />
      );

      expect(screen.queryByText('重试')).toBeNull();
    });
  });
});
