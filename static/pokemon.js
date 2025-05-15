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

// Display result in any pre element
function displayResult(elementId, result) {
    const element = document.getElementById(elementId);
    element.innerHTML = JSON.stringify(result, null, 2);
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
            displayResult('pokemonList', data);
            document.getElementById('addPokemonForm').reset();
            getAllPokemon();
        } else {
            displayResult('pokemonList', { error: 'Failed to add Pokémon', details: data });
        }
    } catch (error) {
        displayResult('pokemonList', { error: 'Error adding Pokémon', details: error.message });
    }
}

async function getAllPokemon() {
    const { success, data } = await callApi('/api/pokemon');
    displayResult('pokemonList', success ? data : 'Error fetching Pokémon');
}

async function updatePokemon() {
    const pokemonId = document.getElementById('updatePokemonId').value;
    const newLevel = document.getElementById('newPokemonLevel').value;
    const { success, data } = await callApi(`/api/pokemon/${pokemonId}`, 'PUT', { level: newLevel });
    displayResult('pokemonList', success ? data : 'Error updating Pokémon');
}

async function deletePokemon() {
    const pokemonId = document.getElementById('deletePokemonId').value;
    const { success, data } = await callApi(`/api/pokemon/${pokemonId}`, 'DELETE');
    displayResult('pokemonList', success ? data : 'Error deleting Pokémon');
}

// Load all Pokémon when page loads
document.addEventListener('DOMContentLoaded', getAllPokemon); 