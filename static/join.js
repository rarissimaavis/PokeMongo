const API_BASE = 'http://localhost:5000/api';

// Helper function for API calls
async function callApi(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (data) options.body = JSON.stringify(data);
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Request failed');
        }
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Display trainers as cards
async function displayTrainersAsCards(trainers) {
    const list = document.getElementById('trainersList');
    list.innerHTML = '';

    if (!Array.isArray(trainers) || trainers.length === 0) {
        list.innerHTML = '<div class="empty-message">No trainers found with Pokémon above the specified level.</div>';
        return;
    }

    trainers.forEach(trainer => {
        const card = document.createElement('div');
        card.className = 'trainer-card';

        card.innerHTML = `
            <div class="trainer-id">ID: ${trainer.trainer.trainerID}</div>
            <div class="trainer-name">${trainer.trainer.name}</div>
            <div class="trainer-actions-left">
                <button class="view-btn" onclick="openViewPokemonModal(${trainer.trainer.trainerID}, '${trainer.trainer.name}', ${document.getElementById('minLevel').value})">View Pokémon</button>
            </div>
        `;

        list.appendChild(card);
    });
}

// Get Strong Pokémon Trainers
async function getStrongPokemon() {
    try {
        const minLevel = document.getElementById('minLevel').value;
        if (!minLevel || isNaN(minLevel)) {
            alert('Please enter a valid minimum level');
            return;
        }
        
        const { results } = await callApi(`/trainers/with-pokemon-above/${minLevel}`);
        await displayTrainersAsCards(results);
    } catch (error) {
        alert(`Error fetching strong Pokémon trainers: ${error.message}`);
    }
}

// Modal functions for viewing Pokémon
function openViewPokemonModal(trainerId, trainerName, minLevel) {
    document.getElementById('pokemonModalTrainerName').textContent = trainerName;
    document.getElementById('viewPokemonModal').style.display = 'block';
    fetchTrainerPokemon(trainerId, minLevel);
}

function closeViewPokemonModal() {
    document.getElementById('viewPokemonModal').style.display = 'none';
}

async function fetchTrainerPokemon(trainerId, minLevel) {
    try {
        const trainerResponse = await callApi(`/trainers/${trainerId}/pokemon`);
        const allPokemon = trainerResponse.pokemon;
        
        const strongPokemon = allPokemon.filter(poke => poke.pokelevel > minLevel);
        
        displayPokemonList(strongPokemon);
    } catch (error) {
        console.error('Error fetching Pokémon:', error);
        document.getElementById('pokemonList').innerHTML = '<div class="empty-message">Error loading Pokémon</div>';
    }
}

function displayPokemonList(pokemon) {
    const container = document.getElementById('pokemonList');
    container.innerHTML = '';

    if (!Array.isArray(pokemon) || pokemon.length === 0) {
        container.innerHTML = '<div class="empty-message">No Pokémon above the specified level</div>';
        return;
    }

    pokemon.forEach(poke => {
        const card = document.createElement('div');
        card.className = 'pokemon-card';
        
        const typeBadges = [];
        if (poke.type1) typeBadges.push(`<span class="type-badge type-${poke.type1.toLowerCase()}">${poke.type1}</span>`);
        if (poke.type2) typeBadges.push(`<span class="type-badge type-${poke.type2.toLowerCase()}">${poke.type2}</span>`);
        
        card.innerHTML = `
            <div class="pokemon-header">
                <h3>${poke.pokename || 'Unknown'}</h3>
                <span class="pokemon-level">Lv. ${poke.pokelevel || '?'}</span>
            </div>
            <div class="pokemon-types">
                ${typeBadges.join('')}
            </div>
            <div class="pokemon-stats">
                <div class="stat-row">
                    <span class="stat-name">HP:</span>
                    <span class="stat-value">${poke.hp || '?'}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-name">Attack:</span>
                    <span class="stat-value">${poke.attack || '?'}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-name">Defense:</span>
                    <span class="stat-value">${poke.defense || '?'}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-name">Speed:</span>
                    <span class="stat-value">${poke.speed || '?'}</span>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const viewModal = document.getElementById('viewPokemonModal');
    if (event.target == viewModal) closeViewPokemonModal();
}

// No default data loading
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('trainersList').innerHTML = '';
});