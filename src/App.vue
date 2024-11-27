<template>
  <div class="whiteboard-container h-screen flex flex-col">
    <WhiteboardCanvas
      ref="canvas"
      :current-tool="currentTool"
      :current-color="currentColor"
      :current-page="currentPage"
    />

    <!-- 底部工具条 -->
    <div
      class="toolbar fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-200 px-4 flex items-center justify-between"
    >
      <!-- 左侧页面控制 -->
      <PageControls
        v-model="currentPage"
        :total-pages="totalPages"
        @add-page="addPage"
        @open="openWhiteboard"
        @save="saveWhiteboard"
      />

      <!-- 右侧工具 -->
      <div class="flex items-center space-x-6">
        <ColorPicker v-model="currentColor" />
        <ToolBar
          v-model="currentTool"
          :can-undo="canUndo"
          :can-redo="canRedo"
          @undo="undo"
          @redo="redo"
          @open-settings="openSettings"
          @exit="exit"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import WhiteboardCanvas from "./components/WhiteboardCanvas.vue";
import PageControls from "./components/PageControls.vue";
import ColorPicker from "./components/ColorPicker.vue";
import ToolBar from "./components/ToolBar.vue";

const canvas = ref<InstanceType<typeof WhiteboardCanvas> | null>(null);
const currentTool = ref("pen");
const currentColor = ref("#000000");
const currentPage = ref(1);
const totalPages = ref(1);

const canUndo = computed(() => canvas.value?.canUndo() ?? false);
const canRedo = computed(() => canvas.value?.canRedo() ?? false);

const undo = () => {
  canvas.value?.undo();
};

const redo = () => {
  canvas.value?.redo();
};

const addPage = () => {
  totalPages.value++;
  currentPage.value = totalPages.value;
};

const openSettings = () => {
  console.log("open settings");
};

const exit = () => {
  console.log("exit");
};

const saveWhiteboard = async (background: "white" | "transparent") => {
  if (!canvas.value) return;

  // 创建一个链接元素
  const link = document.createElement("a");
  const dataUrl = await canvas.value.toDataURL(background);
  link.download = `whiteboard-${Date.now()}.png`;
  link.href = dataUrl;
  link.click();
};

const openWhiteboard = () => {
  // 创建文件输入元素
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file && canvas.value) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          canvas.value?.loadImage(img);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
};
</script>

<style scoped>
.whiteboard-container {
  background-color: #f5f5f5;
}
</style>
