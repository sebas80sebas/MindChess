export default class Timer {
    constructor(callbacks) {
        this.whiteTime = 600;
        this.blackTime = 600;
        this.selectedTime = 600;
        this.timerInterval = null;
        this.isTimerActive = false;
        
        // callbacks: { onUpdate: ({white, black}) => void, onTimeout: (color) => void }
        this.onUpdate = callbacks.onUpdate;
        this.onTimeout = callbacks.onTimeout;
    }

    setDuration(seconds) {
        this.selectedTime = seconds;
        this.reset();
    }

    reset() {
        this.stop();
        this.whiteTime = this.selectedTime;
        this.blackTime = this.selectedTime;
        this.triggerUpdate();
    }

    start(turnColor) {
        if (this.selectedTime === 0) return; // Unlimited time

        this.stop(); // Ensure no duplicate intervals
        this.isTimerActive = true;

        this.timerInterval = setInterval(() => {
            if (turnColor === 'w') {
                this.whiteTime--;
                if (this.whiteTime <= 0) {
                    this.whiteTime = 0;
                    this.stop();
                    if (this.onTimeout) this.onTimeout('white');
                }
            } else {
                this.blackTime--;
                if (this.blackTime <= 0) {
                    this.blackTime = 0;
                    this.stop();
                    if (this.onTimeout) this.onTimeout('black');
                }
            }
            this.triggerUpdate();
        }, 1000);
    }

    stop() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.isTimerActive = false;
    }

    triggerUpdate() {
        if (this.onUpdate) {
            this.onUpdate({
                white: this.whiteTime,
                black: this.blackTime,
                selectedTime: this.selectedTime
            });
        }
    }
}
