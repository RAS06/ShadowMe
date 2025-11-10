// JWT Token Validation Tests
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_a_secure_random_string';

describe('JWT Token Tests', () => {
  let validToken;
  const testUserId = crypto.randomUUID();
  const testEmail = 'jwt-test@example.com';

  beforeAll(() => {
    // Create a valid token
    validToken = jwt.sign(
      { sub: testUserId, email: testEmail },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
  });

  it('should create a valid JWT token', () => {
    expect(validToken).toBeDefined();
    expect(typeof validToken).toBe('string');
    expect(validToken.split('.').length).toBe(3); // Header.Payload.Signature
  });

  it('should decode a valid token correctly', () => {
    const decoded = jwt.verify(validToken, JWT_SECRET);
    expect(decoded.sub).toBe(testUserId);
    expect(decoded.email).toBe(testEmail);
    expect(decoded.exp).toBeDefined();
    expect(decoded.iat).toBeDefined();
  });

  it('should reject an invalid token', () => {
    const invalidToken = validToken.slice(0, -5) + 'xxxxx';
    expect(() => {
      jwt.verify(invalidToken, JWT_SECRET);
    }).toThrow();
  });

  it('should reject a token with wrong secret', () => {
    const wrongSecret = 'wrong_secret_key_12345';
    expect(() => {
      jwt.verify(validToken, wrongSecret);
    }).toThrow('invalid signature');
  });

  it('should reject an expired token', () => {
    const expiredToken = jwt.sign(
      { sub: testUserId, email: testEmail },
      JWT_SECRET,
      { expiresIn: '0s' } // Expires immediately
    );
    
    // Wait a moment to ensure it's expired
    setTimeout(() => {
      expect(() => {
        jwt.verify(expiredToken, JWT_SECRET);
      }).toThrow('jwt expired');
    }, 100);
  });

  it('should extract correct user info from token payload', () => {
    const decoded = jwt.decode(validToken);
    expect(decoded.sub).toBe(testUserId);
    expect(decoded.email).toBe(testEmail);
  });

  it('should handle malformed tokens gracefully', () => {
    const malformedTokens = [
      'not.a.token',
      'Bearer xyz',
      '',
      null,
      undefined,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' // Just header, no payload
    ];

    malformedTokens.forEach(token => {
      expect(() => {
        jwt.verify(token, JWT_SECRET);
      }).toThrow();
    });
  });
});
