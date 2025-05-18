const API_BASE = 'http://localhost:5000';

// Helper function for API calls
async function callApi(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (data) options.body = JSON.stringify(data);
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const result = await response.json();
        return { success: response.ok, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Display Pokémon as cards
function displayPokemon(pokemonList) {
    const container = document.getElementById('pokemonList');
    
    if (!pokemonList || pokemonList.length === 0) {
        container.innerHTML = '<div class="error-message">No Pokémon found</div>';
        return;
    }

    container.innerHTML = '';
    
    pokemonList.forEach(pokemon => {
        const card = document.createElement('div');
        card.className = 'pokemon-card';
        
        const type1Class = `type-badge type-${pokemon.type1.toLowerCase()}`;
        const type2Class = pokemon.type2 ? `type-badge type-${pokemon.type2.toLowerCase()}` : '';
        
        card.innerHTML = `
            <div class="pokemon-header">
                <h3>${pokemon.pokename}</h3>
                <div class="pokemon-level">Lv. ${pokemon.pokelevel}</div>
            </div>
            <div class="pokemon-id">#${pokemon.place}</div>
            <div class="pokemon-types">
                <span class="${type1Class}">${pokemon.type1}</span>
                ${pokemon.type2 ? `<span class="${type2Class}">${pokemon.type2}</span>` : ''}
            </div>
            <div class="pokemon-hp-bar">
                <div class="hp-text">HP: ${pokemon.hp}/${pokemon.maxhp}</div>
                <div class="hp-bar-outer">
                    <div class="hp-bar-inner" style="width: ${(pokemon.hp / pokemon.maxhp) * 100}%"></div>
                </div>
            </div>
            <div class="pokemon-stats">
                <div class="stat-row">
                    <span class="stat-name">ATK</span>
                    <span class="stat-value">${pokemon.attack}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-name">DEF</span>
                    <span class="stat-value">${pokemon.defense}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-name">SP.ATK</span>
                    <span class="stat-value">${pokemon.spatk}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-name">SP.DEF</span>
                    <span class="stat-value">${pokemon.spdef}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-name">SPD</span>
                    <span class="stat-value">${pokemon.speed}</span>
                </div>
            </div>
            <div class="pokemon-footer">
                <span class="trainer-info">Trainer ID: ${pokemon.trainerID || 'Wild'}</span>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Pokémon CRUD functions
async function addPokemon() {
    try {
        const pokemon = {
            pokename: document.getElementById('pokemonName').value,
            type1: document.getElementById('pokemonType1').value,
            type2: document.getElementById('pokemonType2').value || null,
            pokelevel: parseInt(document.getElementById('pokemonPokelevel').value),
            attack: parseInt(document.getElementById('pokemonAttack').value),
            defense: parseInt(document.getElementById('pokemonDefense').value),
            hp: parseInt(document.getElementById('pokemonHP').value),
            maxhp: parseInt(document.getElementById('pokemonMaxHP').value),
            spatk: parseInt(document.getElementById('pokemonSpatk').value),
            spdef: parseInt(document.getElementById('pokemonSpdef').value),
            speed: parseInt(document.getElementById('pokemonSpeed').value),
            place: parseInt(document.getElementById('pokemonPlace').value),
            trainerID: parseInt(document.getElementById('pokemonTrainerID').value)
        };

        const { success, data } = await callApi('/api/pokemon', 'POST', pokemon);
        
        if (success) {
            document.getElementById('addPokemonForm').reset();
            await getAllPokemon();
        } else {
            document.getElementById('pokemonList').innerHTML = `
                <div class="error-message">Error adding Pokémon: ${data.message || 'Unknown error'}</div>
            `;
        }
    } catch (error) {
        document.getElementById('pokemonList').innerHTML = `
            <div class="error-message">Error adding Pokémon: ${error.message}</div>
        `;
    }
}

async function getAllPokemon() {
    const { success, data } = await callApi('/api/pokemon');
    if (success) {
        displayPokemon(data);
    } else {
        document.getElementById('pokemonList').innerHTML = `
            <div class="error-message">Error fetching Pokémon: ${data.message || 'Unknown error'}</div>
        `;
    }
}

async function updatePokemon() {
    const pokemonId = document.getElementById('updatePokemonId').value;
    const newLevel = document.getElementById('newPokemonLevel').value;
    const { success, data } = await callApi(`/api/pokemon/${pokemonId}`, 'PUT', { level: newLevel });
    if (success) {
        await getAllPokemon();
    } else {
        document.getElementById('pokemonList').innerHTML = `
            <div class="error-message">Error updating Pokémon: ${data.message || 'Unknown error'}</div>
        `;
    }
}

async function deletePokemon() {
    const pokemonId = document.getElementById('deletePokemonId').value;
    const { success, data } = await callApi(`/api/pokemon/${pokemonId}`, 'DELETE');
    if (success) {
        await getAllPokemon();
    } else {
        document.getElementById('pokemonList').innerHTML = `
            <div class="error-message">Error deleting Pokémon: ${data.message || 'Unknown error'}</div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', getAllPokemon);