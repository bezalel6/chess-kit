type DraggableOptions = {
  handle?: HTMLElement | ((root: HTMLElement) => HTMLElement);
  initial?: { x?: number; y?: number };
  axis?: 'both' | 'x' | 'y';
  zIndex?: number;
  onDragEnd?: (position: { x: number; y: number }) => void;
};

export function makeDraggable(
  selector: string,
  opts: DraggableOptions = {}
) {
  const root = document.querySelector<HTMLElement>(selector);
  if (!root) throw new Error(`makeDraggable: "${selector}" not found`);

  const axis = opts.axis ?? 'both';

  const cs = getComputedStyle(root);
  root.style.width = cs.width;

  // ensure positioning
  if (cs.position === 'static') root.style.position = 'absolute';

  if (opts.zIndex !== undefined) {
    root.style.zIndex = String(opts.zIndex);
  }

  if (opts.initial?.x !== undefined) root.style.left = `${opts.initial.x}px`;
  if (opts.initial?.y !== undefined) root.style.top = `${opts.initial.y}px`;

  const handle =
    typeof opts.handle === 'function'
      ? opts.handle(root)
      : opts.handle ?? root;

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  const onMouseDown = (e: MouseEvent) => {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseInt(root.style.left || '0', 10);
    startTop = parseInt(root.style.top || '0', 10);
    (handle as HTMLElement).style.cursor = 'grabbing';
    e.preventDefault();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging) return;

    if (axis === 'both' || axis === 'x') {
      root.style.left = `${startLeft + (e.clientX - startX)}px`;
    }
    if (axis === 'both' || axis === 'y') {
      root.style.top = `${startTop + (e.clientY - startY)}px`;
    }
  };

  const onMouseUp = () => {
    if (dragging) {
      dragging = false;
      (handle as HTMLElement).style.cursor = 'grab';
      if (opts.onDragEnd) {
        opts.onDragEnd({
          x: parseInt(root.style.left || '0', 10),
          y: parseInt(root.style.top || '0', 10),
        });
      }
    }
  };

  handle.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  return {
    destroy() {
      handle.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    },
  };
}
