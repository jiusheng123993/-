// 星寰海 v2.0 - 音频播放器工具函数
import Taro from '@tarojs/taro';
import { WhiteNoiseTrack } from '../data/whiteNoiseTracks';

// 音频播放器状态
interface AudioPlayerState {
  isPlaying: boolean;
  currentTrack: WhiteNoiseTrack | null;
  volume: number;
  duration: number; // 当前播放时长（秒）
}

// 全局音频上下文
let audioContext: Taro.InnerAudioContext | null = null;
let playerState: AudioPlayerState = {
  isPlaying: false,
  currentTrack: null,
  volume: 0.5,
  duration: 0,
};

// 定时器引用
let stopTimer: number | null = null;

// 初始化音频上下文
function initAudioContext(): Taro.InnerAudioContext {
  if (!audioContext) {
    audioContext = Taro.createInnerAudioContext();
    audioContext.volume = playerState.volume;

    // 监听播放事件
    audioContext.onPlay(() => {
      playerState.isPlaying = true;
    });

    // 监听暂停事件
    audioContext.onPause(() => {
      playerState.isPlaying = false;
    });

    // 监听停止事件
    audioContext.onStop(() => {
      playerState.isPlaying = false;
      playerState.duration = 0;
    });

    // 监听错误事件
    audioContext.onError((err) => {
      console.error('[AudioPlayer] Error:', err);
      playerState.isPlaying = false;
      Taro.showToast({
        title: '音频播放失败',
        icon: 'none',
      });
    });

    // 监听播放完成事件
    audioContext.onEnded(() => {
      playerState.isPlaying = false;
      playerState.duration = 0;
    });
  }

  return audioContext;
}

// 播放音频文件
export function playAudioFile(track: WhiteNoiseTrack, volume?: number): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const ctx = initAudioContext();

      // 如果正在播放其他音频，先停止
      if (playerState.isPlaying && playerState.currentTrack?.id !== track.id) {
        stopAudio();
      }

      // 设置音量
      if (volume !== undefined) {
        playerState.volume = volume;
      }
      ctx.volume = playerState.volume;

      // 设置音频源
      if (track.file) {
        ctx.src = track.file;
      } else {
        // 如果没有文件路径，使用生成的噪音
        // 注意：小程序环境不支持Web Audio API，需要使用预录制的文件
        reject(new Error('该音频需要预录制文件'));
        return;
      }

      // 开始播放
      ctx.play();
      playerState.currentTrack = track;
      playerState.isPlaying = true;
      playerState.duration = 0;

      // 设置自动停止定时器
      setupAutoStop();

      resolve();
    } catch (error) {
      console.error('[AudioPlayer] playAudioFile error:', error);
      reject(error);
    }
  });
}

// 暂停音频
export function pauseAudio(): void {
  if (audioContext && playerState.isPlaying) {
    audioContext.pause();
    playerState.isPlaying = false;
  }
}

// 继续播放
export function resumeAudio(): void {
  if (audioContext && !playerState.isPlaying && playerState.currentTrack) {
    audioContext.play();
    playerState.isPlaying = true;
  }
}

// 停止音频
export function stopAudio(): void {
  if (audioContext) {
    audioContext.stop();
    playerState.isPlaying = false;
    playerState.duration = 0;
  }

  // 清除定时器
  if (stopTimer) {
    clearInterval(stopTimer);
    stopTimer = null;
  }
}

// 设置音量
export function setVolume(volume: number): void {
  const clampedVolume = Math.max(0, Math.min(1, volume));
  playerState.volume = clampedVolume;

  if (audioContext) {
    audioContext.volume = clampedVolume;
  }

  // 持久化音量设置
  Taro.setStorageSync('audio_volume', clampedVolume);
}

// 获取当前音量
export function getVolume(): number {
  return playerState.volume;
}

// 获取当前播放状态
export function getPlayerState(): AudioPlayerState {
  return { ...playerState };
}

// 设置自动停止
function setupAutoStop(): void {
  // 清除之前的定时器
  if (stopTimer) {
    clearInterval(stopTimer);
    stopTimer = null;
  }

  // 从存储中读取自动停止时间
  const autoStopMinutes = Taro.getStorageSync('auto_stop_minutes') || 0;

  if (autoStopMinutes > 0) {
    stopTimer = window.setInterval(() => {
      playerState.duration += 1;

      // 达到设定时间后停止
      if (playerState.duration >= autoStopMinutes * 60) {
        stopAudio();
        Taro.showToast({
          title: `已自动停止播放（${autoStopMinutes}分钟）`,
          icon: 'none',
        });
      }
    }, 1000);
  }
}

// 设置自动停止时间（分钟）
export function setAutoStopMinutes(minutes: number): void {
  Taro.setStorageSync('auto_stop_minutes', minutes);

  // 如果正在播放，重新设置定时器
  if (playerState.isPlaying) {
    setupAutoStop();
  }
}

// 获取自动停止时间
export function getAutoStopMinutes(): number {
  return Taro.getStorageSync('auto_stop_minutes') || 0;
}

// 恢复用户偏好设置
export function restoreUserPreferences(): void {
  const savedVolume = Taro.getStorageSync('audio_volume');
  if (savedVolume !== undefined) {
    playerState.volume = savedVolume;
    if (audioContext) {
      audioContext.volume = savedVolume;
    }
  }

  const savedAutoStop = Taro.getStorageSync('auto_stop_minutes');
  if (savedAutoStop !== undefined) {
    // 自动停止时间已在setupAutoStop中使用
  }
}

// 清理资源
export function cleanup(): void {
  stopAudio();

  if (audioContext) {
    audioContext.destroy();
    audioContext = null;
  }

  playerState = {
    isPlaying: false,
    currentTrack: null,
    volume: 0.5,
    duration: 0,
  };
}
