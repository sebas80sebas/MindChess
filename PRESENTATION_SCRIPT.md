# MindChess Presentation Script
**Time Limit:** 10 Minutes
**Speaker:** Iván Sebastián Loor Weir

---

## Slide 1: Title
**Visuals:** Title "MindChess", Subtitle "Voice-Controlled Chess for the Visually Impaired", Date, Your Name.
**Script:**
"Good morning/afternoon everyone. My name is Iván, and today I am proud to present **MindChess**, an innovative project designed to make one of the world's most popular games accessible to everyone, regardless of visual ability."

---

## Slide 2: The Challenge
**Visuals:** Bullet points about barriers (Visual reliance, Screen reader issues).
**Script:**
"Chess is a universal language, but for the 2.2 billion people with vision impairment worldwide, digital chess often presents insurmountable barriers.
- Traditional apps rely heavily on drag-and-drop mouse interactions.
- Screen readers can be clumsy and provide incomplete context about the board state.
- This effectively excludes blind players from enjoying independent digital play."

---

## Slide 3: The Solution - MindChess
**Visuals:** "100% Voice Controlled", "Real-time Audio Feedback", "Zero Install".
**Script:**
"MindChess is the solution. It is a web-based, accessibility-first chess application built from the ground up to be played **entirely by voice**.
- You don't need a mouse.
- You don't need a keyboard.
- You simply speak your move, and the game speaks back.
It runs in any modern browser with no installation required, democratizing access instantly."

---

## Slide 4: Key Features
**Visuals:** Voice Commands examples, AI Opponent, Audio Feedback icons.
**Script:**
"Let's look at the key features:
1. **Natural Voice Commands:** You can say 'Knight to f3' or 'Capture pawn', and the system understands.
2. **AI Opponent:** It features a built-in Minimax AI, so users can practice anytime, offline.
3. **Full Audio Feedback:** Crucially, the game announces everything—moves, checks, and even illegal moves—ensuring the player always has a mental map of the board."

---

## Slide 5: Under the Hood (Technical)
**Visuals:** Tech Stack (Web Speech API, Chess.js, Minimax).
**Script:**
"Technically, MindChess leverages the power of the modern web:
- **Web Speech API:** We use the native browser API for both Speech Recognition and Synthesis, ensuring low latency and privacy (processing is local).
- **Chess.js:** Handles the rigorous logic validation.
- **Minimax Algorithm:** Runs client-side for the AI, using Alpha-Beta pruning for efficiency.
- The UI (Chessground) exists primarily for sighted helpers or spectators, but the core loop is audio-driven."

---

## Slide 6: User Experience (Demo Flow)
**Visuals:** Step-by-step flow (Activate -> Command -> Feedback).
**Script:**
"The user experience is designed to be a simple, rhythmic loop:
1. **Activate:** The user presses a key or clicks to listen.
2. **Command:** They speak their move.
3. **Feedback:** The system confirms the move aloud.
4. **Response:** The AI plays immediately.
This cycle allows for a smooth, meditative gameplay experience without the frustration of hunting for buttons."

---

## Slide 7: Impact & Future
**Visuals:** Roadmap (Multi-language, Multiplayer).
**Script:**
"The impact is clear: we are using technology to bridge the digital divide.
Looking forward, our roadmap includes:
- **Multi-language support:** Adding Spanish and French.
- **Online Multiplayer:** Connecting blind players worldwide.
- **Enhanced AI:** integrating Stockfish for grandmaster-level play.
Thank you for listening. MindChess is open source and available today."
