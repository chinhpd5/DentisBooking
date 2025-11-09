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

app.use("/api", routers);

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
