<template>
  <div class="flex items-center space-x-4">
    <button
      v-for="tool in tools"
      :key="tool.name"
      class="tool-btn flex flex-col items-center"
      :class="{ active: modelValue === tool.name }"
      @click="emit('update:modelValue', tool.name)"
    >
      <component :is="tool.icon" class="w-5 h-5" />
      <span class="text-xs mt-1">{{ tool.label }}</span>
    </button>
    <button
      v-for="action in actions"
      :key="action.name"
      class="tool-btn flex flex-col items-center"
      :class="{ 'opacity-50 cursor-not-allowed': isDisabled(action.name) }"
      :disabled="isDisabled(action.name)"
      @click="handleAction(action.name)"
    >
      <component :is="action.icon" class="w-5 h-5" />
      <span class="text-xs mt-1">{{ action.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import {
  Pencil,
  Eraser,
  Lasso,
  Undo2,
  Redo2,
  Settings,
  LogOut,
  FolderOpen,
  Save,
} from "lucide-vue-next";

const props = defineProps<{
  modelValue: string;
  canUndo?: boolean;
  canRedo?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "undo"): void;
  (e: "redo"): void;
  (e: "openSettings"): void;
  (e: "exit"): void;
  (e: "open"): void;
  (e: "save"): void;
}>();

const tools = [
  { name: "pen", label: "画笔", icon: Pencil },
  { name: "eraser", label: "橡皮擦", icon: Eraser },
  { name: "lasso", label: "圈选", icon: Lasso },
];

const actions = [
  { name: "undo", label: "撤销", icon: Undo2 },
  { name: "redo", label: "重做", icon: Redo2 },
  { name: "openSettings", label: "设置", icon: Settings },
  { name: "exit", label: "退出", icon: LogOut },
];

const isDisabled = (actionName: string) => {
  if (actionName === "undo") return !props.canUndo;
  if (actionName === "redo") return !props.canRedo;
  return false;
};

const handleAction = (actionName: string) => {
  if (isDisabled(actionName)) return;
  emit(actionName);
};
</script>

<style scoped>
.tool-btn {
  @apply w-14 h-14 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors;
}

.tool-btn.active {
  @apply bg-blue-50 text-blue-600;
}

.tool-btn:disabled {
  @apply hover:bg-transparent;
}
</style>
