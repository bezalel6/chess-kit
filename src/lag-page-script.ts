/**
 * Chess-Kit Lag Page Script
 * Injected into the main world to intercept WebSocket traffic for move RTT measurement.
 * Communicates with the content script via CustomEvent on document.
 */

(function () {
  const EVENT_NAME = 'chess-kit-ws-data';

  // Track pending sends by timestamp for RTT calculation
  const pendingSends: number[] = [];
  const MAX_PENDING = 50;

  const OriginalWebSocket = window.WebSocket;

  // Proxy the WebSocket constructor to intercept instances
  const WebSocketProxy = new Proxy(OriginalWebSocket, {
    construct(target, args) {
      const ws: WebSocket = Reflect.construct(target, args);

      // Intercept send
      const originalSend = ws.send.bind(ws);
      ws.send = function (data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        const sendTime = performance.now();
        pendingSends.push(sendTime);

        // Cap the pending queue
        if (pendingSends.length > MAX_PENDING) {
          pendingSends.shift();
        }

        return originalSend(data);
      };

      // Intercept messages
      ws.addEventListener('message', () => {
        if (pendingSends.length > 0) {
          const sendTime = pendingSends.shift()!;
          const rtt = performance.now() - sendTime;

          document.dispatchEvent(
            new CustomEvent(EVENT_NAME, {
              detail: {
                type: 'ws-rtt',
                rtt: Math.round(rtt),
                timestamp: Date.now(),
              },
            })
          );
        }
      });

      return ws;
    },
  });

  // Replace global WebSocket
  (window as any).WebSocket = WebSocketProxy;

  // Best-effort: hook into window.game move events if available
  try {
    const checkGameObj = () => {
      const game = (window as any).game;
      if (game && typeof game.on === 'function') {
        let moveStartTime: number | null = null;

        game.on('moveStarted', () => {
          moveStartTime = performance.now();
        });

        game.on('moveFinished', () => {
          if (moveStartTime !== null) {
            const rtt = performance.now() - moveStartTime;
            document.dispatchEvent(
              new CustomEvent(EVENT_NAME, {
                detail: {
                  type: 'ws-rtt',
                  rtt: Math.round(rtt),
                  timestamp: Date.now(),
                },
              })
            );
            moveStartTime = null;
          }
        });
      }
    };

    // Try immediately and after a delay (game object may load late)
    checkGameObj();
    setTimeout(checkGameObj, 3000);
  } catch {
    // Game object hooks are best-effort
  }
})();
