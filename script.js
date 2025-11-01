// --- CONSTANTS AND STATE ---
const LOCAL_STORAGE_KEY = 'interviewScorecards';
const SECTIONS_STORAGE_KEY = 'scorecardSections';
const DEFAULT_SECTIONS = [
    { name: 'Personal', icon: 'fas fa-user' },
    { name: 'Professional', icon: 'fas fa-briefcase' },
    { name: 'Family Background', icon: 'fas fa-home' },
    { name: 'Skill', icon: 'fas fa-cogs' },
    { name: 'System Knowledge', icon: 'fas fa-server' },
    { name: 'Languages', icon: 'fas fa-language' },
    { name: 'Hobbies', icon: 'fas fa-heart' },
    { name: 'Extra', icon: 'fas fa-plus-circle' }
];

let SECTIONS = [...DEFAULT_SECTIONS];

let allInterviews = [];
let currentCandidateName = '';
let filteredInterviews = [];
let sortOrder = { column: '', direction: 'asc' };
let editingIndex = -1;

// --- DOM ELEMENTS ---
const views = {
    dashboard: document.getElementById('dashboard-view'),
    form: document.getElementById('form-view')
};
const nameModal = document.getElementById('name-modal');
const nameInput = document.getElementById('candidate-name-input');
const candidateNameDisplay = document.getElementById('candidate-name-display');
const scorecardSectionsContainer = document.getElementById('scorecard-sections');
const interviewForm = document.getElementById('interview-form');
const interviewListBody = document.getElementById('interview-list');
const emptyState = document.getElementById('empty-state');
const exportButton = document.getElementById('export-button');
const messageBox = document.getElementById('message-box');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const dateFilter = document.getElementById('date-filter');
const customizeModal = document.getElementById('customize-modal');
const sectionsList = document.getElementById('sections-list');
const newSectionName = document.getElementById('new-section-name');
const newSectionIcon = document.getElementById('new-section-icon');

// --- UTILITY FUNCTIONS ---

/**
 * Shows a temporary, non-blocking message notification.
 * @param {string} message 
 * @param {string} type 
 */
function showMessage(message, type = 'success') {
    messageBox.textContent = message;
    messageBox.classList.remove('hidden', 'bg-green-500', 'bg-red-500');
    messageBox.classList.add(type === 'error' ? 'bg-red-500' : 'bg-green-500', 'opacity-100');

    setTimeout(() => {
        messageBox.classList.add('opacity-0');
        setTimeout(() => {
            messageBox.classList.add('hidden');
            messageBox.classList.remove('opacity-0');
        }, 300); // Wait for fade out
    }, 3000);
}

/**
 * Switches the active view between the dashboard and the form.
 * @param {string} viewName 
 */
function showView(viewName) {
    views.dashboard.classList.add('hidden');
    views.form.classList.add('hidden');
    if (views[viewName]) {
        views[viewName].classList.remove('hidden');
    }
}

/**
 * Renders the dynamic HTML for all scorecard sections.
 */
function renderScorecardForm() {
    const sectionsHtml = SECTIONS.map(section => `
        <div class="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 class="text-xl font-bold text-gray-700 mb-4">
                <i class="${section.icon} section-icon"></i>
                ${section.name}
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="md:col-span-1">
                    <label for="${section.name}-score" class="block text-sm font-medium text-gray-700">Score (1-5)</label>
                    <input type="number" id="${section.name}-score" name="${section.name}Score" min="1" max="5" required
                        class="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 score-input" placeholder="e.g., 4"
                    >
                </div>
                <div class="md:col-span-2">
                    <label for="${section.name}-comment" class="block text-sm font-medium text-gray-700">Remarks/Comments</label>
                    <textarea id="${section.name}-comment" name="${section.name}Comment" rows="2"
                        class="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Strengths, weaknesses, and key observations for this area."
                    ></textarea>
                </div>
            </div>
        </div>
    `).join('');
    
    const finalDecisionHtml = `
        <div class="bg-indigo-50 p-6 rounded-xl shadow-sm border border-indigo-200">
            <h3 class="text-xl font-bold text-indigo-700 mb-4">
                <i class="fas fa-gavel section-icon"></i>
                Final Decision
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="md:col-span-1">
                    <label for="final-decision" class="block text-sm font-medium text-gray-700">Decision</label>
                    <select id="final-decision" name="finalDecision" required
                        class="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="">Select Decision</option>
                        <option value="Selected">Selected</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Pending">Pending</option>
                    </select>
                </div>
                <div class="md:col-span-2">
                    <label for="final-comment" class="block text-sm font-medium text-gray-700">Final Comments</label>
                    <textarea id="final-comment" name="finalComment" rows="2"
                        class="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Overall assessment and decision rationale."
                    ></textarea>
                </div>
            </div>
        </div>
    `;
    
    scorecardSectionsContainer.innerHTML = sectionsHtml + finalDecisionHtml;
}

// --- DATA MANAGEMENT ---

/**
 * Loads interview data from localStorage.
 */
function loadData() {
    try {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        allInterviews = data ? JSON.parse(data) : [];
        
        const sectionsData = localStorage.getItem(SECTIONS_STORAGE_KEY);
        SECTIONS = sectionsData ? JSON.parse(sectionsData) : [...DEFAULT_SECTIONS];
    } catch (e) {
        console.error("Error loading data from localStorage:", e);
        allInterviews = [];
        SECTIONS = [...DEFAULT_SECTIONS];
        showMessage("Could not load previous data. Starting fresh.", 'error');
    }
}

/**
 * Saves sections to localStorage.
 */
function saveSectionsData() {
    try {
        localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(SECTIONS));
    } catch (e) {
        console.error("Error saving sections to localStorage:", e);
        showMessage("Sections failed to save.", 'error');
    }
}

/**
 * Saves the current allInterviews array to localStorage.
 */
function saveData() {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allInterviews));
    } catch (e) {
        console.error("Error saving data to localStorage:", e);
        showMessage("Data failed to save locally.", 'error');
    }
}

// --- DASHBOARD FUNCTIONS ---

/**
 * Calculates the average score for an interview record.
 * @param {object} interview 
 * @returns {string} Average score formatted.
 */
function calculateAverageScore(interview) {
    const scores = SECTIONS.map(s => interview.sections[s.name].score).filter(s => s !== null && s !== undefined);
    if (scores.length === 0) return 'N/A';
    
    const total = scores.reduce((sum, score) => sum + score, 0);
    const average = total / scores.length;
    
    return `${average.toFixed(2)} / 5`;
}

/**
 * Filters interviews based on search and filter criteria
 */
function filterInterviews() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;
    const dateRange = dateFilter.value;
    
    filteredInterviews = allInterviews.filter(interview => {
        const nameMatch = interview.name.toLowerCase().includes(searchTerm);
        
        let statusMatch = true;
        if (statusValue) {
            const interviewStatus = interview.finalDecision || 'Pending';
            statusMatch = interviewStatus === statusValue;
        }
        
        let dateMatch = true;
        if (dateRange) {
            const interviewDate = new Date(interview.date);
            const now = new Date();
            
            switch (dateRange) {
                case 'today':
                    dateMatch = interviewDate.toDateString() === now.toDateString();
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    dateMatch = interviewDate >= weekAgo;
                    break;
                case 'month':
                    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    dateMatch = interviewDate >= monthAgo;
                    break;
            }
        }
        
        return nameMatch && statusMatch && dateMatch;
    });
    
    renderDashboard();
}

/**
 * Sorts the table by column
 */
function sortTable(column) {
    if (sortOrder.column === column) {
        sortOrder.direction = sortOrder.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortOrder.column = column;
        sortOrder.direction = 'asc';
    }
    
    filteredInterviews.sort((a, b) => {
        let aVal, bVal;
        
        switch (column) {
            case 'name':
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
                break;
            case 'score':
                aVal = parseFloat(calculateAverageScore(a).split(' ')[0]) || 0;
                bVal = parseFloat(calculateAverageScore(b).split(' ')[0]) || 0;
                break;
            case 'date':
                aVal = new Date(a.date);
                bVal = new Date(b.date);
                break;
            case 'status':
                aVal = a.finalDecision || 'Pending';
                bVal = b.finalDecision || 'Pending';
                break;
        }
        
        if (aVal < bVal) return sortOrder.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    renderDashboard();
}

/**
 * Renders the table of all recorded interviews on the dashboard.
 */
function renderDashboard() {
    interviewListBody.innerHTML = '';
    
    const interviewsToShow = filteredInterviews.length > 0 || searchInput?.value || statusFilter?.value || dateFilter?.value ? filteredInterviews : allInterviews;
    
    if (interviewsToShow.length === 0) {
        emptyState.classList.remove('hidden');
        exportButton.disabled = true;
        return;
    }

    emptyState.classList.add('hidden');
    exportButton.disabled = false;

    interviewsToShow.forEach((interview, index) => {
        const averageScore = calculateAverageScore(interview);
        const interviewDate = new Date(interview.date);
        const originalIndex = allInterviews.indexOf(interview);
        
        const row = document.createElement('tr');
        row.classList.add('hover:bg-gray-50', 'table-row');

        const status = interview.finalDecision || 'Pending';
        const statusClass = status === 'Selected' ? 'status-selected' : status === 'Rejected' ? 'status-rejected' : 'status-pending';
        
        row.innerHTML = `
            <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <i class="fas fa-user mr-2 text-gray-400"></i>
                ${interview.name}
            </td>
            <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">
                <i class="fas fa-star mr-1 text-yellow-400"></i>
                ${averageScore}
            </td>
            <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                <span class="${statusClass}">
                    <i class="fas ${status === 'Selected' ? 'fa-check' : status === 'Rejected' ? 'fa-times' : 'fa-clock'} mr-1"></i>
                    ${status}
                </span>
            </td>
            <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <i class="fas fa-calendar mr-1 text-gray-400"></i>
                <span class="hidden sm:inline">${interviewDate.toLocaleString()}</span>
                <span class="sm:hidden">${interviewDate.toLocaleDateString()}</span>
            </td>
            <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-center">
                <button onclick="viewInterview(${originalIndex})" class="text-blue-600 hover:text-blue-900 transition duration-150 p-2 rounded-md hover:bg-blue-50 mr-1 touch-target">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="editInterview(${originalIndex})" class="text-green-600 hover:text-green-900 transition duration-150 p-2 rounded-md hover:bg-green-50 mr-1 touch-target">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteInterview(${originalIndex})" class="text-red-600 hover:text-red-900 transition duration-150 p-2 rounded-md hover:bg-red-50 touch-target">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        interviewListBody.appendChild(row);
    });
}

/**
 * Views an interview record in detail.
 * @param {number} index - Index in the allInterviews array.
 */
function viewInterview(index) {
    const interview = allInterviews[index];
    let detailsHtml = `
        <div class="bg-white p-6 rounded-xl shadow-lg max-w-4xl mx-auto">
            <h3 class="text-2xl font-bold text-gray-800 mb-4">
                <i class="fas fa-user-circle mr-2 text-indigo-600"></i>
                ${interview.name}
            </h3>
            <p class="text-gray-600 mb-6">
                <i class="fas fa-calendar mr-2"></i>
                Interview Date: ${new Date(interview.date).toLocaleString()}
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    `;

    SECTIONS.forEach(section => {
        const sectionData = interview.sections[section.name];
        detailsHtml += `
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-700 mb-2">
                    <i class="${section.icon} mr-2 text-indigo-500"></i>
                    ${section.name}
                </h4>
                <p class="text-sm text-gray-600">Score: <span class="font-bold">${sectionData.score || 'N/A'}/5</span></p>
                <p class="text-sm text-gray-600 mt-1">Comments: ${sectionData.comment || 'No comments'}</p>
            </div>
        `;
    });

    // Add final decision section
    const finalDecision = interview.finalDecision || 'Pending';
    const finalComment = interview.finalComment || 'No comments';
    detailsHtml += `
            <div class="bg-indigo-50 p-4 rounded-lg col-span-full">
                <h4 class="font-semibold text-indigo-700 mb-2">
                    <i class="fas fa-gavel mr-2 text-indigo-500"></i>
                    Final Decision
                </h4>
                <p class="text-sm text-gray-600">Decision: <span class="font-bold">${finalDecision}</span></p>
                <p class="text-sm text-gray-600 mt-1">Comments: ${finalComment}</p>
            </div>
        </div>
        <div class="mt-6 text-center">
            <button onclick="closeViewModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">
                <i class="fas fa-times mr-2"></i>Close
            </button>
        </div>
    </div>
`;

    // Create and show modal
    const modal = document.createElement('div');
    modal.id = 'view-modal';
    modal.className = 'fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `<div class="max-h-[90vh] overflow-y-auto my-8">${detailsHtml}</div>`;
    document.body.appendChild(modal);
}

/**
 * Closes the view interview modal.
 */
function closeViewModal() {
    const modal = document.getElementById('view-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

/**
 * Deletes an interview record and updates storage/dashboard.
 * @param {number} index - Index in the allInterviews array.
 */
function deleteInterview(index) {
    if (confirm(`Are you sure you want to delete the interview record for ${allInterviews[index].name}?`)) {
        allInterviews.splice(index, 1);
        filteredInterviews = [...allInterviews];
        saveData();
        renderDashboard();
        showMessage("Interview record deleted successfully.");
    }
}

// --- INTERVIEW PROCESS FUNCTIONS ---

function openNameModal() {
    nameInput.value = ''; // Clear previous input
    nameModal.classList.remove('hidden');
    nameInput.focus();
}

function closeNameModal() {
    nameModal.classList.add('hidden');
}

// --- CUSTOMIZE SCORECARD FUNCTIONS ---

function openCustomizeModal() {
    renderSectionsList();
    customizeModal.classList.remove('hidden');
}

function closeCustomizeModal() {
    customizeModal.classList.add('hidden');
}

function renderSectionsList() {
    sectionsList.innerHTML = SECTIONS.map((section, index) => `
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <i class="${section.icon} text-indigo-500"></i>
            <input type="text" value="${section.name}" class="flex-1 p-2 border border-gray-300 rounded" onchange="updateSectionName(${index}, this.value)">
            <select class="p-2 border border-gray-300 rounded" onchange="updateSectionIcon(${index}, this.value)">
                <option value="fas fa-star" ${section.icon === 'fas fa-star' ? 'selected' : ''}>Star</option>
                <option value="fas fa-user" ${section.icon === 'fas fa-user' ? 'selected' : ''}>User</option>
                <option value="fas fa-briefcase" ${section.icon === 'fas fa-briefcase' ? 'selected' : ''}>Briefcase</option>
                <option value="fas fa-home" ${section.icon === 'fas fa-home' ? 'selected' : ''}>Home</option>
                <option value="fas fa-cogs" ${section.icon === 'fas fa-cogs' ? 'selected' : ''}>Cogs</option>
                <option value="fas fa-server" ${section.icon === 'fas fa-server' ? 'selected' : ''}>Server</option>
                <option value="fas fa-language" ${section.icon === 'fas fa-language' ? 'selected' : ''}>Language</option>
                <option value="fas fa-heart" ${section.icon === 'fas fa-heart' ? 'selected' : ''}>Heart</option>
                <option value="fas fa-plus-circle" ${section.icon === 'fas fa-plus-circle' ? 'selected' : ''}>Plus Circle</option>
            </select>
            <button onclick="deleteSection(${index})" class="text-red-600 hover:text-red-800 p-2">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function updateSectionName(index, name) {
    if (name.trim()) {
        SECTIONS[index].name = name.trim();
    }
}

function updateSectionIcon(index, icon) {
    SECTIONS[index].icon = icon;
    renderSectionsList();
}

function addSection() {
    const name = newSectionName.value.trim();
    const icon = newSectionIcon.value;
    
    if (name) {
        SECTIONS.push({ name, icon });
        newSectionName.value = '';
        renderSectionsList();
    }
}

function deleteSection(index) {
    if (SECTIONS.length > 1) {
        SECTIONS.splice(index, 1);
        renderSectionsList();
    } else {
        showMessage('At least one section is required.', 'error');
    }
}

function saveSections() {
    saveSectionsData();
    closeCustomizeModal();
    showMessage('Scorecard sections updated successfully!');
}

/**
 * Handles starting a new interview after candidate name is entered.
 */
function startInterview() {
    currentCandidateName = nameInput.value.trim();
    
    if (currentCandidateName === '') {
        nameInput.focus();
        showMessage('Please enter the candidate\'s name.', 'error');
        return;
    }

    editingIndex = -1; // Reset editing state
    closeNameModal();
    candidateNameDisplay.textContent = currentCandidateName;
    renderScorecardForm();
    interviewForm.reset(); // Clear any previous form data
    showView('form');
}

/**
 * Handles editing an existing interview
 */
function editInterview(index) {
    const interview = allInterviews[index];
    editingIndex = index;
    currentCandidateName = interview.name;
    
    candidateNameDisplay.textContent = currentCandidateName;
    renderScorecardForm();
    
    // Populate form with existing data
    SECTIONS.forEach(section => {
        const sectionData = interview.sections[section.name];
        if (sectionData) {
            const scoreInput = document.getElementById(`${section.name}-score`);
            const commentInput = document.getElementById(`${section.name}-comment`);
            if (scoreInput) scoreInput.value = sectionData.score || '';
            if (commentInput) commentInput.value = sectionData.comment || '';
        }
    });
    
    // Populate final decision
    const finalDecisionSelect = document.getElementById('final-decision');
    const finalCommentTextarea = document.getElementById('final-comment');
    if (finalDecisionSelect) finalDecisionSelect.value = interview.finalDecision || '';
    if (finalCommentTextarea) finalCommentTextarea.value = interview.finalComment || '';
    
    showView('form');
}

/**
 * Event listener for form submission. Collects and saves the data.
 * @param {Event} e 
 */
interviewForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const interviewRecord = {
        name: currentCandidateName,
        date: new Date().toISOString(),
        sections: {}
    };

    let totalScore = 0;
    let scoreCount = 0;

    // Loop through the defined sections to collect score and comment
    SECTIONS.forEach(section => {
        const scoreKey = `${section.name}Score`;
        const commentKey = `${section.name}Comment`;
        
        let score = parseInt(formData.get(scoreKey));
        const comment = formData.get(commentKey).trim();

        // Basic validation and score calculation
        if (isNaN(score) || score < 1 || score > 5) {
            score = null; // Treat invalid scores as null/not provided
        } else {
            totalScore += score;
            scoreCount++;
        }

        interviewRecord.sections[section.name] = {
            score: score,
            comment: comment
        };
    });
    
    // Add final decision
    interviewRecord.finalDecision = formData.get('finalDecision');
    interviewRecord.finalComment = formData.get('finalComment').trim();
    
    // Add overall score data for easier export and review
    interviewRecord.overall = {
        totalScore: totalScore,
        averageScore: scoreCount > 0 ? (totalScore / scoreCount).toFixed(2) : 'N/A'
    };

    // Save or update the record
    if (editingIndex >= 0) {
        allInterviews[editingIndex] = interviewRecord;
        showMessage(`Interview for ${currentCandidateName} updated successfully!`);
        editingIndex = -1;
    } else {
        allInterviews.push(interviewRecord);
        showMessage(`Interview for ${currentCandidateName} saved successfully!`);
    }
    
    filteredInterviews = [...allInterviews];
    saveData();
    
    // Go back to dashboard and update the table
    showView('dashboard');
    renderDashboard();
});

// --- EXPORT FUNCTION ---

/**
 * Converts all interview data into CSV format and triggers a download.
 */
function exportToCSV() {
    if (allInterviews.length === 0) {
        showMessage("No data to export.", 'error');
        return;
    }

    const headerSections = SECTIONS.flatMap(s => [`${s.name} Score (1-5)`, `${s.name} Remarks`]);
    const header = [
        "Candidate Name", 
        "Interview Date & Time", 
        "Overall Average Score",
        "Final Decision",
        "Final Comments",
        ...headerSections
    ].join(',');
    
    const rows = allInterviews.map(interview => {
        const sectionValues = SECTIONS.flatMap(s => [
            interview.sections[s.name].score || 'N/A', // Score
            `"${interview.sections[s.name].comment.replace(/"/g, '""')}"` // Remarks (escaped for quotes)
        ]);

        return [
            `"${interview.name.replace(/"/g, '""')}"`,
            `"${new Date(interview.date).toLocaleString()}"`,
            interview.overall.averageScore,
            `"${interview.finalDecision || 'Pending'}"`,
            `"${(interview.finalComment || '').replace(/"/g, '""')}"`,
            ...sectionValues
        ].join(',');
    });

    const csvContent = [header, ...rows].join('\n');
    
    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Interview_Scorecard_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showMessage("Data successfully exported to CSV!");
}

// --- INITIALIZATION ---

/**
 * Registers service worker for PWA functionality
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    }
}

/**
 * Handles online/offline status
 */
function handleOnlineStatus() {
    const offlineIndicator = document.createElement('div');
    offlineIndicator.className = 'offline-indicator';
    offlineIndicator.innerHTML = '<i class="fas fa-wifi mr-2"></i>You are currently offline';
    document.body.appendChild(offlineIndicator);
    
    function updateOnlineStatus() {
        if (navigator.onLine) {
            offlineIndicator.classList.remove('show');
        } else {
            offlineIndicator.classList.add('show');
        }
    }
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
}

/**
 * Sets up event listeners for search and filter
 */
function setupEventListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', filterInterviews);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', filterInterviews);
    }
    if (dateFilter) {
        dateFilter.addEventListener('change', filterInterviews);
    }
}

/**
 * Initializes the application state and renders the initial dashboard.
 */
function init() {
    loadData();
    filteredInterviews = [...allInterviews];
    renderDashboard();
    showView('dashboard');
    setupEventListeners();
    registerServiceWorker();
    handleOnlineStatus();
    
    // Enhanced confirm dialog
    window.confirm = (message) => {
        return window.prompt(message + "\n\nType 'YES' to confirm deletion.") === 'YES';
    };
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);