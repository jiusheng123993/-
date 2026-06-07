let audioContext: AudioContext | null = null
let gainNode: GainNode | null = null
let currentSource: AudioBufferSourceNode | OscillatorNode | null = null
let noiseNode: AudioBufferSourceNode | null = null
let htmlAudioElement: HTMLAudioElement | null = null
let currentAudioId: string | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
    gainNode = audioContext.createGain()
    gainNode.connect(audioContext.destination)
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
  return audioContext
}

function createNoiseBuffer(ctx: AudioContext, type: 'white' | 'pink' | 'brown', duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = sampleRate * duration
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0

  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1

    if (type === 'white') {
      data[i] = white * 0.15
    } else if (type === 'pink') {
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05
      b6 = white * 0.115926
    } else if (type === 'brown') {
      data[i] = (b0 + white * 0.02)
      b0 = (b0 + white * 0.02) * 0.99
      data[i] *= 0.5
    }
  }

  return buffer
}

function playGeneratedNoise(type: 'white-noise' | 'pink-noise' | 'brown-noise'): void {
  const ctx = getAudioContext()
  if (!gainNode) return

  const noiseType = type === 'white-noise' ? 'white' : type === 'pink-noise' ? 'pink' : 'brown'
  const buffer = createNoiseBuffer(ctx, noiseType, 10)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true
  source.connect(gainNode)
  source.start()
  noiseNode = source
  currentSource = source
}

function playGeneratedTone(frequency: number): void {
  const ctx = getAudioContext()
  if (!gainNode) return

  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(frequency, ctx.currentTime)
  osc.connect(gainNode)
  osc.start()
  currentSource = osc
}

function playHtmlAudio(filePath: string): void {
  stopAll()

  htmlAudioElement = new Audio(filePath)
  htmlAudioElement.loop = true
  htmlAudioElement.volume = gainNode ? gainNode.gain.value : 0.5
  htmlAudioElement.play().catch(() => {})
}

export function playAudio(audioId: string, volume: number = 0.5): void {
  if (currentAudioId === audioId) return

  stopAll()
  currentAudioId = audioId

  if (audioId === 'none') return

  getAudioContext()
  if (!gainNode) return

  gainNode.gain.value = volume

  switch (audioId) {
    case 'white-noise':
    case 'pink-noise':
    case 'brown-noise':
      playGeneratedNoise(audioId)
      break
    case 'hz432':
      playGeneratedTone(432)
      break
    default:
      break
  }
}

export function playAudioFile(audioId: string, filePath: string, volume: number = 0.5): void {
  if (currentAudioId === audioId) return

  stopAll()
  currentAudioId = audioId

  if (!gainNode) {
    getAudioContext()
  }
  if (gainNode) {
    gainNode.gain.value = volume
  }

  playHtmlAudio(filePath)
}

export function setVolume(volume: number): void {
  if (gainNode) {
    gainNode.gain.value = volume
  }
  if (htmlAudioElement) {
    htmlAudioElement.volume = volume
  }
}

export function stopAll(): void {
  if (noiseNode) {
    try { noiseNode.stop() } catch { /* already stopped */ }
    noiseNode = null
  }
  if (currentSource) {
    try { currentSource.stop() } catch { /* already stopped */ }
    currentSource = null
  }
  if (htmlAudioElement) {
    htmlAudioElement.pause()
    htmlAudioElement.src = ''
    htmlAudioElement = null
  }
  currentAudioId = null
}

export function getCurrentAudioId(): string | null {
  return currentAudioId
}

export function playCompletionSound(): void {
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  const now = ctx.currentTime
  osc.type = 'sine'

  const notes = [523.25, 659.25, 783.99, 1046.50]
  notes.forEach((freq, i) => {
    osc.frequency.setValueAtTime(freq, now + i * 0.15)
  })

  gain.gain.setValueAtTime(0.3, now)
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8)

  osc.start(now)
  osc.stop(now + 0.8)
}
