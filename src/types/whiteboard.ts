export interface Tool {
  name: string;
  label: string;
  icon: any; // 可以更具体地定义图标类型
}

export interface WhiteboardState {
  currentTool: string;
  currentColor: string;
  currentPage: number;
  totalPages: number;
} 