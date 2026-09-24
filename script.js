// ============================================
// CONFIGURATION - MODIFIEZ CES VALEURS
// ============================================

// CHEMIN DE L'IMAGE DU SCEAU (remplacez par votre image)
const SCEAU_IMAGE_PATH = "sceau.png";

// VOTRE EMAIL POUR RECEVOIR LES INSCRIPTIONS
const ADMIN_EMAIL = "Wisfekirsem@gmail.com";

// COORDONNEES DU LIEU
// Latitude : 36.52632457978002° N
// Longitude : 2.8112754423282333° E
const LIEU_CONFIG = {
    lat: 36.52632457978002,
    lng: 2.8112754423282333,
    nom: "Salle Palais Souheib",
    adresse: "Route de Soumaa, Blida 09000",
    ville: "Blida, Algérie"
};

// ============================================
// INITIALISATION
// ============================================
function initLieuConfig() {
    document.getElementById('lieuNom').textContent = LIEU_CONFIG.nom;
    document.getElementById('lieuVille').textContent = LIEU_CONFIG.ville;
    document.getElementById('infoLieuNom').textContent = LIEU_CONFIG.nom;
    document.getElementById('infoLieuVille').textContent = LIEU_CONFIG.ville;
    document.getElementById('infoLieuAdresse').textContent = LIEU_CONFIG.adresse;
    
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${LIEU_CONFIG.lat},${LIEU_CONFIG.lng}`;
    document.getElementById('directionsLink').href = directionsUrl;
    
    const mapFrame = document.getElementById('mapFrame');
    const mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1000!2d${LIEU_CONFIG.lng}!3d${LIEU_CONFIG.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${encodeURIComponent(LIEU_CONFIG.nom)}!5e0!3m2!1sfr!2sdz!4v1234567890123!5m2!1sfr!2sdz`;
    mapFrame.src = mapUrl;
}

// ============================================
// SECURITE : DETECTION APPAREIL UNIQUE
// ============================================
const STORAGE_KEY = 'wedding_device_fingerprint_v2';
const REGISTRATION_DATA_KEY = 'wedding_registrations_v2';

function generateDeviceFingerprint() {
    const components = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 'unknown',
        navigator.platform,
        Math.random().toString(36).substr(2, 15)
    ];
    
    let hash = 0;
    const str = components.join('|');
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16) + Date.now().toString(36);
}

function getDeviceId() {
    let deviceId = localStorage.getItem(STORAGE_KEY);
    if (!deviceId) {
        deviceId = generateDeviceFingerprint();
        localStorage.setItem(STORAGE_KEY, deviceId);
    }
    return deviceId;
}

function isDeviceAlreadyRegistered() {
    const deviceId = getDeviceId();
    const registrations = JSON.parse(localStorage.getItem(REGISTRATION_DATA_KEY) || '[]');
    return registrations.find(r => r.deviceId === deviceId);
}

function registerDevice(data) {
    const deviceId = getDeviceId();
    const registrations = JSON.parse(localStorage.getItem(REGISTRATION_DATA_KEY) || '[]');
    
    registrations.push({
        ...data,
        deviceId: deviceId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 50)
    });
    
    localStorage.setItem(REGISTRATION_DATA_KEY, JSON.stringify(registrations));
}

function showAlreadyRegistered(data) {
    document.getElementById('rsvpForm').style.display = 'none';
    document.getElementById('alreadyRegistered').classList.add('show');
    
    const contactInfo = [];
    if (data.email) contactInfo.push(`Email: ${data.email}`);
    if (data.instagram) contactInfo.push(`Instagram: ${data.instagram}`);
    if (data.facebook) contactInfo.push(`Facebook: ${data.facebook}`);
    
    const infoHtml = `
        <p><strong>Nom :</strong> ${data.prenom} ${data.nom}</p>
        ${contactInfo.length > 0 ? `<p><strong>Contact :</strong> ${contactInfo.join(', ')}</p>` : ''}
        <p><strong>Hommes :</strong> ${data.hommes}</p>
        <p><strong>Femmes :</strong> ${data.femmes}</p>
        <p><strong>Total :</strong> ${data.total} personne(s)</p>
        <p><strong>Inscrit le :</strong> ${new Date(data.timestamp).toLocaleString('fr-FR')}</p>
    `;
    document.getElementById('registeredInfo').innerHTML = infoHtml;
}

function resetRegistration() {
    if (confirm('Êtes-vous sûr de vouloir effacer cette inscription ?')) {
        const deviceId = getDeviceId();
        let registrations = JSON.parse(localStorage.getItem(REGISTRATION_DATA_KEY) || '[]');
        registrations = registrations.filter(r => r.deviceId !== deviceId);
        localStorage.setItem(REGISTRATION_DATA_KEY, JSON.stringify(registrations));
        
        document.getElementById('alreadyRegistered').classList.remove('show');
        document.getElementById('rsvpForm').style.display = 'flex';
        document.getElementById('rsvpForm').reset();
        guestCounts.hommes = 0;
        guestCounts.femmes = 0;
        document.getElementById('count-hommes').textContent = '0';
        document.getElementById('count-femmes').textContent = '0';
        updateTotal();
        updateButtonStates();
    }
}

// ============================================
// CONFETTI AVEC DECROISSANCE
// ============================================
class WeddingConfetti {
    constructor() {
        this.canvas = document.getElementById('confettiCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticle(x, y) {
        const colors = ['#c9a962', '#e8d5d5', '#d4b5b5', '#fff', '#ffe4ec', '#f5e6d3', '#d4af37', '#f4e4c1'];
        const shapes = ['circle', 'petal', 'diamond'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        
        return {
            x: x || Math.random() * this.canvas.width,
            y: y || -30,
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * 2 + 1,
            size: Math.random() * 10 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            shape: shape,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            opacity: 1,
            sway: Math.random() * 2,
            swaySpeed: Math.random() * 0.02 + 0.01
        };
    }
    
    burst(x, y, count = 80) {
        for (let i = 0; i < count; i++) {
            const particle = this.createParticle(x, y);
            const angle = (i / count) * Math.PI * 2;
            const velocity = 10 + Math.random() * 10;
            particle.vx = Math.cos(angle) * velocity;
            particle.vy = Math.sin(angle) * velocity - 8;
            particle.size = Math.random() * 15 + 8;
            this.particles.push(particle);
        }
    }
    
    rainProgressive(duration = 10000) {
        let elapsed = 0;
        const interval = 100;
        
        const rainInterval = setInterval(() => {
            elapsed += interval;
            const progress = elapsed / duration;
            const maxParticles = Math.floor(10 * Math.exp(-4 * progress));
            const count = Math.max(0, maxParticles);
            
            for (let i = 0; i < count; i++) {
                this.particles.push(this.createParticle());
            }
            
            if (elapsed >= duration) {
                clearInterval(rainInterval);
            }
        }, interval);
    }
    
    update() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles = this.particles.filter(p => {
            p.x += p.vx + Math.sin(p.y * p.swaySpeed) * p.sway;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;
            p.vy += 0.05;
            p.vx *= 0.995;
            p.opacity -= 0.002;
            
            if (p.opacity <= 0 || p.y > this.canvas.height + 50) return false;
            
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            this.ctx.globalAlpha = p.opacity;
            this.ctx.fillStyle = p.color;
            
            if (p.shape === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (p.shape === 'petal') {
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, p.size / 2, p.size / 3, 0, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (p.shape === 'diamond') {
                this.ctx.beginPath();
                this.ctx.moveTo(0, -p.size / 2);
                this.ctx.lineTo(p.size / 2, 0);
                this.ctx.lineTo(0, p.size / 2);
                this.ctx.lineTo(-p.size / 2, 0);
                this.ctx.closePath();
                this.ctx.fill();
            }
            
            this.ctx.restore();
            return true;
        });
        
        requestAnimationFrame(() => this.update());
    }
    
    start() { this.update(); }
}

const confetti = new WeddingConfetti();
confetti.start();

function createWaxParticles() {
    const container = document.getElementById('waxParticles');
    container.innerHTML = '';
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const angle = (i / 50) * Math.PI * 2 + (Math.random() - 0.5) * 1;
        const distance = 100 + Math.random() * 200;
        const tx = Math.cos(angle) * distance;
        const ty = 300 + Math.random() * 200;
        
        particle.style.left = '50%';
        particle.style.top = '50%';
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        
        const size = 12 + Math.random() * 20;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.animationDelay = (i * 0.01) + 's';
        
        container.appendChild(particle);
        setTimeout(() => particle.classList.add('animate'), 50);
    }
}

// ============================================
// ANIMATION ENVELOPPE
// ============================================
function initEnvelopeAnimation() {
    const envelopeStage = document.getElementById('envelopeStage');
    const waxSeal = document.getElementById('waxSeal');
    const envelopeFlap = document.getElementById('envelopeFlap');
    const envelopeFoldBottom = document.getElementById('envelopeFoldBottom');
    const mainSite = document.getElementById('mainSite');

    waxSeal.addEventListener('click', handleOpenEnvelope);

    function handleOpenEnvelope(e) {
        if (e) e.stopPropagation();
        waxSeal.style.pointerEvents = 'none';
        
        waxSeal.classList.add('broken');
        createWaxParticles();
        
        const scene = document.getElementById('envelopeScene');
        const rect = scene.getBoundingClientRect();
        confetti.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 100);
        
        setTimeout(() => {
            envelopeFlap.classList.add('opening');
            
            setTimeout(() => {
                envelopeFoldBottom.classList.add('opening');
                
                setTimeout(() => {
                    envelopeStage.style.opacity = '0';
                    envelopeStage.style.visibility = 'hidden';
                    
                    setTimeout(() => {
                        mainSite.classList.add('revealed');
                        initScrollAnimations();
                        
                        const existing = isDeviceAlreadyRegistered();
                        if (existing) {
                            showAlreadyRegistered(existing);
                        }
                    }, 500);
                }, 2000);
            }, 600);
        }, 600);
    }
}

function initScrollAnimations() {
    const observerOptions = { threshold: 0.12, rootMargin: '0px 0px -60px 0px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || index * 100;
                setTimeout(() => { entry.target.classList.add('visible'); }, delay);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal-element').forEach((el, i) => {
        el.style.transitionDelay = (i * 0.08) + 's';
        observer.observe(el);
    });

    setTimeout(() => {
        document.querySelectorAll('.reveal-element').forEach((el, i) => {
            if (el.getBoundingClientRect().top < window.innerHeight * 0.8) {
                setTimeout(() => el.classList.add('visible'), i * 120);
            }
        });
    }, 500);
}

// ============================================
// GESTION DU FORMULAIRE
// ============================================
const guestCounts = { hommes: 0, femmes: 0 };

function updateCounter(type, delta) {
    const newValue = guestCounts[type] + delta;
    if (newValue >= 0 && newValue <= 10) {
        guestCounts[type] = newValue;
        document.getElementById(`count-${type}`).textContent = newValue;
        updateTotal();
        updateButtonStates();
    }
}

function updateTotal() {
    const total = guestCounts.hommes + guestCounts.femmes;
    document.getElementById('totalGuests').textContent = total;
}

function updateButtonStates() {
    document.querySelectorAll('.counter-btn[data-action="minus"]').forEach(btn => {
        const target = btn.dataset.target;
        btn.disabled = guestCounts[target] === 0;
    });
    document.querySelectorAll('.counter-btn[data-action="plus"]').forEach(btn => {
        const target = btn.dataset.target;
        btn.disabled = guestCounts[target] >= 10;
    });
}

document.querySelectorAll('.counter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        const target = btn.dataset.target;
        updateCounter(target, action === 'plus' ? 1 : -1);
    });
});

updateButtonStates();

document.getElementById('rsvpForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const existing = isDeviceAlreadyRegistered();
    if (existing) {
        showAlreadyRegistered(existing);
        return;
    }
    
    const formData = new FormData(e.target);
    const prenom = formData.get('prenom').trim();
    const nom = formData.get('nom').trim();
    const email = formData.get('email')?.trim();
    const instagram = formData.get('instagram')?.trim();
    const facebook = formData.get('facebook')?.trim();
    
    if (!email && !instagram && !facebook) {
        showStatus('Veuillez fournir au moins un moyen de contact (Email, Instagram ou Facebook).', 'error');
        return;
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showStatus('Veuillez entrer une adresse email valide.', 'error');
        return;
    }
    
    const data = {
        prenom: prenom,
        nom: nom,
        email: email || null,
        instagram: instagram || null,
        facebook: facebook || null,
        hommes: guestCounts.hommes,
        femmes: guestCounts.femmes,
        total: guestCounts.hommes + guestCounts.femmes,
        date: new Date().toLocaleString('fr-FR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    };
    
    if (data.total === 0) {
        showStatus('Veuillez indiquer au moins une personne.', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    const originalContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Envoi en cours...</span>';
    
    try {
        registerDevice(data);
        
        const contactMethods = [];
        if (data.email) contactMethods.push(`📧 Email: ${data.email}`);
        if (data.instagram) contactMethods.push(`📷 Instagram: ${data.instagram}`);
        if (data.facebook) contactMethods.push(`👤 Facebook: ${data.facebook}`);
        
        const subject = `🎉 Nouvelle inscription - Mariage Wissem & Mousaab | ${prenom} ${nom}`;
        const body = `Bonjour,

Une nouvelle inscription vient d'être reçue :

👤 INVITÉ
   Prénom : ${prenom}
   Nom : ${nom}

📱 MOYENS DE CONTACT
${contactMethods.join('\n')}

👥 PARTICIPANTS
   Hommes : ${data.hommes}
   Femmes : ${data.femmes}
   TOTAL : ${data.total} personne(s)

📅 Date d'inscription : ${data.date}

---
Cet email a été généré automatiquement depuis le site d'invitation.`;
        
        const mailtoLink = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
        
        showStatus('Votre confirmation a été enregistrée avec succès !', 'success');
        confetti.burst(window.innerWidth / 2, window.innerHeight / 2, 150);
        
        setTimeout(() => {
            showAlreadyRegistered({ ...data, timestamp: new Date().toISOString() });
        }, 2000);
        
    } catch (error) {
        console.error('Erreur:', error);
        showStatus('Une erreur est survenue. Veuillez réessayer.', 'error');
    } finally {
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalContent;
        }, 2000);
    }
});

function showStatus(message, type) {
    const status = document.getElementById('formStatus');
    status.textContent = message;
    status.className = 'form-status ' + type;
    status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => { status.className = 'form-status'; }, 8000);
}

// ============================================
// DEMARRAGE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initLieuConfig();
    initEnvelopeAnimation();
});

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => { confetti.resize(); }, 250);
});