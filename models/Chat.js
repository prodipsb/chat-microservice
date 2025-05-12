const mongoose = require('mongoose');
const chatSchema = new mongoose.Schema({
    chat_room_id: {
        type: String,
        required: true,
        default: null
    },
    message_type: {
        type: String,
        required: false,
        default: null
    },
    message: {
        type: String,
        required: false,
        default: null
    },
    text: {
        type: String,
        required: false,
        default: null
    },
    sender_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null
    },
    receiver_id:{
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        default: null
    },
   
    user:{
        type: Object,
        required: false,
        default: null
    },
    received:{
        type: Object,
        required: false,
        default: null
    },
    image:{
        type:String,
        required: false,
        default: null
    },
    video:{
        type:String,
        required: false,
        default: null
    },
    audio:{
        type:String,
        required: false,
        default: null
    },
    system:{
        type:Boolean,
        required: false,
        default: null
    },
    pending:{
        type:Boolean,
        required: false,
        default: null
    },
    quickReplies:{
        type:Object,
        required: false,
        default: null
    },
    // createdAt:{
    //     type:timestamps,
    //     required: false,
    //     default: null
    // }

},
{
    timestamps: true
})


const Chat = mongoose.model('Chat',chatSchema);

module.exports = Chat;