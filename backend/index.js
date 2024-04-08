import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import http from "http"; // Import http module
import { Server } from "socket.io"; // Import Socket.IO

import usersRoute from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app); // Create HTTP server

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

// CORS configuration
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Database connection
mongoose
  .connect(process.env.MONGO_ATLAS_URI)
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => console.error("MongoDB connection error", err));

// API routes
app.use("/api/users", usersRoute);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Socket connected");

  // Handle drawing event from client
  socket.on("drawing", (data) => {
    console.log("Drawing event received:", data);
    // Broadcast the drawing event to all clients except the sender
    socket.broadcast.emit("drawing", data);
  });

  // Example: handle incoming message from client
  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
    // Broadcast the message to all clients
    io.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
