
// Add configurable base path
const BASE_PATH = window.NEOM_BASE_PATH || "";
class LanguageLoader {
  constructor() {
    this.currentLanguage = "malayalam";
    this.translations = {};
    this.defaultTranslations = {
      ui: {
        title: "Neom Mathventure",
        timer: "Time",
        highScore: "High Score",
        level: "Level",
        score: "Score",
        accuracy: "Accuracy",
        buttons: {
          start: "Let's Begin! 🚀",
          check: "Check Answer! 🎯",
          playAgain: "Play Again! 🔄",
        },
        gameOver: "Game Over!",
      },
      mascots: {
        thangamma: {
          name: "Thangamma",
          greetings: [["Hello!", "Let's learn math", "Shall we begin?"]],
          encouragement: [["Great!", "Very good", "Keep going!"]],
          celebrations: [
            ["Level up!", "You're getting better!", "Amazing progress!"],
          ],
        },
        kannappan: {
          name: "Kannappan",
          motivation: [["Try!", "We can do it", "Success awaits!"]],
          celebrations: [["Victory!", "Super", "Success!"]],
        },
      },
      feedback: {
        correct: ["Very good!", "Perfect!", "Excellent!"],
        incorrect: ["Not quite right", "Try again", "Close, but not correct"],
        enterNumber: "Please enter a number",
        correctAnswerWas: "The correct answer was",
        levelUp: ["Next level!", "Moving up!", "Onwards!"],
      },
    };
  }

  async loadLanguage(language) {
    try {
      // Try different path approaches to find the language file
      const paths = [
        `./locales/${language}.json`,
        `../locales/${language}.json`,
        `/www/locales/${language}.json`,
        `/locales/${language}.json`,
      ];

      let response = null;
      let loadedPath = "";

      // Try each path until one works
      for (const path of paths) {
        try {
          console.log(`Attempting to load language from: ${path}`);
          response = await fetch(path);
          if (response.ok) {
            loadedPath = path;
            break;
          }
        } catch (err) {
          console.log(`Failed loading from ${path}: ${err.message}`);
        }
      }

      if (!response || !response.ok) {
        console.warn(`Could not load ${language}, using default translations`);
        this.translations[language] = this.defaultTranslations;
        return this.defaultTranslations;
      }

      console.log(
        `Successfully loaded language ${language} from ${loadedPath}`,
      );
      this.translations[language] = await response.json();
      return this.translations[language];
    } catch (error) {
      console.error(`Error loading language: ${language}`, error);
      this.translations[language] = this.defaultTranslations;
      return this.defaultTranslations;
    }
  }

  async initialize(language) {
    this.currentLanguage = language;
    if (!this.translations[language]) {
      await this.loadLanguage(language);
    }
    return this.translations[language];
  }

  getText(path) {
    if (!this.translations[this.currentLanguage]) {
      return this.getFromDefault(path);
    }

    const result = path
      .split(".")
      .reduce(
        (obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined),
        this.translations[this.currentLanguage],
      );

    if (result !== undefined) {
      return result;
    }

    return this.getFromDefault(path);
  }

  getFromDefault(path) {
    return path
      .split(".")
      .reduce(
        (obj, key) => (obj && obj[key] !== undefined ? obj[key] : ""),
        this.defaultTranslations,
      );
  }

  getRandomPhrase(category) {
    const phrases = this.getText(category);
    if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
      console.warn(`No valid phrases found for category: ${category}`);
      return ["", "", ""];
    }
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  async changeLanguage(language) {
    if (this.currentLanguage === language) return;

    try {
      await this.initialize(language);
      this.currentLanguage = language;
      return this.translations[language];
    } catch (error) {
      console.error(`Failed to change language to ${language}:`, error);
      return (
        this.translations[this.currentLanguage] || this.defaultTranslations
      );
    }
  }
}

export default LanguageLoader;
