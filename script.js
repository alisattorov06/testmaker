const state = {
    questions: [],
    sidebarOpen: false,
    touchStartX: 0,
    touchEndX: 0
};

const elements = {

    sidebarToggle: document.getElementById('sidebarToggle'),
    exportBtn: document.getElementById('exportBtn'),

    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    sidebarClose: document.getElementById('sidebarClose'),

    testTitle: document.getElementById('testTitle'),
    mixedQuestions: document.getElementById('mixedQuestions'),
    mixedAnswers: document.getElementById('mixedAnswers'),
    timer: document.getElementById('timer'),
    password: document.getElementById('password'),

    questionsContainer: document.getElementById('questionsContainer'),
    noQuestions: document.getElementById('noQuestions'),
    addQuestionBtn: document.getElementById('addQuestionBtn'),

    toast: document.getElementById('toast'),
    loadingOverlay: document.getElementById('loadingOverlay')
};

function init() {

    loadFromLocalStorage();

    setupEventListeners();

    renderQuestions();

    if (state.questions.length === 0) {
        addQuestion();
    }
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('testMakerData');

    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);

            if (parsed.config) {
                elements.testTitle.value = parsed.config.title || 'My Test';
                elements.mixedQuestions.checked = parsed.config.mixedQuestions || false;
                elements.mixedAnswers.checked = parsed.config.mixedAnswers || false;
                elements.timer.checked = parsed.config.timer || false;
                elements.password.checked = parsed.config.password || false;
            }

            if (parsed.questions && Array.isArray(parsed.questions)) {
                state.questions = parsed.questions;
            }
        } catch (e) {
            console.error('Failed to parse saved data:', e);
        }
    }
}

function saveToLocalStorage() {
    const data = {
        config: {
            title: elements.testTitle.value,
            mixedQuestions: elements.mixedQuestions.checked,
            mixedAnswers: elements.mixedAnswers.checked,
            timer: elements.timer.checked,
            password: elements.password.checked
        },
        questions: state.questions
    };

    localStorage.setItem('testMakerData', JSON.stringify(data));
}

function setupEventListeners() {
    elements.sidebarToggle.addEventListener('click', openSidebar);
    elements.sidebarClose.addEventListener('click', closeSidebar);
    elements.sidebarOverlay.addEventListener('click', closeSidebar);

    elements.sidebar.addEventListener('touchstart', (e) => {
        state.touchStartX = e.changedTouches[0].screenX;
    });

    elements.sidebar.addEventListener('touchend', (e) => {
        state.touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    elements.exportBtn.addEventListener('click', exportToJSON);

    elements.addQuestionBtn.addEventListener('click', addQuestion);

    elements.testTitle.addEventListener('input', saveToLocalStorage);
    elements.mixedQuestions.addEventListener('change', saveToLocalStorage);
    elements.mixedAnswers.addEventListener('change', saveToLocalStorage);
    elements.timer.addEventListener('change', saveToLocalStorage);
    elements.password.addEventListener('change', saveToLocalStorage);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            e.preventDefault();
        }
    });
}

function handleSwipe() {
    const swipeThreshold = 50;
    const swipeDistance = state.touchStartX - state.touchEndX;

    if (swipeDistance > swipeThreshold && state.sidebarOpen) {
        closeSidebar();
    }
}

function openSidebar() {
    elements.sidebar.classList.add('active');
    elements.sidebarOverlay.classList.add('active');
    state.sidebarOpen = true;
}

function closeSidebar() {
    elements.sidebar.classList.remove('active');
    elements.sidebarOverlay.classList.remove('active');
    state.sidebarOpen = false;
}

function addQuestion() {
    const newQuestion = {
        id: Date.now(),
        question: '',
        type: 'single',
        rightanswer: 1,
        answer1: '',
        answer2: '',
        answer3: '',
        answer4: '',
        answer5: '',
        answer6: '',
        answer7: '',
        explanation: '',
        localImageUri: '',
        remoteImageUrl: '',
        answersCount: 4
    };

    state.questions.push(newQuestion);
    renderQuestions();
    saveToLocalStorage();

    setTimeout(() => {
        const lastQuestion = document.querySelector('.question-card:last-child');
        if (lastQuestion) {
            lastQuestion.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 100);
}

function deleteQuestion(id) {
    state.questions = state.questions.filter(q => q.id !== id);
    renderQuestions();
    saveToLocalStorage();
}

function updateQuestion(id, field, value) {
    const question = state.questions.find(q => q.id === id);
    if (question) {
        question[field] = value;
        saveToLocalStorage();
    }
}

function renderQuestions() {
    if (state.questions.length === 0) {
        elements.noQuestions.style.display = 'block';
        elements.questionsContainer.innerHTML = '';
        return;
    }

    elements.noQuestions.style.display = 'none';

    const questionsHTML = state.questions.map((q, index) => createQuestionHTML(q, index + 1)).join('');
    elements.questionsContainer.innerHTML = questionsHTML;

    state.questions.forEach(q => {
        const questionElement = document.querySelector(`[data-id="${q.id}"]`);
        if (questionElement) {
            attachQuestionEventListeners(q.id, questionElement);
        }
    });
}

function createQuestionHTML(question, number) {
    const answersHTML = Array.from({ length: 7 }, (_, i) => {
        const answerNum = i + 1;
        const isVisible = answerNum <= question.answersCount || answerNum <= 4;

        return `
            <div class="answer-input" ${isVisible ? '' : 'style="display: none;"'}>
                <span class="answer-label">${answerNum}</span>
                <input type="text" 
                       data-field="answer${answerNum}" 
                       value="${question[`answer${answerNum}`] || ''}" 
                       placeholder="Answer ${String.fromCharCode(64 + answerNum)}">
            </div>
        `;
    }).join('');

    return `
        <div class="question-card" data-id="${question.id}">
            <div class="question-header">
                <span class="question-number">Question ${number}</span>
                <button class="delete-question" data-action="delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="form-group">
                <label for="question-${question.id}">Savol matni</label>
                <input type="text" 
                       id="question-${question.id}" 
                       data-field="question" 
                       value="${question.question}" 
                       placeholder="Savolni bu yerga yozing...">
            </div>
            
            <div class="answers-settings">
                <div class="answers-count">
                    <label for="answers-count-${question.id}">Variantlar soni</label>
                    <select id="answers-count-${question.id}" data-field="answersCount">
                        ${[2, 3, 4, 5, 6, 7].map(num =>
        `<option value="${num}" ${question.answersCount === num ? 'selected' : ''}>${num} answers</option>`
    ).join('')}
                    </select>
                </div>
                
                <div class="correct-answer">
                    <label for="correct-answer-${question.id}">To'g'ri variantni tanlang</label>
                    <select id="correct-answer-${question.id}" data-field="rightanswer">
                        ${Array.from({ length: question.answersCount }, (_, i) => {
        const answerNum = i + 1;
        return `<option value="${answerNum}" ${question.rightanswer === answerNum ? 'selected' : ''}>Answer ${answerNum}</option>`;
    }).join('')}
                    </select>
                </div>
            </div>
            
            <div class="answers-grid">
                ${answersHTML}
            </div>
            
            <div class="form-group">
                <label for="explanation-${question.id}">Savol haqida izoh</label>
                <textarea id="explanation-${question.id}" 
                          data-field="explanation" 
                          placeholder="Izohni bu yerga yozing...">${question.explanation || ''}</textarea>
            </div>
        </div>
    `;
}

function attachQuestionEventListeners(questionId, questionElement) {
    const deleteBtn = questionElement.querySelector('[data-action="delete"]');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteQuestion(questionId));
    }

    const inputs = questionElement.querySelectorAll('input[data-field], textarea[data-field], select[data-field]');
    inputs.forEach(input => {
        const field = input.dataset.field;

        if (input.tagName === 'SELECT') {
            input.addEventListener('change', (e) => {
                updateQuestion(questionId, field, e.target.value);

                if (field === 'answersCount') {
                    const question = state.questions.find(q => q.id === questionId);
                    if (question) {
                        question.answersCount = parseInt(e.target.value);
                        renderQuestions();
                    }
                }

                if (field === 'rightanswer') {
                }
            });
        } else {
            input.addEventListener('input', (e) => {
                updateQuestion(questionId, field, e.target.value);
            });
        }
    });
}

function generateJSON() {
    const config = {
        title: elements.testTitle.value.trim() || 'My Test',
        password: elements.password.checked ? 'yes' : 'no',
        timer: elements.timer.checked ? 'yes' : 'no',
        mixed_questions: elements.mixedQuestions.checked ? 'yes' : 'no',
        mixed_answers: elements.mixedAnswers.checked ? 'yes' : 'no',
        attempts: 'no'
    };
    const formattedQuestions = state.questions.map(q => ({
        question: q.question,
        type: 'single',
        rightanswer: parseInt(q.rightanswer),
        answer1: q.answer1 || '',
        answer2: q.answer2 || '',
        answer3: q.answer3 || '',
        answer4: q.answer4 || '',
        answer5: q.answer5 || '',
        answer6: q.answer6 || '',
        answer7: q.answer7 || '',
        explanation: q.explanation || '',
        localImageUri: '',
        remoteImageUrl: ''
    }));

    return {
        ...config,
        questions: formattedQuestions
    };
}

function exportToJSON() {
    elements.loadingOverlay.classList.add('active');

    const jsonData = generateJSON();
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    const titleSlug = jsonData.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    a.href = url;
    a.download = `${titleSlug}-test-${timestamp}.json`;

    setTimeout(() => {
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        elements.loadingOverlay.classList.remove('active');
        showToast('JSON exported successfully!');
    }, 800);
}

function showToast(message) {
    const toastContent = elements.toast.querySelector('span');
    if (toastContent) {
        toastContent.textContent = message;
    }

    elements.toast.classList.add('active');

    setTimeout(() => {
        elements.toast.classList.remove('active');
    }, 3000);
}

document.addEventListener('DOMContentLoaded', init);

window.addEventListener('beforeunload', saveToLocalStorage);