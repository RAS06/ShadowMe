const { renderTemplate, generateChallenge, defaultTemplate } = require('../services/aiPromptService')

describe('aiPromptService', () => {
  test('renderTemplate replaces placeholders', () => {
    const tpl = 'Hello {{name}}, topic={{topic}}, missing={{missing}}'
    const out = renderTemplate(tpl, { name: 'Alice', topic: 'Arrays' })
    expect(out).toBe('Hello Alice, topic=Arrays, missing=')
  })

  test('generateChallenge calls openai client and returns text', async () => {
    // Mock OpenAI client shape used by our service
    const mockCreate = jest.fn().mockResolvedValue({
      choices: [ { message: { content: 'Solve the array reversal problem.' } } ]
    })
    const mockClient = { chat: { completions: { create: mockCreate } } }

    const vars = { topic: 'Arrays', difficulty: 'Easy', format: 'Short' }
    const result = await generateChallenge(mockClient, vars, { template: defaultTemplate, model: 'test-model' })

    expect(result).toBeDefined()
    expect(result.text).toBe('Solve the array reversal problem.')
    // ensure that the client was called with a messages array containing our rendered prompt
    expect(mockCreate).toHaveBeenCalledTimes(1)
    const calledWith = mockCreate.mock.calls[0][0]
    expect(calledWith).toHaveProperty('model', 'test-model')
    expect(calledWith).toHaveProperty('messages')
    expect(Array.isArray(calledWith.messages)).toBe(true)
    const userMsg = calledWith.messages.find(m => m.role === 'user')
    expect(userMsg).toBeDefined()
    expect(userMsg.content).toContain('Topic: Arrays')
  })
})
