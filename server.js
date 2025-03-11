const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connect = require("./database/db.js");
const route = require("./routes/auth.js");
const Message = require("./model/msg.js");
const multer=require('multer');
const user = require("./model/users.js");
const verifyToken = require("./middleware/middle.js"); 

const userssocketid={};

const storage=multer.diskStorage({
  destination:(req,file,cb)=>{
    if(!file) return;
    if(file.fieldname=="profile")
      cb(null,"./uploads/")
    else
    cb(null,"./uploads/msgdata/");
  },
  filename:(req,file,cb)=>{
    cb(null,Date.now()+"rajat");
  }

})
const upload=multer({
  storage:storage,
  limits:{
    fileSize:1024*1024*5
    },
    fileFilter:(req,file,cb)=>{
        const type=file.mimetype;
        if(type=="image/jpeg"||type=="image/png"){
          cb(null,true);
          }
          else{
            cb(null,false);
            }
            }
    }

  );

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const port = 8000;
connect();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/uploads",express.static("uploads"));



io.on("connection", (socket) => {
  console.log("A user connected: ", socket.id);
  socket.on("registration",({userid})=>{
    userssocketid[userid]=socket.id;
    
    console.log("User registered with socket id: ", userssocketid);
    console.log("User registered: ",userid,socket.id);

    io.emit("update",{userid:userid,status:"online"})

  })
  socket.on("check",async({selectid})=>{
      if(userssocketid[selectid]){
        socket.emit("found");
        }
        else{
          console.log("User not found: ",selectid);
  
          socket.emit("notfound");
  
      }
    })


    socket.on("message-seen", async ({ sender, receiver }) => {
      console.log("Message seen: ", sender, receiver);
      const updatedMessage = await Message.updateMany({
      $or:[
        { sender: sender, receiver: receiver, seen: false },
        { sender: receiver, receiver: sender, seen: false },
      ]
    },
    { $set: { seen: true } }
      );
      

      if (updatedMessage.modifiedCount === 0) {
        console.log("No messages were updated!");
        return;
      }
        console.log(updatedMessage)
        
      const senderSocketId = userssocketid[sender];
      if (senderSocketId) {
        io.to(senderSocketId).emit("update-seen", { sender, receiver });
      }
    });
    
  socket.on("sendMessage", async ({ sender, receiver, text ,file}) => {
    try {
      console.log(receiver,"D")
      const newMessage = new Message({ sender, receiver, text ,file});
      await newMessage.save();
      const updateuser = await user.findByIdAndUpdate(
        sender,  
        { 
          $set: { 
            msg: text,
            time: newMessage.createdAt,  
          }
        },
        { new: true } 
      );
      const updateuser1 = await user.findByIdAndUpdate(
        receiver,  
        { 
          $set: { 
            msg: text,
            time: newMessage.createdAt,  
          }
        },
        { new: true } 
      );
      
      console.log(receiver,userssocketid)
      const receiveruser=userssocketid[receiver];
      console.log(socket.id,receiveruser,"pp")
      if(receiveruser){
      io.to(receiveruser).emit("receiveMessage", newMessage); 
      console.log("hello");
      }
      
      io.emit("update-userlist",{
        userid:sender,
        msg:text,
        time:updateuser.time
      })
      io.emit("update-userlist",{
        userid:receiver,
        msg:text,
        time:updateuser1.time
      })
    } catch (error) {
      console.error("Error saving message: ", error);
    }
  });
  
  socket.on("disconnect", () => {
    let h=null;
    for (let userId in userssocketid) {
      if (userssocketid[userId] === socket.id) {
        h=userId;
          delete userssocketid[userId]; 
          break;  
      }
  }
  if(h)
  {
    io.emit("update",{userid:h,status:"offline"})
    socket.broadcast.emit("notfound",{userid:h});
    console.log("User disconnected: ", socket.id);
  }
    
  });
});

app.post("/dataupload/:userid/:selectid",upload.single("filehai"),async(req,res)=>{
  console.log(req.file,"pehli hai");
  const userid=req.params.userid;
  const selectid=req.params.selectid;
  const filepath=req.file.filename;
  console.log(filepath,"l");
  try{
    const newMessage = new Message({ sender:userid, receiver:selectid, file:filepath });
      await newMessage.save();
      const messageData = {
        sender: userid,
        receiver: selectid,
        file: filepath,
        createdAt: newMessage.createdAt,
      };
  
      const receiverSocketId = userssocketid[selectid];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", messageData);
      }
  
      res.json({ newMessage: messageData });
  }
  catch(err){
    console.log("Error saving file",err);
  }
})

app.post("/upload:userid", upload.single("profile"), async (req, res) => {
  console.log(req.file,"dusari hai");
  const userid = req.params.userid;
  const filepath = req.file.filename;
  try {
    const updatedUser = await user.findByIdAndUpdate(
      userid,
      { dp: filepath },
      { new: true }
    );
    res.json({ dp: updatedUser.dp });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.use("/api/auth", route);






server.listen(port, () => {
  console.log("Server is running on port", port);
});
