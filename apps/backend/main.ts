// deno-lint-ignore-file no-explicit-any
import * as hono from 'jsr:@hono/hono';
import * as jwt from 'jsr:@popov/jwt';
import 'jsr:@std/dotenv/load';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const app = new hono.Hono();

const openaiUrl = Deno.env.get('OPENAI_URL') as string;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') as string;

const JWT_SECRET = Deno.env.get('JWT_SECRET') as string;
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseKey = Deno.env.get('SUPABASE_KEY') as string;

const supabase = createClient(supabaseUrl, supabaseKey);

async function authMiddleware(c: hono.Context, next: hono.Next) {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization header required' }, 401);
    }

    const token = authHeader.split(' ')[1];

    // - verify the token with the same secret used to create it
    const isValid = await jwt.isJwtValid(token, JWT_SECRET);

    if (!isValid) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    // - extract the payload
    const payload = jwt.getJwtPayload(token);

    // set the user data in context
    c.set('user', payload);

    await next();
  } catch (error: any) {
    console.error('Auth error:', error);
    return c.json({ error: 'Invalid token' }, 401);
  }
}

app.get('/', (c) => {
  return c.body('Hello, World!');
});

// auth routes
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

    // Create JWT token
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

    // Create JWT token
    const token = await createJWT({ user: user });

    return c.json({ token, user });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// protected routes
app.post('/quiz/save-score', authMiddleware, async (c: any) => {
  const user = c.get('user');
  const { id, email } = user.user;
  const { score, total, totalTime, pageTitle } = await c.req.json();

  try {
    const { data, error } = await supabase.from('quiz').insert([
      {
        user_id: id,
        email: email,
        title: pageTitle,
        time: totalTime,
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

// unprotected route
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

// middle-man route to communicate with openai
app.post('/quiz/questions', authMiddleware, async (c: any) => {
  console.log('Received request for questions');
  const { prompt } = await c.req.json();

  try {
    const response = await fetch(openaiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    // - check if response body exists
    const text = await response.text();

    // - parse JSON only if response is not empty
    if (!text) {
      throw new Error('Empty response body');
    }

    const data = JSON.parse(text);

    // - ensure correct data path
    if (!data.choices) {
      throw new Error('Invalid API response structure');
    }

    // - doing all the filtering on the backend
    const quizData = extractJson(data.choices[0].message.content);

    return c.json(quizData);
  } catch (error: any) {
    console.error(error);
    return c.json({ error: error.message }, 500);
  }
});

function extractJson(text: any) {
  try {
    // extract JSON part by removing backticks and the "json" tag
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) throw new Error('No valid JSON found in text.');

    // parse the extracted JSON
    const quizArray = JSON.parse(jsonMatch[1]);

    return quizArray;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return [];
  }
}

// helper function to create JWT
async function createJWT(payload: any) {
  const secret = JWT_SECRET;

  const response = await jwt.createJwt(payload, secret);
  console.log('response', response);
  return response;
}

Deno.serve(app.fetch);
