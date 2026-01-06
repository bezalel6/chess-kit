type DraggableOptions = {
  initial?: { x?: number; y?: number; size?: { width: number; height: number } };
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

  // --- Initial Positioning and Sizing ---
  const cs = getComputedStyle(root);
  const hasInitialPosition = opts.initial?.x !== undefined;
  const hasInitialSize = opts.initial?.size?.width !== undefined;

  // If no initial values are stored, get the element's current geometry.
  // This is the key to preventing the element from jumping or resizing.
  if (!hasInitialPosition && !hasInitialSize) {
    const rect = root.getBoundingClientRect();
    if (!hasInitialPosition) {
      root.style.left = `${rect.left + window.scrollX}px`;
      root.style.top = `${rect.top + window.scrollY}px`;
    }
    if (!hasInitialSize) {
      root.style.width = `${rect.width}px`;
      root.style.height = `${rect.height}px`;
    }
  } else {
    // Apply stored values if they exist
    if (hasInitialPosition) {
      root.style.left = `${opts.initial!.x}px`;
      root.style.top = `${opts.initial!.y}px`;
    }
    if (hasInitialSize) {
      root.style.width = `${opts.initial!.size!.width}px`;
      root.style.height = `${opts.initial!.size!.height}px`;
    }
  }

  // Set box-sizing to border-box to make size calculations predictable.
  root.style.boxSizing = 'border-box';
  
  // Ensure the element is absolutely positioned to allow top/left to work.
  if (cs.position === 'static') {
    root.style.position = 'absolute';
  }
  if (opts.zIndex) root.style.zIndex = String(opts.zIndex);

  // --- Controls UI ---
  const controlsContainer = document.createElement('div');
  controlsContainer.style.cssText = `
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
  `;
  root.appendChild(controlsContainer);

  const showControls = () => { controlsContainer.style.opacity = '1'; };
  const hideControls = () => { controlsContainer.style.opacity = '0'; };

  root.addEventListener('mouseenter', showControls);
  root.addEventListener('mouseleave', hideControls);

  // --- Drag Handle ---
  if (opts.isRepositionable) {
    const dragHandle = document.createElement('div');
    dragHandle.dataset.direction = 'drag';
    dragHandle.textContent = '⤧';
    dragHandle.style.cssText = `
      position: absolute;
      top: -22px;
      right: 0px;
      width: 30px;
      height: 22px;
      cursor: grab;
      pointer-events: auto;
      background: #3498db;
      color: white;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      border: 1px solid #fff;
      border-bottom: none;
    `;
    controlsContainer.appendChild(dragHandle);
  }

  // --- Resize Handles ---
  if (opts.isResizable) {
    // Add a border to show the resize area
    const resizeBorder = document.createElement('div');
    resizeBorder.style.cssText = `
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none;
      border: 1px dashed #3498db;
      box-sizing: border-box;
    `;
    controlsContainer.appendChild(resizeBorder);

    const directions = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
    directions.forEach(dir => {
      const handle = document.createElement('div');
      handle.dataset.direction = dir;
      handle.style.cssText = `
        position: absolute;
        width: 10px; height: 10px;
        background: #3498db;
        border: 1px solid #fff;
        pointer-events: auto;
      `;
      // Position and cursor style
      if (dir.includes('n')) { handle.style.top = '-5px'; handle.style.cursor = 'n-resize'; }
      if (dir.includes('s')) { handle.style.bottom = '-5px'; handle.style.cursor = 's-resize'; }
      if (dir.includes('w')) { handle.style.left = '-5px'; handle.style.cursor = 'w-resize'; }
      if (dir.includes('e')) { handle.style.right = '-5px'; handle.style.cursor = 'e-resize'; }
      if (dir === 'n' || dir === 's') { handle.style.left = 'calc(50% - 5px)'; }
      if (dir === 'e' || dir === 'w') { handle.style.top = 'calc(50% - 5px)'; }
      if (dir === 'nw' || dir === 'se') { handle.style.cursor = 'nwse-resize'; }
      if (dir === 'ne' || dir === 'sw') { handle.style.cursor = 'nesw-resize'; }
      
      controlsContainer.appendChild(handle);
    });
  }

  // --- Event Handling Logic ---
  let state = {
    action: null as 'drag' | 'resize' | null,
    direction: null as string | null,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
    startWidth: 0,
    startHeight: 0,
  };

  const onMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const direction = target.dataset.direction;
    if (!direction) return;

    e.preventDefault();
    e.stopPropagation();

    state.direction = direction;
    state.startX = e.clientX;
    state.startY = e.clientY;
    
    // For dragging, get position from the style property to avoid coordinate system mismatch.
    state.startLeft = parseInt(root.style.left || '0', 10);
    state.startTop = parseInt(root.style.top || '0', 10);

    // For resizing, get the current dimensions from getBoundingClientRect.
    const rect = root.getBoundingClientRect();
    state.startWidth = rect.width;
    state.startHeight = rect.height;

    if (direction === 'drag') {
      state.action = 'drag';
      (target as HTMLElement).style.cursor = 'grabbing';
    } else {
      state.action = 'resize';
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!state.action) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;

    if (state.action === 'drag') {
      root.style.left = `${state.startLeft + dx}px`;
      root.style.top = `${state.startTop + dy}px`;
    } else if (state.action === 'resize') {
      let { startWidth, startHeight, startLeft, startTop } = state;
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newLeft = startLeft;
      let newTop = startTop;

      if (state.direction?.includes('e')) newWidth = startWidth + dx;
      if (state.direction?.includes('w')) {
        newWidth = startWidth - dx;
        newLeft = startLeft + dx;
      }
      if (state.direction?.includes('s')) newHeight = startHeight + dy;
      if (state.direction?.includes('n')) {
        newHeight = startHeight - dy;
        newTop = startTop + dy;
      }

      root.style.width = `${newWidth}px`;
      root.style.height = `${newHeight}px`;
      root.style.left = `${newLeft}px`;
      root.style.top = `${newTop}px`;
    }
  };

  const onMouseUp = () => {
    if (state.action === 'drag') {
      if (opts.onDragEnd) {
        opts.onDragEnd({
          x: parseInt(root.style.left, 10),
          y: parseInt(root.style.top, 10),
        });
      }
      const dragBorder = controlsContainer.querySelector('[data-direction="drag"]') as HTMLElement;
      if (dragBorder) dragBorder.style.cursor = 'grab';
    } else if (state.action === 'resize') {
      if (opts.onResizeEnd) {
        opts.onResizeEnd({
          width: parseInt(root.style.width, 10),
          height: parseInt(root.style.height, 10),
        });
      }
    }

    state.action = null;
    state.direction = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  controlsContainer.addEventListener('mousedown', onMouseDown);

  return {
    destroy() {
      root.removeEventListener('mouseenter', showControls);
      root.removeEventListener('mouseleave', hideControls);
      if (root.contains(controlsContainer)) {
        root.removeChild(controlsContainer);
      }
      // The mousedown listener is on the container, which is removed.
      // The window listeners are removed on mouseup, but if destroy is called mid-drag, they might linger.
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    },
  };
}