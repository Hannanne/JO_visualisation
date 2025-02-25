console.log("Démarrage du script athletes3D.js");

// Vérification initiale de Three.js
if (typeof THREE === 'undefined') {
    console.error("Three.js n'est pas chargé. Arrêt de l'initialisation.");
    throw new Error("Three.js n'est pas disponible");
}

console.log("Three.js est disponible, version:", THREE.REVISION);

// Variables globales
let scene, camera, renderer, cube;

// Fonction d'animation
function animate() {
    requestAnimationFrame(animate);
    
    if (cube) {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
    }
    
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Fonction d'initialisation
function init() {
    console.log("Début de l'initialisation Three.js");

    try {
        // Récupération du conteneur
        const container = document.getElementById('scene');
        if (!container) {
            throw new Error("Conteneur #scene non trouvé");
        }
        console.log("Conteneur trouvé:", container);

        // Création de la scène
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        console.log("Scène créée");

        // Configuration de la caméra
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;
        console.log("Caméra configurée");

        // Configuration du renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);
        console.log("Renderer configuré");

        // Création du cube
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            wireframe: true
        });
        cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        console.log("Cube ajouté à la scène");

        // Animation
        animate();
        console.log("Animation démarrée");

    } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
        console.error("Stack trace:", error.stack);
    }
}

// Gestion du redimensionnement
window.addEventListener('resize', function() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

// Configuration de la scène Three.js
let athletes = [], bubbleModels = [], controls;
let currentView = 'country';
let currentSize = 'uniform';
let currentOrganization = 'none';
const WORLD_WIDTH = 1000;
const WORLD_HEIGHT = 500;

// Variables pour la physique
const BASE_RADIUS = 15;
const DAMPING = 0.98;
const COLLISION_DAMPING = 0.8;

// Couleurs par continent
const CONTINENT_COLORS = {
    'Europe': 0x4169E1,      // Bleu royal
    'Asie': 0xFFD700,        // Jaune
    'Afrique': 0x32CD32,     // Vert
    'Amérique': 0xFF4500,    // Rouge-orange
    'Océanie': 0x9370DB      // Violet
};

class Bubble {
    constructor(athlete) {
        this.athlete = athlete;
        this.updateGeometry(BASE_RADIUS);
        
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            0
        );
        
        // Position initiale aléatoire
        this.mesh.position.x = Math.random() * WORLD_WIDTH - WORLD_WIDTH/2;
        this.mesh.position.y = Math.random() * WORLD_HEIGHT - WORLD_HEIGHT/2;
        this.mesh.position.z = 0;

        // Données de l'athlète
        this.mesh.userData = {
            athlete: athlete,
            targetPosition: new THREE.Vector3()
        };

        this.createFace();
        this.createNameLabel();
    }

    updateGeometry(radius) {
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: this.getColorForAthlete(),
            transparent: true,
            opacity: 0.6,
            shininess: 100
        });
        
        if (this.mesh) {
            const oldPosition = this.mesh.position.clone();
            const oldRotation = this.mesh.rotation.clone();
            scene.remove(this.mesh);
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.copy(oldPosition);
            this.mesh.rotation.copy(oldRotation);
        } else {
            this.mesh = new THREE.Mesh(geometry, material);
        }
    }

    getColorForAthlete() {
        // Simplifié pour l'exemple - à adapter selon vos données
        const continentMap = {
            'France': 'Europe',
            'Allemagne': 'Europe',
            'Chine': 'Asie',
            'Japon': 'Asie',
            'Kenya': 'Afrique',
            'USA': 'Amérique',
            'Australie': 'Océanie'
            // Ajouter d'autres pays selon vos besoins
        };
        
        const continent = continentMap[this.athlete.country] || 'Europe';
        return CONTINENT_COLORS[continent];
    }

    updateSize(sizeType) {
        let radius = BASE_RADIUS;
        
        switch(sizeType) {
            case 'medals':
                // Supposons que medals est un nombre entre 0 et 10
                const medals = this.athlete.medals || 0;
                radius = BASE_RADIUS * (1 + medals * 0.2);
                break;
            case 'age':
                // Normaliser l'âge entre 15 et 45 ans
                const age = this.athlete.age || 25;
                const normalizedAge = (age - 15) / (45 - 15);
                radius = BASE_RADIUS * (0.5 + normalizedAge);
                break;
        }
        
        this.updateGeometry(radius);
        this.createFace(radius);
    }

    createFace() {
        // Yeux
        const eyeGeometry = new THREE.SphereGeometry(BASE_RADIUS * 0.15, 16, 16);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-BASE_RADIUS * 0.3, BASE_RADIUS * 0.1, BASE_RADIUS);
        this.mesh.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(BASE_RADIUS * 0.3, BASE_RADIUS * 0.1, BASE_RADIUS);
        this.mesh.add(rightEye);

        // Sourire
        const smileGeometry = new THREE.TorusGeometry(BASE_RADIUS * 0.3, BASE_RADIUS * 0.05, 16, 32, Math.PI);
        const smileMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const smile = new THREE.Mesh(smileGeometry, smileMaterial);
        smile.position.set(0, -BASE_RADIUS * 0.1, BASE_RADIUS);
        smile.rotation.x = Math.PI;
        this.mesh.add(smile);
    }

    createNameLabel() {
        const athlete = this.mesh.userData.athlete;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Configuration du canvas pour le texte
        canvas.width = 256;
        canvas.height = 64;
        context.fillStyle = 'rgba(0, 0, 0, 0)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Style du texte
        context.font = 'bold 24px Arial';
        context.fillStyle = '#2024d6';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Ajout d'un fond blanc semi-transparent
        const metrics = context.measureText(athlete.name);
        const padding = 8;
        context.fillStyle = 'rgba(255, 255, 255, 0.8)';
        context.fillRect(
            canvas.width/2 - metrics.width/2 - padding,
            canvas.height/2 - 16 - padding,
            metrics.width + padding * 2,
            32 + padding * 2
        );
        
        // Écriture du texte
        context.fillStyle = '#2024d6';
        context.fillText(athlete.name, canvas.width/2, canvas.height/2);
        
        // Création de la texture et du sprite
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0
        });
        
        this.nameSprite = new THREE.Sprite(spriteMaterial);
        this.nameSprite.scale.set(50, 12.5, 1);
        this.nameSprite.position.set(0, BASE_RADIUS * 2, 0);
        this.mesh.add(this.nameSprite);
    }

    update() {
        // Mouvement vers la position cible avec physique
        const target = this.mesh.userData.targetPosition;
        const position = this.mesh.position;
        
        // Force d'attraction vers la cible
        const direction = target.clone().sub(position);
        const distance = direction.length();
        
        if (distance > 1) {
            direction.normalize().multiplyScalar(0.5);
            this.velocity.add(direction);
        }

        // Application de la vélocité
        this.velocity.multiplyScalar(DAMPING);
        position.add(this.velocity);

        // Rotation douce
        this.mesh.rotation.y += 0.01;
    }

    showName() {
        if (this.nameSprite) {
            this.nameSprite.material.opacity = 1;
        }
    }

    hideName() {
        if (this.nameSprite) {
            this.nameSprite.material.opacity = 0;
        }
    }
}

// Création des bulles
function createBubbles() {
    console.log("Début de la création des bulles...");
    try {
        console.log(`Tentative de création de ${athletes.length} bulles...`);
        
        // Création d'une seule bulle de test d'abord
        if (athletes.length > 0) {
            console.log("Création d'une bulle de test pour:", athletes[0]);
            const testBubble = new Bubble(athletes[0]);
            if (!testBubble.mesh) {
                throw new Error("Échec de la création de la bulle de test");
            }
            scene.add(testBubble.mesh);
            bubbleModels.push(testBubble);
            console.log("Bulle de test créée avec succès");
        }
        
        // Si la bulle de test fonctionne, créer le reste
        for (let i = 1; i < athletes.length; i++) {
            const bubble = new Bubble(athletes[i]);
            scene.add(bubble.mesh);
            bubbleModels.push(bubble);
        }
        
        console.log(`${bubbleModels.length} bulles créées avec succès`);
        
        // Vérification des positions initiales de quelques bulles
        for (let i = 0; i < Math.min(3, bubbleModels.length); i++) {
            console.log(`Position de la bulle ${i}:`, {
                x: bubbleModels[i].mesh.position.x,
                y: bubbleModels[i].mesh.position.y,
                z: bubbleModels[i].mesh.position.z
            });
        }
    } catch (error) {
        console.error("Erreur lors de la création des bulles:", error);
        console.error("Stack trace:", error.stack);
    }
}

// Gestion des collisions
function handleCollisions() {
    for (let i = 0; i < bubbleModels.length; i++) {
        for (let j = i + 1; j < bubbleModels.length; j++) {
            const b1 = bubbleModels[i];
            const b2 = bubbleModels[j];
            
            const diff = b1.mesh.position.clone().sub(b2.mesh.position);
            const dist = diff.length();
            
            if (dist < BASE_RADIUS * 2) {
                const normal = diff.normalize();
                const relativeVel = b1.velocity.clone().sub(b2.velocity);
                const impulse = normal.multiplyScalar(relativeVel.dot(normal) * COLLISION_DAMPING);
                
                b1.velocity.sub(impulse);
                b2.velocity.add(impulse);
                
                // Séparation pour éviter le chevauchement
                const correction = normal.multiplyScalar((BASE_RADIUS * 2 - dist) * 0.5);
                b1.mesh.position.add(correction);
                b2.mesh.position.sub(correction);
            }
        }
    }
}

// Chargement des athlètes
async function loadAthletes() {
    console.log("Début du chargement des athlètes...");
    try {
        const response = await fetch('/api/athletes', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Structure des données reçues:", {
            estTableau: Array.isArray(data),
            taille: data.length,
            premierElement: data.length > 0 ? {
                name: data[0].name,
                country: data[0].country,
                sport: data[0].sport
            } : null
        });
        
        if (!Array.isArray(data)) {
            throw new Error("Les données reçues ne sont pas un tableau");
        }
        
        athletes = data;
        console.log(`${athletes.length} athlètes chargés`);
        
        if (athletes.length === 0) {
            console.warn("Aucun athlète n'a été chargé");
            return;
        }
        
        // Vérification des données avant création des bulles
        if (!athletes[0].name || !athletes[0].country) {
            console.error("Format de données incorrect. Structure attendue:", {
                name: "Nom de l'athlète",
                country: "Pays de l'athlète",
                sport: "Sport de l'athlète"
            });
            console.error("Structure reçue:", athletes[0]);
            throw new Error("Format de données incorrect");
        }
        
        createBubbles();
        
        // Organisation initiale
        organizeByFilter(currentView);
        console.log("Organisation initiale effectuée");
    } catch (error) {
        console.error('Erreur lors du chargement des athlètes:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Organisation par pays
function organizeByCountry() {
    const countries = {};
    let countryCount = 0;
    
    athletes.forEach(athlete => {
        if (!countries[athlete.country]) {
            countries[athlete.country] = {
                index: countryCount++,
                count: 0
            };
        }
        countries[athlete.country].count++;
    });

    bubbleModels.forEach(bubble => {
        const country = countries[bubble.mesh.userData.athlete.country];
        const angle = (country.index / Object.keys(countries).length) * Math.PI * 2;
        const radius = 200;
        
        const targetX = Math.cos(angle) * radius;
        const targetY = Math.sin(angle) * radius;
        
        bubble.mesh.userData.targetPosition.set(targetX, targetY, 0);
    });
}

// Organisation par sport
function organizeBySport() {
    const sports = {};
    let sportCount = 0;
    
    athletes.forEach(athlete => {
        if (!sports[athlete.sport]) {
            sports[athlete.sport] = {
                index: sportCount++,
                count: 0
            };
        }
        sports[athlete.sport].count++;
    });

    const columns = Math.ceil(Math.sqrt(Object.keys(sports).length));
    const spacing = WORLD_WIDTH / columns;
    
    bubbleModels.forEach(bubble => {
        const sport = sports[bubble.mesh.userData.athlete.sport];
        const row = Math.floor(sport.index / columns);
        const col = sport.index % columns;
        
        const targetX = (col - columns/2) * spacing;
        const targetY = (row - Math.floor(Object.keys(sports).length/columns)/2) * spacing;
        
        bubble.mesh.userData.targetPosition.set(targetX, targetY, 0);
    });
}

function organizeByFilter(filter) {
    currentView = filter;
    if (filter === 'country') {
        organizeByCountry();
    } else {
        organizeBySport();
    }
}

function setupEventListeners() {
    const buttons = document.querySelectorAll('.filter-button');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;
            const size = button.dataset.size;

            // Gestion des filtres d'organisation
            if (filter) {
                currentView = filter;
                organizeByFilter(filter);
                
                // Mise à jour des classes active
                document.querySelectorAll('[data-filter]').forEach(btn => 
                    btn.classList.remove('active'));
                button.classList.add('active');
            }

            // Gestion des tailles
            if (size) {
                currentSize = size;
                updateBubbleSizes(size);
                
                // Mise à jour des classes active
                document.querySelectorAll('[data-size]').forEach(btn => 
                    btn.classList.remove('active'));
                button.classList.add('active');
            }
        });
    });
}

function updateBubbleSizes(sizeType) {
    bubbleModels.forEach(bubble => {
        bubble.updateSize(sizeType);
    });
}

// Démarrage
console.log("Appel de init()");
init(); 