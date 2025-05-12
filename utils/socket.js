const { Server } = require("socket.io");
const http = require('http');
const Chat = require('../models/Chat');

let IO;
const onlineUsers = new Map();

module.exports.initIO = (server) => {
  IO = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  IO.use((socket, next) => {
    const { callerId, room, user, name } = socket.handshake.query || {};
    socket.roomID = room;
    socket.userProfile = user;
    socket.callerName = name;
    socket.user = callerId;
    next();
  });

  IO.on("connection", (socket) => {
    // console.log('New client connected:', socket.id);
    // console.log("User Connected:", socket.user);
    // console.log("Connected Room:", socket.roomID);

    socket.join(socket.user);
    socket.join(socket.roomID);

    socket.on('user:join', ({ callerId }) => {
      IO.to(callerId).emit('user:joined', { user: socket.user });
    });

    socket.on('joinroom', (room) => {
      socket.join(room?.room);
      console.log(`User joined room 111: ${room?.room}`);
    });

    socket.on('sendMessage', async (newMessage) => {
      try {
        delete newMessage._id;
        const storeMessage = new Chat(newMessage);
        await storeMessage.save();
        IO.to(newMessage?.chat_room_id).emit('newMessage', storeMessage);
      } catch (err) {
        console.error('Error saving message:', err);
      }
    });

    socket.on('chat message', async (data) => {
      try {
        delete data._id;
        const newMessage = new Chat(data);
        await newMessage.save();
        socket.to(data?.room).emit('chat message', newMessage);
      } catch (err) {
        console.error('Error saving message:', err);
      }
    });

    socket.on("call", (payload) => {
      IO.to(payload?.calleeId).emit("newCall", {
        caller: payload?.caller,
        callerId: payload?.calleeId,
        room: payload?.room,
        mediaType: payload?.mediaType,
        rtcMessage: payload?.rtcMessage,
      });
    });

    socket.on("answerCall", ({ room, callerId, rtcMessage }) => {
      IO.to(callerId).emit("callAnswered", {
        callee: socket.user,
        rtcMessage,
      });
    });

    socket.on("ICEcandidate", ({ calleeId, rtcMessage }) => {
      IO.to(calleeId).emit("ICEcandidate", {
        sender: socket.user,
        rtcMessage,
      });
    });

    socket.on("peer:nego:needed", ({ calleeId, rtcMessage }) => {
      IO.to(calleeId).emit("peer:nego:needed", {
        from: socket.user,
        offer: rtcMessage,
      });
    });

    socket.on("peer:nego:done", ({ to, ans }) => {
      IO.to(to).emit("peer:nego:final", {
        from: socket.user,
        ans,
      });
    });

    socket.on("call:end", ({ room }) => {
      IO.to(room).emit("call:ended", { callerId: socket.user });
    });

    socket.on('offerVideoCall', ({ offerDescription, chatRoomId }) => {
      socket.to(chatRoomId).emit('offerVideoCall', { offerDescription });
    });

    socket.on('answerOfferVideoCall', ({ answerDescription, chatRoomId }) => {
      socket.to(chatRoomId).emit('answerOfferVideoCall', answerDescription);
    });

    socket.on('iceCandidate', ({ iceCandidate, chatRoomId }) => {
      socket.to(chatRoomId).emit('iceCandidate', iceCandidate);
    });

    socket.on("join_room", (socketId) => {
      socket.join(socketId);
      IO.to(socketId).emit("new_joined_room", { user: socket.id, room: 1 });
    });

    socket.on("call_user", ({ offer, user }) => {
      IO.to(user).emit("incoming_call", { from: socket.id, offer });
    });

    socket.on("call_accepted", ({ to, answer }) => {
      IO.to(to).emit("call_accepted", { from: socket.id, answer });
    });

    socket.on('join', (roomID, callback) => {
      const socketIds = socketIdsInRoom(roomID);
      callback(socketIds);
      socket.join(roomID);
      socket.room = roomID;
    });

    socket.on('exchange', (data) => {
      data.from = socket.id;
      const to = IO.sockets.sockets.get(data.to);
      if (to) to.emit('exchange', data);
    });

    socket.on('disconnect', () => {
      if (socket.roomID) {
        IO.to(socket.roomID).emit('leave', socket.id);
        socket.leave(socket.roomID);
      }
      onlineUsers.delete(socket.user);
      IO.emit('onlineUsers', Array.from(onlineUsers.values()));
      console.log('User disconnected:', socket.id);
    });
  });
};

function socketIdsInRoom(roomID) {
  const room = IO.sockets.adapter.rooms.get(roomID);
  return room ? Array.from(room) : [];
}

module.exports.getIO = () => {
  if (!IO) throw new Error("IO not initialized");
  return IO;
};
