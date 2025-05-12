const express  = require('express') 
const http = require('http');
const {Server}  = require('socket.io');
const Chat = require('../models/Chat');

const app = express();
const server = http.createServer(app);
// const io = socketIo(server);
const io = new Server(server);
// console.log('oiii', io)

const createChatData = async (message) => {
    // const {user_id,item_id,shoe_id,pant_id} = req.body;
    try{
      
      const chatData = new Chat(message);
      const storeChatData =  await  chatData.save();
      return storeChatData;
    //   return res.status(200).send({message:'success',data:storeChatData})

    }catch(err){
      console.log('error', err)
    }
}

io.on('connection', (socket) => {
    console.log('Socket User connected', socket.id);
  
    socket.on("message", async (message, callback) => {
      // Broadcast the message to all connected clients

    //  socket.broadcast.to(message?.chat_room_id).emit('message1', message);
     

    

      delete message._id;

      // console.log('sockert message', message)

      const createmessage = await createChatData(message)

      io.emit('message', createmessage);
       console.log('sockert createmessage', createmessage)
    //   return res.status(200).send({message:'success',data:createmessage})
     // io.emit('receive_message', message);
    // callback()
    });



    // ===== Join Room =====
    socket.on("join", async ({id,name}, callback) => {
      const user = {
          id: id,
          name: name
      }
      socket.join(user.id)
      
      socket.emit('message', {
          _id: uuid.v4(),
          text: `${user.name}, welcome to the room`,
          createdAt: new Date(),
          system: true,
          room_id: id
      });

      socket.broadcast.to(user.id).emit('message', {
          _id: uuid.v4(),
          text: `${user.name} has joined the room`,
          createdAt: new Date(),
          system: true,
          room_id: id
      });

      callback()
  }) // on join


    // ===== Loading previous messages =====
    socket.on("loadmessages", async (data, callback) => {
      let room = data.id 
      console.log('room', room)
      const loadmessages = await loadMessages(room)

      // console.log('loadmessages', loadmessages)
      if (loadmessages.error) return callback({
          status: false,
          message: loadmessages.error
      })

      var result = [];
      var messages = loadmessages.data
      if (messages.length > 0) {
          for (let index = 0; index < messages.length; index++) {
              const element = messages[index];
              var setmessage = {
                  _id: element._id,
                  room: element.room,
                  user: element.user,
                  text: element.text,
                  createdAt: element.created_at
              }

              result.push(setmessage)
          }
      }

      callback({
          status: true,
          message: result
      })
  })




    // ===== Send Message ======
    socket.on("send", async (data, callback) => {
      console.log(data, data.room)

    //   const createmessage = await createMessage(data)

    //   if (createmessage.error) return callback({
    //       status: false,
    //       message: createmessage.error
    //   })

    //   // socket.emit('message', data);
    //   socket.broadcast.to(data.room).emit('message', data);
    //   callback({
    //       status: true,
    //       message: data
    //   })
  });


  // ===== Leave Room =====
  socket.on('leaveroom', ({id,name}, callback) => {
    // socket.rooms === {}
    console.log('disconnect', typeof id, socket.id)
    socket.leave(id)
    socket.broadcast.to(id).emit('message', {
        _id: uuid.v4(),
        text: `${name} has left the room`,
        createdAt: new Date(),
        system: true,
    })
    // socket.disconnect(true)
    callback('disconnected')
    console.log('room', socket.rooms)
});




  
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });



  server.listen(9000, () => {console.log('socket server running at 9000') })