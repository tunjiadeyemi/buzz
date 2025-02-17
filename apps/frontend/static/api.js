const API_URL = 'https://quiz-backend.deno.dev';

export async function signUp(email, password) {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error);

  localStorage.setItem('token', data.token);
  return data;
}

export async function signIn(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error);

  localStorage.setItem('token', data.token);
  return data;
}

export async function saveScore(score, total, totalTime, pageTitle) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/quiz/save-score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ score, total, totalTime, pageTitle })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error);

  return data;
}

export async function getQuestions(prompt) {
  const token = localStorage.getItem('token');

  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/quiz/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ prompt })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error);

  return data;
}

export async function getScores() {
  const response = await fetch(`${API_URL}/quiz/leaderboard`);
  console.log('response', response);

  if (!response.ok) throw new Error(response.error);

  return response.json();
}
