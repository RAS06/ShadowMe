const { generateChallenge, defaultTemplate } = require('../services/aiPromptService')

describe('aiPromptService snapshots', () => {
  test('sample prompts produce stable prompt/text structure', async () => {
    const mockCreate = jest.fn().mockImplementation(async (opts) => {
      const userContent = opts.messages && opts.messages[1] && opts.messages[1].content || ''
      if (userContent.includes('Topic: Arrays')) {
        return { choices: [{ message: { content: 'Write a function to reverse an array in place without using extra memory.' } }] }
      }
      if (userContent.includes('Topic: Graphs')) {
        return { choices: [{ message: { content: 'Given a weighted graph, implement Dijkstra to find shortest path between two nodes.' } }] }
      }
      return { choices: [{ message: { content: 'Provide a concise coding challenge.' } }] }
    })

    const mockClient = { chat: { completions: { create: mockCreate } } }

    const samples = [
      { vars: { topic: 'Arrays', difficulty: 'Easy', format: 'Short' } },
      { vars: { topic: 'Graphs', difficulty: 'Medium', format: 'Detailed' } }
    ]

    const results = []
    for (const s of samples) {
      const r = await generateChallenge(mockClient, s.vars, { template: defaultTemplate, model: 'snapshot-model' })
      results.push({ prompt: r.prompt, text: r.text })
    }

    expect(results).toMatchSnapshot()
  })
})
