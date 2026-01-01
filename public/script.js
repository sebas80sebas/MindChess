import { Chess } from "/chess.js";
import { Chessground } from "/chessground.js";

const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const movesList = document.getElementById("moves");
const moveMessages = document.getElementById("moveMessages");
const voiceButton = document.getElementById('voiceButton');

// Timer elements
const timerWhite = document.getElementById('timer-white');
const timerBlack = document.getElementById('timer-black');
const timeDisplayWhite = timerWhite.querySelector('.time-display');
const timeDisplayBlack = timerBlack.querySelector('.time-display');

// Game state variables
let whiteTime = 600;
let blackTime = 600;
let selectedTime = 600;
let timerInterval = null;
let isTimerActive = false;
let isVsComputer = false;
let computerColor = 'b'; // Computer is Black by default

// AI Evaluation Constants
const weights = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
const pst_w = {
    p: [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [5,  5, 10, 25, 25, 10,  5,  5],
        [0,  0,  0, 20, 20,  0,  0,  0],
        [5, -5,-10,  0,  0,-10, -5,  5],
        [5, 10, 10,-20,-20, 10, 10,  5],
        [0,  0,  0,  0,  0,  0,  0,  0]
    ],
    n: [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
    ],
    b: [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10, 10, 10, 10, 10, 10, 10,-10],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
    ],
    r: [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [5, 10, 10, 10, 10, 10, 10,  5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [0,  0,  0,  5,  5,  0,  0,  0]
    ],
    q: [
        [-20,-10,-10, -5, -5,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5,  5,  5,  5,  0,-10],
        [-5,  0,  5,  5,  5,  5,  0, -5],
        [0,  0,  5,  5,  5,  5,  0, -5],
        [-10,  5,  5,  5,  5,  5,  0,-10],
        [-10,  0,  5,  0,  0,  0,  0,-10],
        [-20,-10,-10, -5, -5,-10,-10,-20]
    ],
    k: [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [20, 20,  0,  0,  0,  0, 20, 20],
        [20, 30, 10,  0,  0, 10, 30, 20]
    ]
};

// Mirror PST for black
const pst_b = {};
for (const piece in pst_w) {
    pst_b[piece] = [...pst_w[piece]].reverse();
}

function evaluateBoard(game) {
    let totalEvaluation = 0;
    const board = game.board();
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            totalEvaluation += getPieceValue(board[i][j], i, j);
        }
    }
    return totalEvaluation;
}

function getPieceValue(piece, x, y) {
    if (piece === null) return 0;
    const absoluteValue = weights[piece.type] + (piece.color === 'w' ? pst_w[piece.type][x][y] : pst_b[piece.type][x][y]);
    return piece.color === 'w' ? absoluteValue : -absoluteValue;
}

function minimax(game, depth, alpha, beta, isMaximizingPlayer) {
    if (depth === 0) return -evaluateBoard(game);

    const moves = game.moves();
    if (isMaximizingPlayer) {
        let bestEval = -99999;
        for (const move of moves) {
            game.move(move);
            bestEval = Math.max(bestEval, minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer));
            game.undo();
            alpha = Math.max(alpha, bestEval);
            if (beta <= alpha) return bestEval;
        }
        return bestEval;
    } else {
        let bestEval = 99999;
        for (const move of moves) {
            game.move(move);
            bestEval = Math.min(bestEval, minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer));
            game.undo();
            beta = Math.min(beta, bestEval);
            if (beta <= alpha) return bestEval;
        }
        return bestEval;
    }
}

function getBestMove(game) {
    const moves = game.moves();
    let bestMove = null;
    let bestValue = -99999;

    for (const move of moves) {
        game.move(move);
        const boardValue = minimax(game, 2, -100000, 100000, false);
        game.undo();
        if (boardValue > bestValue) {
            bestValue = boardValue;
            bestMove = move;
        }
    }
    return bestMove;
}

function makeComputerMove() {
    if (game.isGameOver()) return;
    
    // Increased delay for better audio flow and realism
    setTimeout(() => {
        const move = getBestMove(game);
        if (move) {
            const result = game.move(move);
            cg.set({
                fen: game.fen(),
                turnColor: game.turn() === "w" ? "white" : "black",
                movable: {
                    color: game.turn() === "w" ? "white" : "black",
                    dests: getValidMoves()
                }
            });
            
            switchTimerActive();
            updateStatus();
            updateMoveList();
            updateMoveMessages(result);
            announceMove(result);
            
            console.log("[DEBUG] AI Move:", result.san);
        }
    }, 1500);
}

// Timer functions
const game = new Chess();

// Initialize Chessground
const cg = Chessground(boardElement, {
    draggable: { enabled: true },
    movable: {
        color: "white",
        free: false,
        dests: getValidMoves(),
        events: {
            after: (orig, dest) => handleMove(orig, dest)
        }
    },
    highlight: { lastMove: true, check: true }
});

const voiceCommands = {
    'a1': 'a1', 'a2': 'a2', 'a3': 'a3', 'a4': 'a4', 'a5': 'a5', 'a6': 'a6', 'a7': 'a7', 'a8': 'a8',
    'b1': 'b1', 'b2': 'b2', 'b3': 'b3', 'b4': 'b4', 'b5': 'b5', 'b6': 'b6', 'b7': 'b7', 'b8': 'b8',
    'c1': 'c1', 'c2': 'c2', 'c3': 'c3', 'c4': 'c4', 'c5': 'c5', 'c6': 'c6', 'c7': 'c7', 'c8': 'c8',
    'd1': 'd1', 'd2': 'd2', 'd3': 'd3', 'd4': 'd4', 'd5': 'd5', 'd6': 'd6', 'd7': 'd7', 'd8': 'd8',
    'e1': 'e1', 'e2': 'e2', 'e3': 'e3', 'e4': 'e4', 'e5': 'e5', 'e6': 'e6', 'e7': 'e7', 'e8': 'e8',
    'f1': 'f1', 'f2': 'f2', 'f3': 'f3', 'f4': 'f4', 'f5': 'f5', 'f6': 'f6', 'f7': 'f7', 'f8': 'f8',
    'g1': 'g1', 'g2': 'g2', 'g3': 'g3', 'g4': 'g4', 'g5': 'g5', 'g6': 'g6', 'g7': 'g7', 'g8': 'g8',
    'h1': 'h1', 'h2': 'h2', 'h3': 'h3', 'h4': 'h4', 'h5': 'h5', 'h6': 'h6', 'h7': 'h7', 'h8': 'h8',
    'rook': 'r', 'knight': 'n', 'bishop': 'b', 'queen': 'q', 'king': 'k', 'pawn': 'p',
    'torre': 'r', 'caballo': 'n', 'alfil': 'b', 'reina': 'q', 'dama': 'q', 'rey': 'k', 'peón': 'p', 'peon': 'p',
    'move': 'move', 'to': 'to', 'takes': 'takes', 'capture': 'takes',
    'castle kingside': 'O-O', 'castle queenside': 'O-O-O',
    'check': '+', 'checkmate': '#', 'undo': 'undo', 'read': 'read',
    'resign': 'resignation', 'draw': 'draw',
    'mover': 'move', 'mueve': 'move', 'a': 'to', 'come': 'takes', 'captura': 'takes',
    'enroque corto': 'O-O', 'enroque largo': 'O-O-O',
    'jaque': '+', 'jaque mate': '#', 'deshacer': 'undo', 'leer': 'read',
    'rendirse': 'resignation', 'tablas': 'draw', 'empate': 'draw',
    'repeat': 'repeat', 'repetir': 'repeat'
};

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isListening = false;
let currentLanguage = 'en-US';

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = currentLanguage;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const languageSelector = document.createElement('select');
    languageSelector.id = 'languageSelector';
    languageSelector.innerHTML = `
        <option value="en-US">English</option>
        <option value="es-ES">Español</option>
    `;
    languageSelector.style.cssText = 'margin: 10px; padding: 5px; font-size: 14px;';
    languageSelector.addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        recognition.lang = currentLanguage;
        const langName = currentLanguage === 'en-US' ? 'English' : 'Español';
        moveMessages.innerHTML += `<p style="color: blue;">Language changed to ${langName}</p>`;
    });
    voiceButton.parentNode.insertBefore(languageSelector, voiceButton);

    voiceButton.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
            isListening = false;
            voiceButton.textContent = currentLanguage === 'en-US' ? 'Speak' : 'Hablar';
        } else {
            recognition.start();
            isListening = true;
            voiceButton.textContent = currentLanguage === 'en-US' ? 'Listening...' : 'Escuchando...';
        }
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('[DEBUG] Recognized text:', transcript);
        voiceButton.textContent = currentLanguage === 'en-US' ? 'Speak' : 'Hablar';
        isListening = false;
        processVoiceCommand(transcript);
    };

    recognition.onerror = (event) => {
        console.error('[ERROR] Voice recognition error:', event.error);
        voiceButton.textContent = currentLanguage === 'en-US' ? 'Speak' : 'Hablar';
        isListening = false;
        const errorMsg = currentLanguage === 'en-US' ? 
            `Voice recognition error: ${event.error}` : 
            `Error de reconocimiento de voz: ${event.error}`;
        moveMessages.innerHTML += `<p style="color: red;">${errorMsg}</p>`;
    };

    recognition.onend = () => {
        if (isListening) {
            setTimeout(() => {
                try {
                    recognition.start();
                } catch (error) {
                    console.error('[ERROR] Error restarting recognition:', error);
                    isListening = false;
                    voiceButton.textContent = currentLanguage === 'en-US' ? 'Speak' : 'Hablar';
                }
            }, 500);
        } else {
            voiceButton.textContent = currentLanguage === 'en-US' ? 'Speak' : 'Hablar';
        }
    };
} else {
    voiceButton.disabled = true;
    voiceButton.textContent = 'Voice not supported / Voz no soportada';
}

// Timer functions
function formatTime(seconds) {
    if (seconds === 0 && selectedTime === 0) return '∞';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    timeDisplayWhite.textContent = formatTime(whiteTime);
    timeDisplayBlack.textContent = formatTime(blackTime);
    
    // Remove all warning/danger classes first
    timerWhite.classList.remove('timer-warning', 'timer-danger');
    timerBlack.classList.remove('timer-warning', 'timer-danger');
    
    // Add warning/danger classes based on time
    if (selectedTime > 0) {
        if (whiteTime <= 10 && whiteTime > 0) {
            timerWhite.classList.add('timer-danger');
        } else if (whiteTime <= 30) {
            timerWhite.classList.add('timer-warning');
        }
        
        if (blackTime <= 10 && blackTime > 0) {
            timerBlack.classList.add('timer-danger');
        } else if (blackTime <= 30) {
            timerBlack.classList.add('timer-warning');
        }
    }
}

function startTimer() {
    if (selectedTime === 0) return; // No timer for unlimited games
    
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    isTimerActive = true;
    timerInterval = setInterval(() => {
        if (game.turn() === 'w') {
            whiteTime--;
            if (whiteTime <= 0) {
                whiteTime = 0;
                stopTimer();
                endGameByTimeout('white');
            }
        } else {
            blackTime--;
            if (blackTime <= 0) {
                blackTime = 0;
                stopTimer();
                endGameByTimeout('black');
            }
        }
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    isTimerActive = false;
}

function switchTimerActive() {
    timerWhite.classList.remove('timer-active');
    timerBlack.classList.remove('timer-active');
    
    if (game.turn() === 'w') {
        timerWhite.classList.add('timer-active');
    } else {
        timerBlack.classList.add('timer-active');
    }
}

function endGameByTimeout(loser) {
    const winner = loser === 'white' ? 'Black' : 'White';
    const msg = currentLanguage === 'en-US' ? 
        `Time's up! ${winner} wins! 🏆` :
        `¡Se acabó el tiempo! ¡${winner === 'White' ? 'Blancas' : 'Negras'} ganan! 🏆`;
    statusElement.innerText = msg;
    
    const timeoutMsg = currentLanguage === 'en-US' ? 
        `${loser === 'white' ? 'White' : 'Black'} ran out of time` :
        `${loser === 'white' ? 'Blancas' : 'Negras'} se quedó sin tiempo`;
    announceState({ color: loser === 'white' ? 'w' : 'b', san: timeoutMsg });
    
    cg.set({ movable: { color: null, dests: new Map() } });
}

function getValidMoves() {
    const dests = new Map();
    game.board().forEach((row, y) => {
        row.forEach((piece, x) => {
            if (piece && piece.color === game.turn()) {
                const square = String.fromCharCode(97 + x) + (8 - y);
                const moves = game.moves({ square, verbose: true });
                if (moves.length) {
                    dests.set(square, moves.map(m => m.to));
                }
            }
        });
    });
    return dests;
}

function handleMove(orig, dest) {
    const move = game.move({ from: orig, to: dest, promotion: "q" });

    if (move) {
        cg.set({
            fen: game.fen(),
            turnColor: game.turn() === "w" ? "white" : "black",
            movable: {
                color: game.turn() === "w" ? "white" : "black",
                dests: getValidMoves()
            }
        });

        switchTimerActive();
        updateStatus();
        updateMoveList();
        updateMoveMessages(move);
        announceMove(move);
        
        // Start timer on first move
        if (!isTimerActive && selectedTime > 0) {
            startTimer();
        }
        
        // Trigger computer move if applicable
        if (isVsComputer && game.turn() === computerColor && !game.isGameOver()) {
            makeComputerMove();
        }
        
        console.log("[DEBUG] New FEN:", game.fen());
    } else {
        cg.set({ fen: game.fen() });
    }
}

function announceMove(move) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance();
    utterance.lang = currentLanguage;
    
    const player = currentLanguage === 'en-US' ? 
        (move.color === "w" ? "Player 1" : "Player 2") :
        (move.color === "w" ? "Jugador 1" : "Jugador 2");
    const madeMove = currentLanguage === 'en-US' ? "made the move" : "hizo el movimiento";
    
    utterance.text = `${player} ${madeMove} ${move.san}`;
    utterance.pitch = 1.2;
    utterance.volume = 1.0;
    utterance.rate = 0.9;
    
    let voices = synth.getVoices();
    if (voices.length === 0) {
        synth.onvoiceschanged = function() {
            voices = synth.getVoices();
            setVoiceAndSpeak();
        };
    } else {
        setVoiceAndSpeak();
    }
    
    function setVoiceAndSpeak() {
        const languageCode = currentLanguage.split('-')[0];
        const languageVoices = voices.filter(voice => voice.lang.includes(languageCode));
        const preferredVoice = languageVoices.find(voice => voice.name.includes('Google')) || 
                              languageVoices[0] || 
                              voices[0];
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        
        synth.speak(utterance);
    }
}

function announceState(move) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance();
    utterance.lang = currentLanguage;
    
    const player = currentLanguage === 'en-US' ? 
        (move.color === "w" ? "Player 1" : "Player 2") :
        (move.color === "w" ? "Jugador 1" : "Jugador 2");
    
    utterance.text = `${player} ${move.san}`;
    utterance.pitch = 1.2;
    utterance.volume = 1.0;
    utterance.rate = 0.9;
    
    let voices = synth.getVoices();
    if (voices.length === 0) {
        synth.onvoiceschanged = function() {
            voices = synth.getVoices();
            setVoiceAndSpeak();
        };
    } else {
        setVoiceAndSpeak();
    }
    
    function setVoiceAndSpeak() {
        const languageCode = currentLanguage.split('-')[0];
        const languageVoices = voices.filter(voice => voice.lang.includes(languageCode));
        const preferredVoice = languageVoices.find(voice => voice.name.includes('Google')) || 
                              languageVoices[0] || 
                              voices[0];
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        
        synth.speak(utterance);
    }
}

function updateStatus() {
    if (game.isCheckmate()) {
        stopTimer();
        const msg = currentLanguage === 'en-US' ? 
            `Checkmate! ${game.turn() === "w" ? "Black" : "White"} wins 🎉` :
            `¡Jaque mate! ${game.turn() === "w" ? "Negras" : "Blancas"} ganan 🎉`;
        statusElement.innerText = msg;
        setTimeout(() => {
            const announceMsg = currentLanguage === 'en-US' ? "made Checkmate" : "hizo Jaque mate";
            announceState({ color: game.turn() === "w" ? "b" : "w", san: announceMsg });
        }, 1000);
        
    } else if (game.isCheck()) {
        const msg = currentLanguage === 'en-US' ? 
            `Check! ${game.turn() === "w" ? "White's" : "Black's"} turn` :
            `¡Jaque! Turno de ${game.turn() === "w" ? "Blancas" : "Negras"}`;
        statusElement.innerText = msg;
        setTimeout(() => {
            const announceMsg = currentLanguage === 'en-US' ? "made Check" : "hizo Jaque";
            announceState({ color: game.turn() === "w" ? "b" : "w", san: announceMsg });
        }, 1000);
        
    } else if (game.isDraw()) {
        stopTimer();
        const msg = currentLanguage === 'en-US' ? 
            "Draw! The game has ended 🤝" :
            "¡Tablas! El juego ha terminado 🤝";
        statusElement.innerText = msg;
    } else {
        const msg = currentLanguage === 'en-US' ? 
            `${game.turn() === "w" ? "White's" : "Black's"} turn` :
            `Turno de ${game.turn() === "w" ? "Blancas" : "Negras"}`;
        statusElement.innerText = msg;
    }
}

function updateMoveList() {
    movesList.innerHTML = "";
    const history = game.history({ verbose: true });
    let currentMove = "";
    
    history.forEach((move, index) => {
        if (index % 2 === 0) {
            currentMove = `${Math.floor(index / 2) + 1}. ${move.san}`;
        } else {
            currentMove += ` ${move.san}`;
            const li = document.createElement("li");
            li.innerText = currentMove;
            movesList.appendChild(li);
        }
    });

    if (history.length % 2 === 1) {
        const li = document.createElement("li");
        li.innerText = currentMove;
        movesList.appendChild(li);
    }
}

function updateMoveMessages(move) {
    const player = currentLanguage === 'en-US' ?
        (move.color === "w" ? "Player 1" : "Player 2") :
        (move.color === "w" ? "Jugador 1" : "Jugador 2");
    const madeMove = currentLanguage === 'en-US' ? "made the move" : "hizo el movimiento";
    const message = `${player} ${madeMove} ${move.san}`;
    
    const p = document.createElement("p");
    p.innerText = message;
    moveMessages.appendChild(p);
}

function processVoiceCommand(command) {
    console.log("[DEBUG] Command received:", command);
    const commandLabel = currentLanguage === 'en-US' ? "Command" : "Comando";
    moveMessages.innerHTML += `<p>${commandLabel}: ${command}</p>`;

    const lowerCommand = command.toLowerCase();
    const parts = lowerCommand.split(' ');
    const normalizedParts = parts.map(part => voiceCommands[part] || part);
    const normalized = normalizedParts.join(' ');
    console.log("[DEBUG] Normalized command:", normalized);

    try {
        if (normalized.includes('move') || normalized.includes('to')) {
            let piece = null;
            let to = null;

            for (let i = 1; i < parts.length; i++) {
                if (voiceCommands[parts[i]] && ['r', 'n', 'b', 'q', 'k', 'p'].includes(voiceCommands[parts[i]])) {
                    piece = voiceCommands[parts[i]];
                    break;
                }
            }

            for (let i = parts.length - 1; i >= 0; i--) {
                if (/^[a-h][1-8]$/.test(parts[i])) {
                    to = parts[i];
                    break;
                }
                if (i > 0 && /^[a-h]$/.test(parts[i-1]) && /^[1-8]$/.test(parts[i])) {
                    to = parts[i-1] + parts[i];
                    break;
                }
            }

            if (!piece || !to) {
                const errorMsg = currentLanguage === 'en-US' ? 
                    "Could not identify piece or destination" :
                    "No se pudo identificar la pieza o el destino";
                throw new Error(errorMsg);
            }

            const moves = game.moves({ verbose: true });
            const validMove = moves.find(m => m.piece === piece && m.to === to);

            if (validMove) {
                handleMove(validMove.from, validMove.to);
            } else {
                const errorMsg = currentLanguage === 'en-US' ? 
                    `Invalid move for ${piece} to ${to}` :
                    `Movimiento inválido para ${piece} a ${to}`;
                throw new Error(errorMsg);
            }
        }
        else if (normalized.includes('o-o')) {
            const move = normalized.includes('o-o-o') ? 'O-O-O' : 'O-O';
            const result = game.move(move);
            if (result) {
                cg.set({
                    fen: game.fen(),
                    turnColor: game.turn() === "w" ? "white" : "black",
                    movable: {
                        color: game.turn() === "w" ? "white" : "black",
                        dests: getValidMoves()
                    }
                });
                switchTimerActive();
                updateStatus();
                updateMoveList();
                updateMoveMessages(result);
                const castleMsg = currentLanguage === 'en-US' ?
                    `Castle ${move === 'O-O' ? 'kingside' : 'queenside'}` :
                    `Enroque ${move === 'O-O' ? 'corto' : 'largo'}`;
                announceMove({ color: result.color, san: castleMsg });
                
                if (!isTimerActive && selectedTime > 0) {
                    startTimer();
                }

                // Trigger computer move if applicable
                if (isVsComputer && game.turn() === computerColor && !game.isGameOver()) {
                    makeComputerMove();
                }
            } else {
                const errorMsg = currentLanguage === 'en-US' ? 
                    "Castling not allowed" :
                    "Enroque no permitido";
                throw new Error(errorMsg);
            }
        }
        else if (normalized.includes('resignation')) {    
            surrenderConfirm.style.display = "flex";
            const resignMsg = currentLanguage === 'en-US' ? 
                "Are you sure you want to resign?" :
                "¿Estás seguro de que quieres rendirte?";
            announceState({ color: game.turn(), san: resignMsg });
        }
        else if (normalized.includes('draw')) {    
            if (!drawOfferedBy) {
                drawOfferedBy = game.turn();
                drawConfirm.style.display = "flex";
            }
            const drawMsg = currentLanguage === 'en-US' ? 
                "has proposed a draw" :
                "ha propuesto tablas";
            announceState({ color: game.turn(), san: drawMsg });
        } 
        else if (normalized.includes('undo')) {
            handleUndoMove();
        }
        else if (normalized.includes('read')) {
            handleReadMoves();
        }
        else if (normalized.includes('repeat')) {
            handleRepeatLastMove();
        }
        else {
            const errorMsg = currentLanguage === 'en-US' ? 
                "Command not recognized" :
                "Comando no reconocido";
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.error("[ERROR] Error in command:", error.message);
        const errorLabel = currentLanguage === 'en-US' ? "Error" : "Error";
        moveMessages.innerHTML += `<p style="color: red;">${errorLabel}: ${error.message}</p>`;
    }
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'v' || event.key === 'V') {
        if (isListening) {
            recognition.stop();
            isListening = false;
            voiceButton.textContent = currentLanguage === 'en-US' ? 'Speak' : 'Hablar';
        } else {
            recognition.start();
            isListening = true;
            voiceButton.textContent = currentLanguage === 'en-US' ? 'Listening...' : 'Escuchando...';
        }
    }
});

// Start screen logic
document.addEventListener("DOMContentLoaded", () => {
    const startButton = document.getElementById("startButton");
    const startScreen = document.getElementById("start-screen");
    const container = document.getElementById("container");
    const timeOptions = document.querySelectorAll('.time-option');
    const oppOptions = document.querySelectorAll('.opp-option');
    
    // Opponent selection
    oppOptions.forEach(option => {
        option.addEventListener('click', () => {
            oppOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            isVsComputer = option.dataset.opp === 'computer';
        });
    });

    // Time selection
    timeOptions.forEach(option => {
        option.addEventListener('click', () => {
            timeOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedTime = parseInt(option.dataset.time);
            whiteTime = selectedTime;
            blackTime = selectedTime;
        });
    });
    
    // Default selection (10 minutes and Human)
    timeOptions[1].classList.add('selected');
    oppOptions[0].classList.add('selected');
  
    startButton.addEventListener('click', () => {
        startScreen.style.display = "none";
        container.style.display = "flex";
        
        resetGame();
        updateTimerDisplay();
        switchTimerActive();
        
        const turnMsg = currentLanguage === 'en-US' ? "White's turn" : "Turno de Blancas";
        statusElement.textContent = turnMsg;
        voiceButton.disabled = false;
    });

    // Tutorial functionality
    const tutorialButton = document.getElementById("tutorialButton");
    const tutorialScreen = document.getElementById("tutorial-screen");
    const closeTutorial = document.getElementById("closeTutorial");
    const startFromTutorial = document.getElementById("startFromTutorial");
    const prevPage = document.getElementById("prevPage");
    const nextPage = document.getElementById("nextPage");
    const tutorialPage = document.getElementById("tutorialPage");
    
    let currentPage = 1;
    const totalPages = 5;
    let tutorialSpeechSynth = window.speechSynthesis;

    // Dynamic Tutorial logic - Standardized 13 steps
    const tutorialSteps = [
        { id: "step-1", text: "Welcome to MindChess! This is a revolutionary chess game where you can play using voice commands. No need to touch the board - just speak your moves and watch them happen." },
        { id: "step-2", text: "Voice Control allows you to use your microphone to give chess commands in English or Spanish." },
        { id: "step-3", text: "Choose from 5, 10, or 15-minute games, or play without time limits." },
        { id: "step-4", text: "Switch between English and Spanish at any time during the game." },
        { id: "step-5", text: "To make a move, say the piece name and the destination square. For example: Move knight to e4." },
        { id: "step-6", text: "You can say the names of all pieces in English or Spanish, like Pawn, Rook, Knight, Bishop, Queen, or King." },
        { id: "step-7", text: "For special moves like castling, you can say: Castle kingside or Castle queenside. In Spanish: Enroque corto or Enroque largo." },
        { id: "step-8", text: "Use the Read command to hear all moves made so far, Repeat to hear the last move again, or Undo to take back your last move." },
        { id: "step-9", text: "You can also offer a Draw or Resign from the current game using voice commands." },
        { id: "step-10", text: "To play: Select your time control, start the game, and activate voice recognition with the Speak button or V key." },
        { id: "step-11", text: "Speak your moves clearly. The timer will switch automatically. You can also drag pieces with your mouse!" },
        { id: "step-12", text: "Speak at a moderate pace in a quiet environment. The game handles validation and time alerts automatically." },
        { id: "step-13", text: "You are now ready to play! Click Close and Start Game to begin your adventure!" }
    ];

    let currentStepIndex = 0;
    const displayArea = document.getElementById('tutorial-display-area');

    function updateTutorialStep() {
        const step = tutorialSteps[currentStepIndex];
        
        // Update page indicator
        tutorialPage.textContent = `Step ${currentStepIndex + 1} of ${tutorialSteps.length}`;
        
        // Update button states
        prevPage.disabled = currentStepIndex === 0;
        nextPage.disabled = currentStepIndex === tutorialSteps.length - 1;

        // Clear display area and inject new content
        displayArea.innerHTML = '';
        
        const contentSource = document.getElementById(step.id);
        if (contentSource) {
            const clone = contentSource.cloneNode(true);
            clone.style.display = 'block';
            clone.firstElementChild.classList.add('active-step-slide');
            displayArea.appendChild(clone);
        }

        // Speak current step
        tutorialSpeechSynth.cancel();
        const utterance = new SpeechSynthesisUtterance(step.text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;

        let voices = tutorialSpeechSynth.getVoices();
        const setVoiceAndSpeak = () => {
            const englishVoices = voices.filter(voice => voice.lang.includes('en'));
            const preferredVoice = englishVoices.find(voice => voice.name.includes('Google')) || englishVoices[0] || voices[0];
            if (preferredVoice) utterance.voice = preferredVoice;
            tutorialSpeechSynth.speak(utterance);
        };

        if (voices.length === 0) {
            tutorialSpeechSynth.onvoiceschanged = () => {
                voices = tutorialSpeechSynth.getVoices();
                setVoiceAndSpeak();
            };
        } else {
            setVoiceAndSpeak();
        }
    }

    tutorialButton.addEventListener('click', () => {
        startScreen.style.display = "none";
        tutorialScreen.style.display = "block";
        currentStepIndex = 0;
        updateTutorialStep();
    });

    closeTutorial.addEventListener('click', () => {
        tutorialSpeechSynth.cancel();
        tutorialScreen.style.display = "none";
        startScreen.style.display = "flex";
    });

    prevPage.addEventListener('click', () => {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            updateTutorialStep();
        }
    });

    nextPage.addEventListener('click', () => {
        if (currentStepIndex < tutorialSteps.length - 1) {
            currentStepIndex++;
            updateTutorialStep();
        }
    });
});

const startScreen = document.getElementById("start-screen");
const container = document.getElementById("container");

// Resign button
const surrenderButton = document.getElementById("surrenderButton");
const surrenderConfirm = document.getElementById("surrenderConfirm");
const confirmSurrender = document.getElementById("confirmSurrender");
const cancelSurrender = document.getElementById("cancelSurrender");

surrenderButton.addEventListener("click", () => {
    surrenderConfirm.style.display = "flex";
    const resignMsg = currentLanguage === 'en-US' ? 
        "Are you sure you want to resign?" :
        "¿Estás seguro de que quieres rendirte?";
    announceState({ color: game.turn(), san: resignMsg });
});

confirmSurrender.addEventListener("click", () => {
    surrenderConfirm.style.display = "none";
    stopTimer();
    const resignedMsg = currentLanguage === 'en-US' ? "resigned" : "se rindió";
    announceState({ color: game.turn(), san: resignedMsg });
    const statusMsg = currentLanguage === 'en-US' ? 
        "The player has resigned 🏳️" :
        "El jugador se ha rendido 🏳️";
    statusElement.innerText = statusMsg;
    cg.set({ movable: { color: null, dests: new Map() } });
});

cancelSurrender.addEventListener("click", () => {
    surrenderConfirm.style.display = "none";
});

function handleReadMoves() {
    const history = game.history();
    const movesText = history.length ? history.join(', ') : (currentLanguage === 'en-US' ? 'No moves' : 'Sin movimientos');
    const readMsg = currentLanguage === 'en-US' ? 
        `these are the moves made: ${movesText}` :
        `estos son los movimientos realizados: ${movesText}`;
    announceState({ color: game.turn(), san: readMsg });
}

function handleUndoMove() {
    const undone = game.undo();
    if (undone) {
        // If it was vs Computer, undo twice so we get back to the player's turn
        if (isVsComputer && undone.color === computerColor) {
            game.undo();
        }

        cg.set({
            fen: game.fen(),
            turnColor: game.turn() === "w" ? "white" : "black",
            movable: {
                color: game.turn() === "w" ? "white" : "black",
                dests: getValidMoves()
            }
        });
        switchTimerActive();
        updateMoveList();
        const undoMsg = currentLanguage === 'en-US' ? 
            `Move undone` :
            `Movimiento deshecho`;
        announceState({ color: undone.color, san: undoMsg });
    } else {
        const errorMsg = currentLanguage === 'en-US' ? 
            "No moves to undo" :
            "No hay movimientos para deshacer";
        
        // If triggered by button, we use alert or moveMessages
        moveMessages.innerHTML += `<p style="color: red;">${errorMsg}</p>`;
        announceState({ color: game.turn(), san: errorMsg });
    }
}

// Repeat button
const repeatButton = document.getElementById("repeatButton");
const readButton = document.getElementById("readButton");
const undoButton = document.getElementById("undoButton");

function handleRepeatLastMove() {
    const history = game.history({ verbose: true });
    if (history.length > 0) {
        const lastMove = history[history.length - 1];
        announceMove(lastMove);
    } else {
        const noMovesMsg = currentLanguage === 'en-US' ? "No moves yet" : "No hay movimientos realizados";
        announceState({ color: 'w', san: noMovesMsg });
    }
}

repeatButton.addEventListener("click", () => {
    handleRepeatLastMove();
});

readButton.addEventListener("click", () => {
    handleReadMoves();
});

undoButton.addEventListener("click", () => {
    handleUndoMove();
});

// Exit button
const exitButton = document.getElementById("exitButton");
const exitConfirm = document.getElementById("exitConfirm");
const confirmExit = document.getElementById("confirmExit");
const cancelExit = document.getElementById("cancelExit");

exitButton.addEventListener("click", () => {
    exitConfirm.style.display = "flex";
});

confirmExit.addEventListener("click", () => {
    exitConfirm.style.display = "none";
    stopTimer();
    container.style.display = "none";
    startScreen.style.display = "flex";
    cg.set({ movable: { color: null, dests: new Map() } });
});

cancelExit.addEventListener("click", () => {
    exitConfirm.style.display = "none";
});

// Draw button
const drawButton = document.getElementById("drawButton");
const drawConfirm = document.getElementById("drawConfirm");
const acceptDraw = document.getElementById("acceptDraw");
const rejectDraw = document.getElementById("rejectDraw");

let drawOfferedBy = null;

drawButton.addEventListener("click", () => {
    if (!drawOfferedBy) {
        drawOfferedBy = game.turn();
        drawConfirm.style.display = "flex";
    }
    const drawMsg = currentLanguage === 'en-US' ? 
        "has proposed a draw" :
        "ha propuesto tablas";
    announceState({ color: game.turn(), san: drawMsg });
    const statusMsg = currentLanguage === 'en-US' ?
        "The player has requested a draw. Please confirm or cancel" :
        "El jugador ha solicitado tablas. Por favor confirma o cancela";
    statusElement.innerText = statusMsg;
});

acceptDraw.addEventListener("click", () => {
    drawConfirm.style.display = "none";
    stopTimer();
    const drawAgreedMsg = currentLanguage === 'en-US' ? 
        "Draw agreed! 🤝" :
        "¡Tablas acordadas! 🤝";
    statusElement.innerText = drawAgreedMsg;
    const acceptedMsg = currentLanguage === 'en-US' ? 
        "accepted the draw" :
        "aceptó las tablas";
    announceState({ color: game.turn(), san: acceptedMsg });
    drawOfferedBy = null;
    cg.set({ movable: { color: null, dests: new Map() } });
});

rejectDraw.addEventListener("click", () => {
    drawConfirm.style.display = "none";
    drawOfferedBy = null;
    const rejectedMsg = currentLanguage === 'en-US' ? 
        "Draw rejected. Game continues." :
        "Tablas rechazadas. El juego continúa.";
    statusElement.innerText = rejectedMsg;
});

function resetGame() {
    game.reset();
    cg.set({
        fen: game.fen(),
        turnColor: "white",
        movable: {
            color: "white",
            dests: getValidMoves()
        },
        highlight: {
            lastMove: true,
            check: true
        }
    });

    stopTimer();
    whiteTime = selectedTime;
    blackTime = selectedTime;
    updateTimerDisplay();
    switchTimerActive();
    
    const turnMsg = currentLanguage === 'en-US' ? "White's turn" : "Turno de Blancas";
    statusElement.innerText = turnMsg;
    movesList.innerHTML = "";
    moveMessages.innerHTML = "";
    drawOfferedBy = null;
}

console.log("[DEBUG] Chess game started:", game.fen());