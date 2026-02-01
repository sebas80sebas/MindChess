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
