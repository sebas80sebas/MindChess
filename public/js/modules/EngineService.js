export default class EngineService {
    constructor(stockfishPath = 'stockfish/stockfish.js') {
        this.stockfishPath = stockfishPath;
        this.worker = null;
        this.isReady = false;
        this.onBestMove = null;
        this.difficulty = 10; // Default 1-20
        
        this._initWorker();
    }

    _initWorker() {
        try {
            this.worker = new Worker(this.stockfishPath);
            this.worker.onmessage = (e) => this._handleMessage(e.data);
            
            // Initialize UCI
            this.sendCommand('uci');
        } catch (e) {
            console.error("Failed to initialize Stockfish worker:", e);
        }
    }

    setDifficulty(level) {
        // level 1 to 20
        this.difficulty = Math.max(1, Math.min(20, level));
        
        // Stockfish uses Skill Level (0-20)
        // Level 1: Skill Level 0
        // Level 20: Skill Level 20
        const skillLevel = this.difficulty; 
        this.sendCommand(`setoption name Skill Level value ${skillLevel}`);
    }

    getBestMove(fen, depth = 10) {
        if (!this.worker) return;
        
        this.sendCommand('ucinewgame');
        this.sendCommand(`position fen ${fen}`);
        
        // Use depth based on difficulty or fixed depth
        // For level 1-20, we can also vary depth
        const searchDepth = Math.min(depth, Math.floor(this.difficulty / 2) + 5);
        this.sendCommand(`go depth ${searchDepth}`);
    }

    sendCommand(cmd) {
        if (this.worker) {
            console.log("[Stockfish] Sending:", cmd);
            this.worker.postMessage(cmd);
        }
    }

    _handleMessage(msg) {
        console.log("[Stockfish] Received:", msg);
        
        if (msg === 'uciok') {
            this.isReady = true;
            this.setDifficulty(this.difficulty);
        }
        
        if (msg.startsWith('bestmove')) {
            const parts = msg.split(' ');
            const bestMove = parts[1];
            if (this.onBestMove) {
                this.onBestMove(bestMove);
            }
        }
    }

    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}
