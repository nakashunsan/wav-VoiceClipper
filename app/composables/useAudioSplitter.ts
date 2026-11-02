export function useAudioSplitter() {
  /**
   * WAVファイルを指定した時間で分割
   * @param audioBuffer 元のオーディオバッファ
   * @param segmentDuration 各セグメントの長さ（秒）
   * @param onProgress 進捗コールバック
   */
  async function splitAudioByDuration(
    audioBuffer: AudioBuffer,
    segmentDuration: number,
    onProgress?: (current: number, total: number) => void
  ): Promise<Array<{ buffer: AudioBuffer; start: number; end: number; index: number }>> {
    const totalDuration = audioBuffer.duration
    const segmentCount = Math.ceil(totalDuration / segmentDuration)
    const segments: Array<{ buffer: AudioBuffer; start: number; end: number; index: number }> = []
    
    for (let i = 0; i < segmentCount; i++) {
      const startTime = i * segmentDuration
      const endTime = Math.min((i + 1) * segmentDuration, totalDuration)
      const duration = endTime - startTime
      
      // 新しいAudioBufferを作成
      const sampleRate = audioBuffer.sampleRate
      const numberOfChannels = audioBuffer.numberOfChannels
      const startSample = Math.floor(startTime * sampleRate)
      const endSample = Math.floor(endTime * sampleRate)
      const segmentLength = endSample - startSample
      
      const audioContext = new OfflineAudioContext(numberOfChannels, segmentLength, sampleRate)
      const segmentBuffer = audioContext.createBuffer(numberOfChannels, segmentLength, sampleRate)
      
      // 各チャンネルのデータをコピー
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sourceData = audioBuffer.getChannelData(channel)
        const targetData = segmentBuffer.getChannelData(channel)
        
        for (let sample = 0; sample < segmentLength; sample++) {
          targetData[sample] = sourceData[startSample + sample]
        }
      }
      
      segments.push({
        buffer: segmentBuffer,
        start: startTime,
        end: endTime,
        index: i + 1
      })
      
      if (onProgress) {
        onProgress(i + 1, segmentCount)
      }
      
      // UIをブロックしないように少し待つ
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    return segments
  }
  
  /**
   * AudioBufferをWAVファイル（Blob）に変換
   */
  function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numberOfChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const format = 1 // PCM
    const bitDepth = 16
    
    const bytesPerSample = bitDepth / 8
    const blockAlign = numberOfChannels * bytesPerSample
    
    const data = []
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i]
        // -1.0 ~ 1.0 を -32768 ~ 32767 に変換
        const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32768)))
        data.push(intSample & 0xff)
        data.push((intSample >> 8) & 0xff)
      }
    }
    
    const dataSize = data.length
    const fileSize = 36 + dataSize
    
    const arrayBuffer = new ArrayBuffer(44 + dataSize)
    const view = new DataView(arrayBuffer)
    
    // WAVヘッダーを書き込み
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, fileSize, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true) // fmt chunk size
    view.setUint16(20, format, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * blockAlign, true) // byte rate
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitDepth, true)
    writeString(36, 'data')
    view.setUint32(40, dataSize, true)
    
    // データを書き込み
    for (let i = 0; i < data.length; i++) {
      view.setUint8(44 + i, data[i])
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }
  
  return {
    splitAudioByDuration,
    audioBufferToWav
  }
}
