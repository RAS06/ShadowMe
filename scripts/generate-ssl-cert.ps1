# PowerShell script to generate self-signed SSL certificates for development

$certDir = "nginx\ssl"
New-Item -ItemType Directory -Force -Path $certDir | Out-Null

Write-Host "Generating self-signed SSL certificate..." -ForegroundColor Green

# Create certificate
$cert = New-SelfSignedCertificate `
    -DnsName "localhost" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -KeyExportPolicy Exportable `
    -KeySpec Signature `
    -KeyLength 2048 `
    -KeyAlgorithm RSA `
    -HashAlgorithm SHA256 `
    -NotAfter (Get-Date).AddYears(1)

# Export certificate
$certPath = Join-Path $certDir "cert.pem"
$keyPath = Join-Path $certDir "key.pem"

# Export as PFX first
$pfxPath = Join-Path $certDir "temp.pfx"
$password = ConvertTo-SecureString -String "temp" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $password | Out-Null

# Convert to PEM using OpenSSL (if available) or provide instructions
if (Get-Command openssl -ErrorAction SilentlyContinue) {
    # Extract certificate
    & openssl pkcs12 -in $pfxPath -clcerts -nokeys -out $certPath -password pass:temp -passin pass:temp
    # Extract private key
    & openssl pkcs12 -in $pfxPath -nocerts -out $keyPath -password pass:temp -passin pass:temp -passout pass:temp
    # Remove passphrase from key
    & openssl rsa -in $keyPath -out $keyPath -passin pass:temp
    
    Remove-Item $pfxPath
    Remove-Item "Cert:\CurrentUser\My\$($cert.Thumbprint)"
    
    Write-Host "SSL certificates generated successfully!" -ForegroundColor Green
    Write-Host "Location: $certDir\" -ForegroundColor Cyan
    Write-Host "  - cert.pem: Certificate" -ForegroundColor White
    Write-Host "  - key.pem: Private key" -ForegroundColor White
} else {
    Write-Host "OpenSSL not found. Please install OpenSSL or use WSL to run the bash script." -ForegroundColor Yellow
    Write-Host "PFX certificate exported to: $pfxPath" -ForegroundColor Cyan
    Write-Host "You can use this with IIS or convert it using OpenSSL." -ForegroundColor White
}
