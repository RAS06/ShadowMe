const sodium = require('libsodium-wrappers')

let ready = false
let cachedKey = null

// Initialize libsodium
async function init() {
  if (!ready) {
    await sodium.ready
    ready = true
  }
}

// Get or generate encryption key from environment
function getEncryptionKey() {
  // Return cached key if available
  if (cachedKey) {
    return cachedKey
  }
  
  const keyHex = process.env.CHAT_ENCRYPTION_KEY
  
  if (!keyHex) {
    console.warn('CHAT_ENCRYPTION_KEY not set in environment. Generating temporary key. WARNING: Messages will not be decryptable after server restart!')
    // Generate a random key (only for development) and cache it
    cachedKey = sodium.crypto_secretbox_keygen()
    return cachedKey
  }
  
  // Convert hex string to Uint8Array
  const keyBytes = Buffer.from(keyHex, 'hex')
  if (keyBytes.length !== sodium.crypto_secretbox_KEYBYTES) {
    throw new Error(`Invalid CHAT_ENCRYPTION_KEY length. Expected ${sodium.crypto_secretbox_KEYBYTES} bytes (${sodium.crypto_secretbox_KEYBYTES * 2} hex chars)`)
  }
  
  cachedKey = keyBytes
  return cachedKey
}

/**
 * Encrypt a message using libsodium secretbox (authenticated encryption)
 * @param {string} plaintext - The message to encrypt
 * @returns {Promise<string>} Base64-encoded encrypted message with nonce
 */
async function encryptMessage(plaintext) {
  await init()
  
  if (!plaintext) return plaintext
  
  try {
    const key = getEncryptionKey()
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
    const messageBytes = sodium.from_string(plaintext)
    
    // Encrypt the message
    const ciphertext = sodium.crypto_secretbox_easy(messageBytes, nonce, key)
    
    // Combine nonce + ciphertext and encode as base64
    const combined = new Uint8Array(nonce.length + ciphertext.length)
    combined.set(nonce)
    combined.set(ciphertext, nonce.length)
    
    return sodium.to_base64(combined, sodium.base64_variants.ORIGINAL)
  } catch (err) {
    console.error('Encryption error:', err)
    throw new Error('Failed to encrypt message')
  }
}

/**
 * Decrypt a message using libsodium secretbox
 * @param {string} encryptedData - Base64-encoded encrypted message with nonce
 * @returns {Promise<string>} Decrypted plaintext message
 */
async function decryptMessage(encryptedData) {
  await init()
  
  if (!encryptedData) return encryptedData
  
  try {
    const key = getEncryptionKey()
    
    // Decode from base64
    const combined = sodium.from_base64(encryptedData, sodium.base64_variants.ORIGINAL)
    
    // Extract nonce and ciphertext
    const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES)
    const ciphertext = combined.slice(sodium.crypto_secretbox_NONCEBYTES)
    
    // Decrypt the message
    const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key)
    
    return sodium.to_string(decrypted)
  } catch (err) {
    console.error('Decryption error:', err)
    // Return a placeholder rather than failing completely
    return '[Encrypted message - decryption failed]'
  }
}

/**
 * Generate a new encryption key and output as hex (for setup)
 * @returns {Promise<string>} Hex-encoded encryption key
 */
async function generateKey() {
  await init()
  const key = sodium.crypto_secretbox_keygen()
  return Buffer.from(key).toString('hex')
}

module.exports = {
  encryptMessage,
  decryptMessage,
  generateKey
}
