import * as hono from 'jsr:@hono/hono';
import * as jwt from 'jsr:@popov/jwt';
import 'jsr:@std/dotenv/load';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const JWT_SECRET = Deno.env.get('JWT_SECRET') as string;
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseKey = Deno.env.get('SUPABASE_KEY') as string;

export const supabase = createClient(supabaseUrl, supabaseKey);

export function extractJsonFromGemini(data: any) {
  try {
    if (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts
    ) {
      const textContent = data.candidates[0].content.parts[0].text;

      // --- extract JSON part by removing backticks and the "json" tag
      const jsonMatch = textContent.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) throw new Error('No valid JSON found in Gemini response.');

      // --- parse the extracted JSON
      const quizArray = JSON.parse(jsonMatch[1]);

      return quizArray;
    } else {
      throw new Error('Invalid Gemini API response structure');
    }
  } catch (error) {
    console.error('Error parsing Gemini JSON:', error);
    return [];
  }
}

export async function authMiddleware(c: hono.Context, next: hono.Next) {
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

// --- helper function to create JWT
export async function createJWT(payload: any) {
  const secret = JWT_SECRET;

  const response = await jwt.createJwt(payload, secret);
  return response;
}
