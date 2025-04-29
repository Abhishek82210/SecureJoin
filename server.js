const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const chatRooms = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('joinRoom', ({ roomCode, username }) => {
    if (!chatRooms[roomCode]) {
      chatRooms[roomCode] = { users: {}, messages: [] };
    }

    chatRooms[roomCode].users[socket.id] = { name: username };
    socket.join(roomCode);

    io.to(roomCode).emit('userList', Object.values(chatRooms[roomCode].users));
    socket.emit('roomData', {
      roomCode,
      users: Object.values(chatRooms[roomCode].users),
      messages: chatRooms[roomCode].messages
    });

    io.to(roomCode).emit('message', {
      user: 'System',
      text: `${username} joined the room`,
      timestamp: new Date()
    });
  });

  socket.on('sendMessage', ({ roomCode, message, username, avatar }) => {
    const msg = {
      user: username,
      text: message,
      avatar,
      timestamp: new Date()
    };
    chatRooms[roomCode].messages.push(msg);
    io.to(roomCode).emit('message', msg);
  });

  socket.on('sendFile', ({ roomCode, file, username, avatar }) => {
    const msg = {
      user: username,
      file,
      avatar,
      timestamp: new Date()
    };
    chatRooms[roomCode].messages.push(msg);
    io.to(roomCode).emit('fileMessage', msg);
  });

  socket.on('typing', ({ roomCode, username }) => {
    socket.to(roomCode).emit('typing', { username });
  });

  socket.on('stopTyping', ({ roomCode }) => {
    socket.to(roomCode).emit('stopTyping');
  });

  socket.on('leaveRoom', ({ roomCode }) => {
    if (chatRooms[roomCode]?.users[socket.id]) {
      const username = chatRooms[roomCode].users[socket.id].name;
      delete chatRooms[roomCode].users[socket.id];
      io.to(roomCode).emit('message', {
        user: 'System',
        text: `${username} left the room`,
        timestamp: new Date()
      });
      io.to(roomCode).emit('userList', Object.values(chatRooms[roomCode].users));
    }
  });

  socket.on('disconnect', () => {
    Object.keys(chatRooms).forEach(roomCode => {
      if (chatRooms[roomCode].users[socket.id]) {
        const username = chatRooms[roomCode].users[socket.id].name;
        delete chatRooms[roomCode].users[socket.id];
        io.to(roomCode).emit('userList', Object.values(chatRooms[roomCode].users));
        io.to(roomCode).emit('message', {
          user: 'System',
          text: `${username} disconnected`,
          timestamp: new Date()
        });
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));