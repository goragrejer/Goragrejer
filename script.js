// --- ELEMENT REFERENCES AND CONSTANTS ---
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const generateBtn = document.getElementById('generateBtn');
const shareCode = document.getElementById('shareCode');
const useCodeInput = document.getElementById('useCodeInput');
const useBtn = document.getElementById('useBtn');

const STORAGE_KEY = 'studentTodoListTasks';

// The main array to hold our tasks: {text: string, completed: boolean, createdDate: string}
let tasks = [];


// --- DATE UTILITY ---

// Uses the user's local date to format the task creation stamp
function getCurrentDateFormatted() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// NEW FUNCTION: Calculates days passed and determines color class
function getDaysPassedAndColor(creationDateString) {
    if (!creationDateString) {
        return { days: 0, colorClass: '' }; // No date means no color/counter
    }

    const today = new Date();
    const creationDate = new Date(creationDateString);
    
    // Set both to midnight to only compare calendar dates, not time of day
    today.setHours(0, 0, 0, 0);
    creationDate.setHours(0, 0, 0, 0);

    // Calculate the difference in milliseconds
    const diffTime = Math.abs(today - creationDate);
    // Convert to days (1 day = 1000ms * 60s * 60m * 24h)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let colorClass = '';
    // --- COLOR LOGIC ---
    if (diffDays <= 3) { // 3 days or less (including today) -> Green
        colorClass = 'days-green';
    } else if (diffDays <= 10) { // 4 to 10 days -> Yellow
        colorClass = 'days-yellow';
    } else { // More than 10 days (over a week and a half) -> Red
        colorClass = 'days-red';
    }
    
    return { days: diffDays, colorClass: colorClass };
}


// --- LOCAL STORAGE FUNCTIONS (Persistence) ---

function saveTasksToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasksFromStorage() {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    
    if (savedTasks) {
        try {
            tasks = JSON.parse(savedTasks);
        } catch (e) {
            console.error("Error loading tasks from Local Storage:", e);
            tasks = [];
        }
    }
    loadFromURL(); 
    renderTasks();
}


// --- CORE RENDERING AND INTERACTION LOGIC ---

// Render the list (Updated to include day count and color class)
function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        
        // 1. DETERMINE DAYS PASSED AND COLOR CLASS
        const { days, colorClass } = getDaysPassedAndColor(task.createdDate);
        let daysText = days > 0 ? `${days} day${days > 1 ? 's' : ''} past` : 'Today';
        
        // Apply the color class to the list item
        if (colorClass) {
            li.classList.add(colorClass);
        }
        
        // Apply 'completed' class if the task is marked completed
        if (task.completed) {
            li.classList.add('completed');
        }

        // 2. INCLUDE THE DAYS COUNTER IN THE HTML
        li.innerHTML = `
            <span class="task-content">
                ${task.text}
                <small class="task-date"> 
                    (Added: ${task.createdDate || 'No Date'}) 
                    — ${daysText}
                </small>
            </span>
            <button class="deleteBtn" data-index="${index}">Delete</button>
        `;

        // Toggle completion status on click of the list item
        li.onclick = (e) => {
            if (!e.target.classList.contains('deleteBtn')) {
                tasks[index].completed = !tasks[index].completed;
                renderTasks();
                saveTasksToStorage();
            }
        };

        // Attach event listener for the delete button
        const delBtn = li.querySelector('.deleteBtn');
        delBtn.onclick = (e) => {
            e.stopPropagation();
            tasks.splice(index, 1);
            renderTasks();
            saveTasksToStorage(); 
        };
        
        taskList.appendChild(li);
    });
}

// Add task
addBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    if (text) {
        tasks.push({ 
            text: text, 
            completed: false,
            createdDate: getCurrentDateFormatted() 
        });
        taskInput.value = '';
        renderTasks();
        saveTasksToStorage();
    }
});

// Enter key to add
taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { addBtn.click(); }
});


// --- SHARE CODE FUNCTIONS (Base64 Encoding) ---
// (No changes needed here, as they handle data transport)

function encodeBase64(str) {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function decodeBase64(b64) {
    b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) {
        b64 += '=';
    }
    return atob(b64);
}

generateBtn.addEventListener('click', () => {
    const jsonString = JSON.stringify(tasks);
    const base64Code = encodeBase64(jsonString);
    shareCode.value = base64Code;
});

function importTasks(code) {
    if (!code) return false;
    try {
        const jsonString = decodeBase64(code);
        const importedTasks = JSON.parse(jsonString);
        
        if (Array.isArray(importedTasks) && importedTasks.every(t => t.text !== undefined)) {
            tasks = importedTasks.map(task => ({
                text: task.text,
                completed: task.completed || false,
                // Ensure date exists on imported tasks for the counter to work
                createdDate: task.createdDate || getCurrentDateFormatted() 
            }));
            
            renderTasks();
            saveTasksToStorage(); 
            return true;
        } else {
            alert('Invalid share code format.');
            return false;
        }
    } catch (e) {
        alert('Invalid share code: Decoding or JSON parse failed.');
        console.error('Import error:', e);
        return false;
    }
}

useBtn.addEventListener('click', () => {
    const code = useCodeInput.value.trim();
    if (importTasks(code)) {
        useCodeInput.value = '';
    }
});

// --- URL SHARING FEATURE ---

function loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const listCode = urlParams.get('list');
    
    if (listCode) {
        importTasks(listCode);
    }
}


// --- INITIALIZATION ---

loadTasksFromStorage();
