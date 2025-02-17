import { signUp, signIn, saveScore, getScores, getQuestions } from './api.js';

let timerInterval;
let totalTime = 60; // 60 seconds for the quiz
let pageContent = '';
let pageTitle = '';
let currentQuestionIndex = 0;
let currentQuiz = [];
let userAnswers = [];
let currentUser = null;

// update your existing functions to use the API
async function saveScoreHistory(score, total) {
  try {
    await saveScore(score, total, totalTime, pageTitle);
    await displayScoreHistory();
  } catch (error) {
    console.error('Error saving score:', error);
  }
}

// ui components
function showAuthUI() {
  const quizContainer = document.getElementById('quizContainer');
  quizContainer.innerHTML = `
    <div class="auth-container">
      <h2>Sign In</h2>
      <form id="authForm" style="margin-top: 15px">
        <input type="email" id="email" placeholder="Email" required>
        <input type="password" id="password" placeholder="Password" required>
        <span style="font-size: 12px; color: red; margin: 5px 0; display: block"></span>
        <button type="submit" class="quiz-button">Sign In</button>
      </form>
      <p>Don't have an account? <a href="#" id="toggleAuth">Sign Up</a></p>
    </div>
  `;

  const authForm = document.getElementById('authForm');
  const toggleAuth = document.getElementById('toggleAuth');
  let isSignIn = true;

  toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isSignIn = !isSignIn;
    document.querySelector('.auth-container h2').textContent = isSignIn ? 'Sign In' : 'Sign Up';
    toggleAuth.textContent = isSignIn ? 'Sign Up' : 'Sign In';
  });

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Please wait...';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const data = isSignIn ? await signIn(email, password) : await signUp(email, password);
      currentUser = data.user;
      document.querySelector('.auth-container span').textContent = '';
      showQuizUI();
    } catch (error) {
      document.querySelector('.auth-container span').textContent = error;
      submitButton.disabled = false;
      submitButton.textContent = isSignIn ? 'Sign In' : 'Sign Up';
    }
  });
}

function showQuizUI() {
  // show generate quiz button after successful auth
  const generateQuizButton = document.getElementById('generateQuiz');
  generateQuizButton.style.display = 'block';

  // clear the auth UI
  const quizContainer = document.getElementById('quizContainer');
  quizContainer.innerHTML = '';

  const header = document.getElementById('signOutButton');
  header.style.display = 'block';
  header.classList.add('quiz-button');
  header.addEventListener('click', () => {
    currentUser = null;

    header.style.display = 'none';
    const generateQuizButton = document.getElementById('generateQuiz');
    generateQuizButton.style.display = 'none';
    showAuthUI();
  });
}

async function generateQuiz() {
  if (!currentUser) {
    showAuthUI();
    return;
  }

  userAnswers = []; // reset user answers

  const prompt = `
      Create a 5-question multiple-choice quiz based on the following webpage content.
      Provide the quiz in a JSON format like this:
      [
        {
          "question": "What is X?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "Option A"
        }
      ]
      Here is the webpage content:
      """${pageContent.substring(0, 5000)}"""  // Limit to 5000 characters for API request
    `;

  try {
    const response = await getQuestions(prompt);
    displayQuiz(response);
  } catch (error) {
    console.error('Error:', error);
    quizContainer.innerHTML = `<p>Failed to generate quiz. Try again.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const pageTitleElement = document.getElementById('pageTitle');
  const quizContainer = document.getElementById('quizContainer');
  const generateQuizButton = document.getElementById('generateQuiz');
  const signOutButton = document.getElementById('signOutButton');

  // initially hide the generate quiz button
  generateQuizButton.style.display = 'none';

  // start with auth UI
  showAuthUI();

  // listen for messages from the injected script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'PAGE_INFO') {
      pageTitle = message.title;
      pageTitleElement.textContent = `Quiz Title: ${pageTitle}`;
      pageContent = message.body;

      // only enable the button if user is authenticated
      if (currentUser) {
        generateQuizButton.disabled = false;
      }
    }
  });

  // inject script to get page content
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['inject.js']
      });
    }
  });

  // generate quiz button click handler
  generateQuizButton.addEventListener('click', async () => {
    if (!currentUser) {
      showAuthUI();
      return;
    }

    generateQuizButton.disabled = true;
    generateQuizButton.textContent = 'Generating...';

    quizContainer.innerHTML =
      '<img src="classroomio.svg" alt="Loading..." style="width: 100%; display: block; margin: 20px auto;">';

    try {
      await generateQuiz();
    } catch (error) {
      console.error('Error generating quiz:', error);
      quizContainer.innerHTML = `<p>Failed to generate quiz. Try again.</p>`;
      generateQuizButton.disabled = false;
      generateQuizButton.textContent = 'Create Quiz';
    }
  });

  // add sign out functionality
  signOutButton.addEventListener('click', () => {
    currentUser = null;
    // remove header with sign out button
    signOutButton.style.display = 'none';
    const generateQuizButton = document.getElementById('generateQuiz');
    generateQuizButton.style.display = 'none';
    showAuthUI();
  });
});

function startTimer() {
  const timerDisplay = document.getElementById('quizTimer');
  timerDisplay.textContent = `Time Left: ${totalTime}s`;

  timerInterval = setInterval(() => {
    totalTime--;
    timerDisplay.textContent = `Time Left: ${totalTime}s`;
    if (totalTime <= 0) {
      clearInterval(timerInterval);
      checkAnswers(currentQuiz, true); // auto-submit when time is up
    }
  }, 1000);
}

function displayQuiz(quiz) {
  const generateQuizButton = document.getElementById('generateQuiz');
  generateQuizButton.style.display = 'none';

  currentQuiz = quiz; // store the quiz
  totalTime = 60; // reset timer
  clearInterval(timerInterval);
  currentQuestionIndex = 0; // start from the first question

  const quizContainer = document.getElementById('quizContainer');
  quizContainer.innerHTML = `
    <div id="quizTimer" style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">Time Left: 60s</div>
    <div id="quizContent"></div> 
    <div id="quizControls">
      <button id="prevQuestion" style="display:none;">Previous</button>
      <button id="nextQuestion">Next</button>
      <button id="submitQuizButton" style="display:none;">Submit</button>
    </div>
    <div id="quizResult" style="display: none;"></div>
  `;

  updateQuestionDisplay();

  document.getElementById('nextQuestion').addEventListener('click', () => changeQuestion(1));
  document.getElementById('prevQuestion').addEventListener('click', () => changeQuestion(-1));
  document
    .getElementById('submitQuizButton')
    .addEventListener('click', () => checkAnswers(currentQuiz, false));

  startTimer();
}

function updateQuestionDisplay() {
  const quizContent = document.getElementById('quizContent');
  quizContent.classList.add('quizContainer');
  const question = currentQuiz[currentQuestionIndex];

  quizContent.innerHTML = `
    <p style="font-size: 17px; font-weight: bold; margin-bottom: 15px;">${
      currentQuestionIndex + 1
    }. ${question.question}</p>
    <div style="display: flex; flex-direction: column; gap: 1px;">
      ${question.options
        .map(
          (option, i) => `
        <label>
          <input type="radio" name="q${currentQuestionIndex}" value="${option}" 
                ${userAnswers[currentQuestionIndex] === option ? 'checked' : ''}>
          <span style="font-size: 15px;">${option}</span>
        </label><br>
      `
        )
        .join('')}
      </div>
  `;

  // add event listeners to radio buttons
  const radioButtons = quizContent.querySelectorAll('input[type="radio"]');
  radioButtons.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      userAnswers[currentQuestionIndex] = e.target.value;
    });
  });

  // show/hide navigation buttons
  document.getElementById('prevQuestion').style.display =
    currentQuestionIndex === 0 ? 'none' : 'inline-block';
  document.getElementById('nextQuestion').style.display =
    currentQuestionIndex === currentQuiz.length - 1 ? 'none' : 'inline-block';
  document.getElementById('submitQuizButton').style.display =
    currentQuestionIndex === currentQuiz.length - 1 ? 'inline-block' : 'none';

  document.getElementById('submitQuizButton').classList.add('quiz-button');
  document.getElementById('nextQuestion').classList.add('quiz-button');
  document.getElementById('prevQuestion').classList.add('quiz-button');
}

function changeQuestion(direction) {
  currentQuestionIndex += direction;
  updateQuestionDisplay();
}

function checkAnswers(quiz, autoSubmit) {
  if (!autoSubmit) {
    const submitButton = document.getElementById('submitQuizButton');
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
  }

  // hide generate quiz button after successful auth
  const generateQuizButton = document.getElementById('generateQuiz');
  generateQuizButton.style.display = 'none';

  clearInterval(timerInterval);
  let score = 0;
  let reviewHtml = '<h3 style="font-size: 20px; margin: 10px 0;">Review:</h3>';

  quiz.forEach((q, index) => {
    const userAnswer = userAnswers[index];
    if (userAnswer) {
      if (userAnswer === q.answer) {
        score++;
        reviewHtml += `<div style='font-size: 15px; color:green; margin: 10px 0;'>✔ ${q.question} <br /> - ${userAnswer} <br /> - Correct</div>`;
      } else {
        reviewHtml += `<div style='font-size: 15px; color:red; margin: 10px 0;'>✘ ${q.question} <br /> - ${userAnswer} <br /> - Correct Answer: ${q.answer}</div>`;
      }
    } else {
      reviewHtml += `<div style='font-size: 15px; color:red; margin: 10px 0;'>✘ ${q.question} <br /> - No answer selected <br /> - Correct Answer: ${q.answer}</div>`;
    }
  });

  const resultContainer = document.getElementById('quizResult');
  resultContainer.style.display = 'block';
  resultContainer.innerHTML = `
    <p style="font-size: 14px; font-weight: 600;">Your Score: ${score}/${quiz.length}</p>
    ${reviewHtml}
    <button id="tryAgainButton" class="quiz-button">Try Again</button>
  `;

  document.getElementById('quizContent').style.display = 'none';
  document.getElementById('tryAgainButton').addEventListener('click', async () => {
    const tryAgainButton = document.getElementById('tryAgainButton');
    tryAgainButton.disabled = true;
    tryAgainButton.textContent = 'Loading...';

    try {
      document.getElementById('quizContainer').innerHTML =
        '<img src="classroomio.svg" alt="Loading..." style="width: 100%; display: block; margin: 20px auto;">';
      await generateQuiz();
    } catch (error) {
      console.error('Error generating new quiz:', error);
      tryAgainButton.disabled = false;
      tryAgainButton.textContent = 'Try Again';
    }
  });

  // hide submit button after submission
  document.getElementById('submitQuizButton').style.display = 'none';
  document.getElementById('nextQuestion').style.display = 'none';
  document.getElementById('prevQuestion').style.display = 'none';

  saveScoreHistory(score, quiz.length);
  displayScoreHistory();
}

async function displayScoreHistory() {
  try {
    const scores = await getScores();

    const historyContainer = document.getElementById('scoreHistory');
    historyContainer.innerHTML = `
      <h3>Leaderboard</h3>
      <div class="table-container">
        <table class="scores-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Quiz</th>
              <th>Score</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            ${scores
              .map(
                (entry) => `
              <tr>
                <td>${entry.email}</td>
                <td>${entry.title}</td>
                <td>${entry.score}/${entry.total}</td>
                <td>${entry.time}s</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Error fetching score history:', error);
    historyContainer.innerHTML = '<p class="error">Error loading leaderboard</p>';
  }
}

document.addEventListener('DOMContentLoaded', displayScoreHistory);
