const mongoose = require("mongoose");
const userschema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  dp:{
    type:String,
    default:"https://th.bing.com/th?id=OIP.TcMjfHhFaDXAP0kdc8mLKAHaEK&w=333&h=187&c=8&rs=1&qlt=90&r=0&o=6&pid=3.1&rm=2"
  },
  about:{
    type:String,
    default:"No description available",
  },
  msg:{
    type:String,
    default:"No message available",
  },
  time:{
    type:Date,
    default:"",
  },
  otp:{
    type:Number,  
  }

});
const user = mongoose.model("user", userschema);
module.exports = user;
