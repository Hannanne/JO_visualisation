// Configuration
const config = {
    width: document.getElementById('world-map').clientWidth,
    height: 500,
    miiSize: 100
};

// Variables globales
let athletes = [];
let worldMap;
let currentView = 'country';

// Chargement initial des données
async function init() {
    try {
        const [athletesData, worldData] = await Promise.all([
            fetch('/athletes').then(res => res.json()),
            fetch('https://unpkg.com/world-atlas/countries-50m.json').then(res => res.json())
        ]);
        
        athletes = athletesData;
        worldMap = worldData;
        
        setupMap();
        createMiis();
        setupEventListeners();
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
    }
}

// Configuration de la carte
function setupMap() {
    const svg = d3.select('#world-map')
        .append('svg')
        .attr('width', config.width)
        .attr('height', config.height);
    
    const projection = d3.geoMercator()
        .fitSize([config.width, config.height], topojson.feature(worldMap, worldMap.objects.countries));
    
    const path = d3.geoPath().projection(projection);
    
    svg.append('g')
        .selectAll('path')
        .data(topojson.feature(worldMap, worldMap.objects.countries).features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('class', 'country')
        .attr('fill', '#e5e5e5')
        .attr('stroke', '#fff');
}

// Création des Miis
function createMiis() {
    const container = document.getElementById('athletes-container');
    container.innerHTML = '';
    
    athletes.forEach(athlete => {
        const mii = document.createElement('div');
        mii.className = 'athlete-mii';
        mii.dataset.country = athlete.country;
        mii.dataset.sport = athlete.sport;
        
        // Utilisation d'une image Mii générique (à remplacer par des vrais avatars)
        mii.innerHTML = `
            <img src="/static/images/mii-placeholder.png" alt="${athlete.name}">
            <div class="athlete-info">
                <p>${athlete.name}</p>
                <p>${athlete.country}</p>
            </div>
        `;
        
        container.appendChild(mii);
    });
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    const filterSelect = document.getElementById('filter-type');
    
    filterSelect.addEventListener('change', (e) => {
        currentView = e.target.value;
        organizeMiis(currentView);
    });
}

// Organisation des Miis selon le filtre
function organizeMiis(filterType) {
    const miis = document.querySelectorAll('.athlete-mii');
    
    if (filterType === 'country') {
        // Organiser par pays sur la carte
        miis.forEach(mii => {
            const country = mii.dataset.country;
            // Calculer la position sur la carte en fonction du pays
            // À implémenter avec les coordonnées de la carte
        });
    } else {
        // Organiser par sport en groupes
        const sports = [...new Set(athletes.map(a => a.sport))];
        // Organiser en groupes par sport
        // À implémenter
    }
}

// Lancement de l'application
document.addEventListener('DOMContentLoaded', init); 