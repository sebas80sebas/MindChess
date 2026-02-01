export default class Accessibility {
    constructor(speechEngine) {
        this.speech = speechEngine;
        this.language = 'en-US';
    }

    setLanguage(lang) {
        this.language = lang;
        this.speech.setLanguage(lang);
    }

    announceMove(move) {
        const player = this.language === 'en-US' ? 
            (move.color === "w" ? "Player 1" : "Player 2") :
            (move.color === "w" ? "Jugador 1" : "Jugador 2");
        const madeMove = this.language === 'en-US' ? "made the move" : "hizo el movimiento";
        
        const text = `${player} ${madeMove} ${move.san}`;
        this.speech.speak(text);
    }

    announceState(message) {
        this.speech.speak(message);
    }
    
    describePosition(pieces) {
        // pieces: [{type: 'p', square: 'e4'}, ...]
        if (pieces.length === 0) {
            const msg = this.language === 'en-US' ? "No pieces remaining." : "No quedan piezas.";
            this.speech.speak(msg);
            return;
        }

        const pieceNames = {
            'en-US': { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' },
            'es-ES': { p: 'Peón', n: 'Caballo', b: 'Alfil', r: 'Torre', q: 'Dama', k: 'Rey' }
        };

        const descriptions = pieces.map(p => {
            const name = pieceNames[this.language][p.type];
            return `${name} ${p.square}`; // "Pawn e4"
        });

        // Group by type for better brevity? e.g. "Pawns on e4, d4". 
        // For now, simple listing is clearer for blind users to build a mental map.
        const text = descriptions.join(', ');
        this.speech.speak(text);
    }

    describeMaterial(material) {
        // material: { white: 39, black: 39, diff: 0 }
        let msg = "";
        if (this.language === 'en-US') {
            msg = `White: ${material.white}, Black: ${material.black}. `;
            if (material.diff > 0) msg += `White is up by ${material.diff}.`;
            else if (material.diff < 0) msg += `Black is up by ${Math.abs(material.diff)}.`;
            else msg += "Material is equal.";
        } else {
            msg = `Blancas: ${material.white}, Negras: ${material.black}. `;
            if (material.diff > 0) msg += `Blancas ganan por ${material.diff}.`;
            else if (material.diff < 0) msg += `Negras ganan por ${Math.abs(material.diff)}.`;
            else msg += "Material igualado.";
        }
        this.speech.speak(msg);
    }

    // Helper to format messages for UI or Voice based on lang
    getText(key, ...args) {
        // Simple localization map
        const texts = {
            'en-US': {
                'checkmate': (winner) => `Checkmate! ${winner} wins 🎉`,
                'check': (turn) => `Check! ${turn}'s turn`,
                'draw': "Draw! The game has ended 🤝",
                'turn': (turn) => `${turn}'s turn`,
                'white': 'White',
                'black': 'Black',
                'made_checkmate': 'made Checkmate',
                'made_check': 'made Check',
                'time_up': (winner) => `Time's up! ${winner} wins! 🏆`,
                'ran_out_time': (loser) => `${loser} ran out of time`,
                'resigned': 'The player has resigned 🏳️',
                'draw_agreed': 'Draw agreed! 🤝',
                'draw_rejected': 'Draw rejected. Game continues.'
            },
            'es-ES': {
                'checkmate': (winner) => `¡Jaque mate! ${winner} ganan 🎉`,
                'check': (turn) => `¡Jaque! Turno de ${turn}`,
                'draw': "¡Tablas! El juego ha terminado 🤝",
                'turn': (turn) => `Turno de ${turn}`,
                'white': 'Blancas',
                'black': 'Negras',
                'made_checkmate': 'hizo Jaque mate',
                'made_check': 'hizo Jaque',
                'time_up': (winner) => `¡Se acabó el tiempo! ¡${winner} ganan! 🏆`,
                'ran_out_time': (loser) => `${loser} se quedó sin tiempo`,
                'resigned': 'El jugador se ha rendido 🏳️',
                'draw_agreed': '¡Tablas acordadas! 🤝',
                'draw_rejected': 'Tablas rechazadas. El juego continúa.'
            }
        };

        const t = texts[this.language][key];
        if (typeof t === 'function') return t(...args);
        return t || key;
    }
}
