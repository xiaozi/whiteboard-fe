<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="emit('update:modelValue', false)"
  >
    <div class="bg-white rounded-lg shadow-xl p-6 w-96">
      <h2 class="text-xl font-semibold mb-4">设置</h2>
      
      <div class="space-y-4">
        <!-- 工具条位置设置 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            工具条位置
          </label>
          <div class="space-y-2">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                :value="'top'"
                :checked="toolbarPosition === 'top'"
                @change="emit('update:toolbarPosition', 'top')"
                class="w-4 h-4 text-blue-600"
              />
              <span>顶部</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                :value="'bottom'"
                :checked="toolbarPosition === 'bottom'"
                @change="emit('update:toolbarPosition', 'bottom')"
                class="w-4 h-4 text-blue-600"
              />
              <span>底部</span>
            </label>
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          @click="emit('update:modelValue', false)"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  toolbarPosition: "top" | "bottom";
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "update:toolbarPosition", value: "top" | "bottom"): void;
}>();
</script>

