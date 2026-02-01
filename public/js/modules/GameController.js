import ChessLogic from "./ChessLogic.js";
import UIController from "./UIController.js";
import SpeechEngine from "./SpeechEngine.js";
import Accessibility from "./Accessibility.js";
import Timer from "./Timer.js";

export default class GameController {
    constructor() {
        // State
        this.isVsComputer = false;
        this.computerColor = 'b';
        this.currentLanguage = 'en-US';
        this.voiceCommands = this._getVoiceCommands();
        this.drawOfferedBy = null;

        // Modules
        this.chess = new ChessLogic();
        
        this.speech = new SpeechEngine({
            onCommand: (cmd) => this.processVoiceCommand(cmd),
            onError: (err) => this._handleVoiceError(err),
            onStateChange: (isListening) => {
                this.ui.setVoiceButtonState(isListening, this.currentLanguage);
            }
        });

        this.accessibility = new Accessibility(this.speech);
        
        this.timer = new Timer({
            onUpdate: (times) => this.ui.updateTimerDisplay(times.white, times.black, times.selectedTime),
            onTimeout: (loser) => this.endGameByTimeout(loser)
        });

        this.ui = new UIController("board", {
            onMove: (orig, dest) => this.handleHumanMove(orig, dest)
        });

        // Initialize Language Selector
        this.ui.initLanguageSelector((lang) => {
            this.currentLanguage = lang;
            this.accessibility.setLanguage(lang);
            this.speech.setLanguage(lang);
            
            this.ui.setVoiceButtonState(this.speech.isListening, lang);
        });

        // Initialize DOM Event Listeners
        this._initEventListeners();
        
        // Initial UI State
        this.ui.updateStatus(this.accessibility.getText('turn', this.accessibility.getText('white')));
    }

    start() {
        this.resetGame();
    }

    resetGame() {
        this.chess.reset();
        this.timer.reset();
        this.ui.initBoard(this.chess.getFen(), this.chess.getValidMoves(), this.chess.getTurn());
        this.ui.updateStatus(this.accessibility.getText('turn', this.accessibility.getText('white')));
        this.ui.updateMoveList([]);
        this.ui.setTimerActive('w'); 
        this.drawOfferedBy = null;
    }

    handleHumanMove(orig, dest) {
        const move = this.chess.makeMove({ from: orig, to: dest, promotion: 'q' });
        if (move) {
            this._onMoveMade(move);
            
            if (this.isVsComputer && !this.chess.isGameOver() && this.chess.getTurn() === this.computerColor) {
                setTimeout(() => this.makeComputerMove(), 500);
            }
        } else {
            this.ui.updateBoard(this.chess.getFen(), this.chess.getValidMoves(), this.chess.getTurn());
        }
    }

    makeComputerMove() {
        if (this.chess.isGameOver()) return;

        setTimeout(() => {
            const move = this.chess.getBestMove();
            if (move) {
                const result = this.chess.makeMove(move);
                this._onMoveMade(result);
            }
        }, 1000);
    }

    _onMoveMade(move) {
        this.ui.updateBoard(this.chess.getFen(), this.chess.getValidMoves(), this.chess.getTurn());
        
        if (this.timer.selectedTime > 0) {
            this.timer.start(this.chess.getTurn());
        }
        this.ui.setTimerActive(this.chess.getTurn());

        this.ui.updateMoveList(this.chess.getHistory({ verbose: true }));
        
        this.accessibility.announceMove(move);
        this._checkGameStatus();
        
        const player = this.currentLanguage === 'en-US' ?
            (move.color === "w" ? "Player 1" : "Player 2") :
            (move.color === "w" ? "Jugador 1" : "Jugador 2");
        const madeMove = this.currentLanguage === 'en-US' ? "made the move" : "hizo el movimiento";
        this.ui.addMoveMessage(`${player} ${madeMove} ${move.san}`);
    }

    _checkGameStatus() {
        let msg = "";
        let audioMsg = "";

        if (this.chess.isCheckmate()) {
            this.timer.stop();
            const winner = this.chess.getTurn() === 'w' ? this.accessibility.getText('black') : this.accessibility.getText('white');
            msg = this.accessibility.getText('checkmate', winner);
            audioMsg = this.accessibility.getText('made_checkmate');
            this.accessibility.announceState(audioMsg);
        } else if (this.chess.isCheck()) {
            const turn = this.chess.getTurn() === 'w' ? this.accessibility.getText('white') : this.accessibility.getText('black');
            msg = this.accessibility.getText('check', turn);
            audioMsg = this.accessibility.getText('made_check');
            this.accessibility.announceState(audioMsg);
        } else if (this.chess.isDraw()) {
            this.timer.stop();
            msg = this.accessibility.getText('draw');
        } else {
            const turn = this.chess.getTurn() === 'w' ? this.accessibility.getText('white') : this.accessibility.getText('black');
            msg = this.accessibility.getText('turn', turn);
        }
        
        this.ui.updateStatus(msg);
    }

    endGameByTimeout(loser) {
        const winner = loser === 'white' ? this.accessibility.getText('black') : this.accessibility.getText('white');
        const msg = this.accessibility.getText('time_up', winner);
        this.ui.updateStatus(msg);
        
        const loserText = loser === 'white' ? this.accessibility.getText('white') : this.accessibility.getText('black');
        const audioMsg = this.accessibility.getText('ran_out_time', loserText);
        this.accessibility.announceState(audioMsg);
        
        this.ui.cg.set({ movable: { color: null, dests: new Map() } });
    }

    // --- Button Handlers ---

    handleRepeatLastMove() {
        const history = this.chess.getHistory({ verbose: true });
        if (history.length > 0) {
            const lastMove = history[history.length - 1];
            this.accessibility.announceMove(lastMove);
        } else {
            const noMovesMsg = this.currentLanguage === 'en-US' ? "No moves yet" : "No hay movimientos realizados";
            this.accessibility.announceState(noMovesMsg);
        }
    }

    handleReadMoves() {
        const history = this.chess.getHistory();
        const movesText = history.length ? history.join(', ') : (this.currentLanguage === 'en-US' ? 'No moves' : 'Sin movimientos');
        const readMsg = this.currentLanguage === 'en-US' ? 
            `these are the moves made: ${movesText}` :
            `estos son los movimientos realizados: ${movesText}`;
        this.accessibility.announceState(readMsg);
    }

    handleUndoMove() {
        const undone = this.chess.undo();
        if (undone) {
            if (this.isVsComputer && undone.color === this.computerColor) {
                this.chess.undo();
            }
            this.resetToCurrentState();
            const undoMsg = this.currentLanguage === 'en-US' ? "Move undone" : "Movimiento deshecho";
            this.accessibility.announceState(undoMsg);
        } else {
            const errorMsg = this.currentLanguage === 'en-US' ? "No moves to undo" : "No hay movimientos para deshacer";
            this.ui.addMoveMessage(errorMsg, 'red');
            this.accessibility.announceState(errorMsg);
        }
    }

    requestDraw() {
        if (!this.drawOfferedBy) {
            this.drawOfferedBy = this.chess.getTurn();
            this.ui.showModal("drawConfirm");
            
            const drawMsg = this.currentLanguage === 'en-US' ? "has proposed a draw" : "ha propuesto tablas";
            // Announce who proposed it (current turn player)
            const player = this.currentLanguage === 'en-US' ? 
                (this.drawOfferedBy === "w" ? "Player 1" : "Player 2") :
                (this.drawOfferedBy === "w" ? "Jugador 1" : "Jugador 2");
            this.accessibility.announceState(`${player} ${drawMsg}`);
            
            const statusMsg = this.currentLanguage === 'en-US' ?
                "The player has requested a draw. Please confirm or cancel" :
                "El jugador ha solicitado tablas. Por favor confirma o cancela";
            this.ui.updateStatus(statusMsg);
        }
    }

    acceptDraw() {
        this.ui.hideModal("drawConfirm");
        this.timer.stop();
        const drawAgreedMsg = this.accessibility.getText('draw_agreed');
        this.ui.updateStatus(drawAgreedMsg);
        this.accessibility.announceState(drawAgreedMsg);
        this.drawOfferedBy = null;
        this.ui.cg.set({ movable: { color: null, dests: new Map() } });
    }

    rejectDraw() {
        this.ui.hideModal("drawConfirm");
        this.drawOfferedBy = null;
        const rejectedMsg = this.accessibility.getText('draw_rejected');
        this.ui.updateStatus(rejectedMsg);
    }

    resign() {
        this.ui.showModal("surrenderConfirm");
        const resignMsg = this.currentLanguage === 'en-US' ? 
            "Are you sure you want to resign?" :
            "¿Estás seguro de que quieres rendirte?";
        this.accessibility.announceState(resignMsg);
    }

    confirmResignation() {
        this.ui.hideModal("surrenderConfirm");
        this.timer.stop();
        const resignedMsg = this.accessibility.getText('resigned');
        this.ui.updateStatus(resignedMsg);
        this.accessibility.announceState(resignedMsg);
        this.ui.cg.set({ movable: { color: null, dests: new Map() } });
    }

    cancelResignation() {
        this.ui.hideModal("surrenderConfirm");
    }

    exitGame() {
        this.ui.showModal("exitConfirm");
    }

    confirmExit() {
        this.ui.hideModal("exitConfirm");
        this.timer.stop();
        document.getElementById("container").style.display = "none";
        document.getElementById("start-screen").style.display = "flex";
        document.getElementById('main-header').classList.remove('minimized');
        this.ui.cg.set({ movable: { color: null, dests: new Map() } });
    }

    cancelExit() {
        this.ui.hideModal("exitConfirm");
    }

    processVoiceCommand(command) {
        console.log("[GameController] Voice Command:", command);
        this.ui.addMoveMessage(`Command: ${command}`);

        const lowerCommand = command.toLowerCase();
        const parts = lowerCommand.split(' ');
        const normalizedParts = parts.map(part => this.voiceCommands[part] || part);
        const normalized = normalizedParts.join(' ');

        try {
            if (normalized.includes('move') || normalized.includes('to')) {
                 const move = this._parseMoveCommand(parts);
                 if (move) {
                     this.handleHumanMove(move.from, move.to);
                 }
            } 
            else if (normalized.includes('o-o')) {
                const moveStr = normalized.includes('o-o-o') ? 'O-O-O' : 'O-O';
                const move = this.chess.makeMove(moveStr);
                if (move) {
                    this._onMoveMade(move);
                    if (this.isVsComputer && !this.chess.isGameOver() && this.chess.getTurn() === this.computerColor) {
                        setTimeout(() => this.makeComputerMove(), 500);
                    }
                }
            }
            else if (normalized.includes('undo')) {
                 this.handleUndoMove();
            }
            else if (normalized.includes('read')) {
                this.handleReadMoves();
            }
            else if (normalized.includes('repeat')) {
                this.handleRepeatLastMove();
            }
            else if (normalized.includes('resignation')) {
                this.resign();
            }
            else if (normalized.includes('draw')) {
                this.requestDraw();
            }
        } catch (e) {
            console.error(e);
            this.accessibility.announceState("Error");
        }
    }

    _parseMoveCommand(parts) {
        let piece = null;
        let to = null;

        for (let i = 1; i < parts.length; i++) {
            if (this.voiceCommands[parts[i]] && ['r', 'n', 'b', 'q', 'k', 'p'].includes(this.voiceCommands[parts[i]])) {
                piece = this.voiceCommands[parts[i]];
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

        if (piece && to) {
            const moves = this.chess.game.moves({ verbose: true });
            const validMove = moves.find(m => m.piece === piece && m.to === to);
            if (validMove) return { from: validMove.from, to: validMove.to };
        }
        return null;
    }
    
    resetToCurrentState() {
        this.ui.updateBoard(this.chess.getFen(), this.chess.getValidMoves(), this.chess.getTurn());
        this.ui.updateMoveList(this.chess.getHistory({ verbose: true }));
        this._checkGameStatus();
        this.ui.setTimerActive(this.chess.getTurn());
    }

    _handleVoiceError(error) {
        this.ui.addMoveMessage(`Voice Error: ${error}`, 'red');
    }

    _initEventListeners() {
        // Voice Button
        document.getElementById('voiceButton').addEventListener('click', () => this.speech.toggleListening());

        // Key V
        document.addEventListener('keydown', (e) => {
            if (e.key === 'v' || e.key === 'V') {
                this.speech.toggleListening();
            }
        });

        // Start Game
        document.getElementById("startButton").addEventListener('click', () => {
            const selectedTimeEl = document.querySelector('.time-option.selected');
            const selectedTime = selectedTimeEl ? parseInt(selectedTimeEl.dataset.time) : 600;
            
            const selectedOppEl = document.querySelector('.opp-option.selected');
            this.isVsComputer = selectedOppEl && selectedOppEl.dataset.opp === 'computer';

            this.timer.setDuration(selectedTime);
            
            document.getElementById("start-screen").style.display = "none";
            document.getElementById("container").style.display = "flex";
            document.getElementById('main-header').classList.add('minimized');

            if (this.speech.isSupported) {
                this.ui.enableVoiceButton();
            }
            
            this.start();
        });
        
        // Game Control Buttons
        document.getElementById("repeatButton").addEventListener('click', () => this.handleRepeatLastMove());
        document.getElementById("readButton").addEventListener('click', () => this.handleReadMoves());
        document.getElementById("undoButton").addEventListener('click', () => this.handleUndoMove());
        document.getElementById("drawButton").addEventListener('click', () => this.requestDraw());
        document.getElementById("surrenderButton").addEventListener('click', () => this.resign());
        document.getElementById("exitButton").addEventListener('click', () => this.exitGame());

        // Modals
        document.getElementById("confirmSurrender").addEventListener('click', () => this.confirmResignation());
        document.getElementById("cancelSurrender").addEventListener('click', () => this.cancelResignation());
        
        document.getElementById("confirmExit").addEventListener('click', () => this.confirmExit());
        document.getElementById("cancelExit").addEventListener('click', () => this.cancelExit());
        
        document.getElementById("acceptDraw").addEventListener('click', () => this.acceptDraw());
        document.getElementById("rejectDraw").addEventListener('click', () => this.rejectDraw());

        // Settings Selection
         document.querySelectorAll('.opp-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.opp-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });

        document.querySelectorAll('.time-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.time-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });
    }

    _getVoiceCommands() {
        return {
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
    }
}