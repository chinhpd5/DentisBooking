import express from "express";
import mongoose from "mongoose";
import path from 'path';
import dotenv from 'dotenv';
import routers from "./routers";
import cors from "cors";

dotenv.config();

const app = express();

// Cấu hình CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Cho phép requests không có origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Danh sách các origin được phép
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['*'];
    
    // Kiểm tra origin có trong danh sách cho phép không
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {  
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Cho phép gửi cookies và authentication headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Các HTTP methods được phép
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Các headers được phép
  exposedHeaders: ['Content-Range', 'X-Content-Range'], // Các headers client có thể đọc
  maxAge: 86400, // Cache preflight requests trong 24 giờ
};

app.use(cors(corsOptions));

// kết nối cơ sở dữ liệu
mongoose.connect(process.env.CONNECT_MONGODB_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

app.use(express.json());
app.use(express.urlencoded());
app.use(express.static(path.join(__dirname,'uploads')));

app.get('/',(request, response)=>{
  return response.send("Hello world")
})

// Middleware để đảm bảo API response luôn là JSON
app.use("/api", (req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});
app.use("/api", routers);

// 404 handler - phải đặt sau tất cả routes
app.use((req, res, next) => {
  return res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler - phải đặt cuối cùng
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  
  // Đảm bảo không gửi response nếu headers đã được gửi
  if (res.headersSent) {
    return next(err);
  }
  
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  return res.status(statusCode).json({
    success: false,
    message: message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
