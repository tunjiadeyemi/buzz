// deno-lint-ignore-file no-explicit-any
import 'jsr:@std/dotenv/load';
import * as hono from 'jsr:@hono/hono';

import { authMiddleware, createJWT, extractJsonFromGemini, supabase } from './functions.ts';

const app = new hono.Hono();

const geminiUrl = Deno.env.get('PUBLIC_GEMINI_API_URL') as string;
const PRIVATE_GEMINI_API_KEY = Deno.env.get('PRIVATE_GEMINI_API_KEY_V2') as string;

app.get('/', (c) => {
  return c.body('Buzzzzzzzzz');
});

// --- auth routes
app.post('/auth/signup', async (c) => {
  const { email, password } = await c.req.json();

  try {
    const {
      data: { user },
      error
    } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    // --- create JWT token
    const token = await createJWT({ user: user });

    return c.json({ token, user });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

app.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json();

  try {
    const {
      data: { user },
      error
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // --- create JWT token
    const token = await createJWT({ user: user });

    return c.json({ token, user });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// --- protected routes
app.post('/quiz/save-score', authMiddleware, async (c: any) => {
  const user = c.get('user');
  const { id, email } = user.user;
  const { score, total, totalTime, pageTitle, questions } = await c.req.json();

  try {
    const { data, error } = await supabase.from('quiz').insert([
      {
        user_id: id,
        email: email,
        title: pageTitle,
        time: totalTime,
        questions,
        score,
        total,
        created_at: new Date().toISOString()
      }
    ]);

    if (error) throw error;

    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// protected route
app.get('/user/history', authMiddleware, async (c: any) => {
  const user = c.get('user');
  const { id } = user.user;
  console.log('Received request for /user/history');

  try {
    const { data, error } = await supabase
      .from('quiz')
      .select('*')
      .eq('user_id', id)
      .order('score', { ascending: false });

    console.log('Fetched data from Supabase');

    if (error) throw error;

    console.log('Returning data to client');

    return c.json(data);
  } catch (error: any) {
    console.error(error);
    return c.json({ error: error.message }, 500);
  }
});

// middle-man route to communicate with openai
app.post('/quiz/questions', authMiddleware, async (c: any) => {
  console.log('Received request for questions');
  const { prompt } = await c.req.json();

  try {
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'x-goog-api-key': `${PRIVATE_GEMINI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a helpful assistant, ${prompt}`
              }
            ]
          }
        ]
      })
    });

    console.log('Fetched response from Gemini API', response);

    const text = await response.text();

    console.log('Gemini response text:', text);

    const data = JSON.parse(text);

    console.log('Gemini response data:', data);

    const quizData = extractJsonFromGemini(data);

    return c.json(quizData);
  } catch (error: any) {
    console.error(error);
    return c.json({ error: error.message }, 500);
  }
});

// --- unprotected route
app.get('/quiz/leaderboard', async (c) => {
  console.log('Received request for /quiz/leaderboard');

  try {
    const { data, error } = await supabase
      .from('quiz')
      .select('*')
      .order('score', { ascending: false });

    console.log('Fetched data from Supabase');

    if (error) throw error;

    console.log('Returning data to client');

    return c.json(data);
  } catch (error: any) {
    console.error(error);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);
