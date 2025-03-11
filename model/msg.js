const mongoose=require('mongoose');
const messageschema=new mongoose.Schema({
    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      text: {
        type: String,
      },
      file:{
        type:String,
      },
      seen:{
        type:Boolean,
        default:false,
      }
      // status: {
      //   type: String,
      //   // enum: ["sent", "delivered", "read"],
      //   default: "sent",
      // },
    },
    { timestamps: true }
)
const message=mongoose.model("message",messageschema);
module.exports=message;