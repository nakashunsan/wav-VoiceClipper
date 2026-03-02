<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
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
</template>

<script setup lang="ts">
import { useSharedAudioContext } from '~/composables/useSharedAudioContext'
const emit = defineEmits<{
  fileLoaded: [buffer: AudioBuffer]
  loading: [isLoading: boolean, message: string, progress?: number]
}>()

const fileInput = ref<HTMLInputElement>()
const fileName = ref('')
const audioInfo = ref('')

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  fileName.value = file.name

  try {
    const fileSizeMB = file.size / 1024 / 1024
    const isLargeFile = fileSizeMB > 100
    
    emit('loading', true, isLargeFile 
      ? `ファイルを読み込んでいます...\n大容量ファイル（${fileSizeMB.toFixed(0)}MB）のため、時間がかかる場合があります`
      : 'ファイルを読み込んでいます...', 0
    )
    
    // FileReaderでプログレス付き読み込み
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 50 // 読み込みは全体の50%
          emit('loading', true, isLargeFile 
            ? `ファイルを読み込んでいます...\n大容量ファイル（${fileSizeMB.toFixed(0)}MB）のため、時間がかかる場合があります`
            : 'ファイルを読み込んでいます...', progress
          )
        }
      }
      
      reader.onload = () => {
        resolve(reader.result as ArrayBuffer)
      }
      
      reader.onerror = () => {
        reject(new Error('ファイルの読み込みに失敗しました'))
      }
      
      reader.readAsArrayBuffer(file)
    })
    
    emit('loading', true, 'オーディオをデコード中...', 50)
    
    // 共有 AudioContext を使ってデコードすることで、ブラウザの AudioContext 制限に引っかかりにくくする
    const audioContext = useSharedAudioContext()
    
    // デコード処理（プログレスは推定）
    const decodePromise = audioContext.decodeAudioData(arrayBuffer)
    
    // デコード中のプログレス表示（推定）
    const progressInterval = setInterval(() => {
      emit('loading', true, 'オーディオをデコード中...', 50 + Math.random() * 40)
    }, 200)
    
    const buffer = await decodePromise
    clearInterval(progressInterval)
    
    emit('loading', true, '完了', 100)
    
    const duration = buffer.duration.toFixed(2)
    const sampleRate = buffer.sampleRate
    const channels = buffer.numberOfChannels
    const sizeMB = (buffer.length * channels * 2 / 1024 / 1024).toFixed(2)
    
    audioInfo.value = `${duration}秒 | ${sampleRate}Hz | ${channels}ch | ${sizeMB}MB`
    
    emit('fileLoaded', buffer)
  } catch (error) {
    alert('WAVファイルの読み込みに失敗しました: ' + (error as Error).message)
  } finally {
    emit('loading', false, '', 0)
  }
}
</script>
