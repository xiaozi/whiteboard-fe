import { ref, onMounted } from 'vue';

export function useCanvas() {
  const canvas = ref<HTMLCanvasElement | null>(null);
  const ctx = ref<CanvasRenderingContext2D | null>(null);

  const resizeCanvas = (canvas: HTMLCanvasElement) => {
    const container = canvas.parentElement;
    if (container) {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
    }
  };

  onMounted(() => {
    if (canvas.value) {
      ctx.value = canvas.value.getContext('2d');
      resizeCanvas(canvas.value);
      window.addEventListener('resize', () => canvas.value && resizeCanvas(canvas.value));
    }
  });

  return {
    canvas,
    ctx,
    resizeCanvas
  };
} 