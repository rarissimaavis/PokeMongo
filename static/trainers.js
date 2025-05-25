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
        list.innerHTML = '<div class="empty-message">No trainers available.</div>';
        return;
    }

    trainers.forEach(trainer => {
        const card = document.createElement('div');
        card.className = 'trainer-card';

        card.innerHTML = `
            <div class="trainer-id">ID: ${trainer.trainerID}</div>
            <div class="trainer-name">${trainer.trainername}</div>
            <div class="trainer-actions-left">
                <button class="view-btn" onclick="openViewPokemonModal('${trainer.trainerID}', '${trainer.trainername}')">View Pokémon</button>
            </div>
            <div class="trainer-actions">
                <button class="update-btn" onclick="openUpdateTrainerModal('${trainer._id}')">Update</button>
                <button class="delete-btn" onclick="confirmDeleteTrainer('${trainer._id}')">Delete</button>
            </div>
        `;

        list.appendChild(card);
    });
}

// Modal functions for trainers
function openCreateTrainerModal() {
    document.getElementById('createTrainerModal').style.display = 'block';
}

function closeCreateTrainerModal() {
    document.getElementById('createTrainerModal').style.display = 'none';
}

async function openUpdateTrainerModal(trainerId) {
    try {
        const trainer = await callApi(`/trainers/${trainerId}`);
        
        document.getElementById('updateTrainerId').value = trainer._id;
        document.getElementById('updateTrainerID').value = trainer.trainerID;
        document.getElementById('updateTrainerName').value = trainer.trainername;
        
        document.getElementById('updateTrainerModal').style.display = 'block';
    } catch (error) {
        alert(`Failed to load trainer: ${error.message}`);
    }
}

function closeUpdateTrainerModal() {
    document.getElementById('updateTrainerModal').style.display = 'none';
}

// Trainers CRUD functions
async function getAllTrainers() {
    try {
        const trainers = await callApi('/trainers');
        await displayTrainersAsCards(trainers);
    } catch (error) {
        alert(`Error fetching trainers: ${error.message}`);
    }
}

async function createTrainer() {
    try {
        const trainer = {
            trainerID: document.getElementById('trainerID').value,
            trainername: document.getElementById('trainerName').value
        };
        
        await callApi('/trainers', 'POST', trainer);
        document.getElementById('createTrainerForm').reset();
        closeCreateTrainerModal();
        await getAllTrainers();
    } catch (error) {
        alert(`Error creating trainer: ${error.message}`);
    }
}

async function updateTrainer() {
    try {
        const trainerId = document.getElementById('updateTrainerId').value;
        const trainer = {
            trainerID: document.getElementById('updateTrainerID').value,
            trainername: document.getElementById('updateTrainerName').value
        };
        
        await callApi(`/trainers/${trainerId}`, 'PUT', trainer);
        closeUpdateTrainerModal();
        await getAllTrainers();
    } catch (error) {
        alert(`Error updating trainer: ${error.message}`);
    }
}

async function confirmDeleteTrainer(trainerId) {
    if (confirm('Are you sure you want to delete this trainer and all their Pokémon?')) {
        try {
            await callApi(`/trainers/${trainerId}`, 'DELETE');
            await getAllTrainers();
        } catch (error) {
            alert(`Error deleting trainer: ${error.message}`);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    getAllTrainers();
    
    window.onclick = function(event) {
        const createModal = document.getElementById('createTrainerModal');
        const updateModal = document.getElementById('updateTrainerModal');
        const viewModal = document.getElementById('viewPokemonModal');
        if (event.target == createModal) closeCreateTrainerModal();
        if (event.target == updateModal) closeUpdateTrainerModal();
        if (event.target == viewModal) closeViewPokemonModal();
    }
});

function openViewPokemonModal(trainerId, trainerName) {
    document.getElementById('pokemonModalTrainerName').textContent = trainerName;
    document.getElementById('viewPokemonModal').style.display = 'block';
    fetchTrainerPokemon(trainerId);
}

function closeViewPokemonModal() {
    document.getElementById('viewPokemonModal').style.display = 'none';
}

async function fetchTrainerPokemon(trainerId) {
    try {
        const response = await callApi(`/trainers/${trainerId}/pokemon`);
        displayPokemonList(response.pokemon);
    } catch (error) {
        console.error('Error fetching Pokémon:', error);
        document.getElementById('pokemonList').innerHTML = '<div class="empty-message">Error loading Pokémon</div>';
    }
}

function displayPokemonList(pokemon) {
    const container = document.getElementById('pokemonList');
    container.innerHTML = '';

    if (!Array.isArray(pokemon) || pokemon.length === 0) {
        container.innerHTML = '<div class="empty-message">This trainer has no Pokémon</div>';
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