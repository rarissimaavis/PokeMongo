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

// Display Pokémon as cards
async function displayPokemon(pokemonList) {
    const container = document.getElementById('pokemonList');
    container.innerHTML = '';

    if (!pokemonList || pokemonList.length === 0) {
        container.innerHTML = '<div class="error-message">No Pokémon found</div>';
        return;
    }

    for (const pokemon of pokemonList) {
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
                <div class="pokemon-actions">
                    <button class="update-btn" onclick="openUpdateModal('${pokemon._id}')">Update</button>
                    <button class="delete-btn" onclick="confirmDelete('${pokemon._id}')">Delete</button>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    }
}

// Modal functions
function openCreateModal() {
    document.getElementById('createModal').style.display = 'block';
}

function closeCreateModal() {
    document.getElementById('createModal').style.display = 'none';
}

async function openUpdateModal(pokemonId) {
    try {
        const pokemon = await callApi(`/pokemon/${pokemonId}`);
        
        document.getElementById('updatePokemonId').value = pokemon._id;
        document.getElementById('updatePokemonName').value = pokemon.pokename;
        document.getElementById('updatePokemonType1').value = pokemon.type1;
        document.getElementById('updatePokemonType2').value = pokemon.type2 || '';
        document.getElementById('updatePokemonPokelevel').value = pokemon.pokelevel;
        document.getElementById('updatePokemonAttack').value = pokemon.attack;
        document.getElementById('updatePokemonDefense').value = pokemon.defense;
        document.getElementById('updatePokemonHP').value = pokemon.hp;
        document.getElementById('updatePokemonMaxHP').value = pokemon.maxhp;
        document.getElementById('updatePokemonSpatk').value = pokemon.spatk;
        document.getElementById('updatePokemonSpdef').value = pokemon.spdef;
        document.getElementById('updatePokemonSpeed').value = pokemon.speed;
        document.getElementById('updatePokemonPlace').value = pokemon.place;
        document.getElementById('updatePokemonTrainerID').value = pokemon.trainerID || '';
        
        document.getElementById('updateModal').style.display = 'block';
    } catch (error) {
        alert(`Failed to load Pokémon: ${error.message}`);
    }
}

function closeUpdateModal() {
    document.getElementById('updateModal').style.display = 'none';
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
            trainerID: parseInt(document.getElementById('pokemonTrainerID').value) || null
        };

        await callApi('/pokemon', 'POST', pokemon);
        document.getElementById('addPokemonForm').reset();
        closeCreateModal();
        await getAllPokemon();
    } catch (error) {
        alert(`Failed to add Pokémon: ${error.message}`);
    }
}

async function updatePokemon() {
    try {
        const pokemonId = document.getElementById('updatePokemonId').value;
        const pokemon = {
            pokename: document.getElementById('updatePokemonName').value,
            type1: document.getElementById('updatePokemonType1').value,
            type2: document.getElementById('updatePokemonType2').value || null,
            pokelevel: parseInt(document.getElementById('updatePokemonPokelevel').value),
            attack: parseInt(document.getElementById('updatePokemonAttack').value),
            defense: parseInt(document.getElementById('updatePokemonDefense').value),
            hp: parseInt(document.getElementById('updatePokemonHP').value),
            maxhp: parseInt(document.getElementById('updatePokemonMaxHP').value),
            spatk: parseInt(document.getElementById('updatePokemonSpatk').value),
            spdef: parseInt(document.getElementById('updatePokemonSpdef').value),
            speed: parseInt(document.getElementById('updatePokemonSpeed').value),
            place: parseInt(document.getElementById('updatePokemonPlace').value),
            trainerID: parseInt(document.getElementById('updatePokemonTrainerID').value) || null
        };

        await callApi(`/pokemon/${pokemonId}`, 'PUT', pokemon);
        closeUpdateModal();
        await getAllPokemon();
    } catch (error) {
        alert(`Failed to update Pokémon: ${error.message}`);
    }
}

async function confirmDelete(pokemonId) {
    if (confirm('Are you sure you want to delete this Pokémon?')) {
        try {
            await callApi(`/pokemon/${pokemonId}`, 'DELETE');
            await getAllPokemon();
        } catch (error) {
            alert(`Failed to delete Pokémon: ${error.message}`);
        }
    }
}

async function getAllPokemon() {
    try {
        const pokemonList = await callApi('/pokemon');
        await displayPokemon(pokemonList);
    } catch (error) {
        document.getElementById('pokemonList').innerHTML = `
            <div class="error-message">Error fetching Pokémon: ${error.message}</div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', getAllPokemon);