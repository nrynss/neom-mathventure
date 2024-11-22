import init, { NeomMathGame } from '../../pkg/neom_mathventure.js';
import LanguageLoader from './languageloader.js';

class MascotController {
    constructor(gameUI) {
        this.gameUI = gameUI;
        this.thangamma = document.querySelector('.tapir');
        this.kannappan = document.querySelector('.capybara');
        this.initializeMascots();
    }

    initializeMascots() {
        this.setupMascotInteractions(this.thangamma, 'thangamma');
        this.setupMascotInteractions(this.kannappan, 'kannappan');
    }

    setupMascotInteractions(mascot, character) {
        mascot.addEventListener('mouseover', () => {
            this.showSpeechBubble(mascot, character, 'encouragement');
            this.playHoverAnimation(mascot);
        });

        mascot.addEventListener('click', () => {
            this.showSpeechBubble(mascot, character, 'greetings');
            this.playClickAnimation(mascot);
        });
    }

    updateExpression(mascot, expression) {
        const face = mascot.querySelector('.mascot-face');
        const expressions = face.querySelectorAll('path[class^="smile"], path[class^="grin"], path[class^="compassionate"], path[class^="very-happy"]');
        
        expressions.forEach(exp => exp.classList.add('hidden'));
        face.querySelector(`.${expression}`).classList.remove('hidden');
    }

    showSpeechBubble(mascot, character, type) {
        const speechBubble = mascot.querySelector('.speech-bubble');
        const phrases = this.gameUI.languageLoader.getPhrase(`mascots.${character}.${type}`);
        
        const [primary, secondary, motivation] = phrases;
        speechBubble.querySelector('.primary-text').textContent = primary;
        speechBubble.querySelector('.secondary-text').textContent = secondary;
        speechBubble.querySelector('.motivation-text').textContent = motivation;

        speechBubble.style.opacity = "1";
        speechBubble.classList.add('show');

        setTimeout(() => {
            speechBubble.classList.remove('show');
            speechBubble.style.opacity = "0";
        }, 3000);
    }

    playHoverAnimation(mascot) {
        if (mascot.classList.contains('tapir')) {
            mascot.querySelector('.jasmine').style.animation = 'sway 1.5s ease-in-out';
            mascot.querySelector('.bangle').style.animation = 'sparkle 1s ease-in-out';
        } else {
            mascot.querySelector('.capybara-head').style.animation = 'bounce 1s ease-in-out';
        }
    }

    playClickAnimation(mascot) {
        if (mascot.classList.contains('tapir')) {
            mascot.querySelectorAll('.bangle').forEach(bangle => {
                bangle.style.animation = 'sparkle 0.5s ease-in-out';
            });
        } else {
            mascot.querySelector('.capybara-body').style.transform = 'scale(1.1)';
            setTimeout(() => {
                mascot.querySelector('.capybara-body').style.transform = 'scale(1)';
            }, 200);
        }
    }

    celebrate() {
        this.updateExpression(this.thangamma, 'very-happy');
        this.updateExpression(this.kannappan, 'very-happy');
        this.showSpeechBubble(this.thangamma, 'thangamma', 'celebrations');
        this.showSpeechBubble(this.kannappan, 'kannappan', 'celebrations');

        // Add celebration animations
        this.thangamma.classList.add('celebrating');
        this.kannappan.classList.add('celebrating');

        setTimeout(() => {
            this.thangamma.classList.remove('celebrating');
            this.kannappan.classList.remove('celebrating');
        }, 3000);
    }

    handleCorrectAnswer() {
        this.updateExpression(this.thangamma, 'grin');
        this.updateExpression(this.kannappan, 'grin');
        this.showSpeechBubble(this.thangamma, 'thangamma', 'encouragement');
        
        setTimeout(() => {
            this.updateExpression(this.thangamma, 'smile');
            this.updateExpression(this.kannappan, 'smile');
        }, 2000);
    }

    handleWrongAnswer() {
        this.updateExpression(this.thangamma, 'compassionate');
        this.updateExpression(this.kannappan, 'compassionate');
        this.showSpeechBubble(this.kannappan, 'kannappan', 'motivation');
        
        setTimeout(() => {
            this.updateExpression(this.thangamma, 'smile');
            this.updateExpression(this.kannappan, 'smile');
        }, 2000);
    }
}

class GameUI {
    constructor() {
        this.game = null;
        this.timer = null;
        this.timeLeft = 30;
        this.isGameActive = false;
        this.currentDifficulty = 1;
        this.languageLoader = new LanguageLoader();
        this.mascotController = null;

        // DOM elements
        this.questionEl = document.getElementById('question');
        this.answerEl = document.getElementById('answer');
        this.actionButton = document.getElementById('actionButton');
        this.scoreEl = document.getElementById('score');
        this.highScoreEl = document.getElementById('highScore');
        this.levelEl = document.getElementById('level');
        this.timeEl = document.getElementById('time');
        this.accuracyEl = document.getElementById('accuracy');
        this.messageEl = document.getElementById('message');

        this.bindEvents();
    }

    async initialize() {
        await init();
        this.game = new NeomMathGame();
        await this.languageLoader.initialize('malayalam');
        this.mascotController = new MascotController(this);
        this.updateHighScore();
        this.updateUIText();
    }

    bindEvents() {
        this.actionButton.addEventListener('click', () => {
            if (!this.isGameActive) {
                this.startGame();
            } else {
                this.processAnswer();
            }
        });

        this.answerEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.isGameActive) {
                e.preventDefault();
                this.processAnswer();
            }
        });

        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const language = btn.dataset.lang;
                await this.languageLoader.changeLanguage(language);
                this.updateUIText();
                this.updateActiveLanguageButton(btn);
            });
        });
    }

    startGame() {
        if (this.timer) clearInterval(this.timer);

        this.game.reset_game();
        this.isGameActive = true;
        this.timeLeft = 30;
        this.currentDifficulty = 1;
        
        this.updateButtonState('playing');
        this.updateQuestion();
        this.startTimer();
        this.updateStars();
        
        this.answerEl.value = '';
        this.answerEl.classList.remove('hidden');
        this.answerEl.focus();
    }

    processAnswer() {
        if (!this.isGameActive) return;

        const answer = parseInt(this.answerEl.value);
        if (isNaN(answer)) return;

        if (this.game.check_answer(answer)) {
            this.handleCorrectAnswer();
        } else {
            this.handleWrongAnswer();
        }

        this.updateStats();
        this.updateQuestion();
        this.answerEl.value = '';
        this.answerEl.focus();
    }

    handleCorrectAnswer() {
        this.createCelebrationEffect();
        this.mascotController.handleCorrectAnswer();
        
        this.timeLeft = Math.min(this.timeLeft + 2, 30);
        this.timeEl.style.color = 'green';
        setTimeout(() => this.timeEl.style.color = '', 500);

        if (this.game.get_difficulty() > this.currentDifficulty) {
            this.handleLevelUp();
        }
    }

    handleWrongAnswer() {
        this.timeLeft = Math.max(this.timeLeft - 2, 0);
        this.timeEl.style.color = 'red';
        setTimeout(() => this.timeEl.style.color = '', 500);

        this.mascotController.handleWrongAnswer();
    }

    handleLevelUp() {
        this.currentDifficulty = this.game.get_difficulty();
        this.levelEl.parentElement.classList.add('level-up');
        setTimeout(() => this.levelEl.parentElement.classList.remove('level-up'), 1000);
        
        this.updateStars();
        this.mascotController.celebrate();
    }

    createCelebrationEffect() {
        const celebration = document.getElementById('celebration');
        const rect = this.questionEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 8; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.innerHTML = '⭐';
            star.style.left = `${centerX}px`;
            star.style.top = `${centerY}px`;
            star.style.transform = `rotate(${i * 45}deg)`;
            celebration.appendChild(star);
            
            setTimeout(() => star.remove(), 1000);
        }
    }

    updateButtonState(state) {
        const buttonTexts = {
            'start': 'ui.buttons.start',
            'playing': 'ui.buttons.check',
            'gameover': 'ui.buttons.playAgain'
        };

        this.actionButton.textContent = this.languageLoader.getText(buttonTexts[state]);

        if (state === 'playing') {
            this.answerEl.classList.remove('hidden');
        } else {
            this.answerEl.classList.add('hidden');
        }
    }

    // [Previous helper methods remain the same...]

    endGame() {
        clearInterval(this.timer);
        this.isGameActive = false;
        
        const finalScore = this.game.get_score();
        const accuracy = this.game.get_accuracy().toFixed(1);
        const statsTemplate = this.languageLoader.getText('feedback.gameStats');
        
        this.questionEl.textContent = `${this.languageLoader.getText('ui.gameOver')} ${statsTemplate.replace('{}', finalScore).replace('{}', accuracy)}`;
        this.updateButtonState('gameover');
        this.mascotController.celebrate();
    }
}

// Initialize the game
const gameUI = new GameUI();
gameUI.initialize().catch(console.error);

// Prevent zooming on mobile devices
document.addEventListener('gesturestart', e => e.preventDefault());

// Prevent form submission
document.addEventListener('submit', e => e.preventDefault());

// Prevent double-tap zoom on mobile
document.addEventListener('touchend', function(e) {
    const now = Date.now();
    const timeDiff = now - (this.lastTouch || now);
    this.lastTouch = now;

    if (timeDiff < 500 && timeDiff > 0) {
        e.preventDefault();
    }
}, false);