<template>
  <div class="flex items-center space-x-4">
    <button class="tool-btn" @click="prevPage">
      <ChevronLeft class="w-5 h-5" />
    </button>
    <span class="text-gray-600">{{ modelValue }} / {{ totalPages }}</span>
    <button class="tool-btn" @click="nextPage">
      <ChevronRight class="w-5 h-5" />
    </button>
    <button class="tool-btn" @click="addPage">
      <Plus class="w-5 h-5" />
    </button>
    <button class="tool-btn flex flex-col items-center" @click="$emit('open')">
      <FolderOpen class="w-5 h-5" />
      <span class="text-xs mt-1">打开</span>
    </button>
    <button
      class="tool-btn flex flex-col items-center"
      @click="showSaveDialog = true"
    >
      <Save class="w-5 h-5" />
      <span class="text-xs mt-1">保存</span>
    </button>

    <!-- 保存选项弹层 -->
    <div
      v-if="showSaveDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div class="bg-white rounded-lg p-6 w-80">
        <h3 class="text-lg font-medium mb-4">选择保存背景</h3>
        <div class="space-y-4">
          <button
            class="w-full py-2 px-4 rounded border hover:bg-gray-50"
            @click="$emit('save', 'white')"
          >
            白色背景
          </button>
          <button
            class="w-full py-2 px-4 rounded border hover:bg-gray-50"
            @click="$emit('save', 'transparent')"
          >
            透明背景
          </button>
        </div>
        <button
          class="mt-4 w-full py-2 rounded hover:bg-red-50 text-red-500 hover:text-red-600"
          @click="showSaveDialog = false"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  FolderOpen,
  Save,
} from "lucide-vue-next";
import { ref } from "vue";

const props = defineProps<{
  modelValue: number;
  totalPages: number;
}>();

const showSaveDialog = ref(false);

const emit = defineEmits<{
  (e: "update:modelValue", value: number): void;
  (e: "add-page"): void;
  (e: "open"): void;
  (e: "save", background: "white" | "transparent"): void;
}>();

const prevPage = () => {
  if (props.modelValue > 1) {
    emit("update:modelValue", props.modelValue - 1);
  }
};

const nextPage = () => {
  if (props.modelValue < props.totalPages) {
    emit("update:modelValue", props.modelValue + 1);
  }
};

const addPage = () => {
  emit("add-page");
};
</script>

<style scoped>
.tool-btn {
  @apply w-14 h-14 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors;
}
</style>
