const { encryptMessage, decryptMessage, generateKey } = require('../utils/encryption')

describe('Message Encryption', () => {
  it('should encrypt and decrypt messages correctly', async () => {
    const plaintext = 'This is a secret message!'
    
    const encrypted = await encryptMessage(plaintext)
    expect(encrypted).toBeDefined()
    expect(encrypted).not.toBe(plaintext)
    expect(encrypted.length).toBeGreaterThan(plaintext.length)
    
    const decrypted = await decryptMessage(encrypted)
    expect(decrypted).toBe(plaintext)
  })

  it('should generate different ciphertexts for the same message', async () => {
    const plaintext = 'Same message'
    
    const encrypted1 = await encryptMessage(plaintext)
    const encrypted2 = await encryptMessage(plaintext)
    
    // Different nonces mean different ciphertexts
    expect(encrypted1).not.toBe(encrypted2)
    
    // But both decrypt to the same plaintext
    expect(await decryptMessage(encrypted1)).toBe(plaintext)
    expect(await decryptMessage(encrypted2)).toBe(plaintext)
  })

  it('should handle empty messages', async () => {
    const encrypted = await encryptMessage('')
    const decrypted = await decryptMessage(encrypted)
    expect(decrypted).toBe('')
  })

  it('should handle special characters and emojis', async () => {
    const plaintext = 'Hello 👋 Special chars: @#$%^&*()_+-=[]{}|;:,.<>?'
    
    const encrypted = await encryptMessage(plaintext)
    const decrypted = await decryptMessage(encrypted)
    
    expect(decrypted).toBe(plaintext)
  })

  it('should generate valid encryption keys', async () => {
    const key = await generateKey()
    expect(key).toBeDefined()
    expect(key.length).toBe(64) // 32 bytes as hex = 64 chars
    expect(/^[0-9a-f]+$/.test(key)).toBe(true)
  })
})
