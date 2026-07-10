const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WS_PORT = 8081;

// 配置：要监听的项目目录列表
const WATCH_PATHS = [
  {
    boardHtml: 'e:\\星寰海\\.board\\index.html',
    diffsDir: 'e:\\星寰海\\.board\\diffs\\'
  }
];

// 所有连接的 WebSocket 客户端
const clients = new Set();

// 生成 WebSocket accept key
function generateAcceptKey(key) {
  const magic = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
  return crypto.createHash('sha1').update(key + magic).digest('base64');
}

// 编码 WebSocket 文本帧
function encodeFrame(data) {
  const payload = Buffer.from(data, 'utf-8');
  const payloadLen = payload.length;
  let frame;

  if (payloadLen < 126) {
    frame = Buffer.allocUnsafe(2 + payloadLen);
    frame[0] = 0x81; // FIN=1, opcode=text
    frame[1] = payloadLen;
    payload.copy(frame, 2);
  } else if (payloadLen < 65536) {
    frame = Buffer.allocUnsafe(4 + payloadLen);
    frame[0] = 0x81;
    frame[1] = 126;
    frame.writeUInt16BE(payloadLen, 2);
    payload.copy(frame, 4);
  } else {
    frame = Buffer.allocUnsafe(10 + payloadLen);
    frame[0] = 0x81;
    frame[1] = 127;
    frame.writeBigUInt64BE(BigInt(payloadLen), 2);
    payload.copy(frame, 10);
  }

  return frame;
}

// 广播消息给所有客户端
function broadcast(message) {
  const frame = encodeFrame(JSON.stringify(message));
  for (const client of clients) {
    try {
      client.write(frame);
    } catch (e) {
      // 忽略写入失败的客户端
    }
  }
}

// 创建 HTTP 服务器并处理 WebSocket 升级
const server = http.createServer((req, res) => {
  res.writeHead(426, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server - use ws://localhost:' + WS_PORT);
});

server.on('upgrade', (request, socket, head) => {
  const key = request.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }

  const acceptKey = generateAcceptKey(key);
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + acceptKey + '\r\n' +
    '\r\n'
  );

  clients.add(socket);
  console.log('[WS] Client connected, total:', clients.size);

  // 发送连接成功消息
  try {
    socket.write(encodeFrame(JSON.stringify({ type: 'connected', message: 'WebSocket 实时更新已连接' })));
  } catch (e) {
    // ignore
  }

  socket.on('close', () => {
    clients.delete(socket);
    console.log('[WS] Client disconnected, total:', clients.size);
  });

  socket.on('error', () => {
    clients.delete(socket);
  });

  // 忽略客户端发来的消息（只接收不处理）
  socket.on('data', () => {});
});

// 文件监听防抖
const debounceMap = new Map();
function debouncedBroadcast(filePath, delay) {
  delay = delay || 300;
  const key = filePath;
  if (debounceMap.has(key)) {
    clearTimeout(debounceMap.get(key));
  }
  debounceMap.set(key, setTimeout(function() {
    debounceMap.delete(key);
    var fileName = path.basename(filePath);
    console.log('[Watch] File changed:', filePath);
    broadcast({ type: 'reload', file: fileName, path: filePath });
  }, delay));
}

// 设置文件监听
function setupWatchers() {
  for (var i = 0; i < WATCH_PATHS.length; i++) {
    var config = WATCH_PATHS[i];
    // 监听 index.html
    if (fs.existsSync(config.boardHtml)) {
      fs.watch(config.boardHtml, function(eventType) {
        if (eventType === 'change') {
          debouncedBroadcast(config.boardHtml);
        }
      });
      console.log('[Watch] Watching:', config.boardHtml);
    } else {
      console.log('[Watch] Not found (will retry on change):', config.boardHtml);
    }

    // 监听 diffs 目录
    if (fs.existsSync(config.diffsDir)) {
      fs.watch(config.diffsDir, { recursive: true }, function(eventType, filename) {
        if (eventType === 'change' && filename) {
          var fullPath = path.join(config.diffsDir, filename);
          debouncedBroadcast(fullPath);
        }
      });
      console.log('[Watch] Watching directory:', config.diffsDir);
    } else {
      console.log('[Watch] Directory not found (will retry on change):', config.diffsDir);
    }
  }
}

server.listen(WS_PORT, function() {
  console.log('[WS] WebSocket server listening on ws://localhost:' + WS_PORT);
  setupWatchers();
});

// 优雅退出
process.on('SIGINT', function() {
  console.log('\n[WS] Shutting down...');
  for (var client of clients) {
    try {
      client.destroy();
    } catch (e) {}
  }
  server.close(function() {
    process.exit(0);
  });
});
