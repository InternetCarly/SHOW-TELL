const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

// Track clients by room and role
// Each room has: { displays: Set, senders: Set }
const rooms = {};

function getRoom(name) {
  if (!rooms[name]) rooms[name] = { displays: new Set(), senders: new Set() };
  return rooms[name];
}

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const room = url.searchParams.get("room") || "default";
  const role = url.searchParams.get("role") || "sender";

  const r = getRoom(room);
  if (role === "display") {
    r.displays.add(ws);
  } else {
    r.senders.add(ws);
  }

  console.log(`[${room}] ${role} connected (${r.displays.size} displays, ${r.senders.size} senders)`);

  ws.on("message", (data) => {
    // Broadcast image data from senders to all displays in the same room
    const msg = data.toString();
    console.log(`[${room}] relaying image (${(msg.length / 1024).toFixed(1)} KB)`);
    for (const display of r.displays) {
      if (display.readyState === 1) display.send(msg);
    }
  });

  ws.on("close", () => {
    r.displays.delete(ws);
    r.senders.delete(ws);
    console.log(`[${room}] ${role} disconnected`);
  });
});

console.log(`Relay server running on ws://localhost:${PORT}`);
