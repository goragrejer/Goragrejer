// --- ELEMENT REFERENCES AND CONSTANTS ---
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const generateBtn = document.getElementById('generateBtn');
const shareCode = document.getElementById('shareCode');
const useCodeInput = document.getElementById('useCodeInput');
const useBtn = document.getElementById('useBtn');

// NEW: References for filter buttons
const filterAllBtn = document.getElementById('filterAll');
const filterActiveBtn = document.getElementById('filterActive');
const filterCompletedBtn = document.getElementById('filterCompleted');

const STORAGE_KEY = 'studentTodoListTasks';

// The main array to hold our tasks: {text: string, completed: boolean, createdDate: string}
let tasks = [];

// NEW: Global variable to track the current filter state ('all', 'active', 'completed')
let currentFilter = 'all';


// --- DATE UTILITY (UNCHANGED) ---

function getCurrentDateFormatted() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDaysPassedAndColor(creationDateString) {
    if (!creationDateString) {
        return { days: null, colorClass: '' }; 
    }

    const today = new Date();
    const creationDate = new Date(creationDateString);
    
    today.setHours(0, 0, 0, 0);
    creationDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - creationDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let colorClass = '';
    if (diffDays <= 3) {
        colorClass = 'days-green';
    } else if (diffDays <= 10) {
        colorClass = 'days-yellow';
    } else {
        colorClass = 'days-red';
    }
    
    return { days: diffDays, colorClass: colorClass };
}


// --- LOCAL STORAGE FUNCTIONS (UNCHANGED) ---

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


// --- FILTERING LOGIC (NEW) ---

function setFilter(filter) {
    currentFilter = filter;
    
    // Update the visual state of the buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active-filter');
    });
    
    // Find the button matching the current filter and activate it
    const activeBtn = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active-filter');
    }
    
    renderTasks(); // Re-render the list with the new filter applied
}


// --- CORE RENDERING AND INTERACTION LOGIC (UPDATED) ---

function renderTasks() {
    // 1. Filter the tasks based on the currentFilter
    let filteredTasks = tasks.filter(task => {
        if (currentFilter === 'active') {
            return !task.completed;
        }
        if (currentFilter === 'completed') {
            return task.completed;
        }
        return true; // 'all' filter returns all tasks
    });
    
    taskList.innerHTML = '';
    
    // 2. Render the filtered list
    filteredTasks.forEach((task, index) => {
        const li = document.createElement('li');
        
        const { days, colorClass } = getDaysPassedAndColor(task.createdDate);
        
        let daysText;
        if (days === null) {
            daysText = 'No Age Data';
        } else if (days === 0) {
            daysText = 'Today';
        } else if (days === 1) {
            daysText = '1 day past';
        } else {
            daysText = `${days} days past`;
        }
        
        if (colorClass) {
            li.classList.add(colorClass);
        }
        
        if (task.completed) {
            li.classList.add('completed');
        }

        li.innerHTML = `
            <span class="task-content">
                <span class="task-index">[${index + 1}]</span> ${task.text}
                <small class="task-date"> 
                    (Added: ${task.createdDate || 'No Date'}) 
                    — ${daysText}
                </small>
            </span>
            <button class="deleteBtn" data-index="${tasks.indexOf(task)}">Delete</button>
        `;
        // NOTE: We use tasks.indexOf(task) for the delete button index 
        // to ensure we delete the correct item from the main (unfiltered) 'tasks' array.

        // Toggle completion status on click
        li.onclick = (e) => {
            if (!e.target.classList.contains('deleteBtn')) {
                // Find the index in the original array before toggling
                const originalIndex = tasks.findIndex(t => t.text === task.text && t.createdDate === task.createdDate);
                if (originalIndex !== -1) {
                    tasks[originalIndex].completed = !tasks[originalIndex].completed;
                    renderTasks();
                    saveTasksToStorage();
                }
            }
        };

        // Delete button listener
        const delBtn = li.querySelector('.deleteBtn');
        delBtn.onclick = (e) => {
            e.stopPropagation();
            // The data-index is the index in the *main* tasks array (set above)
            const deleteIndex = parseInt(e.target.getAttribute('data-index')); 
            tasks.splice(deleteIndex, 1);
            renderTasks();
            saveTasksToStorage(); 
        };
        
        taskList.appendChild(li);
    });
}

// Add task (UNCHANGED)
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

// Enter key to add (UNCHANGED)
taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { addBtn.click(); }
});


// --- FILTER BUTTON LISTENERS (NEW) ---

filterAllBtn.addEventListener('click', () => setFilter('all'));
filterActiveBtn.addEventListener('click', () => setFilter('active'));
filterCompletedBtn.addEventListener('click', () => setFilter('completed'));


// --- SHARE CODE FUNCTIONS (UNCHANGED) ---

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

// --- URL SHARING FEATURE (UNCHANGED) ---

function loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const listCode = urlParams.get('list');
    
    if (listCode) {
        importTasks(listCode);
    }
}


// --- INITIALIZATION (UNCHANGED) ---

loadTasksFromStorage();
