import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { Redis } from "ioredis";
import "dotenv/config";

const app = express();
app.use(cors());

if (!process.env.REDIS_CONNECTION_STRING) {
  throw new Error("REDIS_CONNECTION_STRING is not defined in .env");
}
const redis = new Redis(process.env.REDIS_CONNECTION_STRING);
const subRedis = new Redis(process.env.REDIS_CONNECTION_STRING);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

subRedis.on("message", (channel, message) => {
  console.log("Message received on channel:", channel);
  io.to(channel).emit("room-update", message);
});
subRedis.on("error", (err) => {
  console.error("Redis subscription error", err);
});

io.on("connection", async (socket) => {
  const { id } = socket;
  socket.on("join-room", async (room: string) => {
    console.log("User joined the room", room);
    const subscribedRooms = await redis.smembers("subscribed-rooms");
    await socket.join(room);
    await redis.sadd(`rooms:${id}`, room);
    await redis.hincrby("room-connection", room, 1);
    if (!subscribedRooms.includes(room)) {
      subRedis.subscribe(room, async (err) => {
        if (err) {
          console.error("Failed to subscribe", err);
        } else {
          await redis.sadd("subscribed-rooms", room);
          console.log("Subscribed to room", room);
        }
      });
    }
  });
  socket.on("disconnect", async () => {
    const { id } = socket;
    const joinedRooms = await redis.smembers(`rooms:${id}`);
    await redis.del(`rooms:${id}`);
    joinedRooms.forEach(async (room) => {
      const remainingConnections = await redis.hincrby(
        `room-connection`,
        room,
        -1
      );
      if (remainingConnections <= 0) {
        await redis.hdel(`room-connection`, room);
        subRedis.unsubscribe(room, async (err) => {
          if (err) {
            console.error("Failed to unSubscribed", err);
          } else {
            await redis.srem("subscribed-rooms", room);
            console.log("Unsubcribed from room:", room);
          }
        });
      }
    });
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is listening on port:${PORT}`);
});
