import GameController from "./modules/GameController.js";
import Tutorial from "./modules/Tutorial.js";

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Game
    const game = new GameController();
    
    // Initialize Tutorial (shares speech engine)
    const tutorial = new Tutorial(game.speech);

    console.log("[MindChess] Application Initialized");

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then((reg) => {
                console.log('[ServiceWorker] Registered:', reg);
            })
            .catch((err) => {
                console.error('[ServiceWorker] Registration failed:', err);
            });
    }
});
