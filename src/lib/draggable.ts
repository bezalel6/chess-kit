type DraggableOptions = {
  handle?: HTMLElement | ((root: HTMLElement) => HTMLElement);
  initial?: { x?: number; y?: number; size?: { width: number; height: number } };
  axis?: 'both' | 'x' | 'y';
  zIndex?: number;
  isRepositionable?: boolean;
  isResizable?: boolean;
  onDragEnd?: (position: { x: number; y: number }) => void;
  onResizeEnd?: (size: { width: number; height: number }) => void;
};

export function makeDraggable(
  selector: string,
  opts: DraggableOptions = {}
) {
  const root = document.querySelector<HTMLElement>(selector);
  if (!root) throw new Error(`makeDraggable: "${selector}" not found`);

  const axis = opts.axis ?? 'both';
  const cs = getComputedStyle(root);

  // If the element has a stored position, use it. Otherwise, calculate its current position.
  if (opts.initial?.x !== undefined) {
    root.style.left = `${opts.initial.x}px`;
  }
  if (opts.initial?.y !== undefined) {
    root.style.top = `${opts.initial.y}px`;
  }
  
  // If the element has a stored size, use it. Otherwise, use its current size.
  if (opts.initial?.size?.width !== undefined) {
    root.style.width = `${opts.initial.size.width}px`;
  } else {
    root.style.width = cs.width;
  }
  if (opts.initial?.size?.height !== undefined) {
    root.style.height = `${opts.initial.size.height}px`;
  }

  // This is the key part: if we are about to make an element absolute that was previously
  // static, we pin it to its current location on the screen.
  if (cs.position === 'static' && opts.initial?.x === undefined) {
    const rect = root.getBoundingClientRect();
    root.style.top = `${rect.top + window.scrollY}px`;
    root.style.left = `${rect.left + window.scrollX}px`;
    root.style.height = `${rect.height}px`; // Also lock in the height
  }
  
  // Ensure the element is absolutely positioned to allow top/left to work.
  if (cs.position === 'static') {
    root.style.position = 'absolute';
  }

  if (opts.zIndex !== undefined) {
    root.style.zIndex = String(opts.zIndex);
  }

  let handle: HTMLElement | null = null;
  let resizeHandle: HTMLElement | null = null;

  // Dragging logic
  if (opts.isRepositionable) {
    handle = typeof opts.handle === 'function'
        ? opts.handle(root)
        : opts.handle ?? root;

    let dragging = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;

    const onMouseDown = (e: MouseEvent) => {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseInt(root.style.left || '0', 10);
      startTop = parseInt(root.style.top || '0', 10);
      (handle as HTMLElement).style.cursor = 'grabbing';
      e.preventDefault();
      e.stopPropagation();
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
  }

  // Resizing logic
  if (opts.isResizable) {
    resizeHandle = document.createElement('div');
    Object.assign(resizeHandle.style, {
      position: 'absolute',
      bottom: '0px',
      right: '0px',
      width: '10px',
      height: '10px',
      background: 'rgba(0,0,0,.5)',
      cursor: 'nwse-resize',
      zIndex: String(opts.zIndex ? opts.zIndex + 1 : 'auto'),
    });
    root.appendChild(resizeHandle);

    let resizing = false;
    let startResizeX = 0, startResizeY = 0, startWidth = 0, startHeight = 0;

    const onResizeMouseDown = (e: MouseEvent) => {
      resizing = true;
      startResizeX = e.clientX;
      startResizeY = e.clientY;
      startWidth = parseInt(getComputedStyle(root).width, 10);
      startHeight = parseInt(getComputedStyle(root).height, 10);
      e.preventDefault();
      e.stopPropagation();
    };

    const onResizeMouseMove = (e: MouseEvent) => {
      if (!resizing) return;
      const newWidth = startWidth + (e.clientX - startResizeX);
      const newHeight = startHeight + (e.clientY - startResizeY);
      root.style.width = `${newWidth}px`;
      root.style.height = `${newHeight}px`;
    };

    const onResizeMouseUp = () => {
      if (resizing) {
        resizing = false;
        if (opts.onResizeEnd) {
          opts.onResizeEnd({
            width: parseInt(root.style.width, 10),
            height: parseInt(root.style.height, 10),
          });
        }
      }
    };

    resizeHandle.addEventListener('mousedown', onResizeMouseDown);
    window.addEventListener('mousemove', onResizeMouseMove);
    window.addEventListener('mouseup', onResizeMouseUp);
  }

  return {
    destroy() {
      // A more robust implementation would store and remove these listeners specifically.
      if (handle) {
        // For now, we assume destroying the element or its parent will clean up.
      }
      if (resizeHandle && root.contains(resizeHandle)) {
        root.removeChild(resizeHandle);
      }
    },
  };
}
