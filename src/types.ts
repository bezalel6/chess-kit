export type DraggableSelector = {
  id: string;
  selector: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  isResizable: boolean;
  isRepositionable: boolean;
};
