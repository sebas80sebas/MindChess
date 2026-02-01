import { Chess } from "/chess.js";
import EngineService from "./EngineService.js";

export default class ChessLogic {
    constructor() {
        this.game = new Chess();
        this.depth = 2; // Default AI depth for local fallback
        
        // Stockfish Integration
        this.engine = new EngineService();
        
        // AI Evaluation Constants (moved from original script)
        this.weights = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
        this.pst_w = {
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
        
        this.pst_b = {};
        for (const piece in this.pst_w) {
            this.pst_b[piece] = [...this.pst_w[piece]].reverse();
        }
    }

    setDifficulty(level) {
        this.engine.setDifficulty(level);
    }

    getBestMoveAsync(callback) {
        this.engine.onBestMove = callback;
        this.engine.getBestMove(this.game.fen());
    }

    reset() {
        this.game.reset();
    }

    getTurn() {
        return this.game.turn();
    }

    getFen() {
        return this.game.fen();
    }

    isGameOver() {
        return this.game.isGameOver();
    }

    isCheckmate() {
        return this.game.isCheckmate();
    }

    isCheck() {
        return this.game.isCheck();
    }

    isDraw() {
        return this.game.isDraw();
    }

    getHistory(options) {
        return this.game.history(options);
    }

    makeMove(moveOrString) {
        // moveOrString can be "e4", {from: 'e2', to: 'e4'}, etc.
        return this.game.move(moveOrString);
    }

    undo() {
        return this.game.undo();
    }

    getValidMoves(square) {
        // If square provided, return moves for that square.
        // If not, return all moves.
        if (square) {
            return this.game.moves({ square, verbose: true }).map(m => m.to);
        }
        
        // This format is specific for Chessground highlighting
        const dests = new Map();
        this.game.board().forEach((row, y) => {
            row.forEach((piece, x) => {
                if (piece && piece.color === this.game.turn()) {
                    const sq = String.fromCharCode(97 + x) + (8 - y);
                    const moves = this.game.moves({ square: sq, verbose: true });
                    if (moves.length) {
                        dests.set(sq, moves.map(m => m.to));
                    }
                }
            });
        });
        return dests;
    }
    
    // --- AI Logic (Synchronous Minimax for now) ---
    // In a future step, this will be delegated to a Web Worker running Stockfish
    
    getBestMove() {
        const moves = this.game.moves();
        let bestMove = null;
        let bestValue = -99999;

        for (const move of moves) {
            this.game.move(move);
            const boardValue = this._minimax(2, -100000, 100000, false);
            this.game.undo();
            if (boardValue > bestValue) {
                bestValue = boardValue;
                bestMove = move;
            }
        }
        return bestMove;
    }

    _minimax(depth, alpha, beta, isMaximizingPlayer) {
        if (depth === 0) return -this._evaluateBoard();

        const moves = this.game.moves();
        if (isMaximizingPlayer) {
            let bestEval = -99999;
            for (const move of moves) {
                this.game.move(move);
                bestEval = Math.max(bestEval, this._minimax(depth - 1, alpha, beta, !isMaximizingPlayer));
                this.game.undo();
                alpha = Math.max(alpha, bestEval);
                if (beta <= alpha) return bestEval;
            }
            return bestEval;
        } else {
            let bestEval = 99999;
            for (const move of moves) {
                this.game.move(move);
                bestEval = Math.min(bestEval, this._minimax(depth - 1, alpha, beta, !isMaximizingPlayer));
                this.game.undo();
                beta = Math.min(beta, bestEval);
                if (beta <= alpha) return bestEval;
            }
            return bestEval;
        }
    }

    _evaluateBoard() {
        let totalEvaluation = 0;
        const board = this.game.board();
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                totalEvaluation += this._getPieceValue(board[i][j], i, j);
            }
        }
        return totalEvaluation;
    }

    _getPieceValue(piece, x, y) {
        if (piece === null) return 0;
        const absoluteValue = this.weights[piece.type] + (piece.color === 'w' ? this.pst_w[piece.type][x][y] : this.pst_b[piece.type][x][y]);
        return piece.color === 'w' ? absoluteValue : -absoluteValue;
    }
}
