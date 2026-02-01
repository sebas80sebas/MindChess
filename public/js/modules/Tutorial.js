export default class Tutorial {
    constructor(speechEngine) {
        this.speech = speechEngine;
        this.tutorialSteps = [
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
        this.currentStepIndex = 0;
        this.displayArea = document.getElementById('tutorial-display-area');
        this.tutorialPage = document.getElementById("tutorialPage");
        this.prevPage = document.getElementById("prevPage");
        this.nextPage = document.getElementById("nextPage");
        
        this._initListeners();
    }

    start() {
        this.currentStepIndex = 0;
        this.updateTutorialStep();
    }

    updateTutorialStep() {
        const step = this.tutorialSteps[this.currentStepIndex];
        
        // Update page indicator
        this.tutorialPage.textContent = `Step ${this.currentStepIndex + 1} of ${this.tutorialSteps.length}`;
        
        // Update button states
        this.prevPage.disabled = this.currentStepIndex === 0;
        this.nextPage.disabled = this.currentStepIndex === this.tutorialSteps.length - 1;

        // Clear display area and inject new content
        this.displayArea.innerHTML = '';
        
        const contentSource = document.getElementById(step.id);
        if (contentSource) {
            const clone = contentSource.cloneNode(true);
            clone.style.display = 'block';
            clone.firstElementChild.classList.add('active-step-slide');
            this.displayArea.appendChild(clone);
        }

        // Speak current step
        this.speech.speak(step.text, true); // true for priority (cancel previous)
    }

    _initListeners() {
        document.getElementById("tutorialButton").addEventListener('click', () => {
            document.getElementById("start-screen").style.display = "none";
            document.getElementById("tutorial-screen").style.display = "block";
            document.getElementById('main-header').classList.add('minimized');
            this.start();
        });

        document.getElementById("closeTutorial").addEventListener('click', () => {
            window.speechSynthesis.cancel();
            document.getElementById("tutorial-screen").style.display = "none";
            document.getElementById("start-screen").style.display = "flex";
            document.getElementById('main-header').classList.remove('minimized');
        });

        this.prevPage.addEventListener('click', () => {
            if (this.currentStepIndex > 0) {
                this.currentStepIndex--;
                this.updateTutorialStep();
            }
        });

        this.nextPage.addEventListener('click', () => {
            if (this.currentStepIndex < this.tutorialSteps.length - 1) {
                this.currentStepIndex++;
                this.updateTutorialStep();
            }
        });
    }
}
