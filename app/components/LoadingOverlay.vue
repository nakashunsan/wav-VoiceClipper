<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-300"
        leave-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="modelValue"
          class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        >
          <div class="text-center max-w-md w-full px-4">
            <div class="inline-block w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p class="text-white text-xl font-semibold whitespace-pre-line mb-4">{{ message }}</p>
            
            <!-- Progress Bar -->
            <div v-if="progress !== undefined && progress >= 0" class="w-full">
              <div class="bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
                <div 
                  class="bg-primary-500 h-full transition-all duration-300 ease-out"
                  :style="{ width: `${Math.min(100, Math.max(0, progress))}%` }"
                />
              </div>
              <p class="text-white text-sm">{{ Math.round(progress) }}%</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  message: string
  progress?: number
}>()
</script>
