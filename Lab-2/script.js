// Strict mode for clean code
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // Global variables and state 
    const APP_ROOT_ID = 'app-root';
    const LS_KEY = 'todoListTasks';
    
    let tasks = []; 
    let currentSort = 'date-asc'; 
    let currentFilter = 'all'; 
    let currentSearch = ''; 
    let draggedItem = null; 

    // Загрузка данных из localStorage 
    function loadTasks() {
        const storedTasks = localStorage.getItem(LS_KEY);
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
        } else {
            // initial task
            // tasks = [
            //     { id: Date.now() + 1, text: 'Drag-and-Drop', completed: false, date: '2025-12-10' },
            //     { id: Date.now() + 2, text: 'Адаптивность макета', completed: true, date: '2025-12-05' },
            //     { id: Date.now() + 3, text: 'Сортировка по дате', completed: false, date: '2025-11-30' }
            // ];
        }
    }

    // Save data to localStorage
    function saveTasks() {
        localStorage.setItem(LS_KEY, JSON.stringify(tasks));
    }

    // helper fun. for DOM
    function createDomElement(tag, className, textContent, attributes = {}) {
        const element = document.createElement(tag);
        if (className) {
            element.className = className;
        }
        if (textContent) {
            element.textContent = textContent;
        }
        for (const key in attributes) {
            element.setAttribute(key, attributes[key]);
        }
        return element;
    }


    function renderAppStructure() {
        const root = document.getElementById(APP_ROOT_ID);
        
        const appContainer = createDomElement('section', 'todo-app');
        root.appendChild(appContainer);

        const title = createDomElement('h1', null, 'Список задач');
        appContainer.appendChild(title);

        const form = createDomElement('form', 'todo-form', null, { id: 'todo-form' });
        appContainer.appendChild(form);

        const textInput = createDomElement('input', 'todo-form__input', null, { 
            type: 'text', 
            placeholder: 'Новая задача...',
            id: 'new-task-text',
            required: 'true'
        });
        form.appendChild(textInput);

        // for date
        const dateInput = createDomElement('input', 'todo-form__date', null, { 
            type: 'date',
            id: 'new-task-date',
            value: new Date().toISOString().split('T')[0] // Текущая дата
        });
        form.appendChild(dateInput);

        // for adding 
        const addButton = createDomElement('button', 'todo-form__button', 'Добавить', { type: 'submit' });
        form.appendChild(addButton);
        
        const controlsPanel = createDomElement('nav', 'controls-panel');
        appContainer.appendChild(controlsPanel);

        // search
        const searchInput = createDomElement('input', 'controls-panel__search', null, {
            type: 'text',
            placeholder: 'Поиск по названию...',
            id: 'search-input'
        });
        controlsPanel.appendChild(searchInput);

        // filter
        const filterSelect = createDomElement('select', 'controls-panel__filter', null, { id: 'filter-select' });
        
        const optionAll = createDomElement('option', null, 'Все задачи', { value: 'all' });
        const optionCompleted = createDomElement('option', null, 'Выполненные', { value: 'completed' });
        const optionPending = createDomElement('option', null, 'Невыполненные', { value: 'pending' });

        filterSelect.appendChild(optionAll);
        filterSelect.appendChild(optionCompleted);
        filterSelect.appendChild(optionPending);
        controlsPanel.appendChild(filterSelect);

        // sorting
        const sortSelect = createDomElement('select', 'controls-panel__sort', null, { id: 'sort-select' });

        const sortDateAsc = createDomElement('option', null, 'Сортировать: по дате (по возр.)', { value: 'date-asc' });
        const sortDateDesc = createDomElement('option', null, 'Сортировать: по дате (по убыв.)', { value: 'date-desc' });

        sortSelect.appendChild(sortDateAsc);
        sortSelect.appendChild(sortDateDesc);
        controlsPanel.appendChild(sortSelect);

        const ulList = createDomElement('ul', 'todo-list', null, { id: 'todo-list' });
        appContainer.appendChild(ulList);

        setupEventListeners();
        renderTasks();
    }

    //Drag-and-Drop 

    function getFilteredAndSortedTasks() {
        let result = [...tasks];

        if (currentSearch) {
            const searchTerm = currentSearch.toLowerCase();
            result = result.filter(task => task.text.toLowerCase().includes(searchTerm));
        }

        if (currentFilter !== 'all') {
            result = result.filter(task => 
                currentFilter === 'completed' ? task.completed : !task.completed
            );
        }

        // 3. sorting by date
        result.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (currentSort === 'date-asc') {
                return dateA - dateB;
            } else { // 'date-desc'
                return dateB - dateA;
            }
        });

        return result;
    }

    function renderTasks() {
        const todoList = document.getElementById('todo-list');
        todoList.innerHTML = ''; 
        
        const filteredAndSorted = getFilteredAndSortedTasks();
        
        if (filteredAndSorted.length === 0) {
            const emptyMessage = createDomElement('li', null, 'Нет задач, соответствующих условиям.');
            todoList.appendChild(emptyMessage);
            return;
        }

        filteredAndSorted.forEach(task => {
            const listItem = createDomElement('li', 'todo-item', null, {
                'data-id': task.id,
                draggable: 'true' // Drag-and-Drop
            });

            // Visual styling for completed task
            if (task.completed) {
                listItem.classList.add('todo-item--completed');
            }

            // Content container
            const contentContainer = createDomElement('div', 'todo-item__content');
            listItem.appendChild(contentContainer);

            // Checkbox (Mark completed)
            const checkboxId = `task-${task.id}`;
            const checkbox = createDomElement('input', 'todo-item__checkbox', null, {
                type: 'checkbox',
                id: checkboxId,
                checked: task.completed,
            });
            contentContainer.appendChild(checkbox);

            const checkLabel = createDomElement('label', 'todo-item__check-label', null, { for: checkboxId });
            contentContainer.appendChild(checkLabel);
            
            //Text
            const textSpan = createDomElement('span', 'todo-item__text', task.text);
            contentContainer.appendChild(textSpan);

            // Date
            const dateSpan = createDomElement('span', 'todo-item__date', `Срок: ${task.date}`);
            contentContainer.appendChild(dateSpan);

            // action buttons
            const actionsDiv = createDomElement('div', 'todo-item__actions');
            listItem.appendChild(actionsDiv);
            
            const editButton = createDomElement('button', 'action-btn action-btn--edit', 'Редактировать', { 'data-action': 'edit' });
            const deleteButton = createDomElement('button', 'action-btn action-btn--delete', 'Удалить', { 'data-action': 'delete' });
            
            actionsDiv.appendChild(editButton);
            actionsDiv.appendChild(deleteButton);

            todoList.appendChild(listItem);
        });
    }

    // CRUD

    function addTask(text, date) {
        const newTask = {
            id: Date.now(),
            text: text,
            completed: false,
            date: date
        };
        tasks.push(newTask);
        saveTasks();
        renderTasks();
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }

    function toggleComplete(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
        }
    }

    function startEditTask(itemElement, task) {
        // deleting the old elements and adding new ones
        itemElement.classList.add('todo-item--editing');
        const contentContainer = itemElement.querySelector('.todo-item__content');
        const actionsDiv = itemElement.querySelector('.todo-item__actions');

        contentContainer.innerHTML = '';
        actionsDiv.innerHTML = '';
        
        // text entry
        const editInput = createDomElement('input', 'todo-item__edit-input', null, {
            type: 'text',
            value: task.text
        });
        contentContainer.appendChild(editInput);
        
        // date entry
        const editDate = createDomElement('input', 'todo-item__edit-date', null, {
            type: 'date',
            value: task.date 
        });
        contentContainer.appendChild(editDate);

        // save button
        const saveButton = createDomElement('button', 'action-btn action-btn--edit', 'Сохранить', { 'data-action': 'save' });
        actionsDiv.appendChild(saveButton);
    }
    
    function saveEditTask(itemElement, id) {
        const task = tasks.find(t => t.id === id);
        const editInput = itemElement.querySelector('.todo-item__edit-input');
        const editDate = itemElement.querySelector('.todo-item__edit-date');
        
        if (task && editInput.value.trim()) {
            task.text = editInput.value.trim();
            task.date = editDate.value;
            saveTasks();
            renderTasks(); 
        } else {
            alert('Текст задачи не может быть пустым!');
        }
    }

    // Drag and drop
    
    function handleDragStart(e) {
        draggedItem = this; // 'this' ссылается на li.todo-item
        setTimeout(() => this.classList.add('dragging'), 0);
        // Передача ID для идентификации в drop-обработчике
        e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
    }

    function handleDragEnd(e) {
        this.classList.remove('dragging');
        
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        draggedItem = null;
    }

    function handleDragOver(e) {
        e.preventDefault(); 
        if (this.nodeType === 1 && this !== draggedItem) {

            if (!this.classList.contains('drag-over')) {

                document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
                this.classList.add('drag-over');
            }
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        this.classList.remove('drag-over');

        if (this === draggedItem || !draggedItem) {
            return;
        }

        const droppedItemId = parseInt(e.dataTransfer.getData('text/plain'));
        const targetItemId = parseInt(this.getAttribute('data-id'));

        // finding text from list
        const droppedIndex = tasks.findIndex(t => t.id === droppedItemId);
        const targetIndex = tasks.findIndex(t => t.id === targetItemId);

        if (droppedIndex !== -1 && targetIndex !== -1) {
            const [movedTask] = tasks.splice(droppedIndex, 1);
            tasks.splice(targetIndex, 0, movedTask);
            
            saveTasks();
            
            // NOTE: RenderTasks is not called here, as D&D only works with the current pne 
            // filtered/sorted list on the screen
             // To maintain order, simply update the DOM.
            const todoList = document.getElementById('todo-list');
            
            if (droppedIndex < targetIndex) {

                todoList.insertBefore(draggedItem, this.nextSibling);
            } else {

                todoList.insertBefore(draggedItem, this);
            }
        }
    }

    // event listeners

    function setupEventListeners() {
        const todoList = document.getElementById('todo-list');
        const form = document.getElementById('todo-form');
        const filterSelect = document.getElementById('filter-select');
        const sortSelect = document.getElementById('sort-select');
        const searchInput = document.getElementById('search-input');
        
        // Form Submission (Add task)
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const textInput = document.getElementById('new-task-text');
            const dateInput = document.getElementById('new-task-date');
            
            const text = textInput.value.trim();
            const date = dateInput.value;

            if (text && date) {
                addTask(text, date);
                textInput.value = ''; // clearing the field 
                dateInput.value = new Date().toISOString().split('T')[0]; // to reset the date
            }
        });

        // State Change and Actions (Delete, Edit, Complete)
        todoList.addEventListener('click', (e) => {
            const itemElement = e.target.closest('.todo-item');
            if (!itemElement) return;

            const id = parseInt(itemElement.getAttribute('data-id'));
            const task = tasks.find(t => t.id === id);

            // clicking the check box
            if (e.target.classList.contains('todo-item__checkbox')) {
                toggleComplete(id);
                return;
            }

            // clickk on action buttons 
            const action = e.target.getAttribute('data-action');
            if (action) {
                switch (action) {
                    case 'delete':
                        if (confirm('Вы уверены, что хотите удалить задачу?')) {
                            deleteTask(id);
                        }
                        break;
                    case 'edit':
                        startEditTask(itemElement, task);
                        break;
                    case 'save':
                        saveEditTask(itemElement, id);
                        break;
                }
            }
        });
        
        // filtering 
        filterSelect.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            renderTasks();
        });

        // sorting 
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderTasks();
        });
        
        // searching by name 
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            renderTasks();
        });

        // drag and drop listeners
        todoList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('todo-item')) {
                handleDragStart.call(e.target, e);
            }
        });
        
        todoList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('todo-item')) {
                handleDragEnd.call(e.target, e);
            }
        });

        todoList.addEventListener('dragover', (e) => {
            const targetItem = e.target.closest('.todo-item');
            if (targetItem) {
                handleDragOver.call(targetItem, e);
            }
        });

        todoList.addEventListener('dragleave', (e) => {
            if (e.target.classList.contains('drag-over')) {
                e.target.classList.remove('drag-over');
            }
        });

        todoList.addEventListener('drop', (e) => {
            const targetItem = e.target.closest('.todo-item');
            if (targetItem) {
                handleDrop.call(targetItem, e);
            }
        });
    }


    loadTasks();
    renderAppStructure();
});
