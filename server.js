import express from "express";
import { createServer } from "http";
// import { v4 as uuidv4 } from "uuid";
import { generateRandomString, generateRandomNumbers } from "./KeyGeneration.js"
import { Server } from "socket.io";
import { ExpressPeerServer } from "peer";
import cors from "cors";
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import path from 'path';

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.post("/send-email", async (req, res) => {
  const { to, classification, topic } = req.body;

  const currentDate = new Date().toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });

  if (!to || !classification || !topic) {
    return res.status(400).send('Missing required fields');
  }

  const templatePath = path.join(__dirname, 'emailTemplates', 'email.html');

  try {
    const data = await readFile(templatePath, 'utf8');

    const htmlContent = data
      .replace('{to}', to)
      .replace('{classification}', classification)
      .replace('{topic}', topic)
      .replace('{date}', currentDate);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'salinsenyas.mm24@gmail.com',
        pass: 'pmsx ubuh wauo jzsf'
      }
    });

    const mailOptions = {
      from: '"SalinSenyas" <salinsenyas.mm24@gmail.com>',
      to: to,
      subject: 'Topic request',
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    res.send('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Error sending email');
  }
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId, userId);
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
      socket.to(roomId).emit("receiveReaction", reaction, userName);
    });
    socket.on("gesture-detected", (gesture, userName) => {
      socket.to(roomId).emit("receive-gesture", gesture, userName);
    });
    socket.on('recognized-gesture-letter', ({ gesture, letter }) => {
      socket.to(roomId).emit('receive-gesture-letter', gesture, letter);
      console.log(gesture)
    });
    socket.on("disconnect", () => {
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });
});

server.listen(process.env.PORT || 3000);