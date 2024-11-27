import { ref } from 'vue';

export function useHistory() {
  const history = ref<ImageData[][]>([]);
  const currentHistoryIndex = ref<number[]>([]);

  const saveToHistory = (ctx: CanvasRenderingContext2D, pageIndex: number) => {
    const currentState = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );

    history.value[pageIndex] = history.value[pageIndex].slice(
      0,
      currentHistoryIndex.value[pageIndex] + 1
    );
    history.value[pageIndex].push(currentState);
    currentHistoryIndex.value[pageIndex]++;
  };

  return {
    history,
    currentHistoryIndex,
    saveToHistory
  };
} 