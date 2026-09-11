const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let waitingQueue = [];
let onlineUsers = 0;

// 获取本机局域网 IP 的函数
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (let name of Object.keys(interfaces)) {
    for (let iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  onlineUsers++;
  io.emit('onlineCount', onlineUsers);

  socket.on('findMatch', ({ country, gender }) => {
    console.log('User ' + socket.id + ' is looking for a match...');
    if (waitingQueue.length > 0) {
      const peer = waitingQueue.shift();
      socket.emit('matchFound', { peerId: peer.id });
      io.to(peer.id).emit('matchFound', { peerId: socket.id });
    } else {
      waitingQueue.push({ id: socket.id, country, gender });
      socket.emit('waiting');
    }
  });

  socket.on('signal', (data) => {
    io.to(data.targetId).emit('signal', data);
  });

  socket.on('chatMessage', (msg) => {
    socket.broadcast.emit('chatMessage', msg);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    onlineUsers--;
    io.emit('onlineCount', onlineUsers);
    waitingQueue = waitingQueue.filter(u => u.id !== socket.id);
  });
});

const PORT = 3001;
const LOCAL_IP = getLocalIP();
server.listen(PORT, '0.0.0.0', () => {
  console.log('Signaling server is running on port ' + PORT);
  console.log('Local access: http://localhost:' + PORT);
  console.log('Network access: http://' + LOCAL_IP + ':' + PORT);
});
