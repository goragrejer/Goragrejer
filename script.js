// --- CORE RENDERING AND INTERACTION LOGIC (FIXED) ---

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

        // FIND THE STABLE INDEX: This is the index in the original 'tasks' array
        // We use this index for toggling and deleting, regardless of the current filter
        const stableIndex = tasks.indexOf(task); 

        li.innerHTML = `
            <span class="task-content">
                <span class="task-index">[${index + 1}]</span> ${task.text}
                <small class="task-date"> 
                    (Added: ${task.createdDate || 'No Date'}) 
                    — ${daysText}
                </small>
            </span>
            <button class="deleteBtn" data-index="${stableIndex}">Delete</button>
        `;

        // Toggle completion status on click
        li.onclick = (e) => {
            if (!e.target.classList.contains('deleteBtn')) {
                // Use the stable index to toggle completion in the main 'tasks' array
                if (stableIndex !== -1) {
                    tasks[stableIndex].completed = !tasks[stableIndex].completed;
                    renderTasks();
                    saveTasksToStorage();
                }
            }
        };

        // Delete button listener
        const delBtn = li.querySelector('.deleteBtn');
        delBtn.onclick = (e) => {
            e.stopPropagation();
            // The data-index holds the stable index from the main 'tasks' array
            const deleteIndex = parseInt(e.target.getAttribute('data-index')); 
            tasks.splice(deleteIndex, 1);
            renderTasks();
            saveTasksToStorage(); 
        };
        
        taskList.appendChild(li);
    });
}
