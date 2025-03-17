const express=require('express');
const mongoose=require('mongoose')
const routes=express.Router();
const user=require('../model/users');
const verifyToken = require("../middleware/middle"); 
const jwt = require("jsonwebtoken"); 
const message=require('../model/msg')
const SecretKey="HareKrishna";

routes.post('/checkemail',async(req,res)=>{
  try{
    const { email } = req.body;
    const existingUser = await user.findOne({ email });
  
    if (!existingUser) return res.status(400).json({ message: "User not found" }); 
    const otp=Math.floor(Math.random()*12345);
    existingUser.otp=otp;
    await existingUser.save();
    const token=jwt.sign({email},SecretKey,{expiresIn:"2h"})
    res.status(200).json( {token,otp} );
  }
  catch(err){
    console.log(err);
    res.status(500).send({message:err.message})
    }
    })

    routes.post("/Otp",verifyToken,async(req,res)=>{
      try{
        const { otp } = req.body;
        const {email}= req.user;
        const existingUser = await user.findOne({ email });
        if (!existingUser) return res.status(400).json({ message: "User not found" });
          if(existingUser.otp!=otp){
            return res.status(400).json({ message: "Invalid OTP" });
            }
            existingUser.otp=null;
            await existingUser.save();
            res.status(200).json({ email});
            }
            catch(err){
              console.log(err);
            }
    })

    routes.post("/Password",verifyToken,async(req,res)=>{
      try{
        const { password } = req.body;
        const {email}= req.user;
        console.log(password,"lllll");
        const existingUser = await user.findOne({ email });
        if (!existingUser) return res.status(400).json({ message: "User not found"});

          existingUser.password=password;
          await existingUser.save();
          res.status(200).json({ message: "Password updated" });
          }
          catch(err){
            console.log(err);
            res.status(500).json({ message: "Internal Server Error" });
          }
    })
routes.post("/deletemsg",async(req,res)=>{
  try{
    const{userid,selectid}=req.body;
    console.log(userid,selectid);
    const msg = await message.deleteMany({
      $or: [
        { sender: userid, receiver: selectid },
        { sender: selectid, receiver: userid }
      ]
    });
    
    res.json(msg);
    
  }
  catch(error){
    console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
})
routes.post("/allmsg", async (req, res) => {
  try {
      const { senderId, receiverId } = req.body;  
      if (!senderId || !receiverId) {
          return res.status(400).json({ error: "Sender and Receiver IDs are required." });
      }
      const messages = await message.find({
          $or: [
              { sender: senderId, receiver: receiverId },
              { sender: receiverId, receiver: senderId }
          ]
      }) 

      res.json(messages);
  } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});
routes.post('/send',async(req,res)=>{
  try{
  const {sender,receiver,text}=req.body;
  const newmessage=new message({sender,receiver,text});
  await newmessage.save();
  res.status(201).json(newmessage);
  }
  catch(err){
    res.status(500).json({message:err.message});
    }
})
routes.post("/getdata", async (req, res) => {
  try {
    const { userid } = req.body;
    
    const user1 = await user.findById(userid, { dp: 1, username: 1, _id: 0 });
    if (!user1) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user1); 
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

routes.post('/signup',async(req,res)=>{
    
    const { name, email, password } = req.body;
    const existingUser = await user.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const newUser = new user({ username:name, email, password });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
})
routes.post("/login", async (req, res) => {
  try {
      const { email, password } = req.body;
      const existingUser = await user.findOne({ email });

      if (!existingUser) {
          return res.status(400).json({ message: "User not found" });
      }

      if (existingUser.password !== password) {
          return res.status(400).json({ message: "Invalid password" });
      }

      const token = jwt.sign({ userId: existingUser.id }, SecretKey, { expiresIn: "2h" });

      res.status(200).json({ token });
  } catch (err) {
      console.error("Error in login:", err);
      res.status(500).json({ message: "Internal Server Error" });
  }
});

  
    routes.get("/check-auth", verifyToken, (req, res) => {    
      res.status(200).json({ message: "Authenticated", userId: req.user.userId });
    });
    routes.post("/delete",async(req,res)=>{
      try{
        
        const {id}=req.body;
       
        console.log({id},"id hai ye delete");
        const deleted = await message.deleteOne({_id:id});
        console.log(deleted,"k");
        if(!deleted) return res.status(404).json({message:"User not found"});
        res.status(200).json({message:"User deleted successfully"});
        }catch(err){
          res.status(500).json({message:err.message});
        }
    })
    routes.post("/getuser", async (req, res) => {
      const { userid } = req.body;
      console.log(userid,("ewdwed"))
          if (!mongoose.Types.ObjectId.isValid(userid)) {
        return res.status(400).json({ error: "Invalid UserID" });
      }
    
      try {
        const data = await user.find(
          { _id: { $ne: new mongoose.Types.ObjectId(userid) } },
          { username: 1, dp: 1 ,msg:1,time:1}
        );
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: "Server Error" });
      }
    })

  
module.exports=routes;