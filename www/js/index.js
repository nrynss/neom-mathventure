// Add configurable base path
const BASE_PATH = window.NEOM_BASE_PATH || "";

// Import game components - fixed import syntax
import init, { NeomMathGame } from "../pkg/neom_mathventure.js";
import LanguageLoader from "./languageloader.js";

class GameUI {
  constructor() {
    this.game = null;
    this.timer = null;
    this.timeLeft = 30;
    this.isGameActive = false;
    this.currentDifficulty = 1;
    this.languageLoader = new LanguageLoader();
    this.eventHandlers = []; // Track event handlers for cleanup

    // DOM elements
    this.questionEl = document.getElementById("question");
    this.answerEl = document.getElementById("answer");
    this.actionButton = document.getElementById("actionButton");
    this.scoreEl = document.getElementById("score");
    this.highScoreEl = document.getElementById("highScore");
    this.levelEl = document.getElementById("level");
    this.timeEl = document.getElementById("time");
    this.accuracyEl = document.getElementById("accuracy");
    this.messageEl = document.getElementById("message");
  }

  async initialize() {
    try {
      await init();
      this.game = new NeomMathGame();

      // Load language
      await this.languageLoader.initialize("malayalam");

      // Load saved high score
      this.loadHighScore();
      this.updateHighScore();

      this.bindEvents();
      this.addMascotInteractivity();
      this.initializeLanguageSwitcher();
      this.updateUIText();

      console.log("Game initialized successfully");
    } catch (error) {
      console.error("Failed to initialize game:", error);
      this.showError("Failed to initialize game. Please reload the page.");
    }
  }

  // Rest of the class implementation remains the same
  // ...
}
