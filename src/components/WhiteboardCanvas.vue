<template>
  <div class="flex-1 relative">
    <!-- 主画布 -->
    <canvas
      ref="canvas"
      class="w-full h-full bg-white absolute top-0 left-0"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
    ></canvas>
    <!-- 选区层 -->
    <canvas
      ref="selectionCanvas"
      class="w-full h-full absolute top-0 left-0 pointer-events-none"
    ></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";

const props = defineProps<{
  currentTool: string;
  currentColor: string;
  currentPage: number;
}>();

const canvas = ref<HTMLCanvasElement | null>(null);
const selectionCanvas = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);
const selectionCtx = ref<CanvasRenderingContext2D | null>(null);

const isDrawing = ref(false);
const lastX = ref(0);
const lastY = ref(0);

// 圈选相关的状态
const isSelecting = ref(false);
const isMoving = ref(false);
const selectionPath = ref<Path2D | null>(null);
const selectionPoints = ref<{ x: number; y: number }[]>([]);

// 更新类型定义
type SelectedArea = {
  path: Path2D;
  points: { x: number; y: number }[];
  bounds: { x: number; y: number; width: number; height: number };
  originalBounds: { x: number; y: number; width: number; height: number };
  imageData: ImageData;
};

const selectedArea = ref<SelectedArea | null>(null);
const moveOffset = ref({ x: 0, y: 0 });

// 用于保存每一页的绘画内容
const pages = ref<ImageData[]>([]);
// 用于保存每一页的历史记录
const history = ref<ImageData[][]>([]);
const currentHistoryIndex = ref<number[]>([]);

// 调整画布大小
const resizeCanvas = () => {
  if (
    !canvas.value ||
    !selectionCanvas.value ||
    !ctx.value ||
    !selectionCtx.value
  )
    return;

  const container = canvas.value.parentElement;
  if (container) {
    const { width, height } = container.getBoundingClientRect();

    // 设置主画布尺寸
    canvas.value.width = width;
    canvas.value.height = height;

    // 设置选区画布尺寸
    selectionCanvas.value.width = width;
    selectionCanvas.value.height = height;

    // 重新加载当前页面
    loadPage(props.currentPage);
  }
};

onMounted(() => {
  if (canvas.value && selectionCanvas.value) {
    ctx.value = canvas.value.getContext("2d");
    selectionCtx.value = selectionCanvas.value.getContext("2d");

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
  }
});

// 监听页面变化
watch(
  () => props.currentPage,
  (newPage, oldPage) => {
    if (oldPage && ctx.value && canvas.value) {
      // 保存当前页面
      pages.value[oldPage - 1] = ctx.value.getImageData(
        0,
        0,
        canvas.value.width,
        canvas.value.height
      );
    }
    // 加载新页面
    loadPage(newPage);
  }
);

// 监听工具变化
watch(
  () => props.currentTool,
  () => {
    // 如果切换工具且有选区，应用选区内容
    if (selectedArea.value) {
      ctx.value?.putImageData(
        selectedArea.value.imageData,
        selectedArea.value.bounds.x,
        selectedArea.value.bounds.y
      );
      // 只有当选区位置发生变化时才保存历史记录
      if (
        selectedArea.value.bounds.x !== selectedArea.value.originalBounds.x ||
        selectedArea.value.bounds.y !== selectedArea.value.originalBounds.y
      ) {
        saveToHistory();
      }
      selectedArea.value = null;
      clearSelectionCanvas();
    }
  }
);

const startDrawing = (e: MouseEvent) => {
  if (!ctx.value || !canvas.value || !selectionCtx.value) return;

  const rect = canvas.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (props.currentTool === "lasso") {
    if (selectedArea.value) {
      // 检查是否在选区内点击
      if (selectionCtx.value.isPointInPath(selectedArea.value.path, x, y)) {
        isMoving.value = true;
        moveOffset.value = {
          x: x - selectedArea.value.bounds.x,
          y: y - selectedArea.value.bounds.y,
        };
        return;
      } else {
        // 如果点击在选区外，应用当前选区内容到主画布
        ctx.value.putImageData(
          selectedArea.value.imageData,
          selectedArea.value.bounds.x,
          selectedArea.value.bounds.y
        );
        // 只有当选区位置发生变化时才保存历史记录
        if (
          selectedArea.value.bounds.x !== selectedArea.value.originalBounds.x ||
          selectedArea.value.bounds.y !== selectedArea.value.originalBounds.y
        ) {
          saveToHistory();
        }
      }
    }
    // 开始新的圈选
    isSelecting.value = true;
    selectionPoints.value = [{ x, y }];
    selectionPath.value = new Path2D();
    selectionPath.value.moveTo(x, y);
    selectedArea.value = null;
    clearSelectionCanvas();
  } else {
    // 如果切换到其他工具，应用当前选区
    if (selectedArea.value) {
      ctx.value.putImageData(
        selectedArea.value.imageData,
        selectedArea.value.bounds.x,
        selectedArea.value.bounds.y
      );
      // 有当选区位置发生变化时才保存历史记录
      if (
        selectedArea.value.bounds.x !== selectedArea.value.originalBounds.x ||
        selectedArea.value.bounds.y !== selectedArea.value.originalBounds.y
      ) {
        saveToHistory();
      }
      selectedArea.value = null;
      clearSelectionCanvas();
    }
    isDrawing.value = true;
    lastX.value = x;
    lastY.value = y;
  }
};

const draw = (e: MouseEvent) => {
  if (!ctx.value || !canvas.value || !selectionCtx.value) return;

  const rect = canvas.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isSelecting.value && selectionPath.value) {
    // 添加新的点到路径
    selectionPoints.value.push({ x, y });
    selectionPath.value.lineTo(x, y);
    // 更新选区显示
    clearSelectionCanvas();
    drawSelectionPath();
  } else if (isMoving.value && selectedArea.value) {
    // 移动选中区域，并限制在画布范围内
    const newX = Math.max(
      0,
      Math.min(
        x - moveOffset.value.x,
        canvas.value.width - selectedArea.value.bounds.width
      )
    );
    const newY = Math.max(
      0,
      Math.min(
        y - moveOffset.value.y,
        canvas.value.height - selectedArea.value.bounds.height
      )
    );
    selectedArea.value.bounds.x = newX;
    selectedArea.value.bounds.y = newY;
    // 更新选区显示
    clearSelectionCanvas();
    drawSelectedArea();
  } else if (isDrawing.value) {
    ctx.value.beginPath();
    ctx.value.moveTo(lastX.value, lastY.value);
    ctx.value.lineTo(x, y);

    if (props.currentTool === "pen") {
      ctx.value.strokeStyle = props.currentColor;
      ctx.value.lineWidth = 2;
      ctx.value.lineCap = "round";
      ctx.value.stroke();
    } else if (props.currentTool === "eraser") {
      ctx.value.strokeStyle = "#ffffff";
      ctx.value.lineWidth = 20;
      ctx.value.lineCap = "round";
      ctx.value.stroke();
    }

    lastX.value = x;
    lastY.value = y;
  }
};

const stopDrawing = () => {
  if (!ctx.value || !canvas.value || !selectionCtx.value) return;

  if (isSelecting.value && selectionPath.value) {
    isSelecting.value = false;

    // 完成选区路径
    const firstPoint = selectionPoints.value[0];
    selectionPath.value.lineTo(firstPoint.x, firstPoint.y);
    selectionPath.value.closePath();

    // 计算选区边界
    const bounds = calculatePathBounds(selectionPoints.value);

    // 如果选区大小为0，则取消选择
    if (bounds.width === 0 || bounds.height === 0) {
      clearSelectionCanvas();
      return;
    }

    // 创建临时画布
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.value.width;
    tempCanvas.height = canvas.value.height;
    const tempCtx = tempCanvas.getContext("2d");

    if (tempCtx) {
      // 复制原始画布内容
      tempCtx.drawImage(canvas.value, 0, 0);

      // 创建另一个临时画布用于裁剪
      const clipCanvas = document.createElement("canvas");
      clipCanvas.width = bounds.width;
      clipCanvas.height = bounds.height;
      const clipCtx = clipCanvas.getContext("2d");

      if (clipCtx) {
        // 将选区内容绘制到裁剪画布
        clipCtx.save();
        clipCtx.translate(-bounds.x, -bounds.y);
        clipCtx.fill(selectionPath.value);
        clipCtx.globalCompositeOperation = "source-in";
        clipCtx.drawImage(tempCanvas, 0, 0);
        clipCtx.restore();

        // 获取裁剪后的图像数据
        const imageData = clipCtx.getImageData(
          0,
          0,
          bounds.width,
          bounds.height
        );

        // 创建选区对象
        selectedArea.value = {
          path: selectionPath.value,
          points: [...selectionPoints.value],
          bounds,
          originalBounds: { ...bounds },
          imageData: imageData,
        };

        // 清除原画布上的选中区域
        ctx.value.save();
        ctx.value.globalCompositeOperation = "destination-out";
        ctx.value.fill(selectionPath.value);
        ctx.value.restore();

        // 在选区层显示选中内容和边框
        clearSelectionCanvas();
        drawSelectedArea();
      }
    }
  } else if (isMoving.value && selectedArea.value) {
    isMoving.value = false;

    // 创建临时画布
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.value.width;
    tempCanvas.height = canvas.value.height;
    const tempCtx = tempCanvas.getContext("2d");

    if (tempCtx) {
      // 计算偏移量
      const offsetX =
        selectedArea.value.bounds.x - selectedArea.value.originalBounds.x;
      const offsetY =
        selectedArea.value.bounds.y - selectedArea.value.originalBounds.y;

      // 创建移动后的路径
      const movedPath = new Path2D();
      const points = selectedArea.value.points;
      if (points.length > 0) {
        movedPath.moveTo(points[0].x + offsetX, points[0].y + offsetY);
        for (let i = 1; i < points.length; i++) {
          movedPath.lineTo(points[i].x + offsetX, points[i].y + offsetY);
        }
        movedPath.closePath();
      }

      // 在临时画布上绘制选区内容
      tempCtx.save();
      tempCtx.putImageData(
        selectedArea.value.imageData,
        selectedArea.value.bounds.x,
        selectedArea.value.bounds.y
      );
      tempCtx.restore();

      // 将临时画布的内容复制到主画布
      ctx.value.drawImage(tempCanvas, 0, 0);

      // 保存历史记录
      if (
        selectedArea.value.bounds.x !== selectedArea.value.originalBounds.x ||
        selectedArea.value.bounds.y !== selectedArea.value.originalBounds.y
      ) {
        saveToHistory();
      }

      // 清除选区状态和选区层
      selectedArea.value = null;
      clearSelectionCanvas();
    }
  } else if (isDrawing.value) {
    isDrawing.value = false;
    saveToHistory();
  }
};

// 清除选区画布
const clearSelectionCanvas = () => {
  if (!selectionCtx.value || !selectionCanvas.value) return;
  selectionCtx.value.clearRect(
    0,
    0,
    selectionCanvas.value.width,
    selectionCanvas.value.height
  );
};

// 绘制选区路径
const drawSelectionPath = () => {
  if (!selectionCtx.value || !selectionPath.value) return;

  selectionCtx.value.save();
  selectionCtx.value.strokeStyle = "#0066ff";
  selectionCtx.value.lineWidth = 1;
  selectionCtx.value.setLineDash([5, 5]);
  selectionCtx.value.stroke(selectionPath.value);
  selectionCtx.value.setLineDash([]);
  selectionCtx.value.restore();
};

// 绘制选中区域
const drawSelectedArea = () => {
  if (!selectionCtx.value || !selectedArea.value) return;

  // 绘制选区内容
  selectionCtx.value.putImageData(
    selectedArea.value.imageData,
    selectedArea.value.bounds.x,
    selectedArea.value.bounds.y
  );

  // 绘制选区边框
  selectionCtx.value.save();
  selectionCtx.value.strokeStyle = "#0066ff";
  selectionCtx.value.lineWidth = 1;
  selectionCtx.value.setLineDash([5, 5]);

  // 计算偏移量并绘制移动后的路径
  const offsetX =
    selectedArea.value.bounds.x - selectedArea.value.originalBounds.x;
  const offsetY =
    selectedArea.value.bounds.y - selectedArea.value.originalBounds.y;

  const path = new Path2D();
  const points = selectedArea.value.points;
  if (points.length > 0) {
    path.moveTo(points[0].x + offsetX, points[0].y + offsetY);
    for (let i = 1; i < points.length; i++) {
      path.lineTo(points[i].x + offsetX, points[i].y + offsetY);
    }
    path.closePath();
  }

  selectionCtx.value.stroke(path);
  selectionCtx.value.setLineDash([]);
  selectionCtx.value.restore();
};

// 计算路径的边界，并确保不超出画布范围
const calculatePathBounds = (points: { x: number; y: number }[]) => {
  if (!canvas.value) return { x: 0, y: 0, width: 0, height: 0 };

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x = Math.max(0, Math.min(...xs));
  const y = Math.max(0, Math.min(...ys));
  const maxX = Math.min(Math.max(...xs), canvas.value.width);
  const maxY = Math.min(Math.max(...ys), canvas.value.height);
  const width = maxX - x;
  const height = maxY - y;
  return { x, y, width, height };
};

const loadPage = (pageNumber: number) => {
  if (!ctx.value || !canvas.value) return;

  const pageIndex = pageNumber - 1;
  if (!pages.value[pageIndex]) {
    // 如果页面不存在，创建新页面
    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
    pages.value[pageIndex] = ctx.value.getImageData(
      0,
      0,
      canvas.value.width,
      canvas.value.height
    );
    history.value[pageIndex] = [pages.value[pageIndex]];
    currentHistoryIndex.value[pageIndex] = 0;
  } else {
    // 加载已存在的页面
    ctx.value.putImageData(pages.value[pageIndex], 0, 0);
  }

  // 清除选区层
  clearSelectionCanvas();
};

const saveToHistory = () => {
  if (!ctx.value || !canvas.value) return;

  const currentPageIndex = props.currentPage - 1;
  const currentState = ctx.value.getImageData(
    0,
    0,
    canvas.value.width,
    canvas.value.height
  );

  history.value[currentPageIndex] = history.value[currentPageIndex].slice(
    0,
    currentHistoryIndex.value[currentPageIndex] + 1
  );
  history.value[currentPageIndex].push(currentState);
  currentHistoryIndex.value[currentPageIndex]++;
};

// 暴露方法给父组件
defineExpose({
  undo: () => {
    if (!ctx.value || !canvas.value) return;
    const currentPageIndex = props.currentPage - 1;
    if (currentHistoryIndex.value[currentPageIndex] > 0) {
      currentHistoryIndex.value[currentPageIndex]--;
      ctx.value.putImageData(
        history.value[currentPageIndex][
          currentHistoryIndex.value[currentPageIndex]
        ],
        0,
        0
      );
      selectedArea.value = null;
      clearSelectionCanvas();
    }
  },
  redo: () => {
    if (!ctx.value || !canvas.value) return;
    const currentPageIndex = props.currentPage - 1;
    if (
      currentHistoryIndex.value[currentPageIndex] <
      history.value[currentPageIndex].length - 1
    ) {
      currentHistoryIndex.value[currentPageIndex]++;
      ctx.value.putImageData(
        history.value[currentPageIndex][
          currentHistoryIndex.value[currentPageIndex]
        ],
        0,
        0
      );
      selectedArea.value = null;
      clearSelectionCanvas();
    }
  },
  canUndo: () => {
    const currentPageIndex = props.currentPage - 1;
    return currentHistoryIndex.value[currentPageIndex] > 0;
  },
  canRedo: () => {
    const currentPageIndex = props.currentPage - 1;
    return (
      currentHistoryIndex.value[currentPageIndex] <
      history.value[currentPageIndex]?.length - 1
    );
  },
  toDataURL: (background: "white" | "transparent" = "white") => {
    return new Promise<string>((resolve) => {
      if (!canvas.value) {
        resolve("");
        return;
      }

      // 创建临时画布
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.value.width;
      tempCanvas.height = canvas.value.height;
      const tempCtx = tempCanvas.getContext("2d");

      if (tempCtx) {
        if (background === "white") {
          // 白色背景
          tempCtx.fillStyle = "#ffffff";
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        }
        // 将原画布内容复制到临时画布
        tempCtx.drawImage(canvas.value, 0, 0);
        resolve(tempCanvas.toDataURL("image/png"));
      } else {
        resolve(canvas.value.toDataURL());
      }
    });
  },

  loadImage: (img: HTMLImageElement) => {
    if (!ctx.value || !canvas.value) return;

    // 清空当前画布
    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);

    // 在画布中央绘制图片
    const scale = Math.min(
      canvas.value.width / img.width,
      canvas.value.height / img.height
    );
    const x = (canvas.value.width - img.width * scale) / 2;
    const y = (canvas.value.height - img.height * scale) / 2;

    ctx.value.drawImage(img, x, y, img.width * scale, img.height * scale);

    // 保存到历史记录
    saveToHistory();
  },
});
</script>
