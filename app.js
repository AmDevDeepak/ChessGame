const express = require("express");
const http = require("http");
const socket = require("socket.io");
const { Chess } = require("chess.js");
const path = require("path");
const { title } = require("process");
const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

let players = {};
let currentPlayer = "w";

app.get("/", (req, res) => {
  res.render("index");
});

io.on("connection", (uniqueSocket) => {
  console.log("Connected");

  if (!players.white) {
    players.white = uniqueSocket.id;
    uniqueSocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniqueSocket.id;
    uniqueSocket.emit("playerRole", "b");
  } else {
    uniqueSocket.emit("spectatorRole");
  }

  uniqueSocket.on("disconnect", () => {
    if (players.white === uniqueSocket.id) {
      delete players.white;
    } else if (players.black === uniqueSocket.id) {
      delete players.black;
    }
  });
    
  uniqueSocket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && uniqueSocket.id !== players.white) return;
      if (chess.turn() === "b" && uniqueSocket.id !== players.black) return;

      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid move :", move);
        uniqueSocket.emit("invalidMove", move);
      }
    } catch (error) {
      console.log(error);
      uniqueSocket.emit("Invalid move :", move);
    }
  });
});


server.listen(3000);
