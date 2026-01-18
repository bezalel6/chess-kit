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
    transition: opacity 0.3s ease;
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
      top: -28px;
      right: 0px;
      width: 36px;
      height: 28px;
      cursor: grab;
      pointer-events: auto;
      background: linear-gradient(135deg, #4a7c59 0%, #3d6547 100%);
      color: white;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-bottom: none;
      box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.3);
      transition: all 0.2s ease;
    `;

    dragHandle.addEventListener('mouseenter', () => {
      dragHandle.style.background = 'linear-gradient(135deg, #5a8c69 0%, #4d7557 100%)';
      dragHandle.style.transform = 'translateY(-2px)';
    });

    dragHandle.addEventListener('mouseleave', () => {
      dragHandle.style.background = 'linear-gradient(135deg, #4a7c59 0%, #3d6547 100%)';
      dragHandle.style.transform = 'translateY(0)';
    });

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
      border: 2px solid #4a7c59;
      box-sizing: border-box;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    `;
    controlsContainer.appendChild(resizeBorder);

    const directions = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
    directions.forEach(dir => {
      const handle = document.createElement('div');
      handle.dataset.direction = dir;
      handle.style.cssText = `
        position: absolute;
        width: 12px; height: 12px;
        background: linear-gradient(135deg, #4a7c59 0%, #3d6547 100%);
        border: 2px solid rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        pointer-events: auto;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        transition: all 0.2s ease;
      `;
      // Position and cursor style
      if (dir.includes('n')) { handle.style.top = '-6px'; handle.style.cursor = 'n-resize'; }
      if (dir.includes('s')) { handle.style.bottom = '-6px'; handle.style.cursor = 's-resize'; }
      if (dir.includes('w')) { handle.style.left = '-6px'; handle.style.cursor = 'w-resize'; }
      if (dir.includes('e')) { handle.style.right = '-6px'; handle.style.cursor = 'e-resize'; }
      if (dir === 'n' || dir === 's') { handle.style.left = 'calc(50% - 6px)'; }
      if (dir === 'e' || dir === 'w') { handle.style.top = 'calc(50% - 6px)'; }
      if (dir === 'nw' || dir === 'se') { handle.style.cursor = 'nwse-resize'; }
      if (dir === 'ne' || dir === 'sw') { handle.style.cursor = 'nesw-resize'; }

      handle.addEventListener('mouseenter', () => {
        handle.style.background = 'linear-gradient(135deg, #5a8c69 0%, #4d7557 100%)';
        handle.style.transform = 'scale(1.2)';
        handle.style.borderColor = 'rgba(255, 255, 255, 0.8)';
      });

      handle.addEventListener('mouseleave', () => {
        handle.style.background = 'linear-gradient(135deg, #4a7c59 0%, #3d6547 100%)';
        handle.style.transform = 'scale(1)';
        handle.style.borderColor = 'rgba(255, 255, 255, 0.5)';
      });

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