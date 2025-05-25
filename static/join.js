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

// Get Strong Pokémon (above certain level)
async function getStrongPokemon() {
    const minLevel = document.getElementById('minLevel').value;
    const { success, data } = await callApi(`/api/trainers/with-pokemon-above/${minLevel}`);
    displayResult('strongPokemonResult', success ? data : 'Error fetching strong Pokémon');
}