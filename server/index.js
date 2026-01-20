const WebSocket = require('ws');

const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port });
const rooms = new Map();

function send(ws, msg) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

wss.on('connection', (ws) => {
  ws.roomId = null;

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (e) {
      return;
    }

    if (msg.type === 'join' && msg.room) {
      ws.roomId = msg.room;
      if (!rooms.has(ws.roomId)) {
        rooms.set(ws.roomId, new Set());
      }
      rooms.get(ws.roomId).add(ws);
      send(ws, { type: 'joined', room: ws.roomId });
      return;
    }

    if (!ws.roomId) return;
    const peers = rooms.get(ws.roomId);
    if (!peers) return;
    peers.forEach((peer) => {
      if (peer !== ws) send(peer, msg);
    });
  });

  ws.on('close', () => {
    if (!ws.roomId) return;
    const peers = rooms.get(ws.roomId);
    if (!peers) return;
    peers.delete(ws);
    if (peers.size === 0) {
      rooms.delete(ws.roomId);
    }
  });
});

console.log(`Signaling server running on ${port}`);
