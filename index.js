import express from 'express';
import mongoose from 'mongoose'
import cors from 'cors'
import morgan from 'morgan'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import fs from 'fs'

import productRoutes from "./routes/products.routes.js";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import messagesRoutes from "./routes/messages.routes.js";
import deliveriesRoutes from "./routes/deliveries.routes.js";
import warehousesRoutes from "./routes/warehouses.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import storiesRoutes from "./routes/stories.routes.js";
import connectDB from './config/connectDB.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
dotenv.config();


app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use('/uploads', express.static('uploads'));

// Connect to database
connectDB();

// Create uploads directory if it doesn't exist
if(!fs.existsSync('./uploads'))fs.mkdirSync('./uploads');

// Routes
app.get('/',(req,res)=>{
    res.json({ message: 'Sokoni Africa API - Server running', version: '2.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/warehouses', warehousesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stories', storiesRoutes);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT ||3000;

app.listen(PORT,()=>{
    console.log(`server running on port http://localhost:${PORT}`)
});