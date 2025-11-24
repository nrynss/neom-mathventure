// Simple music player that loads melodies from JSON files
export class MusicPlayer {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isPlaying = false;
        this.currentMelody = null;
        this.currentNoteIndex = 0;
        this.scheduledNotes = [];
        this.scheduleInterval = null;
    }

    async initialize() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.15; // Soft volume
            this.masterGain.connect(this.audioContext.destination);
        }
    }

    async loadMelody(jsonPath) {
        try {
            const response = await fetch(jsonPath);
            this.currentMelody = await response.json();
            console.log(`Loaded: ${this.currentMelody.title} by ${this.currentMelody.composer}`);
        } catch (error) {
            console.error('Failed to load melody:', error);
        }
    }

    playNote(frequency, startTime, duration) {
        if (!this.audioContext || !this.masterGain) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;

        // ADSR envelope for smooth notes
        const now = startTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.1);
        gainNode.gain.setValueAtTime(0.2, now + duration - 0.1);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(now);
        oscillator.stop(now + duration);

        return oscillator;
    }

    scheduleNextBatch() {
        if (!this.isPlaying || !this.currentMelody) return;

        const currentTime = this.audioContext.currentTime;
        const notes = this.currentMelody.notes;
        const frequencies = this.currentMelody.noteFrequencies;

        // Schedule next 10 notes
        let timeOffset = 0;
        for (let i = 0; i < 10; i++) {
            const noteIndex = (this.currentNoteIndex + i) % notes.length;
            const noteData = notes[noteIndex];
            const frequency = frequencies[noteData.note];

            if (frequency) {
                this.playNote(frequency, currentTime + timeOffset, noteData.duration);
                timeOffset += noteData.duration;
            }
        }

        this.currentNoteIndex = (this.currentNoteIndex + 10) % notes.length;
    }

    async start(melodyPath = 'music/ode_to_joy.json') {
        if (this.isPlaying) return;

        await this.initialize();

        if (!this.currentMelody) {
            await this.loadMelody(melodyPath);
        }

        if (!this.currentMelody) {
            console.error('No melody loaded');
            return;
        }

        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        this.isPlaying = true;
        this.currentNoteIndex = 0;

        // Schedule first batch
        this.scheduleNextBatch();

        // Keep scheduling more notes every 3 seconds
        this.scheduleInterval = setInterval(() => {
            if (this.isPlaying) {
                this.scheduleNextBatch();
            }
        }, 3000);
    }

    stop() {
        this.isPlaying = false;

        if (this.scheduleInterval) {
            clearInterval(this.scheduleInterval);
            this.scheduleInterval = null;
        }

        // Disconnect and clean up
        if (this.masterGain) {
            this.masterGain.disconnect();
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
            this.masterGain = null;
        }
    }

    isCurrentlyPlaying() {
        return this.isPlaying;
    }
}
