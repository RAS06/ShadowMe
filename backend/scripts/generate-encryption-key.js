// Script to generate encryption key for chat messages
const { generateKey } = require('../utils/encryption')

async function main() {
  const key = await generateKey()
  console.log('\n=== Chat Message Encryption Key ===')
  console.log('Add this to your backend/.env file:')
  console.log(`\nCHAT_ENCRYPTION_KEY=${key}\n`)
  console.log('Keep this key secure! Without it, encrypted messages cannot be decrypted.')
}

main().catch(console.error)
