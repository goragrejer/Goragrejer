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
    // Month is 0-indexed, so we add 1
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    // Check for a share code in the URL when the page loads
    loadFromURL(); 
    renderTasks();
}


// --- CORE RENDERING AND INTERACTION LOGIC ---

// Render the list
function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        
        // Apply 'completed' class if the task is marked completed
        if (task.completed) {
            li.classList.add('completed');
        }

        // The inner HTML includes the task text and the new date stamp
        li.innerHTML = `
            <span class="task-content">
                ${task.text}
                <small class="task-date"> (Added: ${task.createdDate || 'No Date'})</small>
            </span>
            <button class="deleteBtn" data-index="${index}">Delete</button>
        `;

        // Toggle completion status on click of the list item
        li.onclick = (e) => {
            // Check if the click target is NOT the delete button
            if (!e.target.classList.contains('deleteBtn')) {
                tasks[index].completed = !tasks[index].completed;
                renderTasks();
                saveTasksToStorage();
            }
        };

        // Attach event listener for the delete button
        const delBtn = li.querySelector('.deleteBtn');
        delBtn.onclick = (e) => {
            e.stopPropagation(); // Stop the parent li's click event (toggle)
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
        // Task object now includes the date stamp
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
        
        // Validation now checks for the new 'createdDate' property for new imports
        if (Array.isArray(importedTasks) && importedTasks.every(t => t.text !== undefined)) {
            // This loop ensures older tasks (without a date) get the current date upon import
            tasks = importedTasks.map(task => ({
                text: task.text,
                completed: task.completed || false,
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
