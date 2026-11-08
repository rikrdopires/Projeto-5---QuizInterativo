/* 1. CONSTANTES E CONFIGURAÇÕES
======================================== */
const DEFAULT_QUESTION_COUNT = 10

const MAX_HINTS = 3;

const BEST_SCORE_KEY = "quiz_interativo_best_score";


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

    // seletor de resultados
const resultScreen = document.getElementById("result_screen");
const finalScore = document.getElementById("final_score");
const scorePercentage = document.getElementById("score_percentage");
const bestScore = document.getElementById("best_score");
const restartButton = document.getElementById("restart_button");

    // seletor de feedback
const feedback = document.getElementById("feedback");

    // próxima pergunta
const nextButton = document.getElementById("next_button");

    // ajuda dos universitarios
const hintButton = document.getElementById("hint_button");
const hintText = document.getElementById("hint_text");

    // Revisão de erros
const reviewSection = document.querySelector(".review_section");
const mistakeReview = document.getElementById("mistake_review");

    // desempenho
const performanceSection = document.querySelector(".performance_section");
const categoryResults = document.getElementById("category_results");
const studySection = document.querySelector(".study_section");
const studyRecommendations = document.getElementById("study_recommendations");



/* 4. ESTADO DA APLICAÇÃO
======================================== */
let selectedQuestionCount = DEFAULT_QUESTION_COUNT;


let sessionQuestions = [];
let currentQuestionIndex = 0;


let score = 0;

let sessionAnswers = [];

let bestResult = null;

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

function loadBestResult() {
    try {
        const savedResult = localStorage.getItem(BEST_SCORE_KEY);

        if (savedResult === null) {
            return;
        }

        const data = JSON.parse(savedResult);

        if (
            typeof data.score === "number" &&
            typeof data.total === "number" &&
            data.total > 0 &&
            data.score >= 0 &&
            data.score <= data.total
        ) {
            bestResult = data;
        }

    } catch (error) {
        console.warn("Não foi possível recuperar o recorde:", error);
    }
}


function updateBestResult() {
    const total = sessionQuestions.length;

    const isNewRecord =
        bestResult === null ||
        score * bestResult.total > bestResult.score * total ||
        (
            score * bestResult.total === bestResult.score * total &&
            score > bestResult.score
        );

    if (!isNewRecord) {
        return;
    }

    bestResult = {
        score: score,
        total: total
    };

    try {
        localStorage.setItem(
        BEST_SCORE_KEY,
        JSON.stringify(bestResult)
        );
    } catch (error) {
        console.warn("Não foi possível salvar o recorde:", error);
    }
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


    // calcular o aproveitamento e preecher a tela final
function renderResults() {
    const totalQuestions = sessionQuestions.length;

    const percentage = Math.round(
        (score / totalQuestions) * 100
    );

    finalScore.textContent = `Pontuação: ${score} de ${totalQuestions}`;
    scorePercentage.textContent = `Aproveitamento: ${percentage}%`;

    updateBestResult();
    const bestPercentage = Math.round(
        (bestResult.score / bestResult.total) * 100
    );
    bestScore.textContent = `Melhor pontuação: ${bestResult.score} de ${bestResult.total} (${bestPercentage}%)`;
    bestScore.hidden = false;

    renderMistakeReview();
    renderLearningDiagnosis();

    questionScreen.hidden = true;
    resultScreen.hidden = false;
}

    // revisão dos erros
function renderMistakeReview() {
    mistakeReview.innerHTML = "";

    const mistakes = sessionAnswers.filter((answer) => {
        return !answer.isCorrect;
    });

    reviewSection.hidden = false;
    
    if (mistakes.length === 0) {
        const message = document.createElement("p");
        message.textContent = "Parabéns! Você não errou nenhuma questão.";
        mistakeReview.appendChild(message);
        return;
    }

    mistakes.forEach((answer, index) => {
        const item = document.createElement("article");
        item.classList.add("review_item");

        const title = document.createElement("h4");
        title.textContent = `Questão ${index + 1} — ${answer.question.category}`;
        
        const questionText = document.createElement("p");
        questionText.textContent = answer.question.question;

        const selectedAnswer = document.createElement("p");
        selectedAnswer.classList.add("review_wrong");
        selectedAnswer.textContent = `Sua resposta: ${answer.question.options[answer.selectedIndex]}`;

        const correctAnswer = document.createElement("p");
        correctAnswer.classList.add("review_correct");
        correctAnswer.textContent = `Resposta correta: ${answer.question.options[answer.question.correctAnswer]}`;
    
        const explanation = document.createElement("p");
        explanation.textContent = `Explicação: ${answer.question.explanation}`;
    
        item.appendChild(title);
        item.appendChild(questionText);
        item.appendChild(selectedAnswer);
        item.appendChild(correctAnswer);
        item.appendChild(explanation);

        mistakeReview.appendChild(item);
    });
}


    // calculo de desempenho e painel de estudo
function renderLearningDiagnosis() {
    categoryResults.innerHTML = "";
    studyRecommendations.innerHTML = "";

    const statsByCategory = new Map();

    sessionAnswers.forEach((answer) => {
        const category = answer.question.category;
        const topic = answer.question.topic;

        if (!statsByCategory.has(category)) {
            statsByCategory.set(category, {
                category: category,
                total: 0,
                correct: 0,
                missedTopics: []
            });
        }

        const stats = statsByCategory.get(category);
        stats.total += 1;

        if (answer.isCorrect) {
            stats.correct += 1;
        } else if (!stats.missedTopics.includes(topic)) {
            stats.missedTopics.push(topic);
        }
    });

    statsByCategory.forEach((stats) => {
        const percentage = Math.round((stats.correct / stats.total) * 100);

        const item = document.createElement("article");
        item.classList.add("category_item");

        const title = document.createElement("h4");
        title.textContent = stats.category;

        const result = document.createElement("p");
        result.textContent = `${stats.correct} de ${stats.total} acertos — ${percentage}%`;

        item.appendChild(title);
        item.appendChild(result);
        categoryResults.appendChild(item);

        if (stats.missedTopics.length > 0) {
            const recommendation = document.createElement("article");
            recommendation.classList.add("study_item");

            const recommendationTitle = document.createElement("h4");
            recommendationTitle.textContent = stats.category;
            const recommendationText = document.createElement("p");
            recommendationText.textContent = `Revise os assuntos: ${stats.missedTopics.join(", ")}.`;
            
            recommendation.appendChild(recommendationTitle);
            recommendation.appendChild(recommendationText);

            studyRecommendations.appendChild(recommendation);
        }
    });

    if (studyRecommendations.children.length === 0) {
        const message = document.createElement("p");
        message.textContent = "Você acertou todas as questões do Quiz. Continue praticando.";
        studyRecommendations.appendChild(message);
    }

    const note = document.createElement("p");
    note.classList.add("diagnosis_note");
    note.textContent = "Este diagnóstico considera somente as questões desta Quiz.";
    studyRecommendations.appendChild(note);

    performanceSection.hidden = false;
    studySection.hidden = false;
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
    sessionAnswers = [];

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

    sessionAnswers.push({
        question: currentQuestion,
        selectedIndex: selectedIndex,
        isCorrect: isCorrect
    });

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

    renderResults();
}

    // retornar a tela inicial
function restartQuiz() {
    resultScreen.hidden = true;
    questionScreen.hidden = true;
    startScreen.hidden = false;

    sessionQuestions = [];
    currentQuestionIndex = 0;
    score = 0;
    sessionAnswers = [];

    hintsRemaining = MAX_HINTS;
    hintUsedOnCurrentQuestion = false;

    feedback.textContent = "";
    feedback.classList.remove("is-correct", "is-incorrect");

    configFeedback.hidden = true;
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


restartButton.addEventListener("click", restartQuiz);


/* 9. INICIALIZAÇÃO
======================================== */
async function init() {
    startButton.disabled = true;

    try {
        await loadQuestions();
        loadBestResult();
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