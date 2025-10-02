// --- ELEMENT REFERENCES AND CONSTANTS ---
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const generateBtn = document.getElementById('generateBtn');
const shareCode = document.getElementById('shareCode');
const useCodeInput = document.getElementById('useCodeInput');
const useBtn = document.getElementById('useBtn');

const STORAGE_KEY = 'studentTodoListTasks';

// The main array to hold our tasks: {text: string, completed: boolean}
let tasks = [];


// --- LOCAL STORAGE FUNCTIONS (Persistence) ---

// Saves the current tasks array to Local Storage
function saveTasksToStorage() {
    // Convert the JavaScript array into a JSON string to store it.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Loads tasks from Local Storage on startup
function loadTasksFromStorage() {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    
    if (savedTasks) {
        try {
            // Parse the JSON string back into a JavaScript array
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
        const span = document.createElement('span');
        span.textContent = task.text;
        li.appendChild(span);

        // Apply 'completed' class if the task is marked completed
        if (task.completed) {
            li.classList.add('completed');
        }

        // Toggle completion status on click of the list item
        li.onclick = (e) => {
            // Check if the click target is NOT the delete button to prevent toggling when deleting
            if (!e.target.classList.contains('deleteBtn')) {
                tasks[index].completed = !tasks[index].completed;
                renderTasks(); // Re-render to update classes
                saveTasksToStorage();
            }
        };

        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.className = 'deleteBtn';
        
        // Delete button logic
        delBtn.onclick = (e) => {
            e.stopPropagation(); // Prevent the li click handler from running
            tasks.splice(index, 1);
            renderTasks();
            saveTasksToStorage(); 
        };
        
        li.appendChild(delBtn);
        taskList.appendChild(li);
    });
}

// Add task
addBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    if (text) {
        // Task is stored as an object with text and completion status
        tasks.push({ text: text, completed: false });
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

// Convert string to Base64 (URL-safe)
function encodeBase64(str) {
    // btoa is a native browser function to convert string to Base64
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Convert Base64 back to string
function decodeBase64(b64) {
    b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
    // Ensure padding is correct for atob
    while (b64.length % 4) {
        b64 += '=';
    }
    // atob is a native browser function to convert Base64 back to string
    return atob(b64);
}

// Generate Share Code (JSON -> Base64)
generateBtn.addEventListener('click', () => {
    const jsonString = JSON.stringify(tasks);
    const base64Code = encodeBase64(jsonString);
    shareCode.value = base64Code;
});

// Use Share Code (Base64 -> JSON)
function importTasks(code) {
    if (!code) return false;
    try {
        const jsonString = decodeBase64(code);
        const importedTasks = JSON.parse(jsonString);
        
        // Basic validation: ensure it's an array and has the 'text' property
        if (Array.isArray(importedTasks) && importedTasks.every(t => t.text !== undefined)) {
            tasks = importedTasks;
            renderTasks();
            saveTasksToStorage(); // Save imported list for persistence
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

// Checks the URL for a 'list' parameter and loads it
function loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const listCode = urlParams.get('list');
    
    if (listCode) {
        console.log("Found URL share code. Importing list...");
        importTasks(listCode);
        
        // Optional: Clear the URL parameter after loading to keep it clean
        // window.history.pushState({}, document.title, window.location.pathname);
    }
}


// --- INITIALIZATION ---

// Start by loading any saved or shared tasks when the script first executes
loadTasksFromStorage();
