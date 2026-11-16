// Aura Tab - Optional Groq AI Client

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Validates a Groq API Key with a lightweight test request
 */
export async function verifyGroqApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    return { success: false, error: 'API key is too short or empty.' };
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'Respond with the word "OK".' }],
        max_tokens: 5,
        temperature: 0.1
      })
    });

    if (response.ok) {
      return { success: true };
    }
    const errData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: errData.error?.message || `API error (${response.status})`
    };
  } catch (err) {
    return { success: false, error: err.message || 'Network request failed.' };
  }
}

/**
 * Dictionary lookup: plain English definition and example sentence
 */
export async function defineWordWithAI(word, apiKey) {
  if (!apiKey) return null;

  try {
    const prompt = `Define the word "${word}". Return ONLY a JSON object with this exact shape:
{"word": "${word}", "definition": "Definition in 1-2 simple sentences.", "example": "A natural example sentence using the word."}`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 150,
        temperature: 0.1
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    return JSON.parse(content);
  } catch (err) {
    console.warn('[Aura Tab] AI Dictionary lookup failed:', err);
    return null;
  }
}

/**
 * Semantic Tab Grouping
 * Input: [{ id: 123, title: "...", url: "..." }]
 * Output: [{ name: "Category", color: "blue", tabIds: [123] }]
 */
export async function groupTabsWithAI(tabs, apiKey) {
  if (!apiKey || !tabs || tabs.length < 2) return null;

  const validColors = ['blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
  const tabSummaries = tabs.map(t => ({ id: t.id, title: t.title || t.url }));

  const prompt = `Group these browser tabs into 2 to 5 meaningful thematic project categories (e.g. "Research", "Dev Tools", "Travel Planning", "Social & Entertainment").
Assign each category one color from: ${validColors.join(', ')}.
Every tab ID must appear in exactly one group.

Tabs:
${JSON.stringify(tabSummaries)}

Return ONLY a JSON array of objects with keys "name", "color", and "tabIds":
[{"name": "...", "color": "...", "tabIds": [...]}]`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.2
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    let text = data.choices?.[0]?.message?.content?.trim() || '';
    
    // Extract JSON array if surrounded by markdown code blocks
    if (text.startsWith('```')) {
      text = text.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '').trim();
    }
    
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('[Aura Tab] AI Tab grouping failed, falling back to domain grouping:', err);
    return null;
  }
}

/**
 * Screen OCR via Groq Vision
 * Input: base64 Data URL (data:image/png;base64,...)
 * Output: Transcribed string
 */
export async function extractTextFromImage(base64DataUrl, apiKey) {
  if (!apiKey) {
    throw new Error('Groq API Key is required for Screen OCR.');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: 'llama-3.2-11b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract and transcribe all legible text from this image exactly as written. Return ONLY the plain extracted text, with no markdown fences, preamble, or commentary. If no text exists, return empty string.'
            },
            {
              type: 'image_url',
              image_url: { url: base64DataUrl }
            }
          ]
        }
      ],
      max_tokens: 300,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Vision API Error (${response.status})`);
  }

  const data = await response.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

