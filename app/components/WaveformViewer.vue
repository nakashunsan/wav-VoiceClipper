<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <!-- Zoom Controls -->
    <div class="flex flex-wrap items-center justify-center gap-4 mb-4">
      <span class="text-sm font-medium text-gray-700">波形表示:</span>
      <button @click="zoomIn" class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition">
        <Icon name="mdi:magnify-plus" /> 拡大
      </button>
      <button @click="zoomOut" class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition">
        <Icon name="mdi:magnify-minus" /> 縮小
      </button>
      <button @click="resetZoom" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
        リセット
      </button>
      <span class="text-primary-600 font-semibold">
        {{ zoomLevel >= 100 ? Math.round(zoomLevel).toLocaleString() : Math.round(zoomLevel * 100) }}{{ zoomLevel >= 100 ? '×' : '%' }}
      </span>
      
      <label class="flex items-center gap-2 cursor-pointer">
        <input v-model="compressSilence" type="checkbox" class="w-4 h-4 text-primary-600 rounded" />
        <span class="text-sm text-gray-700">無音を圧縮表示</span>
      </label>
    </div>
    
    <!-- Waveform Canvas -->
    <div ref="waveformWrapper" class="overflow-x-auto rounded-lg border border-gray-200">
      <div ref="waveformContainer" class="relative bg-gray-50" :style="{ width: canvasWidth + 'px', height: '250px' }">
        <canvas
          ref="canvas"
          class="cursor-crosshair"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
        />
        <div ref="detectedRegionsContainer" class="absolute inset-0 pointer-events-none" />
        <div v-if="showSelection" class="absolute top-0 h-full bg-primary-500/30 border-2 border-primary-500 pointer-events-none" :style="selectionStyle" />
        <div class="absolute top-0 h-full w-0.5 bg-red-500 pointer-events-none z-10" :style="playbackStyle">
          <div class="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  audioBuffer: AudioBuffer
  detectedRegions: Array<{ start: number; end: number }>
  currentRegionIndex: number
  playbackPosition?: number
}>()

const emit = defineEmits<{
  regionSelected: [index: number]
  selectionChanged: [selection: { start: number; end: number }]
  seekTo: [time: number]
}>()

const canvas = ref<HTMLCanvasElement>()
const waveformContainer = ref<HTMLDivElement>()
const waveformWrapper = ref<HTMLDivElement>()
const detectedRegionsContainer = ref<HTMLDivElement>()

const zoomLevel = ref(1)
const compressSilence = ref(false)
const canvasWidth = ref(800)
const isDragging = ref(false)
const dragStartTime = ref(0)
const selectionStart = ref(0)
const selectionEnd = ref(0)
const showSelection = ref(false)

// 親コンポーネントから呼び出せるようにする
defineExpose({
  zoomIn,
  zoomOut,
  resetZoom
})

const selectionStyle = computed(() => {
  const left = Math.min(selectionStart.value, selectionEnd.value)
  const width = Math.abs(selectionEnd.value - selectionStart.value)
  return {
    left: `${left}px`,
    width: `${width}px`
  }
})

const playbackStyle = computed(() => {
  if (!props.playbackPosition || !props.audioBuffer) return { display: 'none' }
  
  const duration = props.audioBuffer.duration
  const position = (props.playbackPosition / duration) * canvasWidth.value
  
  return {
    left: `${position}px`,
    display: 'block'
  }
})

watch(() => props.audioBuffer, () => {
  nextTick(() => drawWaveform())
})

watch([zoomLevel, compressSilence], () => {
  nextTick(() => drawWaveform())
})

watch(() => props.detectedRegions, () => {
  nextTick(() => drawDetectedRegions())
}, { deep: true })

watch(() => props.currentRegionIndex, () => {
  nextTick(() => drawDetectedRegions())
})

onMounted(() => {
  if (props.audioBuffer) {
    drawWaveform()
    drawDetectedRegions()
  }
})

function zoomIn() {
  // 上限を大幅に引き上げ（50 → 10000）
  // 長時間ファイルでも細かく拡大できるように
  zoomLevel.value = Math.min(zoomLevel.value * 1.5, 10000)
}

function zoomOut() {
  zoomLevel.value = Math.max(zoomLevel.value * 0.67, 1)
}

function resetZoom() {
  zoomLevel.value = 1
}

function drawWaveform() {
  if (!canvas.value || !waveformWrapper.value) return
  
  const baseWidth = waveformWrapper.value.offsetWidth
  const width = Math.floor(baseWidth * zoomLevel.value)
  const height = 250
  
  // デバイスピクセル比を取得（Retinaディスプレイ対応）
  const dpr = window.devicePixelRatio || 1
  
  // ブラウザのキャンバスサイズ制限を考慮（多くのブラウザで32767px）
  // 超大きいキャンバスはメモリエラーを起こすので、dprを調整
  const maxCanvasSize = 32767
  let adjustedDpr = dpr
  
  if (width * dpr > maxCanvasSize) {
    adjustedDpr = Math.floor(maxCanvasSize / width)
    console.warn(`Canvas size limited: ${width * dpr}px → ${width * adjustedDpr}px`)
  }
  
  canvasWidth.value = width
  
  // 高解像度対応：実際のピクセル数を増やす（制限内で）
  canvas.value.width = width * adjustedDpr
  canvas.value.height = height * adjustedDpr
  
  // CSSサイズは元のまま
  canvas.value.style.width = width + 'px'
  canvas.value.style.height = height + 'px'
  
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return
  
  // スケーリングを適用（毎回リセットしてから設定）
  ctx.setTransform(adjustedDpr, 0, 0, adjustedDpr, 0, 0)
  ctx.clearRect(0, 0, width, height)
  
  const data = props.audioBuffer.getChannelData(0)
  const dataLength = data.length
  const amp = height / 2
  
  // 背景
  ctx.fillStyle = '#f9fafb'
  ctx.fillRect(0, 0, width, height)
  
  // 大容量ファイル対策: ダウンサンプリング比率を動的に調整
  // 1GB WAVファイル (約48000Hz * 600秒 = 28,800,000サンプル) でも高速化
  const samplesPerPixel = Math.ceil(dataLength / width)
  const downsampleFactor = Math.max(1, Math.floor(samplesPerPixel / 100))
  const step = samplesPerPixel * downsampleFactor
  
  // 波形を描画（より滑らかに）
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // バッチ処理で描画を高速化
  const batchSize = 1000
  let currentBatch = 0
  
  const drawBatch = () => {
    const startX = currentBatch * batchSize
    const endX = Math.min(startX + batchSize, width)
    
    for (let i = startX; i < endX; i++) {
      let min = 1.0
      let max = -1.0
      
      // ダウンサンプリングしながら最小・最大値を取得
      const startIdx = i * samplesPerPixel
      const endIdx = Math.min(startIdx + samplesPerPixel, dataLength)
      
      for (let j = startIdx; j < endIdx; j += downsampleFactor) {
        const datum = data[j]
        if (datum !== undefined) {
          if (datum < min) min = datum
          if (datum > max) max = datum
        }
      }
      
      const y1 = (1 + min) * amp
      const y2 = (1 + max) * amp

      // 無音圧縮表示モードでは、音量の小さい部分を薄く描画して判別しやすくする
      const peak = Math.max(Math.abs(min), Math.abs(max))
      const isSilent = compressSilence.value && peak < 0.02

      ctx.strokeStyle = isSilent ? '#d1d5db' : '#667eea'
      ctx.beginPath()
      ctx.moveTo(i + 0.5, y1)
      ctx.lineTo(i + 0.5, y2)
      ctx.stroke()
    }
    
    currentBatch++
    
    // 次のバッチがあれば非同期で処理
    if (endX < width) {
      requestAnimationFrame(drawBatch)
    } else {
      // 描画完了後に中央線と検出区間を描画
      finishDrawing()
    }
  }
  
  // 最初のバッチを開始
  drawBatch()
}

function finishDrawing() {
  if (!canvas.value) return
  
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return
  
  const width = canvasWidth.value
  const height = 250
  const amp = height / 2
  const dpr = window.devicePixelRatio || 1
  
  // キャンバスサイズ制限を考慮
  const maxCanvasSize = 32767
  let adjustedDpr = dpr
  
  if (width * dpr > maxCanvasSize) {
    adjustedDpr = Math.floor(maxCanvasSize / width)
  }
  
  // スケーリングを再適用
  ctx.setTransform(adjustedDpr, 0, 0, adjustedDpr, 0, 0)
  
  // 中央線を描画
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, amp)
  ctx.lineTo(width, amp)
  ctx.stroke()
  
  // 検出された区間も再描画
  drawDetectedRegions()
}

function drawDetectedRegions() {
  if (!detectedRegionsContainer.value || !props.audioBuffer) return
  
  // コンテナをクリア
  detectedRegionsContainer.value.innerHTML = ''
  
  const duration = props.audioBuffer.duration
  const width = canvasWidth.value
  
  props.detectedRegions.forEach((region, index) => {
    const left = (region.start / duration) * width
    const regionWidth = ((region.end - region.start) / duration) * width
    
    const div = document.createElement('div')
    div.style.position = 'absolute'
    div.style.left = `${left}px`
    div.style.width = `${regionWidth}px`
    div.style.top = '0'
    div.style.height = '100%'
    div.style.cursor = 'pointer'
    
    // 現在選択中の区間は強調表示
    if (index === props.currentRegionIndex) {
      div.style.backgroundColor = 'rgba(34, 197, 94, 0.3)'
      div.style.border = '2px solid rgb(34, 197, 94)'
    } else {
      div.style.backgroundColor = 'rgba(251, 146, 60, 0.2)'
      div.style.border = '1px solid rgba(251, 146, 60, 0.5)'
    }
    
    div.addEventListener('click', () => {
      emit('regionSelected', index)
    })
    
    detectedRegionsContainer.value?.appendChild(div)
  })
}

function handleMouseDown(event: MouseEvent) {
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  
  isDragging.value = true
  dragStartTime.value = Date.now()
  selectionStart.value = x
  selectionEnd.value = x
  showSelection.value = true
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value || !canvas.value) return
  
  const rect = canvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  selectionEnd.value = Math.max(0, Math.min(x, rect.width))
}

function handleMouseUp() {
  if (!isDragging.value) return
  
  const dragDuration = Date.now() - dragStartTime.value
  const dragDistance = Math.abs(selectionEnd.value - selectionStart.value)
  
  isDragging.value = false
  
  // クリック判定: 150ms以内 かつ 移動距離5px以内
  if (dragDuration < 150 && dragDistance < 5) {
    // シングルクリック: 再生位置を変更
    const duration = props.audioBuffer.duration
    const width = canvasWidth.value
    const clickTime = (selectionStart.value / width) * duration
    
    emit('seekTo', clickTime)
    showSelection.value = false
  } else if (dragDistance > 5) {
    // ドラッグ: 範囲選択
    const duration = props.audioBuffer.duration
    const width = canvasWidth.value
    
    const left = Math.min(selectionStart.value, selectionEnd.value)
    const right = Math.max(selectionStart.value, selectionEnd.value)
    
    const start = (left / width) * duration
    const end = (right / width) * duration
    
    emit('selectionChanged', { start, end })
  } else {
    // 短いドラッグは無視
    showSelection.value = false
  }
}
</script>
