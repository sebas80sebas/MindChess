import GameController from "./modules/GameController.js";
import Tutorial from "./modules/Tutorial.js";

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Game
    const game = new GameController();
    
    // Initialize Tutorial (shares speech engine)
    const tutorial = new Tutorial(game.speech);

    console.log("[MindChess] Application Initialized");
});
