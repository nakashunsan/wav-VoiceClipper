<template>
  <div class="container mx-auto px-4 py-8 max-w-7xl">
    <!-- Page Title -->
    <div class="text-center mb-8">
      <p class="text-gray-600 text-sm mb-6">WAVファイルから必要な部分を簡単に切り抜き</p>
      <div class="flex items-center justify-center gap-4">
        <NuxtLink to="/" class="text-primary-500 hover:text-primary-600 text-sm">
          <Icon name="mdi:home" class="inline" /> ホームに戻る
        </NuxtLink>
        <span class="text-gray-300">|</span>
        <NuxtLink to="/splitter" class="text-green-500 hover:text-green-600 text-sm">
          <Icon name="mdi:call-split" class="inline" /> ファイル分割ツール
        </NuxtLink>
      </div>
    </div>

    <!-- Main Content -->
    <div class="space-y-6">
      <AudioUploader 
        @file-loaded="handleFileLoaded"
        @loading="handleLoading"
      />
      
      <template v-if="audioBuffer">
        <DetectionPanel
          @detect="handleDetect"
          @clear="handleClearDetection"
        />
        
        <div v-if="detectionSummary" class="-mt-2">
          <div
            v-if="detectionSummary.count > 0"
            class="text-sm text-gray-700 bg-green-50 border border-green-200 text-center px-4 py-2 rounded-lg"
          >
            検出された音声区間:
            <span class="font-semibold">{{ detectionSummary.count }}</span>
            個（合計
            <span class="font-semibold">{{ detectionSummary.totalDuration.toFixed(1) }}</span>
            秒）
          </div>
          <div
            v-else
            class="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 text-center px-4 py-2 rounded-lg"
          >
            音声区間が検出されませんでした。しきい値を下げるか、最小音声長を短くして再度お試しください。
          </div>
        </div>
        
        <WaveformViewer
          ref="waveformViewerRef"
          :audio-buffer="audioBuffer"
          :detected-regions="detectedRegions"
          :current-region-index="currentRegionIndex"
          :playback-position="playbackPosition"
          @region-selected="handleRegionSelected"
          @selection-changed="handleSelectionChanged"
          @seek-to="handleSeekTo"
        />
        
        <RegionNavigation
          v-if="detectedRegions.length > 0"
          :current-index="currentRegionIndex"
          :total-regions="detectedRegions.length"
          @navigate="handleNavigate"
          @add-all="handleAddAllRegions"
        />
        
        <AudioControls
          :has-selection="hasSelection"
          @play="handlePlay"
          @pause="handlePause"
          @play-selection="handlePlaySelection"
          @add-to-queue="handleAddToQueue"
        />
        
        <TimeDisplay
          :start-time="selectionStart"
          :end-time="selectionEnd"
          @update="handleTimeUpdate"
        />
        
        <ExportQueue
          :queue="exportQueue"
          @play-item="handlePlayQueueItem"
          @remove-item="handleRemoveFromQueue"
          @clear-queue="handleClearQueue"
          @export-all="handleExportAll"
        />
      </template>
    </div>

    <!-- Footer -->
    <footer class="mt-16 pt-8 border-t border-gray-200 text-center text-gray-600 text-sm">
      <div class="flex items-center justify-center gap-4 mb-4">
        <a href="https://github.com/namoo-san/wav-VoiceClipper" target="_blank" rel="noopener" class="text-primary-500 hover:text-primary-600 transition">
          <Icon name="mdi:github" class="inline" /> GitHub
        </a>
        <button @click="showHelp = true" class="text-primary-500 hover:text-primary-600 transition">
          <Icon name="mdi:help-circle" class="inline" /> 使い方
        </button>
      </div>
      <div class="flex items-center justify-center gap-4 mb-2 text-xs">
        <NuxtLink to="/privacy" class="hover:text-primary-500 transition">プライバシーポリシー</NuxtLink>
        <NuxtLink to="/terms" class="hover:text-primary-500 transition">利用規約</NuxtLink>
      </div>
      <p class="text-xs text-gray-400">
        {{ config.public.gitCommit }} • {{ new Date(config.public.buildTime).toLocaleDateString('ja-JP') }}
      </p>
    </footer>

    <!-- Help Modal -->
    <HelpModal v-model="showHelp" />
    
    <!-- Loading Overlay -->
    <LoadingOverlay v-model="isLoading" :message="loadingMessage" :progress="loadingProgress" />
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()

const audioBuffer = ref<AudioBuffer | null>(null)
const detectedRegions = ref<Array<{ start: number; end: number }>>([])
const currentRegionIndex = ref(-1)
const selectionStart = ref(0)
const selectionEnd = ref(0)
const hasSelection = ref(false)
const exportQueue = ref<Array<any>>([])
const showHelp = ref(false)
const isLoading = ref(false)
const loadingMessage = ref('')
const loadingProgress = ref<number | undefined>(undefined)
const playbackPosition = ref<number | undefined>(undefined)
const waveformViewerRef = ref<any>(null)
const detectionSummary = ref<{ count: number; totalDuration: number } | null>(null)

const { detectVoiceRegions } = useAudioDetection()
const { playAudio, playSelection, stopAudio } = useAudioPlayback()
const { exportToZip } = useAudioExport()

// キーボードショートカット
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

function handleKeyDown(event: KeyboardEvent) {
  // 入力フィールドにフォーカスがある場合は無視
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    return
  }

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      if (detectedRegions.value.length > 0) {
        handleNavigate(-1)
      }
      break
    
    case 'ArrowRight':
      event.preventDefault()
      if (detectedRegions.value.length > 0) {
        handleNavigate(1)
      }
      break
    
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (hasSelection.value) {
        handleAddToQueue()
      }
      break
    
    case '+':
    case '=':
      event.preventDefault()
      if (waveformViewerRef.value) {
        waveformViewerRef.value.zoomIn()
      }
      break
    
    case '-':
    case '_':
      event.preventDefault()
      if (waveformViewerRef.value) {
        waveformViewerRef.value.zoomOut()
      }
      break
  }
}

function handleFileLoaded(buffer: AudioBuffer) {
  audioBuffer.value = buffer
  detectedRegions.value = []
  currentRegionIndex.value = -1
  exportQueue.value = []
  detectionSummary.value = null
}

function handleLoading(loading: boolean, message: string, progress?: number) {
  isLoading.value = loading
  loadingMessage.value = message
  loadingProgress.value = progress
}

async function handleDetect(options: any) {
  if (!audioBuffer.value) return
  
  isLoading.value = true
  loadingMessage.value = '音声区間を検出しています...'
  
  try {
    console.log('Starting detection with options:', options)
    const regions = await detectVoiceRegions(audioBuffer.value, options)
    console.log('Detection complete, found regions:', regions.length)
    detectedRegions.value = regions
    
    const totalDuration = regions.reduce((sum, region) => {
      return sum + (region.end - region.start)
    }, 0)
    detectionSummary.value = {
      count: regions.length,
      totalDuration
    }
    
    if (regions.length > 0) {
      currentRegionIndex.value = 0
      handleRegionSelected(0)
    } else {
      alert('音声区間が検出されませんでした。しきい値を下げるか、最小音声長を短くして再度お試しください。')
    }
  } catch (error) {
    console.error('Detection error:', error)
    alert('音声区間の検出中にエラーが発生しました: ' + (error as Error).message)
  } finally {
    isLoading.value = false
  }
}

function handleClearDetection() {
  detectedRegions.value = []
  currentRegionIndex.value = -1
  detectionSummary.value = null
}

function handleRegionSelected(index: number) {
  currentRegionIndex.value = index
  const region = detectedRegions.value[index]
  if (region) {
    selectionStart.value = region.start
    selectionEnd.value = region.end
    hasSelection.value = true
    
    // 波形を選択した区間にスクロール
    scrollToRegion(region)
  }
}

function scrollToRegion(region: { start: number; end: number }) {
  // WaveformViewerコンポーネントに通知
  nextTick(() => {
    const waveformViewer = document.querySelector('.overflow-x-auto')
    if (waveformViewer && audioBuffer.value) {
      const duration = audioBuffer.value.duration
      const scrollWidth = waveformViewer.scrollWidth
      const clientWidth = waveformViewer.clientWidth
      
      // 区間の中央位置を計算
      const regionCenter = (region.start + region.end) / 2
      const scrollPosition = (regionCenter / duration) * scrollWidth - clientWidth / 2
      
      waveformViewer.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      })
    }
  })
}

function handleSelectionChanged(selection: { start: number; end: number }) {
  selectionStart.value = selection.start
  selectionEnd.value = selection.end
  hasSelection.value = true
}

function handleNavigate(direction: number) {
  if (detectedRegions.value.length === 0) return
  
  let newIndex = currentRegionIndex.value + direction
  if (newIndex < 0) newIndex = detectedRegions.value.length - 1
  if (newIndex >= detectedRegions.value.length) newIndex = 0
  
  handleRegionSelected(newIndex)
}

function handlePlay() {
  if (audioBuffer.value) {
    playAudio(audioBuffer.value, (currentTime) => {
      playbackPosition.value = currentTime
    })
  }
}

function handlePause() {
  stopAudio()
  playbackPosition.value = undefined
}

function handlePlaySelection() {
  if (audioBuffer.value && hasSelection.value) {
    playSelection(audioBuffer.value, selectionStart.value, selectionEnd.value, (currentTime) => {
      playbackPosition.value = currentTime
    })
  }
}

function handleAddToQueue() {
  if (!hasSelection.value) return
  
  const queueItem = {
    id: Date.now(),
    name: `voice_${exportQueue.value.length + 1}`,
    startTime: selectionStart.value,
    endTime: selectionEnd.value,
    duration: selectionEnd.value - selectionStart.value
  }
  
  exportQueue.value.push(queueItem)
  
  // 次の区間に自動移動
  if (detectedRegions.value.length > 0 && currentRegionIndex.value >= 0) {
    handleNavigate(1)
  }
}

function handleAddAllRegions() {
  detectedRegions.value.forEach((region, index) => {
    const queueItem = {
      id: Date.now() + index,
      name: `voice_${exportQueue.value.length + index + 1}`,
      startTime: region.start,
      endTime: region.end,
      duration: region.end - region.start
    }
    exportQueue.value.push(queueItem)
  })
}

function handlePlayQueueItem(item: any) {
  if (audioBuffer.value) {
    playSelection(audioBuffer.value, item.startTime, item.endTime, (currentTime) => {
      playbackPosition.value = currentTime
    })
  }
}

function handleRemoveFromQueue(id: number) {
  exportQueue.value = exportQueue.value.filter(item => item.id !== id)
}

function handleClearQueue() {
  if (confirm('キューを全てクリアしますか？')) {
    exportQueue.value = []
  }
}

async function handleExportAll() {
  if (!audioBuffer.value || exportQueue.value.length === 0) return
  
  isLoading.value = true
  loadingMessage.value = 'エクスポート中...'
  
  try {
    await exportToZip(audioBuffer.value, exportQueue.value, (progress) => {
      loadingMessage.value = `エクスポート中... (${progress.current}/${progress.total})`
    })
  } finally {
    isLoading.value = false
  }
}

function handleTimeUpdate(times: { start: number; end: number }) {
  selectionStart.value = times.start
  selectionEnd.value = times.end
  hasSelection.value = true
}

function handleSeekTo(time: number) {
  if (!audioBuffer.value) return
  
  // 再生中の場合は停止して新しい位置から再生
  stopAudio()
  playSelection(audioBuffer.value, time, audioBuffer.value.duration, (currentTime) => {
    playbackPosition.value = currentTime
  })
}
</script>
