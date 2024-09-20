const appElement = document.querySelector('#matrix-words-cloud');
if (!appElement) throw new Error(`No #matrix-words-cloud found`);
appElement.appendChild(document.createElement('canvas'))

const canvas = document.querySelector('canvas');
if (!canvas) throw new Error(`No canvas found`);
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error(`No canvas support`);

canvas.width = appElement.offsetWidth;
canvas.height = appElement.offsetHeight;

console.log('w', appElement.offsetWidth);
console.log('h', appElement.offsetHeight);

document.addEventListener('DOMContentLoaded', () => {
    console.log('dcl', appElement.offsetHeight)
    canvas.height = appElement.offsetHeight;
})

window.addEventListener('resize', () => {
    console.log("resized");

    canvas.width = appElement.offsetWidth;
    canvas.height = appElement.offsetHeight;
})

// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;

const letters = [...Array(26)].map((_, i) => String.fromCharCode(i + 65));

const fontSize = 10;

const possibleWords = ['Rust', 'TypeScript', 'Machine Learning', 'Cryptography', 'Blockchain', 'Deep Learning', 'Quantum Computing', 'Big Data', 'Kubernetes', 'Docker', 'Cybersecurity', 'Microservices', 'Data Science', 'DevOps', 'Neural Networks', 'Natural Language Processing)', 'Cloud Computing', 'Edge Computing', 'Serverless', 'Artificial General Intelligence', 'Reinforcement Learning', 'Swift', 'Golang', 'Python', 'WebAssembly', 'Augmented Reality', 'Virtual Reality', 'Computer Vision', 'Distributed Systems', 'Zero Trust', 'Homomorphic Encryption', 'Quantum Cryptography', 'Federated Learning', 'Augmented Analytics',]

class Word {
    drops = [];
    age = 0;
    frozenTime = 40;
    target = 'Love'

    constructor(target = 'Love') {
        this.target = target;
        this.drops = [];
        this.age = -80;
        const xC = (Math.random() - 0.5) * canvas.width / fontSize / 2;
        const yC = (Math.random() - 0.5) * canvas.height / fontSize / 2;

        for (let i = 0; i < this.target.length; i++) {
            const phi0 = 2 * Math.PI * Math.random()
            const v0 = 1;
            const x0 = xC + canvas.width / fontSize / 2 - this.target.length / 2 + i + v0 * this.age * Math.cos(phi0);
            const y0 = yC + canvas.height / fontSize / 2 + v0 * this.age * Math.sin(phi0);

            this.drops[i] = {
                x: x0, y: y0, phi: phi0, v: v0, dead: false
            };
        }
    }
}

function regenerateWords() {
    if (words.length < 10 && Math.random() > 0.9) {
        words.push(new Word(possibleWords[Math.floor(Math.random() * possibleWords.length)]));
    }
}

const words = [new Word('Pick')]

window.words = words;

function draw() {
    /**
     * @type string {light|dark}
     */
    const mode = localStorage.getItem('theme');


    ctx.fillStyle = mode === 'light' ? `rgba(255, 255, 255, .1)` : `rgba(0, 0, 0, .1)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const word of words) {
        word.age++;

        for (let i = 0; i < word.drops.length; i++) {
            const text = letters[Math.floor(Math.random() * letters.length)];
            ctx.fillStyle = mode === 'light' ? '#818181' : '#0f0';

            if (word.age > 0 && word.age < word.frozenTime) {
                ctx.fillStyle = '#ff0044';
                ctx.fillText(word.target[i], word.drops[i].x * fontSize, word.drops[i].y * fontSize);
                continue;
            }

            ctx.fillText(text, word.drops[i].x * fontSize, word.drops[i].y * fontSize);

            word.drops[i].x = word.drops[i].x + word.drops[i].v * Math.cos(word.drops[i].phi);
            word.drops[i].y = word.drops[i].y + word.drops[i].v * Math.sin(word.drops[i].phi);

            if (((word.drops[i].x * fontSize > canvas.width || word.drops[i].x * fontSize < 0) && Math.random() > 0.5 && word.age > 0) || ((word.drops[i].y * fontSize > canvas.height || word.drops[i].y * fontSize < 0) && Math.random() > 0.5 && word.age > 0)) {
                word.drops[i].dead = true;
            }
        }

        if (word.age > word.frozenTime && word.drops.some(d => d.dead)) {
            word.drops = word.drops.filter(drop => !drop.dead);
        }

        if (word.drops.length === 0) {
            words.splice(words.indexOf(word), 1);
        }
    }

    regenerateWords();
}

setInterval(draw, 33)