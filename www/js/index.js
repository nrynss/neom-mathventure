// index.js

// Add configurable base path - Ensure this is set correctly in index.html
const BASE_PATH = window.NEOM_BASE_PATH || "";

// Import WASM module and LanguageLoader
import init, { NeomMathGame } from `../pkg/neom_mathventure.js`;
import LanguageLoader from "./languageloader.js";

class GameUI {
    constructor() {
        this.game = null; // WASM game instance
        this.timerInterval = null; // Stores the interval ID for the timer
        this.timeLeft = 30; // Initial time for each game
        this.timeBonus = 3; // Seconds added for correct answer
        this.maxTime = 60; // Maximum time allowed
        this.isGameActive = false; // Flag to track game state
        this.currentDifficulty = 1; // Track difficulty for UI updates
        this.languageLoader = new LanguageLoader(); // Handles translations
        this.activeListeners = []; // Store active listeners for cleanup

        // DOM elements
        this.questionEl = document.getElementById("question");
        this.answerEl = document.getElementById("answer");
        this.actionButton = document.getElementById("actionButton");
        this.scoreEl = document.getElementById("score");
        this.highScoreEl = document.getElementById("highScore");
        this.levelEl = document.getElementById("level");
        this.levelStarsEl = document.querySelector(".level-stars");
        this.timeEl = document.getElementById("time");
        this.accuracyEl = document.getElementById("accuracy");
        this.messageEl = document.getElementById("message");
        this.celebrationEl = document.getElementById("celebration");
        this.langButtons = document.querySelectorAll(".lang-btn");
        this.mascotTapir = document.querySelector(".mascot.tapir");
        this.mascotCapybara = document.querySelector(".mascot.capybara");
        this.tapirSpeechBubble = this.mascotTapir.querySelector(".speech-bubble");
        this.capybaraSpeechBubble = this.mascotCapybara.querySelector(".speech-bubble");

        // UI Text element selectors (add more as needed)
        this.uiTextElements = {
            '.game-title': 'ui.title',
            '.timer': 'ui.timer', // Selects the container, text updated separately
            '.high-score': 'ui.highScore', // Selects the container, text updated separately
            '.level-indicator': 'ui.level', // Selects the container, text updated separately
            '.current-score': 'ui.score', // Selects the container, text updated separately
            '.accuracy': 'ui.accuracy', // Selects the container, text updated separately
            '#answer': null // Placeholder updated separately
        };
    }

    /**
     * Initializes the game: loads WASM, language, high score, and binds events.
     */
    async initialize() {
        try {
            // Initialize WASM module
            await init(`${BASE_PATH}/pkg/neom_mathventure_bg.wasm`);
            this.game = new NeomMathGame();
            console.log("WASM Module Initialized");

            // Load initial language (default: malayalam)
            await this.languageLoader.initialize("malayalam");
            console.log("Language Loader Initialized");

            // Load saved high score from localStorage
            this.loadHighScore();
            this.updateHighScoreDisplay(); // Update UI with loaded score

            // Set up initial UI state and event listeners
            this.bindEvents();
            this.addMascotInteractivity();
            this.initializeLanguageSwitcher();
            this.updateUIText(); // Set initial text based on default language
            this.showMascotGreeting("thangamma"); // Initial greeting

            console.log("Game initialized successfully");

        } catch (error) {
            console.error("Failed to initialize game:", error);
            this.showError("Game initialization failed. Please refresh the page.");
            // Disable game functionality if init fails
            this.actionButton.disabled = true;
            this.answerEl.disabled = true;
        }
    }

    /**
     * Binds all necessary event listeners and stores references for cleanup.
     */
    bindEvents() {
        // Clear existing listeners before adding new ones
        this.cleanupEventListeners();

        // Action button (Start Game / Check Answer / Play Again)
        this._addEventListener(this.actionButton, 'click', () => this.handleActionClick());

        // Answer input: Allow Enter key submission
        this._addEventListener(this.answerEl, 'keypress', (e) => {
            if (e.key === 'Enter' && this.isGameActive) {
                this.checkAnswer();
            }
        });

        // Language buttons
        this.langButtons.forEach(button => {
            this._addEventListener(button, 'click', async (e) => {
                const lang = e.target.dataset.lang;
                if (lang && lang !== this.languageLoader.currentLanguage) {
                    await this.changeLanguage(lang);
                }
            });
        });

        // Mascot clicks for speech bubbles
        this._addEventListener(this.mascotTapir, 'click', () => this.showMascotGreeting('thangamma'));
        this._addEventListener(this.mascotCapybara, 'click', () => this.showMascotGreeting('kannappan'));
         // Add focus listener for keyboard accessibility
        this._addEventListener(this.mascotTapir, 'focus', () => this.showMascotGreeting('thangamma'));
        this._addEventListener(this.mascotCapybara, 'focus', () => this.showMascotGreeting('kannappan'));

        console.log("Event listeners bound.");
    }

    /**
     * Helper to add event listeners and track them for removal.
     */
    _addEventListener(element, type, listener) {
        if (!element) return; // Guard against missing elements
        element.addEventListener(type, listener);
        this.activeListeners.push({ element, type, listener });
    }

    /**
     * Removes all tracked event listeners.
     */
    cleanupEventListeners() {
        this.activeListeners.forEach(({ element, type, listener }) => {
            if (element) {
                element.removeEventListener(type, listener);
            }
        });
        this.activeListeners = []; // Clear the tracking array
        console.log("Event listeners cleaned up.");
    }

    /**
     * Handles clicks on the main action button based on game state.
     */
    handleActionClick() {
        if (!this.isGameActive) {
            // Start or Restart Game
            this.startGame();
        } else {
            // Check Answer
            this.checkAnswer();
        }
    }

    /**
     * Starts a new game session.
     */
    startGame() {
        console.log("Starting game...");
        this.isGameActive = true;
        this.timeLeft = 30; // Reset timer
        this.currentDifficulty = 1; // Reset difficulty
        this.game.reset_game(); // Reset WASM game state
        this.loadHighScore(); // Ensure high score is current before starting
        this.game.set_high_score(this.game.get_high_score()); // Pass high score to WASM

        this.answerEl.value = ""; // Clear input field
        this.answerEl.classList.remove('hidden'); // Show input field
        this.answerEl.disabled = false;
        this.answerEl.focus(); // Focus input for immediate typing

        this.questionEl.classList.remove('correct', 'incorrect'); // Reset question style

        this.updateUI(); // Update score, level, etc.
        this.updateUIText(); // Ensure button text is correct
        this.nextQuestion(); // Generate the first question
        this.startTimer(); // Start the countdown

        this.showMessage('', 'info', 0); // Clear any previous messages
        this.showMascotGreeting('thangamma'); // Show starting mascot message
    }

    /**
     * Starts the game timer interval.
     */
    startTimer() {
        clearInterval(this.timerInterval); // Clear any existing timer
        this.timeEl.textContent = this.timeLeft; // Initial display

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.timeEl.textContent = this.timeLeft;

            // Visual warning when time is low
            if (this.timeLeft <= 10) {
                this.timeEl.style.color = 'var(--error-color)';
                this.timeEl.style.fontWeight = 'bold';
            } else {
                 this.timeEl.style.color = 'var(--kerala-red)'; // Reset color
                 this.timeEl.style.fontWeight = 'normal';
            }


            if (this.timeLeft <= 0) {
                this.gameOver();
            }
        }, 1000); // Update every second
    }

    /**
     * Stops the game timer.
     */
    stopTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.timeEl.style.color = 'var(--kerala-red)'; // Reset color
        this.timeEl.style.fontWeight = 'normal';
    }

    /**
     * Generates and displays the next question from the WASM module.
     */
    nextQuestion() {
        try {
            const questionText = this.game.generate_question();
            this.questionEl.textContent = questionText + " = ?";
            this.questionEl.classList.remove('correct', 'incorrect'); // Reset style
            this.answerEl.value = ""; // Clear answer input
            this.answerEl.focus(); // Keep focus on input

            // Update difficulty display if it changed
            const newDifficulty = this.game.get_difficulty();
            if (newDifficulty > this.currentDifficulty) {
                this.currentDifficulty = newDifficulty;
                this.updateLevelDisplay();
                this.showMessage(this.languageLoader.getRandomPhrase('feedback.levelUp'), 'info');
                this.triggerCelebration('⭐'); // Level up celebration
                this.showMascotMessage('thangamma', 'celebrations'); // Mascot level up message
            }
        } catch (error) {
            console.error("Error generating question:", error);
            this.showError("Error getting next question.");
            this.gameOver(); // End game if question generation fails
        }
    }

    /**
     * Checks the user's answer against the correct answer from WASM.
     */
    checkAnswer() {
        const userAnswer = parseInt(this.answerEl.value, 10);

        if (isNaN(userAnswer)) {
            this.showMessage(this.languageLoader.getText('feedback.enterNumber'), 'error');
            this.questionEl.classList.add('incorrect'); // Visual cue for invalid input
            setTimeout(() => this.questionEl.classList.remove('incorrect'), 500);
            return;
        }

        try {
            const isCorrect = this.game.check_answer(userAnswer);

            if (isCorrect) {
                this.questionEl.classList.add('correct');
                this.showMessage(this.languageLoader.getRandomPhrase('feedback.correct'), 'success');
                this.triggerCelebration('✅'); // Correct answer celebration
                this.showMascotMessage('kannappan', 'celebrations'); // Positive mascot feedback

                // Add bonus time, capped at maxTime
                this.timeLeft = Math.min(this.timeLeft + this.timeBonus, this.maxTime);
                this.timeEl.textContent = this.timeLeft; // Update display immediately

            } else {
                const correctAnswer = this.game.get_correct_answer();
                this.questionEl.classList.add('incorrect');
                const incorrectMsg = this.languageLoader.getRandomPhrase('feedback.incorrect');
                this.showMessage(`${incorrectMsg} (${this.languageLoader.getText('ui.correctAnswer') || 'Ans'}: ${correctAnswer})`, 'error');
                this.showMascotMessage('kannappan', 'motivation'); // Encouraging mascot feedback
            }

            this.updateUI(); // Update score, accuracy, high score
            this.saveHighScore(); // Save high score if it changed

            // Generate next question after a short delay to show feedback
            setTimeout(() => {
                if (this.isGameActive) { // Check if game hasn't ended
                   this.nextQuestion();
                }
            }, 800); // Delay for feedback visibility

        } catch (error) {
            console.error("Error checking answer:", error);
            this.showError("Error checking answer.");
            this.gameOver(); // End game on error
        }
    }

    /**
     * Handles the game over state.
     */
    gameOver() {
        console.log("Game Over!");
        this.isGameActive = false;
        this.stopTimer();
        this.answerEl.disabled = true; // Disable input
        this.answerEl.classList.add('hidden'); // Hide input

        const finalScore = this.game.get_score();
        const finalAccuracy = this.game.get_accuracy();
        const gameOverMsg = this.languageLoader.getText('ui.gameOver');
        let statsMsg = this.languageLoader.getText('feedback.gameStats') || "Score: {} | Accuracy: {}%";
        statsMsg = statsMsg.replace('{}', finalScore).replace('{}', finalAccuracy);

        this.questionEl.textContent = gameOverMsg; // Show "Game Over" in question area
        this.questionEl.classList.remove('correct', 'incorrect');
        this.showMessage(statsMsg, 'info', 0); // Show final stats indefinitely
        this.updateUIText(); // Update button text to "Play Again"
        this.showMascotMessage('thangamma', 'encouragement'); // Final mascot message
    }

    /**
     * Updates all relevant UI elements (score, level, accuracy, timer).
     */
    updateUI() {
        if (!this.game) return; // Ensure game object exists

        try {
            this.scoreEl.textContent = this.game.get_score();
            this.updateHighScoreDisplay();
            this.updateLevelDisplay();
            this.accuracyEl.textContent = `${this.game.get_accuracy()}%`;
            // Timer is updated by its own interval
        } catch (error) {
            console.error("Error updating UI:", error);
            // Don't crash the game, just log the error
        }
    }

     /**
     * Updates the high score display element.
     */
    updateHighScoreDisplay() {
        if (this.game) {
            this.highScoreEl.textContent = this.game.get_high_score();
        }
    }

    /**
     * Updates the level display and stars.
     */
    updateLevelDisplay() {
         if (this.game) {
            const level = this.game.get_difficulty();
            this.levelEl.textContent = level;
            // Add more stars for higher levels (example)
            this.levelStarsEl.textContent = '⭐'.repeat(Math.min(level, 5)); // Max 5 stars
        }
    }


    /**
     * Loads the high score from localStorage.
     */
    loadHighScore() {
        const savedScore = localStorage.getItem('neomMathventureHighScore');
        if (savedScore !== null && this.game) {
            try {
                this.game.set_high_score(parseInt(savedScore, 10));
                console.log("Loaded high score:", savedScore);
            } catch (error) {
                 console.error("Error setting high score from localStorage:", error);
            }
        }
    }

    /**
     * Saves the current high score to localStorage if it's higher.
     */
    saveHighScore() {
        if (!this.game) return;
        try {
            const currentHighScore = this.game.get_high_score();
            const savedScore = parseInt(localStorage.getItem('neomMathventureHighScore') || '0', 10);
            if (currentHighScore > savedScore) {
                localStorage.setItem('neomMathventureHighScore', currentHighScore.toString());
                console.log("Saved new high score:", currentHighScore);
            }
        } catch (error) {
             console.error("Error saving high score:", error);
        }
    }

    /**
     * Displays a message to the user (e.g., correct/incorrect).
     * @param {string} text - The message text.
     * @param {string} type - 'success', 'error', or 'info'.
     * @param {number} duration - How long to show the message (ms). 0 for indefinite.
     */
    showMessage(text, type = 'info', duration = 2000) {
        this.messageEl.textContent = text;
        this.messageEl.className = 'message'; // Reset classes
        this.messageEl.classList.add(type);
        this.messageEl.classList.add('show');

        // Clear message after duration, if duration is not 0
        if (duration > 0) {
            setTimeout(() => {
                this.messageEl.classList.remove('show');
                 // Optional: Clear text after fade out
                // setTimeout(() => { this.messageEl.textContent = ''; }, 300);
            }, duration);
        }
    }

    /**
     * Shows an error message (specific styling).
     * @param {string} text - The error message.
     */
    showError(text) {
        this.showMessage(text, 'error', 5000); // Show errors for longer
    }

    /**
     * Triggers a visual celebration effect.
     * @param {string} emoji - The emoji to use for celebration.
     */
    triggerCelebration(emoji = '🎉') {
        for (let i = 0; i < 10; i++) { // Create multiple particles
            const span = document.createElement('span');
            span.textContent = emoji;
            span.style.left = `${Math.random() * 100}%`;
            span.style.animationDelay = `${Math.random() * 0.5}s`; // Stagger animations
            this.celebrationEl.appendChild(span);

            // Remove the span after animation ends
            span.addEventListener('animationend', () => {
                span.remove();
            });
        }
    }

    /**
     * Changes the game language.
     * @param {string} lang - The language code ('malayalam', 'manglish', 'english').
     */
    async changeLanguage(lang) {
        console.log(`Changing language to: ${lang}`);
        try {
            await this.languageLoader.changeLanguage(lang);
            this.updateUIText(); // Update all UI text elements
            this.updateLanguageSwitcher(lang); // Update button active state
            // Optionally show a mascot message in the new language
            this.showMascotGreeting('thangamma');
        } catch (error) {
            console.error(`Failed to change language to ${lang}:`, error);
            this.showError(`Could not load ${lang} language.`);
        }
    }

     /**
     * Updates the UI text elements based on the current language.
     */
    updateUIText() {
        if (!this.languageLoader) return;

        // Update elements defined in uiTextElements map
        for (const selector in this.uiTextElements) {
            const element = document.querySelector(selector);
            const langKey = this.uiTextElements[selector];
            if (element && langKey) {
                // Preserve icons/spans if they exist within the element
                const textNode = Array.from(element.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                 if (textNode) {
                    textNode.textContent = this.languageLoader.getText(langKey) + (selector.includes('timer') || selector.includes('high-score') || selector.includes('level') || selector.includes('score') || selector.includes('accuracy') ? ': ' : ''); // Add colon for stats
                 } else {
                     // Fallback if no direct text node found (might overwrite icons)
                     // element.textContent = this.languageLoader.getText(langKey);
                 }
            } else if (element && selector === '#answer') {
                 element.placeholder = this.languageLoader.getText('ui.answerPlaceholder') || "Type answer";
            }
        }

        // Update action button text based on game state
        let buttonKey = 'ui.buttons.start';
        if (this.isGameActive) {
            buttonKey = 'ui.buttons.check';
        } else if (this.game && this.game.get_score() > 0 || this.timeLeft <= 0 && this.timerInterval === null) { // Check if game has been played
            buttonKey = 'ui.buttons.playAgain';
        }
        this.actionButton.innerHTML = this.languageLoader.getText(buttonKey); // Use innerHTML to allow icons

         // Update static text in stats bar (the labels)
        const timerLabel = document.querySelector(".timer");
        if (timerLabel) timerLabel.childNodes[0].textContent = this.languageLoader.getText('ui.timer') + ": ";
        const highScoreLabel = document.querySelector(".high-score");
        if (highScoreLabel) highScoreLabel.childNodes[0].textContent = this.languageLoader.getText('ui.highScore') + ": ";
         const levelLabel = document.querySelector(".level-indicator");
        if (levelLabel) levelLabel.childNodes[0].textContent = this.languageLoader.getText('ui.level') + " "; // Space before number
        const scoreLabel = document.querySelector(".current-score");
        if (scoreLabel) scoreLabel.childNodes[0].textContent = this.languageLoader.getText('ui.score') + ": ";
        const accuracyLabel = document.querySelector(".accuracy");
        if (accuracyLabel) accuracyLabel.childNodes[0].textContent = this.languageLoader.getText('ui.accuracy') + ": ";


        // Update mascot names
        this.mascotTapir.querySelector('.mascot-name').textContent = this.languageLoader.getText('mascots.thangamma.name');
        this.mascotCapybara.querySelector('.mascot-name').textContent = this.languageLoader.getText('mascots.kannappan.name');

        console.log("UI text updated for language:", this.languageLoader.currentLanguage);
    }


    /**
     * Sets up the language switcher buttons and active states.
     */
    initializeLanguageSwitcher() {
        this.updateLanguageSwitcher(this.languageLoader.currentLanguage);
    }

    /**
     * Updates the active state of language switcher buttons.
     * @param {string} activeLang - The currently active language code.
     */
    updateLanguageSwitcher(activeLang) {
        this.langButtons.forEach(button => {
            if (button.dataset.lang === activeLang) {
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
            } else {
                button.classList.remove('active');
                 button.setAttribute('aria-pressed', 'false');
            }
        });
    }

    /**
     * Adds basic interactivity to mascots (showing speech bubbles).
     */
    addMascotInteractivity() {
        // Event listeners are added in bindEvents
        console.log("Mascot interactivity setup.");
    }

    /**
     * Shows a random greeting message from a specific mascot.
     * @param {string} mascotId - 'thangamma' or 'kannappan'.
     */
    showMascotGreeting(mascotId) {
        this.showMascotMessage(mascotId, 'greetings');
    }

    /**
     * Shows a random message from a specific category for a mascot.
     * @param {string} mascotId - 'thangamma' or 'kannappan'.
     * @param {string} category - 'greetings', 'encouragement', 'motivation', 'celebrations'.
     */
    showMascotMessage(mascotId, category) {
        const phrases = this.languageLoader.getRandomPhrase(`mascots.${mascotId}.${category}`);
        if (!phrases || phrases.length < 1) return; // Need at least one phrase

        const bubble = mascotId === 'thangamma' ? this.tapirSpeechBubble : this.capybaraSpeechBubble;
        const otherBubble = mascotId === 'thangamma' ? this.capybaraSpeechBubble : this.tapirSpeechBubble;

        const primaryTextEl = bubble.querySelector('.primary-text');
        const secondaryTextEl = bubble.querySelector('.secondary-text');
        const motivationTextEl = bubble.querySelector('.motivation-text'); // Optional third line

        if (primaryTextEl) primaryTextEl.textContent = phrases[0] || "";
        if (secondaryTextEl) secondaryTextEl.textContent = phrases[1] || ""; // Use second phrase if available
        if (motivationTextEl) motivationTextEl.textContent = phrases[2] || ""; // Use third phrase if available


        // Show the bubble and hide the other one
        bubble.classList.add('show');
        otherBubble.classList.remove('show');


        // Hide the bubble after a delay
        setTimeout(() => {
            bubble.classList.remove('show');
        }, 4000); // Show for 4 seconds
    }
}

// --- Main Execution ---
// Wait for the DOM to be fully loaded before initializing the game
document.addEventListener('DOMContentLoaded', () => {
    const gameUI = new GameUI();
    gameUI.initialize();

    // Optional: Make game instance accessible for debugging
    // window.neomGame = gameUI;
});
