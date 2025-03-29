// Add configurable base path
const BASE_PATH = window.NEOM_BASE_PATH || "";

class LanguageLoader {
  constructor() {
    this.currentLanguage = "malayalam";
    this.translations = {};
    this.defaultTranslations = {
      ui: {
        title: "Math Game",
        buttons: {
          start: "Start",
          check: "Check",
          playAgain: "Play Again",
        },
        gameOver: "Game Over",
      },
      feedback: {
        enterNumber: "Please enter a number",
      },
    };
  }

  async loadLanguage(language) {
    try {
      // Updated path to use BASE_PATH and remove /www/ prefix
      const response = await fetch(`${BASE_PATH}/locales/${language}.json`);
      if (!response.ok) throw new Error(`Failed to load ${language}`);
      this.translations[language] = await response.json();
      return this.translations[language];
    } catch (error) {
      console.error(`Error loading language: ${language}`, error);

      // Fallback to English if available
      if (language !== "english" && this.translations["english"]) {
        console.log("Falling back to English language");
        return this.translations["english"];
      }

      // Use default translations as last resort
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
    const result = path
      .split(".")
      .reduce(
        (obj, key) => obj?.[key],
        this.translations[this.currentLanguage],
      );
    if (result === undefined) {
      // Try to get from default translations if not found
      const defaultValue = path
        .split(".")
        .reduce((obj, key) => obj?.[key], this.defaultTranslations);
      return defaultValue || "";
    }
    return result;
  }

  getRandomPhrase(category) {
    const phrases = this.getText(category);
    if (!phrases || !phrases.length) {
      console.warn(`No phrases found for category: ${category}`);
      return null;
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
      return this.translations[this.currentLanguage]; // Return current language on error
    }
  }
}

export default LanguageLoader;
