import jwt from 'jsonwebtoken'
import User from '../models/user.model';
import dotenv from 'dotenv';
import { USER_ROLE } from '../utils/constants.js';
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
    req.user = decode;
  })

  next()
}

export const checkPermission = (...roles) =>{
  return async (req,res,next) => {
    try {
      const user = await User.findById(req.userId);
      
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

export const checkAdmin = (req,res,next) => {
  if(req.user.role !== USER_ROLE.ADMIN){
    return res.status(403).json({message: "Bạn không có quyền sử dụng chức năng này"})
  }
  next();
}

export const checkStaff = (req,res,next) => {
  if(req.user.role !== USER_ROLE.STAFF){
    return res.status(403).json({message: "Bạn không có quyền sử dụng chức năng này"})
  }
  next();
}

export const checkAdminStaff = (req,res,next) => {
  if(!(req.user.role === USER_ROLE.ADMIN || req.user.role === USER_ROLE.STAFF)){
    return res.status(403).json({message: "Bạn không có quyền sử dụng chức năng này"})
  }
  next();
}