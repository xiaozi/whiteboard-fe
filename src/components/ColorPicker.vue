<template>
  <div class="flex space-x-2">
    <button
      v-for="color in colors"
      :key="color.value"
      class="w-8 h-8 rounded-full relative color-btn"
      :class="{ 'color-btn-active': modelValue === color.value }"
      @click="emit('update:modelValue', color.value)"
    >
      <div
        class="absolute inset-[4px] rounded-full"
        :style="{ backgroundColor: color.value }"
      ></div>
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const colors = [
  { value: "#000000" },
  { value: "#FF0000" },
  { value: "#0000FF" },
];
</script>

<style scoped>
.color-btn {
  background: transparent;
}

.color-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  padding: 2px;
  background: linear-gradient(45deg, #ff0000, #00ff00, #0000ff);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.2s;
}

.color-btn-active::before {
  opacity: 1;
}
</style>
