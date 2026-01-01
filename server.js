const express = require("express");
const path = require("path");
const app = express();

// Serve static files from "public"
app.use(express.static(path.join(__dirname, "public")));

// Serve chess.js and chessground.js
app.get("/chess.js", (req, res) => {
    res.sendFile(path.join(__dirname, "node_modules/chess.js/dist/esm/chess.js"));
});

app.get("/chessground.js", (req, res) => {
    res.sendFile(path.join(__dirname, "node_modules/chessground/dist/chessground.min.js"));
});

// 🔹 Fix MIME type for chessground.css
app.get("/chessground.css", (req, res) => {
    res.type("text/css");
    res.sendFile(path.join(__dirname, "node_modules/chessground/dist/chessground.css"));
});

app.get("/chessgroundbrown.css", (req, res) => {
    res.type("text/css");
    res.sendFile(path.join(__dirname, "node_modules/chessground/dist/chessgroundbrown.css"));
});

app.get("/chessgroundbase.css", (req, res) => {
    res.type("text/css");
    res.sendFile(path.join(__dirname, "node_modules/chessground/dist/chessgroundbase.css"));
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
