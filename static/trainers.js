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

// Trainers CRUD functions
async function createTrainer() {
    const trainer = {
        trainerID: document.getElementById('trainerID').value,
        name: document.getElementById('trainerName').value
    };
    const { success, data } = await callApi('/api/trainers', 'POST', trainer);
    displayResult('trainersList', success ? data : 'Error creating trainer');
}

async function getAllTrainers() {
    const { success, data } = await callApi('/api/trainers');
    displayResult('trainersList', success ? data : 'Error fetching trainers');
}

async function updateTrainer() {
    const trainerId = document.getElementById('updateTrainerId').value;
    const newName = document.getElementById('newTrainerName').value;
    const { success, data } = await callApi(`/api/trainers/${trainerId}`, 'PUT', { name: newName });
    displayResult('trainersList', success ? data : 'Error updating trainer');
}

async function deleteTrainer() {
    const trainerId = document.getElementById('deleteTrainerId').value;
    const { success, data } = await callApi(`/api/trainers/${trainerId}`, 'DELETE');
    displayResult('trainersList', success ? data : 'Error deleting trainer');
}

// Load all trainers when page loads
document.addEventListener('DOMContentLoaded', getAllTrainers);


