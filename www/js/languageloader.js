class LanguageLoader {
    constructor() {
        this.currentLanguage = 'malayalam';
        this.translations = {};
    }

    async loadLanguage(language) {
        try {
            const response = await fetch(`/locales/${language}.json`);
            if (!response.ok) throw new Error(`Failed to load ${language}`);
            this.translations[language] = await response.json();
            return this.translations[language];
        } catch (error) {
            console.error(`Error loading language: ${language}`, error);
            throw error;
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
        return path.split('.').reduce((obj, key) => obj && obj[key], this.translations[this.currentLanguage]) || '';
    }

    getRandomPhrase(category) {
        const phrases = this.getText(category);
        return phrases[Math.floor(Math.random() * phrases.length)];
    }

    async changeLanguage(language) {
        if (this.currentLanguage === language) return;
        await this.initialize(language);
        this.currentLanguage = language;
        return this.translations[language];
    }
}

export default LanguageLoader;