const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { OpenAI } = require('openai');
const multer = require('multer');
const upload = multer();
const authMiddleware = require('../middleware/auth');
const { renderTemplate, defaultTemplate, generateChallenge } = require('../services/aiPromptService');

// Load API key from env
const openaiApiKey = process.env.OPENAI_API_KEY || '';
const openai = new OpenAI({ apiKey: openaiApiKey });
const prisma = new PrismaClient();

// Simple helper to build a prompt for the AI
function buildPrompt(payload) {
  const { topic, difficulty, format } = payload || {};
  const parts = [];
  parts.push('You are a helpful coding challenge generator.');
  if (topic) parts.push(`Topic: ${topic}`);
  if (difficulty) parts.push(`Difficulty: ${difficulty}`);
  if (format) parts.push(`Prefer format: ${format}`);
  parts.push('Produce a single self-contained challenge description in clear English. Keep it concise but complete.');
  parts.push('Respond with only the challenge text; do not include metadata.');
  return parts.join('\n');
}

// POST /ai/generateChallenge
router.post('/generateChallenge', async (req, res) => {
  const userId = req.user?.id || null;
  const payload = req.body || {};
  const prompt = buildPrompt(payload);
  let rawResponse = null;
  let responseText = '';

  try {
    // Use Chat Completions API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a concise coding-challenge generator.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 600,
      temperature: 0.7
    });

    rawResponse = completion;
    // choose first message content
    const choice = completion?.choices && completion.choices[0];
    responseText = choice?.message?.content || (typeof completion === 'string' ? completion : JSON.stringify(completion));

    // Save log to Prisma
    try {
      await prisma.aiLog.create({
        data: {
          userId: userId ? String(userId) : null,
          prompt,
          responseText,
          rawResponse: JSON.stringify(rawResponse),
          status: 'success'
        }
      });
    } catch (logErr) {
      console.warn('Failed to persist AI log:', logErr?.message || logErr);
    }

    // Return challenge
    return res.json({ challenge: responseText });
  } catch (err) {
    console.error('/ai/generateChallenge error', err?.message || err);
    // Save failure log
    try {
      await prisma.aiLog.create({
        data: {
          userId: userId ? String(userId) : null,
          prompt,
          responseText: err?.message || 'error',
          rawResponse: JSON.stringify({ error: (err && err.toString()) || 'unknown' }),
          status: 'error'
        }
      });
    } catch (logErr) {
      console.warn('Failed to persist AI error log:', logErr?.message || logErr);
    }

    if (err?.response) {
      const status = err.response?.status || 500;
      const message = err.response?.data || err.message || 'AI provider error';
      return res.status(status).json({ error: message });
    }
    return res.status(500).json({ error: err?.message || 'Internal error generating challenge' });
  }
});

// POST /ai/submitForFeedback
// Accepts either a text field `text`, an optional file (field name `file`), and optional `comment`.
router.post('/submitForFeedback', authMiddleware, upload.single('file'), async (req, res) => {
  const userId = req.user?.id || null;
  const body = req.body || {};
  const comment = body.comment || '';
  let submissionText = body.text || '';

  // If a file was uploaded, attempt to extract text for common text types
  if (req.file && (!submissionText || submissionText.length < 10)) {
    const mimetype = req.file.mimetype || '';
    const name = req.file.originalname || '';
    try {
      if (mimetype.startsWith('text/') || /json|xml|javascript|python|plain/.test(mimetype) || /\.js$|\.py$|\.java$|\.txt$|\.md$|\.json$/.test(name)) {
        submissionText = req.file.buffer.toString('utf8');
      } else {
        // Cannot parse non-text binary; leave submissionText empty and note file info
        submissionText = `<<uploaded file ${name} (type ${mimetype}) - binary content omitted>>`;
      }
    } catch (e) {
      console.warn('Failed to read uploaded file', e?.message || e);
      submissionText = submissionText || `<<failed to extract file ${name}>>`;
    }
  }

  // Build a feedback template (can be replaced with better template or externalized)
  const feedbackTemplate = `You are an expert tutor.\n\nStudent submission:\n{{submissionText}}\n\nAdditional instructions: {{comment}}\n\nProvide constructive feedback: strengths, weaknesses, and clear suggestions to improve. Keep feedback actionable and concise.`;

  const promptVars = { submissionText, comment };

  // Persist the submission first so we can link logs
  let submissionRecord = null;
  try {
    submissionRecord = await prisma.submission.create({
      data: {
        userId: userId ? String(userId) : null,
        filename: req.file?.originalname || null,
        content: submissionText || null,
        comment: comment || null
      }
    });
  } catch (subErr) {
    console.warn('Failed to persist submission:', subErr?.message || subErr);
  }

  try {
    // Use our service to call OpenAI
    const result = await generateChallenge(openai, promptVars, { template: feedbackTemplate, model: process.env.OPENAI_MODEL || 'gpt-4o-mini', temperature: 0.5, max_tokens: 800 });

    // Persist aiLog linked to submission (if created)
    try {
      const aiLog = await prisma.aiLog.create({
        data: {
          submissionId: submissionRecord ? submissionRecord.id : null,
          userId: userId ? String(userId) : null,
          prompt: result.prompt,
          responseText: result.text,
          rawResponse: JSON.stringify(result.raw),
          status: 'success'
        }
      });

      return res.json({ feedback: result.text, submissionId: submissionRecord?.id || null, logId: aiLog.id });
    } catch (logErr) {
      console.warn('Failed to persist AI feedback log:', logErr?.message || logErr);
      return res.json({ feedback: result.text, submissionId: submissionRecord?.id || null });
    }
  } catch (err) {
    console.error('/ai/submitForFeedback error', err?.message || err);
    // attempt to persist error log
    try {
      await prisma.aiLog.create({
        data: {
          submissionId: submissionRecord ? submissionRecord.id : null,
          userId: userId ? String(userId) : null,
          prompt: renderTemplate(feedbackTemplate, promptVars),
          responseText: err?.message || 'error',
          rawResponse: JSON.stringify({ error: (err && err.toString()) || 'unknown' }),
          status: 'error'
        }
      });
    } catch (logErr) {
      console.warn('Failed to persist AI error log:', logErr?.message || logErr);
    }

    if (err?.response) {
      const status = err.response?.status || 500;
      const message = err.response?.data || err.message || 'AI provider error';
      return res.status(status).json({ error: message });
    }
    return res.status(500).json({ error: err?.message || 'Internal error generating feedback' });
  }
});

module.exports = router;
