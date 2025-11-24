export class Confetti {
    constructor() {
        this.colors = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6'];
    }

    fire() {
        const count = 100;
        const defaults = {
            origin: { y: 0.7 },
            zIndex: 1000
        };

        // Since we can't easily use a library without npm, we'll implement a simple DOM-based confetti
        // or just use a visual trick. 
        // Actually, let's create simple DOM elements that fall down.

        for (let i = 0; i < 50; i++) {
            this.createParticle();
        }
    }

    createParticle() {
        const particle = document.createElement('div');
        const size = Math.random() * 10 + 5;
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.background = color;
        particle.style.position = 'fixed';
        particle.style.top = '-10px';
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '9999';

        // Random animation properties
        const duration = Math.random() * 2 + 1;
        const delay = Math.random() * 0.5;

        particle.style.transition = `top ${duration}s ease-in, transform ${duration}s linear, opacity ${duration}s ease-in`;

        document.body.appendChild(particle);

        // Trigger animation
        requestAnimationFrame(() => {
            particle.style.top = '110vh';
            particle.style.transform = `rotate(${Math.random() * 360}deg) translateX(${Math.random() * 100 - 50}px)`;
            particle.style.opacity = '0';
        });

        // Cleanup
        setTimeout(() => {
            particle.remove();
        }, duration * 1000 + 100);
    }
}
