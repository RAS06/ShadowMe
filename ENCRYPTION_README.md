# Chat Encryption Documentation

## Overview

ShadowMe implements comprehensive encryption for chat messages using both **transport layer encryption (TLS/SSL)** and **database-level encryption** to ensure maximum security and privacy.

## Security Features

### 1. Transport Layer Encryption (HTTPS/WSS)

**Technology:** Nginx with TLS 1.2/1.3  
**Purpose:** Encrypts all data in transit between client and server

All communication happens over encrypted channels:
- **HTTPS** for web pages and API calls (port 443)
- **WSS** (WebSocket Secure) for real-time chat messages
- HTTP (port 80) automatically redirects to HTTPS

**Benefits:**
- Prevents man-in-the-middle attacks
- Protects against eavesdropping
- Ensures data integrity during transmission

### 2. Database-Level Message Encryption

**Technology:** Libsodium (authenticated encryption with secretbox)  
**Purpose:** Encrypts message content before storing in MongoDB

Every chat message is encrypted using:
- **Algorithm:** XSalsa20-Poly1305 (authenticated encryption)
- **Key Size:** 256 bits (32 bytes)
- **Nonce:** Unique random nonce for each message
- **Authentication:** Built-in message authentication (prevents tampering)

**Benefits:**
- Messages are encrypted at rest in the database
- Even with database access, messages remain unreadable without the encryption key
- Each message uses a unique nonce (prevents pattern analysis)
- Message authentication detects any tampering attempts

## Architecture

```
Client (Browser)
    ↓ HTTPS/WSS (TLS encrypted)
Nginx (Reverse Proxy)
    ↓ Internal network
Backend Server
    ↓ Encrypt with libsodium
MongoDB (Encrypted storage)
```

## Configuration

### SSL Certificates

For development, self-signed certificates are generated automatically. For production, replace with proper certificates:

```bash
# Certificate files location
nginx/ssl/cert.pem  # SSL certificate
nginx/ssl/key.pem   # Private key
```

### Encryption Key

The chat encryption key must be set in `backend/.env`:

```bash
CHAT_ENCRYPTION_KEY=<64-character-hex-string>
```

**Generate a new key:**
```bash
node backend/scripts/generate-encryption-key.js
```

**IMPORTANT:** 
- Keep this key secure!
- Back it up safely
- Without this key, encrypted messages cannot be decrypted
- Never commit this key to version control

## Implementation Details

### Message Encryption Flow

1. **Sending a message:**
   ```
   User types message → Socket.io sends via WSS → 
   Backend receives → Encrypt with libsodium → 
   Save encrypted message to MongoDB
   ```

2. **Receiving messages:**
   ```
   Query MongoDB → Retrieve encrypted messages → 
   Decrypt with libsodium → Send via WSS → 
   Display to user
   ```

### Encryption Process

```javascript
// Encryption (backend/utils/encryption.js)
1. Generate random nonce (24 bytes)
2. Encrypt message with XSalsa20
3. Authenticate with Poly1305 MAC
4. Combine: nonce + ciphertext
5. Encode as Base64
6. Store in database
```

### Decryption Process

```javascript
// Decryption (backend/utils/encryption.js)
1. Decode from Base64
2. Extract nonce (first 24 bytes)
3. Extract ciphertext (remaining bytes)
4. Verify MAC and decrypt
5. Return plaintext message
```

## Security Best Practices

### For Administrators:

1. **Protect the encryption key:**
   - Never expose `CHAT_ENCRYPTION_KEY` publicly
   - Use environment variables, not hardcoded values
   - Back up the key in a secure location

2. **Use proper SSL certificates in production:**
   - Replace self-signed certificates with CA-signed certificates
   - Use Let's Encrypt for free automated certificates
   - Ensure certificates don't expire

3. **Monitor and rotate keys:**
   - Plan for key rotation strategy
   - Keep audit logs of encryption key changes
   - Test backup/recovery procedures

4. **Network security:**
   - Keep nginx and backend on internal network
   - Only expose nginx (reverse proxy) to public
   - Use firewall rules to restrict access

### For Developers:

1. **Never log plaintext messages**
2. **Always use the encryption utilities**
3. **Test encryption in your development environment**
4. **Handle decryption failures gracefully**

## Testing

### Test Encryption Locally

```bash
cd backend
npm test -- encryption.test.js
```

### Verify HTTPS

1. Access https://localhost (browser warning is normal for self-signed cert)
2. Check browser dev tools → Security tab
3. Verify connection is using TLS 1.2 or 1.3

### Verify Database Encryption

1. Connect to MongoDB
2. Query chat_messages collection
3. Verify `message` field contains encrypted Base64 strings (not plaintext)

```javascript
// Example encrypted message in DB:
{
  message: "YourBase64EncryptedString==",  // Not plaintext!
  senderId: "...",
  timestamp: "..."
}
```

## Troubleshooting

### "Decryption failed" errors

**Cause:** Encryption key mismatch or corrupted data

**Solutions:**
- Verify `CHAT_ENCRYPTION_KEY` is set correctly in `.env`
- Ensure the same key is used across all instances
- Check if key was changed after messages were encrypted

### Certificate errors in browser

**Cause:** Self-signed certificate not trusted

**Solutions:**
- Accept the certificate warning (dev only)
- Add certificate to system trust store
- Use proper CA-signed certificate for production

### WebSocket connection fails over HTTPS

**Cause:** Nginx misconfiguration

**Solutions:**
- Check nginx logs: `docker logs shadowme-nginx`
- Verify WebSocket proxy settings in `nginx.conf`
- Ensure backend Socket.io is accepting connections

## Performance Considerations

- **Encryption overhead:** ~0.5ms per message (negligible)
- **Memory:** Minimal impact (streaming encryption)
- **Database size:** Encrypted messages are ~30% larger due to nonce and encoding

## Compliance

This implementation helps meet security requirements for:
- HIPAA (Healthcare data protection)
- GDPR (Data protection at rest and in transit)
- SOC 2 (Security controls)

## References

- [Libsodium Documentation](https://doc.libsodium.org/)
- [TLS Best Practices](https://wiki.mozilla.org/Security/Server_Side_TLS)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
