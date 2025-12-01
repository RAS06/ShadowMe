#!/bin/bash
# Script to generate self-signed SSL certificates for development

CERT_DIR="nginx/ssl"
mkdir -p "$CERT_DIR"

echo "Generating self-signed SSL certificate..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERT_DIR/key.pem" \
  -out "$CERT_DIR/cert.pem" \
  -subj "/C=US/ST=State/L=City/O=ShadowMe/CN=localhost"

chmod 600 "$CERT_DIR/key.pem"
chmod 644 "$CERT_DIR/cert.pem"

echo "SSL certificates generated in $CERT_DIR/"
echo "cert.pem - Certificate"
echo "key.pem - Private key"
