import jwt from 'jsonwebtoken'
import User from '../models/user.model';
import dotenv from 'dotenv'
dotenv.config();

export const checkAuth = (req,res,next) =>{
  const header = req.headers["authorization"];
  if(!header){
    return res.status(401).json({message: "Thiếu header"})
  }

  const token = header.split(" ")[1];
  if(!token){
    return res.status(401).json({message: "Thiếu token"})
  }

  jwt.verify(token,process.env.KEY_SECRET,(err,decode) => {
    if(err){
      return res.status(401).json({message: "Sai token hoặc hết hạn"})
    }
    req.userId = decode.id;
  })

  next()
}

export const checkPermission = (...roles) =>{
  return async (req,res,next) => {
    try {
      const user = await User.findById(req.userId);
      console.log(user);
      if(!user){
        return res.status(403).json({message: "Không tìm thấy user"})
      }

      const isPermission = roles.includes(user.role);
      if(!isPermission){
        return res.status(403).json({message: "Bạn không có quyền sử dụng chức năng này"})
      }

      next();
    } catch (error) {
      return res.status(500).json({message: error.message})
    }
    
  }
}