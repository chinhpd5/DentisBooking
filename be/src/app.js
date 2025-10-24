import express from "express";
import mongoose from "mongoose";
import path from 'path';
import dotenv from 'dotenv';
import routers from "./routers";
import cors from "cors";

dotenv.config();

const app = express();

app.use(cors())

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
