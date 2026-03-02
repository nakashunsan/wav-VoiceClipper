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
          <div class="text-center">
            <div class="inline-block w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p class="text-white text-xl font-semibold whitespace-pre-line">{{ message }}</p>
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
}>()
</script>
