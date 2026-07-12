// 星寰海 v2.0 - 白噪音播放器组件
import { useState, useEffect, useCallback } from 'react';
import { View, Text, Slider } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { WHITE_NOISE_TRACKS, WhiteNoiseTrack } from '../data/whiteNoiseTracks';
import {
  playAudioFile,
  pauseAudio,
  resumeAudio,
  stopAudio,
  setVolume,
  getVolume,
  getAutoStopMinutes,
  setAutoStopMinutes,
  restoreUserPreferences,
} from '../utils/audioPlayer';
import './WhiteNoisePlayer.scss';

interface WhiteNoisePlayerProps {
  className?: string; // 自定义类名
}

export default function WhiteNoisePlayer({
  className = '',
}: WhiteNoisePlayerProps) {
  const [currentTrack, setCurrentTrack] = useState<WhiteNoiseTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [autoStopMinutes, setAutoStopMinutesState] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 恢复用户偏好设置
  useEffect(() => {
    restoreUserPreferences();
    setVolumeState(getVolume());
    setAutoStopMinutesState(getAutoStopMinutes());
  }, []);

  // 播放指定轨道
  const playTrack = useCallback(
    async (track: WhiteNoiseTrack) => {
      setLoading(true);
      setError(null);

      try {
        await playAudioFile(track, volume);
        setCurrentTrack(track);
        setIsPlaying(true);
        Taro.showToast({
          title: `正在播放：${track.name}`,
          icon: 'success',
          duration: 1500,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '播放失败';
        setError(errorMsg);
        Taro.showToast({
          title: errorMsg,
          icon: 'none',
        });
      } finally {
        setLoading(false);
      }
    },
    [volume]
  );

  // 暂停播放
  const handlePause = useCallback(() => {
    pauseAudio();
    setIsPlaying(false);
  }, []);

  // 继续播放
  const handleResume = useCallback(() => {
    if (currentTrack) {
      resumeAudio();
      setIsPlaying(true);
    }
  }, [currentTrack]);

  // 停止播放
  const handleStop = useCallback(() => {
    stopAudio();
    setIsPlaying(false);
    setCurrentTrack(null);
  }, []);

  // 音量变化处理
  const handleVolumeChange = useCallback(
    (value: number) => {
      const newVolume = value / 100; // 转换为0-1范围
      setVolumeState(newVolume);
      setVolume(newVolume);
    },
    []
  );

  // 自动停止时间变化处理
  const handleAutoStopChange = useCallback((value: number) => {
    setAutoStopMinutesState(value);
    setAutoStopMinutes(value);
  }, []);

  // 选择轨道
  const selectTrack = useCallback(
    (track: WhiteNoiseTrack) => {
      if (isPlaying && currentTrack?.id === track.id) {
        // 如果正在播放同一轨道，切换暂停/播放
        handlePause();
      } else {
        // 播放新轨道
        playTrack(track);
      }
    },
    [isPlaying, currentTrack, playTrack, handlePause]
  );

  // 按分类分组轨道
  const groupedTracks = WHITE_NOISE_TRACKS.reduce<Record<string, WhiteNoiseTrack[]>>(
    (acc, track) => {
      if (!acc[track.category]) {
        acc[track.category] = [];
      }
      acc[track.category].push(track);
      return acc;
    },
    {}
  );

  // 分类显示名称
  const categoryLabels: Record<string, string> = {
    nature: '自然声音',
    ambient: '环境声音',
    frequency: '频率噪音',
  };

  return (
    <View className={`white-noise-player ${className}`}>
      {/* 当前播放状态 */}
      <View className="player-status">
        {currentTrack ? (
          <View className="current-track">
            <Text className="track-icon">{currentTrack.icon}</Text>
            <Text className="track-name">{currentTrack.name}</Text>
            {isPlaying ? (
              <Text className="playing-indicator">● 正在播放</Text>
            ) : (
              <Text className="paused-indicator">○ 已暂停</Text>
            )}
          </View>
        ) : (
          <Text className="no-track-selected">未选择音频</Text>
        )}
      </View>

      {/* 错误提示 */}
      {error && (
        <View className="error-message">
          <Text>⚠️ {error}</Text>
        </View>
      )}

      {/* 音量控制 */}
      <View className="volume-control">
        <Text className="control-label">音量</Text>
        <Slider
          className="volume-slider"
          value={volume * 100}
          min={0}
          max={100}
          step={1}
          onChanging={(e) => handleVolumeChange(e.detail.value)}
          onChange={(e) => handleVolumeChange(e.detail.value)}
        />
        <Text className="volume-value">{Math.round(volume * 100)}%</Text>
      </View>

      {/* 自动停止时间 */}
      <View className="auto-stop-control">
        <Text className="control-label">自动停止</Text>
        <Slider
          className="auto-stop-slider"
          value={autoStopMinutes}
          min={0}
          max={60}
          step={5}
          onChanging={(e) => handleAutoStopChange(e.detail.value)}
          onChange={(e) => handleAutoStopChange(e.detail.value)}
        />
        <Text className="auto-stop-value">
          {autoStopMinutes === 0 ? '不自动停止' : `${autoStopMinutes}分钟`}
        </Text>
      </View>

      {/* 播放控制按钮 */}
      <View className="playback-controls">
        {!isPlaying ? (
          <View
            className={`play-btn ${!currentTrack ? 'disabled' : ''}`}
            onClick={handleResume}
          >
            <Text>▶ 播放</Text>
          </View>
        ) : (
          <View className="pause-btn" onClick={handlePause}>
            <Text>⏸ 暂停</Text>
          </View>
        )}
        <View
          className={`stop-btn ${!currentTrack ? 'disabled' : ''}`}
          onClick={handleStop}
        >
          <Text>⏹ 停止</Text>
        </View>
      </View>

      {/* 音频列表 */}
      <View className="track-list">
        {Object.entries(groupedTracks).map(([category, tracks]) => (
          <View key={category} className="track-group">
            <Text className="group-title">{categoryLabels[category] || category}</Text>
            <View className="track-items">
              {tracks.map((track) => {
                const isActive = currentTrack?.id === track.id;
                return (
                  <View
                    key={track.id}
                    className={`track-item ${isActive ? 'active' : ''}`}
                    onClick={() => selectTrack(track)}
                  >
                    <Text className="track-icon">{track.icon}</Text>
                    <View className="track-info">
                      <Text className="track-name">{track.name}</Text>
                      {track.description && (
                        <Text className="track-desc">{track.description}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      {/* 加载提示 */}
      {loading && (
        <View className="loading-overlay">
          <Text>加载中...</Text>
        </View>
      )}
    </View>
  );
}
