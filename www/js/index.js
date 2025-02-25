// Add configurable base path
const BASE_PATH = window.NEOM_BASE_PATH || '';
import init, { NeomMathGame } from `${BASE_PATH}/pkg/neom_mathventure.js`;
import LanguageLoader from './languageloader.js';

class GameUI {
    constructor() {
        this.game = null;
        this.timer = null;
        this.timeLeft = 30;
        this.isGameActive = false;
        this.currentDifficulty = 1;
        this.languageLoader = new LanguageLoader();

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
        this.updateHighScore();
        this.addMascotInteractivity();
        this.initializeLanguageSwitcher();
        this.updateUIText();
    }

    bindEvents() {
        this.actionButton.addEventListener('click', () => {
            const currentText = this.actionButton.textContent;
            const startTexts = [
                this.languageLoader.getText('ui.buttons.start'),
                this.languageLoader.getText('ui.buttons.playAgain')
            ];
            
            if (startTexts.some(text => currentText.includes(text))) {
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
    }

    initializeLanguageSwitcher() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const language = btn.dataset.lang;
                await this.languageLoader.changeLanguage(language);
                this.updateUIText();
                this.updateActiveButton(btn);
            });
        });
        this.updateActiveButton(document.querySelector(`[data-lang="malayalam"]`));
    }

    updateActiveButton(activeBtn) {
        document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    updateUIText() {
        document.title = this.languageLoader.getText('ui.title');
        document.querySelector('.game-title').textContent = this.languageLoader.getText('ui.title');
        this.updateButtonState(this.isGameActive ? 'playing' : 'start');
    }

    addMascotInteractivity() {
        const tapir = document.querySelector('.tapir');
        const capybara = document.querySelector('.capybara');

        tapir.addEventListener('mouseover', () => {
            this.showMascotMessage(tapir, 'mascots.thangamma.encouragement');
        });

        capybara.addEventListener('mouseover', () => {
            this.showMascotMessage(capybara, 'mascots.kannappan.motivation');
        });

        tapir.addEventListener('click', () => {
            this.playMascotAnimation(tapir);
            this.showMascotMessage(tapir, 'mascots.thangamma.greetings');
        });

        capybara.addEventListener('click', () => {
            this.playMascotAnimation(capybara);
            this.showMascotMessage(capybara, 'mascots.kannappan.celebrations');
        });
    }

    showMascotMessage(mascot, phrasePath) {
        const speechBubble = mascot.querySelector('.speech-bubble');
        const phrases = this.languageLoader.getRandomPhrase(phrasePath);
        
        if (phrases && phrases.length >= 3) {
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
    }

    startGame() {
        if (this.timer) {
            clearInterval(this.timer);
        }

        this.game.reset_game();
        this.isGameActive = true;
        this.timeLeft = 30;
        this.currentDifficulty = 1;
        
        this.updateButtonState('playing');
        this.clearMessage();
        this.updateQuestion();
        this.startTimer();
        this.updateStars();
        
        this.answerEl.value = '';
        this.answerEl.classList.remove('hidden');
        this.answerEl.focus();
    }

    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.timeEl.textContent = this.timeLeft;

            if (this.timeLeft <= 5) {
                this.timeEl.style.color = 'red';
                this.timeEl.style.animation = 'pulse 1s infinite';
            }

            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
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

    updateQuestion() {
        const newQuestion = this.game.generate_question();
        
        this.questionEl.style.animation = 'none';
        this.questionEl.offsetHeight; // Trigger reflow
        this.questionEl.textContent = newQuestion;
        this.questionEl.style.animation = 'popIn 0.5s ease-out';
    }

    handleCorrectAnswer() {
        this.createCelebrationEffect();
        this.questionEl.classList.add('correct-answer');
        setTimeout(() => this.questionEl.classList.remove('correct-answer'), 500);

        this.timeLeft = Math.min(this.timeLeft + 2, 30);
        this.timeEl.style.color = 'green';
        setTimeout(() => this.timeEl.style.color = '', 500);

        this.showMascotMessage(
            document.querySelector('.tapir'),
            'mascots.thangamma.encouragement'
        );

        if (this.game.get_difficulty() > this.currentDifficulty) {
            this.handleLevelUp();
        }
    }

    handleWrongAnswer() {
        this.timeLeft = Math.max(this.timeLeft - 2, 0);
        this.timeEl.style.color = 'red';
        setTimeout(() => this.timeEl.style.color = '', 500);

        this.showMascotMessage(
            document.querySelector('.capybara'),
            'mascots.kannappan.motivation'
        );
    }

    handleLevelUp() {
        this.currentDifficulty = this.game.get_difficulty();
        this.levelEl.parentElement.classList.add('level-up');
        setTimeout(() => this.levelEl.parentElement.classList.remove('level-up'), 1000);
        
        this.updateStars();
        this.showMascotMessage(
            document.querySelector('.tapir'),
            'mascots.thangamma.celebrations'
        );
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

    updateStats() {
        this.scoreEl.textContent = this.game.get_score();
        this.levelEl.textContent = this.game.get_difficulty();
        this.accuracyEl.textContent = this.game.get_accuracy().toFixed(1);
        this.updateHighScore();
    }

    updateHighScore() {
        const highScore = this.game.get_high_score();
        if (highScore > parseInt(this.highScoreEl.textContent)) {
            this.highScoreEl.classList.add('score-changed');
            setTimeout(() => this.highScoreEl.classList.remove('score-changed'), 500);
        }
        this.highScoreEl.textContent = highScore;
    }

    updateStars() {
        const level = this.game.get_difficulty();
        const stars = '⭐'.repeat(level);
        document.querySelector('.level-stars').textContent = stars;
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

    playMascotAnimation(mascot) {
        if (mascot.classList.contains('tapir')) {
            const snout = mascot.querySelector('.tapir-snout');
            snout.style.animation = 'none';
            snout.offsetHeight;
            snout.style.animation = 'snoutWiggle 1s ease-in-out';
        } else if (mascot.classList.contains('capybara')) {
            const ears = mascot.querySelectorAll('.capybara-ear');
            ears.forEach(ear => {
                ear.style.animation = 'none';
                ear.offsetHeight;
                ear.style.animation = 'earWiggle 1s ease-in-out';
            });
        }
    }

    clearMessage() {
        this.messageEl.className = 'message';
    }

    endGame() {
        clearInterval(this.timer);
        this.isGameActive = false;
        
        const finalScore = this.game.get_score();
        const accuracy = this.game.get_accuracy().toFixed(1);
        
        const statsTemplate = this.languageLoader.getText('feedback.gameStats');
        const endMessage = `${this.languageLoader.getText('ui.gameOver')} ${statsTemplate.replace('{}', finalScore).replace('{}', accuracy)}`;

        this.questionEl.textContent = endMessage;
        this.updateButtonState('gameover');
        this.answerEl.classList.add('hidden');
    }
}

// Initialize the game
const gameUI = new GameUI();
gameUI.initialize().catch(console.error);

// Prevent zooming on mobile devices
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});

// Prevent form submission
document.addEventListener('submit', function(e) {
    e.preventDefault();
});

// Prevent double-tap zoom on mobile
document.addEventListener('touchend', function(e) {
    const now = Date.now();
    const timeDiff = now - (this.lastTouch || now);
    this.lastTouch = now;

    if (timeDiff < 500 && timeDiff > 0) {
        e.preventDefault();
    }
}, false);