const BASE_PATH = window.NEOM_BASE_PATH || "";

import init, { NeomMathGame } from "../pkg/neom_mathventure.js";
import { MusicPlayer } from "./music_player.js";
import { Confetti } from "./confetti.js";

class GameUI {
    constructor() {
        this.game = null;
        this.animationFrameId = null;
        this.lastTick = 0;
        this.currentLanguage = "english"; // Default to English
        this.lastSpeaker = null;
        this.englishLocale = null;
        this.musicPlayer = new MusicPlayer(); // JSON-based music player
        this.confetti = new Confetti();

        this.screens = {
            welcome: document.getElementById('welcome-screen'),
            game: document.getElementById('game-screen'),
            gameOver: document.getElementById('game-over-screen')
        };

        this.displays = {
            time: document.getElementById('time-display'),
            score: document.getElementById('score-display'),
            highScore: document.getElementById('highscore-display'),
            level: document.getElementById('level-display'),
            question: document.getElementById('question-display'),
            finalScore: document.getElementById('final-score'),
            finalAccuracy: document.getElementById('final-accuracy'),
            feedback: document.getElementById('feedback-message')
        };

        this.inputs = {
            answer: document.getElementById('answer-input'),
            checkBtn: document.getElementById('check-btn'),
            startBtn: document.getElementById('start-btn'),
            restartBtn: document.getElementById('restart-btn')
        };

        this.langButtons = document.querySelectorAll('.lang-btn[data-lang]');
        this.audioToggle = document.getElementById('audio-toggle');
        this.musicToggle = document.getElementById('music-toggle');

        this.mascots = {
            thangamma: {
                element: document.querySelector('.tapir-wrapper'),
                bubble: document.querySelector('.tapir .speech-bubble'),
                text: document.querySelector('.tapir .speech-text')
            },
            kannappan: {
                element: document.querySelector('.capybara-wrapper'),
                bubble: document.querySelector('.capybara .speech-bubble'),
                text: document.querySelector('.capybara .speech-text')
            }
        };
    }

    async initialize() {
        try {
            await init(`${BASE_PATH}/pkg/neom_mathventure_bg.wasm?v=${Date.now() + 1}`);
            this.game = new NeomMathGame();

            const engResponse = await fetch(`${BASE_PATH}/locales/english.json`);
            if (engResponse.ok) {
                this.englishLocale = await engResponse.text();
            }

            // Load English by default
            await this.loadLanguage(this.currentLanguage);
            this.updateActiveLangButton(this.currentLanguage);
            this.updateStaticText();
            this.bindEvents();
            this.updateHighScoreDisplay();
        } catch (error) {
            console.error("Initialization failed:", error);
        }
    }

    async loadLanguage(lang) {
        try {
            const response = await fetch(`${BASE_PATH}/locales/${lang}.json`);
            if (!response.ok) {
                console.warn(`Failed to load ${lang}`);
                return;
            }
            const jsonText = await response.text();
            this.game.load_locales(jsonText);
            this.currentLanguage = lang;
        } catch (error) {
            console.error(`Error loading language ${lang}:`, error);
        }
    }

    bindEvents() {
        this.langButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const lang = e.currentTarget.dataset.lang;
                if (lang) {
                    await this.loadLanguage(lang);
                    this.updateActiveLangButton(lang);
                    this.updateStaticText();
                }
            });
        });

        // Audio toggle - controls speech
        if (this.audioToggle) {
            this.audioToggle.addEventListener('click', () => {
                const enabled = this.game.toggle_audio();
                this.audioToggle.textContent = enabled ? '🔊' : '🔇';
            });
        }

        // Music toggle - controls background music
        if (this.musicToggle) {
            this.musicToggle.addEventListener('click', async () => {
                if (this.musicPlayer.isCurrentlyPlaying()) {
                    this.musicPlayer.stop();
                    this.musicToggle.textContent = '🔇';
                } else {
                    await this.musicPlayer.start();
                    this.musicToggle.textContent = '🎵';
                }
            });
        }

        if (this.mascots.thangamma.element) {
            this.mascots.thangamma.element.addEventListener('click', () => {
                this.showMascotSpeech('thangamma', 'greetings');
            });
        }
        if (this.mascots.kannappan.element) {
            this.mascots.kannappan.element.addEventListener('click', () => {
                this.showMascotSpeech('kannappan', 'motivation');
            });
        }

        this.inputs.startBtn.addEventListener('click', () => this.startGame());
        this.inputs.restartBtn.addEventListener('click', () => this.startGame());
        this.inputs.checkBtn.addEventListener('click', () => this.checkAnswer());
        this.inputs.answer.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.checkAnswer();
        });
    }

    updateActiveLangButton(lang) {
        this.langButtons.forEach(btn => {
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    updateStaticText() {
        const titleEl = document.querySelector('.game-title');
        if (titleEl) titleEl.textContent = this.game.get_ui_text('ui.title');

        this.inputs.startBtn.textContent = this.game.get_ui_text('ui.buttons.start');
        this.inputs.checkBtn.textContent = this.game.get_ui_text('ui.buttons.check');
        this.inputs.restartBtn.textContent = this.game.get_ui_text('ui.buttons.playAgain');
    }

    showMascotSpeech(mascot, category) {
        const mascotData = this.mascots[mascot];
        if (!mascotData || !mascotData.bubble || !mascotData.text) return;

        const message = this.game.get_mascot_message(mascot, category);
        if (!message) return;

        mascotData.text.textContent = message;
        mascotData.bubble.style.opacity = '1';

        if (this.englishLocale) {
            const tempGame = new NeomMathGame();
            tempGame.load_locales(this.englishLocale);
            const englishMsg = tempGame.get_mascot_message(mascot, category);
            this.game.speak_mascot_message(englishMsg || message, mascot);
        } else {
            this.game.speak_mascot_message(message, mascot);
        }

        setTimeout(() => {
            mascotData.bubble.style.opacity = '0';
        }, 3000);
    }

    async startGame() {
        if (!this.game) return;

        this.game.reset_game();
        const q = this.game.generate_question();
        this.updateQuestionDisplay(q);

        this.showScreen('game');
        this.updateUI();
        this.inputs.answer.value = '';
        this.inputs.answer.focus();

        this.showMascotSpeech('thangamma', 'greetings');
        this.lastSpeaker = 'thangamma';

        // Start background music
        await this.musicPlayer.start();

        this.lastTick = performance.now();
        this.gameLoop(this.lastTick);
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active');
        });
        this.screens[screenName].classList.remove('hidden');
        this.screens[screenName].classList.add('active');
    }

    gameLoop(timestamp) {
        if (!this.game) return;

        const deltaTime = timestamp - this.lastTick;

        if (deltaTime >= 1000) {
            const isRunning = this.game.tick();
            this.lastTick = timestamp;
            this.updateUI();

            if (!isRunning) {
                this.gameOver();
                return;
            }
        }

        this.animationFrameId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    checkAnswer() {
        const value = parseInt(this.inputs.answer.value);
        if (isNaN(value)) return;

        const isCorrect = this.game.check_answer(value);

        const nextMascot = this.lastSpeaker === 'thangamma' ? 'kannappan' : 'thangamma';

        if (isCorrect) {
            const feedbackMsg = this.game.get_mascot_message('feedback', 'correct') || "Correct!";
            this.showFeedback(feedbackMsg, "success");
            const category = nextMascot === 'thangamma' ? 'encouragement' : 'celebrations';
            this.showMascotSpeech(nextMascot, category);
            const q = this.game.generate_question();
            this.updateQuestionDisplay(q);
            this.inputs.answer.value = '';

            // Small confetti burst for correct answer? Maybe too much.
            // Let's just do it for high score or game over.
        } else {
            const feedbackMsg = this.game.get_mascot_message('feedback', 'incorrect') || "Try Again!";
            this.showFeedback(feedbackMsg, "error");
            this.showMascotSpeech(nextMascot, 'motivation');
        }

        this.lastSpeaker = nextMascot;
        this.updateUI();
        this.inputs.answer.focus();
    }

    showFeedback(msg, type) {
        this.displays.feedback.textContent = msg;
        this.displays.feedback.className = `message ${type}`;
        setTimeout(() => {
            this.displays.feedback.textContent = '';
            this.displays.feedback.className = 'message';
        }, 1000);
    }

    updateUI() {
        this.displays.time.textContent = this.game.get_time_left();
        this.displays.score.textContent = this.game.get_score();
        this.displays.highScore.textContent = this.game.get_high_score();
        this.displays.level.textContent = this.game.get_difficulty();
    }

    updateQuestionDisplay(text) {
        this.displays.question.textContent = `${text} = ?`;
    }

    updateHighScoreDisplay() {
        if (this.game) {
            this.displays.highScore.textContent = this.game.get_high_score();
        }
    }

    gameOver() {
        cancelAnimationFrame(this.animationFrameId);
        this.musicPlayer.stop();
        this.showScreen('gameOver');
        this.displays.finalScore.textContent = this.game.get_score();
        this.displays.finalAccuracy.textContent = this.game.get_accuracy();

        this.showMascotSpeech('kannappan', 'celebrations');

        // Fire confetti!
        this.confetti.fire();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const ui = new GameUI();
    ui.initialize();
});