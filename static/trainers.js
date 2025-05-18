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
        if (event.target == createModal) closeCreateTrainerModal();
        if (event.target == updateModal) closeUpdateTrainerModal();
    }
});