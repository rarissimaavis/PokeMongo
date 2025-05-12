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
    const pokemon = {
        pokemonID: document.getElementById('pokemonID').value,
        name: document.getElementById('pokemonName').value,
        type: document.getElementById('pokemonType').value,
        level: parseInt(document.getElementById('pokemonLevel').value),
        trainerID: document.getElementById('pokemonTrainerID').value
    };
    const { success, data } = await callApi('/api/pokemon', 'POST', pokemon);
    displayResult('pokemonList', success ? data : 'Error adding Pokémon');
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