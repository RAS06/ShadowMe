// Reusable AI prompt service
// Exposes template storage, render function, and a generateChallenge function that calls a provided OpenAI client.

const defaultTemplate = `You are a helpful challenge generator.\n\nTopic: {{topic}}\nDifficulty: {{difficulty}}\nFormat: {{format}}\n\nProduce a single self-contained challenge description in clear English. Keep it concise but include enough detail for a student to understand the task. Respond with only the challenge text.`;

function renderTemplate(template, vars) {
  if (typeof template !== 'string') throw new TypeError('template must be a string')
  const finalVars = vars || {}
  // Simple placeholder replacement: {{key}}. Not a full templating engine.
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, key) => {
    const val = finalVars[key]
    if (val === undefined || val === null) return ''
    return String(val)
  })
}

async function generateChallenge(openaiClient, vars = {}, options = {}) {
  if (!openaiClient) throw new Error('openaiClient is required')
  const template = options.template || defaultTemplate
  const prompt = renderTemplate(template, vars)

  // Build messages for Chat Completions
  const system = options.system || 'You are a concise coding-challenge generator.'
  const model = options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const temperature = typeof options.temperature === 'number' ? options.temperature : 0.7
  const max_tokens = typeof options.max_tokens === 'number' ? options.max_tokens : 600

  // Call the OpenAI client. We expect an object that supports chat.completions.create
  if (!openaiClient.chat || !openaiClient.chat.completions || typeof openaiClient.chat.completions.create !== 'function') {
    throw new Error('openaiClient must implement chat.completions.create')
  }

  const completion = await openaiClient.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt }
    ],
    max_tokens,
    temperature
  })

  const text = (completion?.choices && completion.choices[0]?.message?.content) || (typeof completion === 'string' ? completion : JSON.stringify(completion))
  return { prompt, text, raw: completion }
}

module.exports = { defaultTemplate, renderTemplate, generateChallenge }
