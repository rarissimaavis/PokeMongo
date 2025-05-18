const API_BASE = 'http://localhost:5000';

// Helper function
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

// Display trainers
function displayTrainersAsCards(trainers) {
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
        `;

        list.appendChild(card);
    });
}

// Load trainers
async function getAllTrainers() {
    const { success, data } = await callApi('/api/trainers');
    if (success) displayTrainersAsCards(data);
    else alert('Error fetching trainers');
}

// Create
async function createTrainer() {
    const trainer = {
        trainerID: document.getElementById('trainerID').value,
        trainername: document.getElementById('trainerName').value
    };
    const { success } = await callApi('/api/trainers', 'POST', trainer);
    if (success) getAllTrainers();
    else alert('Error creating trainer');
}

// Update
async function updateTrainer() {
    const trainerId = document.getElementById('updateTrainerId').value;
    const newName = document.getElementById('newTrainerName').value;
    const { success } = await callApi(`/api/trainers/${trainerId}`, 'PUT', { trainername: newName });
    if (success) getAllTrainers();
    else alert('Error updating trainer');
}

// Delete
async function deleteTrainer() {
    const trainerId = document.getElementById('deleteTrainerId').value;
    const { success } = await callApi(`/api/trainers/${trainerId}`, 'DELETE');
    if (success) getAllTrainers();
    else alert('Error deleting trainer');
}

document.addEventListener('DOMContentLoaded', getAllTrainers);
