import { Chessground } from "/chessground.js";

export default class UIController {
    constructor(boardId, callbacks) {
        this.boardElement = document.getElementById(boardId);
        this.statusElement = document.getElementById("status");
        this.movesList = document.getElementById("moves");
        this.moveMessages = document.getElementById("moveMessages");
        this.voiceButton = document.getElementById('voiceButton');
        this.timerWhite = document.getElementById('timer-white');
        this.timerBlack = document.getElementById('timer-black');
        this.timeDisplayWhite = this.timerWhite.querySelector('.time-display');
        this.timeDisplayBlack = this.timerBlack.querySelector('.time-display');

        // Callbacks: { onMove: (orig, dest) => void }
        this.onMove = callbacks.onMove;
        
        this.cg = null;
        this.language = 'en-US';
    }

    initBoard(fen, validMoves, turnColor) {
        this.cg = Chessground(this.boardElement, {
            fen: fen,
            turnColor: turnColor === 'w' ? 'white' : 'black',
            draggable: { enabled: true },
            movable: {
                color: turnColor === 'w' ? 'white' : 'black',
                free: false,
                dests: validMoves,
                events: {
                    after: (orig, dest) => {
                        if (this.onMove) this.onMove(orig, dest);
                    }
                }
            },
            highlight: { lastMove: true, check: true }
        });
    }

    setScreenlessMode(enabled) {
        const boardContainer = document.getElementById('board-container');
        if (enabled) {
            boardContainer.classList.add('screenless-active');
        } else {
            boardContainer.classList.remove('screenless-active');
        }
    }

    updateLastMoveLarge(text) {
        const el = document.getElementById('last-move-large');
        if (el) el.textContent = text;
    }

    updateBoard(fen, validMoves, turnColor) {
        if (!this.cg) return;
        this.cg.set({
            fen: fen,
            turnColor: turnColor === 'w' ? 'white' : 'black',
            movable: {
                color: turnColor === 'w' ? 'white' : 'black',
                dests: validMoves
            }
        });
    }
    
    updateTimerDisplay(whiteTime, blackTime, selectedTime) {
        this.timeDisplayWhite.textContent = this._formatTime(whiteTime, selectedTime);
        this.timeDisplayBlack.textContent = this._formatTime(blackTime, selectedTime);

        // Remove all warning/danger classes first
        this.timerWhite.classList.remove('timer-warning', 'timer-danger');
        this.timerBlack.classList.remove('timer-warning', 'timer-danger');

        // Add warning/danger classes based on time
        if (selectedTime > 0) {
            if (whiteTime <= 10 && whiteTime > 0) this.timerWhite.classList.add('timer-danger');
            else if (whiteTime <= 30) this.timerWhite.classList.add('timer-warning');

            if (blackTime <= 10 && blackTime > 0) this.timerBlack.classList.add('timer-danger');
            else if (blackTime <= 30) this.timerBlack.classList.add('timer-warning');
        }
    }

    setTimerActive(turnColor) {
        this.timerWhite.classList.remove('timer-active');
        this.timerBlack.classList.remove('timer-active');
        
        if (turnColor === 'w') {
            this.timerWhite.classList.add('timer-active');
        } else {
            this.timerBlack.classList.add('timer-active');
        }
    }

    _formatTime(seconds, selectedTime) {
        if (seconds === 0 && selectedTime === 0) return '∞';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateStatus(message) {
        this.statusElement.innerText = message;
        // Also update large status if in screenless mode
        const largeStatus = document.getElementById('game-status-large');
        if (largeStatus) largeStatus.textContent = message;
    }

    updateMoveList(history) {
        this.movesList.innerHTML = "";
        let currentMove = "";
        
        history.forEach((move, index) => {
            if (index % 2 === 0) {
                currentMove = `${Math.floor(index / 2) + 1}. ${move.san}`;
            } else {
                currentMove += ` ${move.san}`;
                const li = document.createElement("li");
                li.innerText = currentMove;
                this.movesList.appendChild(li);
            }
        });

        if (history.length % 2 === 1) {
            const li = document.createElement("li");
            li.innerText = currentMove;
            this.movesList.appendChild(li);
        }
    }

    addMoveMessage(message, color = null) {
        const p = document.createElement("p");
        p.innerText = message;
        if (color) p.style.color = color;
        this.moveMessages.appendChild(p);
    }

    setVoiceButtonState(isListening, language) {
        if (language === 'en-US') {
            this.voiceButton.textContent = isListening ? 'Listening...' : 'Speak';
        } else {
            this.voiceButton.textContent = isListening ? 'Escuchando...' : 'Hablar';
        }
    }

    enableVoiceButton() {
        this.voiceButton.disabled = false;
    }
    
    setLanguage(lang) {
        this.language = lang;
    }

    initLanguageSelector(onChangeCallback) {
        const languageSelector = document.createElement('select');
        languageSelector.id = 'languageSelector';
        languageSelector.innerHTML = `
            <option value="en-US">English</option>
            <option value="es-ES">Español</option>
        `;
        languageSelector.style.cssText = 'margin: 10px; padding: 5px; font-size: 14px;';
        
        languageSelector.addEventListener('change', (e) => {
            const newLang = e.target.value;
            this.setLanguage(newLang);
            if (onChangeCallback) onChangeCallback(newLang);
            
            const langName = newLang === 'en-US' ? 'English' : 'Español';
            this.addMoveMessage(`Language changed to ${langName}`, 'blue');
        });
        
        this.voiceButton.parentNode.insertBefore(languageSelector, this.voiceButton);
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = "flex";
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = "none";
    }
}
