<template>
  <div class="container mx-auto px-4 py-8 max-w-5xl">
    <!-- Page Title -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">WAVファイル分割ツール</h1>
      <p class="text-gray-600 text-sm mb-4">大容量のWAVファイルを扱いやすいサイズに分割</p>
      <NuxtLink to="/tool" class="text-primary-500 hover:text-primary-600 text-sm">
        <Icon name="mdi:arrow-left" class="inline" /> メインツールに戻る
      </NuxtLink>
    </div>

    <!-- File Upload -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
      <div class="text-center">
        <input
          ref="fileInput"
          type="file"
          accept=".wav,audio/wav"
          class="hidden"
          @change="handleFileSelect"
        />
        
        <button
          @click="fileInput?.click()"
          class="inline-flex items-center gap-3 px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl font-medium text-lg"
        >
          <Icon name="mdi:file-music" class="text-2xl" />
          WAVファイルを選択
        </button>
        
        <p v-if="fileName" class="mt-4 text-gray-600 flex items-center justify-center gap-2">
          <Icon name="mdi:check-circle" class="text-green-500" />
          {{ fileName }}
        </p>
        
        <p v-if="audioInfo" class="mt-2 text-sm text-gray-500">
          {{ audioInfo }}
        </p>
      </div>
    </div>

    <!-- Split Settings -->
    <template v-if="audioBuffer">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">分割設定</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              分割サイズ（推奨: 5〜10分）
            </label>
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="preset in presets"
                :key="preset.value"
                @click="segmentDuration = preset.value"
                :class="[
                  'px-4 py-2 rounded-lg transition',
                  segmentDuration === preset.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              カスタム設定（分）
            </label>
            <input
              v-model.number="customMinutes"
              type="number"
              min="1"
              max="60"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              @input="segmentDuration = customMinutes * 60"
            />
          </div>
          
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-800">
              <Icon name="mdi:information" class="inline" />
              {{ Math.ceil(audioBuffer.duration / segmentDuration) }}個のファイルに分割されます
              （各ファイル約{{ formatDuration(segmentDuration) }}）
            </p>
          </div>
        </div>
        
        <button
          @click="handleSplit"
          :disabled="isSplitting"
          class="w-full mt-6 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <Icon name="mdi:content-cut" class="inline" />
          {{ isSplitting ? '分割中...' : '分割を開始' }}
        </button>
      </div>

      <!-- Split Results -->
      <div v-if="segments.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">分割結果</h2>
        
        <div class="space-y-2 mb-6">
          <div
            v-for="segment in segments"
            :key="segment.index"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <div class="flex-1">
              <p class="font-medium text-gray-900">
                {{ getSegmentFileName(segment.index) }}
              </p>
              <p class="text-sm text-gray-600">
                {{ formatTime(segment.start) }} 〜 {{ formatTime(segment.end) }}
                （{{ formatDuration(segment.end - segment.start) }}）
              </p>
            </div>
            
            <button
              @click="downloadSegment(segment)"
              class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
            >
              <Icon name="mdi:download" class="inline" /> ダウンロード
            </button>
          </div>
        </div>
        
        <button
          @click="downloadAll"
          class="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium"
        >
          <Icon name="mdi:download-multiple" class="inline" />
          全てダウンロード（ZIP）
        </button>
      </div>
    </template>

    <!-- Loading Overlay -->
    <LoadingOverlay v-model="isLoading" :message="loadingMessage" />
  </div>
</template>

<script setup lang="ts">
import { useSharedAudioContext } from '~/composables/useSharedAudioContext'

useHead({
  title: 'WAVファイル分割ツール - ボイス素材作るくん',
  meta: [
    { name: 'description', content: '大容量のWAVファイルを扱いやすいサイズに分割するツール。ブラウザ上で完結、プライバシー保護。' }
  ]
})

const fileInput = ref<HTMLInputElement>()
const fileName = ref('')
const audioInfo = ref('')
const audioBuffer = ref<AudioBuffer | null>(null)
const segmentDuration = ref(300) // デフォルト5分
const customMinutes = ref(5)
const segments = ref<Array<{ buffer: AudioBuffer; start: number; end: number; index: number }>>([])
const isSplitting = ref(false)
const isLoading = ref(false)
const loadingMessage = ref('')

const { splitAudioByDuration, audioBufferToWav } = useAudioSplitter()

const presets = [
  { label: '3分', value: 180 },
  { label: '5分', value: 300 },
  { label: '10分', value: 600 },
  { label: '15分', value: 900 },
  { label: '30分', value: 1800 }
]

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  fileName.value = file.name
  
  const fileSizeMB = file.size / 1024 / 1024
  const isLargeFile = fileSizeMB > 100
  
  isLoading.value = true
  loadingMessage.value = isLargeFile
    ? `ファイルを読み込んでいます...\n大容量ファイル（${fileSizeMB.toFixed(0)}MB）のため、時間がかかる場合があります`
    : 'ファイルを読み込んでいます...'

  try {
    const arrayBuffer = await file.arrayBuffer()
    const audioContext = useSharedAudioContext()
    const buffer = await audioContext.decodeAudioData(arrayBuffer)
    
    audioBuffer.value = buffer
    
    const duration = buffer.duration.toFixed(2)
    const sampleRate = buffer.sampleRate
    const channels = buffer.numberOfChannels
    const sizeMB = (buffer.length * channels * 2 / 1024 / 1024).toFixed(2)
    
    audioInfo.value = `${duration}秒 | ${sampleRate}Hz | ${channels}ch | ${sizeMB}MB`
    
    // 分割結果をクリア
    segments.value = []
  } catch (error) {
    alert('WAVファイルの読み込みに失敗しました: ' + (error as Error).message)
  } finally {
    isLoading.value = false
  }
}

async function handleSplit() {
  if (!audioBuffer.value) return
  
  isSplitting.value = true
  isLoading.value = true
  loadingMessage.value = '分割中...'
  
  try {
    const result = await splitAudioByDuration(
      audioBuffer.value,
      segmentDuration.value,
      (current, total) => {
        loadingMessage.value = `分割中... (${current}/${total})`
      }
    )
    
    segments.value = result
  } catch (error) {
    alert('分割中にエラーが発生しました: ' + (error as Error).message)
  } finally {
    isSplitting.value = false
    isLoading.value = false
  }
}

function getSegmentFileName(index: number): string {
  const baseName = fileName.value.replace(/\.wav$/i, '')
  return `${baseName}_part${index.toString().padStart(3, '0')}.wav`
}

function downloadSegment(segment: { buffer: AudioBuffer; index: number }) {
  const blob = audioBufferToWav(segment.buffer)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = getSegmentFileName(segment.index)
  a.click()
  URL.revokeObjectURL(url)
}

async function downloadAll() {
  isLoading.value = true
  loadingMessage.value = 'ZIPファイルを作成中...'
  
  try {
    const files: Array<{ name: string; data: Uint8Array }> = []
    
    for (let i = 0; i < segments.value.length; i++) {
      const segment = segments.value[i]
      const blob = audioBufferToWav(segment.buffer)
      const arrayBuffer = await blob.arrayBuffer()
      
      files.push({
        name: getSegmentFileName(segment.index),
        data: new Uint8Array(arrayBuffer)
      })
      
      loadingMessage.value = `ZIPファイルを作成中... (${i + 1}/${segments.value.length})`
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    loadingMessage.value = 'ダウンロード準備中...'
    const zipBlob = await createZipFromFiles(files)
    
    const baseName = fileName.value.replace(/\.wav$/i, '')
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${baseName}_split.zip`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    alert('ZIPファイルの作成に失敗しました: ' + (error as Error).message)
  } finally {
    isLoading.value = false
  }
}

async function createZipFromFiles(files: Array<{ name: string; data: Uint8Array }>): Promise<Blob> {
  const encoder = new TextEncoder()
  let offset = 0
  const localHeaders: Array<{ header: Uint8Array; data: Uint8Array; offset: number }> = []
  const centralHeaders: Uint8Array[] = []
  
  files.forEach(file => {
    const nameBytes = encoder.encode(file.name)
    const crc = crc32(file.data)
    
    const localHeader = new Uint8Array(30 + nameBytes.length)
    const localView = new DataView(localHeader.buffer)
    localView.setUint32(0, 0x04034b50, true)
    localView.setUint16(4, 20, true)
    localView.setUint16(8, 0, true)
    localView.setUint32(14, crc, true)
    localView.setUint32(18, file.data.length, true)
    localView.setUint32(22, file.data.length, true)
    localView.setUint16(26, nameBytes.length, true)
    localHeader.set(nameBytes, 30)
    
    localHeaders.push({ header: localHeader, data: file.data, offset })
    offset += localHeader.length + file.data.length
    
    const centralHeader = new Uint8Array(46 + nameBytes.length)
    const centralView = new DataView(centralHeader.buffer)
    centralView.setUint32(0, 0x02014b50, true)
    centralView.setUint16(4, 20, true)
    centralView.setUint16(6, 20, true)
    centralView.setUint16(12, 0, true)
    centralView.setUint32(16, crc, true)
    centralView.setUint32(20, file.data.length, true)
    centralView.setUint32(24, file.data.length, true)
    centralView.setUint16(28, nameBytes.length, true)
    centralView.setUint32(42, localHeaders[localHeaders.length - 1].offset, true)
    centralHeader.set(nameBytes, 46)
    
    centralHeaders.push(centralHeader)
  })
  
  const centralDirOffset = offset
  const centralDirSize = centralHeaders.reduce((sum, h) => sum + h.length, 0)
  
  const endRecord = new Uint8Array(22)
  const endView = new DataView(endRecord.buffer)
  endView.setUint32(0, 0x06054b50, true)
  endView.setUint16(8, files.length, true)
  endView.setUint16(10, files.length, true)
  endView.setUint32(12, centralDirSize, true)
  endView.setUint32(16, centralDirOffset, true)
  
  const totalSize = offset + centralDirSize + endRecord.length
  const zipData = new Uint8Array(totalSize)
  let pos = 0
  
  localHeaders.forEach(({ header, data }) => {
    zipData.set(header, pos)
    pos += header.length
    zipData.set(data, pos)
    pos += data.length
  })
  
  centralHeaders.forEach(header => {
    zipData.set(header, pos)
    pos += header.length
  })
  
  zipData.set(endRecord, pos)
  
  return new Blob([zipData], { type: 'application/zip' })
}

function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1))
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  if (mins > 0) {
    return `${mins}分${secs}秒`
  }
  return `${secs}秒`
}
</script>
