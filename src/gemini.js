const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

function toCleanJson(text) {
  // Remove code fences if present and parse JSON safely
  const cleaned = text
    .replace(/^```(json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    return null;
  }
}

async function generateSections(metadata, readmeRaw) {
  const prompt = `You are helping write a professional README for a GitHub repository.\n\n` +
  `Given the repository metadata (JSON) and optionally its current README content, produce JSON with these exact keys:\n` +
  `- description: 2-4 crisp paragraphs.\n` +
  `- features: array of concise bullet points.\n` +
  `- installation: step-by-step list (as an array of strings).\n` +
  `- usage: short tutorial with code snippets in Markdown fences (string).\n` +
  `- techStack: array of technologies (derived from languages, package.json, topics).\n` +
  `Do not invent APIs. If something is unknown, write a sensible generic step.\n` +
  `Return **ONLY** valid JSON, no extra text.\n\n` +
  `METADATA:\n` + JSON.stringify(metadata) + `\n\n` +
  `CURRENT_README (may be empty):\n` + (readmeRaw ? readmeRaw.slice(0, 5000) : '');

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const json = toCleanJson(text);
  if (!json) {
    // Fallback minimal structure
    return {
      description: metadata.description || 'Project description goes here.',
      features: [],
      installation: [ 'Clone the repo', 'Install dependencies', 'Run the app' ],
      usage: '```bash\n# usage instructions here\n```',
      techStack: Object.keys(metadata.languages || {})
    };
  }
  return json;
}

module.exports = { generateSections };
