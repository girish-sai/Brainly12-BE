import express from 'express';
import jwt from 'jsonwebtoken';
import { ContentModel, LinkModel, UserModel } from './db';
import { JWT_PASSWORD } from './config';
import { userMiddleware } from './middleware';
import { random } from './utils';

import cors from 'cors';

const app=express();

app.use(express.json());
app.use(cors());
app.post("/api/v1/signup",async (req,res)=>{
const username=req.body.username;
const password=req.body.password;

try{
  await UserModel.create({
    username:username,
    password:password
  })
  res.json({
    msg:"SignUp Successfully"
   })
}catch(e){
  res.status(411).json({
    msg:"User Already exists"
  })
}


})
app.post("/api/v1/signin",async (req,res)=>{
  const username=req.body.username;
const password=req.body.password;


  const existingUser=await UserModel.findOne({
    username:username,
    password:password
  })
  if(existingUser){
    const token=jwt.sign({
      id:existingUser._id
    },JWT_PASSWORD);
    res.json({
      token:token
    })
  }
 else{
  res.status(411).json({
    msg:"Incorrect credentials "
  })
 
}
})

app.post("/api/v1/content",userMiddleware,async (req,res)=>{
  const link=req.body.link;
  const type=req.body.type;
  await ContentModel.create({
    link,
    type,
    title:req.body.title,
    //@ts-ignore
    userId:req.userId,
    tags:[]
  })
  res.json({
    msg:"Content Added"
  })
})

app.get("/api/v1/content",userMiddleware,async (req,res)=>{
  //@ts-ignore
  const userId=req.userId;
  const content=await ContentModel.find({
    userId:userId,
  }).populate("userId","username")
  res.json({
    content
  })
})

app.delete("/api/v1/content",userMiddleware,async (req,res)=>{
  const contentId=req.body.contentId;
  await ContentModel.deleteOne({
    _id:contentId,
    //@ts-ignore
    userId:req.userId
  })
  res.json({
    msg:"Content deleted",
    
  })
})

app.post("/api/v1/brain/share",userMiddleware,async (req,res)=>{
const share=req.body.share;
if(share){

 const existingLink= await LinkModel.findOne({
  //@ts-ignore
    userId:req.userId
  });
  if(existingLink){
    res.json({
      hash:existingLink.hash
    })
    return;
  }
  const hash=random(10);
  await LinkModel.create({
    //@ts-ignore
    userId:req.userId,
    hash:hash
  })
  res.json({
    msg:"/share/"+hash
  })
}else{
  await  LinkModel.deleteOne({
    //@ts-ignore
    userId:req.userId
  });
}
res.json({
  msg:"Removed Link"
})

})

app.get("/api/v1/brain/:shareLink",async (req,res)=>{
    const hash=req.params.shareLink
    const link=await LinkModel.findOne({
      hash
    });
    if(!link){
      res.status(411).json(
        {
          msg:"Sorry incorrect input"
        }
        

      )
      return
    }
      const content=await ContentModel.find({
        userId:link.userId
      })
    const user=await UserModel.findOne({
      _id:link.userId
    })
    if(!user){
      res.status(411).json({
        msg:'User not found, Error should ideally not happen'
      })
      return;
    }
   res.json({
    username:user.username,
    content:content
   })
})

app.listen(3000,()=>{
  console.log("running in port 3000");
})