/* 1. CONSTANTES E CONFIGURAÇÕES
======================================== */
const DEFAULT_QUESTION_COUNT = 10

const MAX_HINTS = 3;


/* 2. BANCO DE PERGUNTAS
======================================== */
let questions = [];


/* 3. SELETORES DOM
======================================== */
    
const questionCountInput = document.getElementById("question_count");
const startButton = document.getElementById("start_button");
const configFeedback = document.getElementById("config_feedback");

    // seletores da tela de perguntas
const startScreen = document.getElementById("start_screen");
const questionScreen = document.getElementById("question_screen");

const questionCounter = document.getElementById("question_counter");
const questionCategory = document.getElementById("question_category");
const questionText = document.getElementById("question_text");
const answerOptions = document.getElementById("answer_options");
const progressBar = document.getElementById("progress_bar");
const progressPercentage = document.getElementById("progress_percentage");


    // seletor de feedback
const feedback = document.getElementById("feedback");

    // próxima pergunta
const nextButton = document.getElementById("next_button");

    // ajuda dos universitarios
const hintButton = document.getElementById("hint_button");
const hintText = document.getElementById("hint_text");

    

/* 4. ESTADO DA APLICAÇÃO
======================================== */
let selectedQuestionCount = DEFAULT_QUESTION_COUNT;


let sessionQuestions = [];
let currentQuestionIndex = 0;


let score = 0;

let hintsRemaining = MAX_HINTS;
let hintUsedOnCurrentQuestion = false;


/* 5. DADOS E PROCESSAMENTO (funcoes)
======================================== */
async function loadQuestions() {
    const response = await fetch("./questions.json");
    if (!response.ok) {
        throw new Error("Não foi possível carregar questions.json."); 
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("O banco de perguntas está vazio ou inválido.");
    }

    questions = data;
    questionCountInput.max = questions.length;
    questionCountInput.value = Math.min(DEFAULT_QUESTION_COUNT, questions.length);

    selectedQuestionCount = Number(questionCountInput.value);
    console.log("Perguntas carregadas:", questions.length);
}

function shuffleQuestions(questionList) {
    const shuffled = [...questionList];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[randomIndex]] =
        [shuffled[randomIndex], shuffled[i]];
    }

    return shuffled;
}




/* 6. RENDERIZAÇÃO DA INTERFACE
======================================== */
    // mostrar o enunciado, categorias e alternativas
function renderQuestion() {
    const currentQuestion = sessionQuestions[currentQuestionIndex];

    questionCounter.textContent = `Pergunta ${currentQuestionIndex + 1} de ${sessionQuestions.length}`

    questionCategory.textContent = currentQuestion.category;
    questionText.textContent = currentQuestion.question;

    progressBar.max = sessionQuestions.length;
    progressBar.value = currentQuestionIndex;
    progressPercentage.textContent =
        `${Math.round((currentQuestionIndex / sessionQuestions.length) * 100)}%`;

    feedback.textContent = "";
    feedback.classList.remove("is-correct", "is-incorrect");

    hintUsedOnCurrentQuestion = false;
    hintText.textContent = "";
    hintText.hidden = true;
    hintButton.textContent = `Ajuda dos universitários (${hintsRemaining})`;
    hintButton.disabled = hintsRemaining === 0;

    nextButton.hidden = true;
    nextButton.textContent =
        currentQuestionIndex === sessionQuestions.length - 1
            ? "Ver resultado"
            : "Próxima pergunta";

    answerOptions.innerHTML = "";
    currentQuestion.options.forEach((option, index) => {
        const answerButton = document.createElement("button");
        answerButton.type = "button";
        answerButton.classList.add("answer_option");
        answerButton.dataset.index = index;
        answerButton.textContent = `${String.fromCharCode(65 + index)}. ${option}`;

        answerButton.addEventListener("click", () => {checkAnswer(index);
        });

        answerOptions.appendChild(answerButton);
    });
}




/* 7. CONTROLE DO JOGO
======================================== */
   //verificar valor digitado e apresentar o resultado
function configureSession() {
    const questionCount = Number(questionCountInput.value);

    questionCountInput.max = questions.length;

    if (!questionCountInput.checkValidity()) {
        configFeedback.textContent = `Informe um número inteiro entre 1 e ${questions.length}.`;
        configFeedback.classList.remove("is-success");
        configFeedback.classList.add("is-error");
        configFeedback.hidden = false;
        return;
    }

    selectedQuestionCount = questionCount;
    startQuiz();
}


function startQuiz() {
    sessionQuestions = shuffleQuestions(questions).slice(0, selectedQuestionCount);
    currentQuestionIndex = 0;
    score = 0;

    hintsRemaining = MAX_HINTS;
    hintUsedOnCurrentQuestion = false;

    console.log("Questões sorteadas:",sessionQuestions.map((question) => question.id));

    startScreen.hidden = true;
    questionScreen.hidden = false;

    renderQuestion();
}

    // comparar alternativas para feedback
function checkAnswer(selectedIndex) {
    const currentQuestion = sessionQuestions[currentQuestionIndex];
    const isCorrect = selectedIndex === currentQuestion.correctAnswer;
    const answerButtons = answerOptions.querySelectorAll("button");

    answerButtons.forEach((button, index) => {
        button.disabled = true;

        if (index === currentQuestion.correctAnswer) {
            button.classList.add("is-correct");
        } else if (index === selectedIndex) {
            button.classList.add("is-incorrect");
        }
    });

    if (isCorrect) {
        score += 1;
        feedback.textContent = "Resposta correta!";
        feedback.classList.add("is-correct");
    } else {
        const correctOption = currentQuestion.options[currentQuestion.correctAnswer];
        feedback.textContent = `Resposta incorreta. A alternativa correta é: ${correctOption}.`;

        feedback.classList.add("is-incorrect");
    }

    progressBar.value = currentQuestionIndex + 1;
    progressPercentage.textContent =
        `${Math.round(((currentQuestionIndex + 1) / sessionQuestions.length) * 100)}%`;

    hintButton.disabled = true;    
    nextButton.hidden = false;
}

    // avançar para a pergunta seguinte
function nextQuestion() {
    currentQuestionIndex += 1;
    
    if (currentQuestionIndex < sessionQuestions.length) {
        renderQuestion();
        return;
    }

    questionCounter.textContent = "Sessão concluída";
    questionCategory.textContent = "Resultado";
    questionText.textContent = "Você concluiu todas as perguntas!";

    answerOptions.innerHTML = "";
    
    feedback.textContent = `Você acertou ${score} de ${sessionQuestions.length} questões.`;
    feedback.classList.remove("is-correct", "is-incorrect");

    progressBar.value = sessionQuestions.length;
    nextButton.hidden = true;
}

    // ajuda dos universitários
function showHint() {
    if (hintsRemaining === 0 || hintUsedOnCurrentQuestion) {
        return;
    }

    const currentQuestion = sessionQuestions[currentQuestionIndex];

    hintText.textContent = currentQuestion.hint;
    hintText.hidden = false;

    hintsRemaining -= 1;
    hintUsedOnCurrentQuestion = true;

    hintButton.textContent =
        `Ajuda dos universitários (${hintsRemaining})`;

    hintButton.disabled = true;
}


/* 8. EVENT LISTENERS
======================================== */
    // executar a validação ao iniciar o jogo
startButton.addEventListener("click", configureSession);

questionCountInput.addEventListener("input", () => {
    configFeedback.hidden = true;
    configFeedback.classList.remove("is-success", "is-error");
});


nextButton.addEventListener("click", nextQuestion);

hintButton.addEventListener("click", showHint);


/* 9. INICIALIZAÇÃO
======================================== */
async function init() {
    startButton.disabled = true;

    try {
        await loadQuestions();
        startButton.disabled = false;

    } catch (error) {
        console.error("Erro na inicialização:", error);

        configFeedback.textContent =
        "Não foi possível carregar as perguntas. Verifique o arquivo JSON.";

        configFeedback.classList.remove("is-success");
        configFeedback.classList.add("is-error");
        configFeedback.hidden = false;
    }
}

init();