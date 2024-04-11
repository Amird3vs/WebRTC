import express from "express";
import { createServer } from "http";
// import { v4 as uuidv4 } from "uuid";
import { generateRandomString, generateRandomNumbers } from "./KeyGeneration.js"
import { Server } from "socket.io";
import { ExpressPeerServer } from "peer";
import cors from "cors";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.set("view engine", "ejs");

app.use("/peerjs", peerServer);
app.use(express.static("public"));

app.use(cors());

function generateMeetingLink() {
  const abc = generateRandomString(3);
  const numbers = generateRandomNumbers(3);
  const xyz = generateRandomString(3);
  return `${abc}-${numbers}-${xyz}`;
}

app.get("/", (req, res) => {
  const meetingLink = generateMeetingLink();
  // res.redirect(`/${meetingLink}`);
  res.send(meetingLink);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    setTimeout(() => {
      socket.to(roomId).emit("user-connected", userId, userName);
    }, 1000);
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });
    socket.on("send-file", (fileData, userName) => {
      socket.to(roomId).emit("receive-file", fileData, userName);
    });
    socket.on("reaction", (reaction, userName) => {
      console.log('Received reaction from client:', reaction, userName);
      socket.to(roomId).emit("receiveReaction", reaction, userName);
    });
    socket.on("gesture-detected", (gesture, userName) => {
      console.log('Received gesture from client:', gesture, userName);
      socket.to(roomId).emit("receive-gesture", gesture, userName);
    });
    socket.on("disconnect", () => {
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });
});

server.listen(process.env.PORT || 3000);