# Quick script to promote a user to doctor
# Usage: .\promote-doctor.ps1 user@example.com "Clinic Name" "123 Address"

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$false)]
    [string]$ClinicName = "Test Clinic",
    
    [Parameter(Mandatory=$false)]
    [string]$Address = "123 Test Street"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Promoting user: $Email to doctor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Get the user ID from MongoDB
Write-Host "`nStep 1: Looking up user ID..." -ForegroundColor Yellow

$getUserScript = @"
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: '$Email' });
    if (!user) {
      console.log('ERROR:User not found');
      process.exit(1);
    }
    console.log('USERID:' + user.id);
    process.exit(0);
  } catch (err) {
    console.log('ERROR:' + err.message);
    process.exit(1);
  }
})();
"@

$response = docker exec shadowme-backend node -e $getUserScript

$userId = $null
foreach ($line in $response -split "`n") {
    $trimmed = $line.Trim()
    if ($trimmed -match "^USERID:(.+)$") {
        $userId = $Matches[1]
        break
    }
    if ($trimmed -match "^ERROR:") {
        Write-Host "Error: $trimmed" -ForegroundColor Red
        exit 1
    }
}

if (-not $userId) {
    Write-Host "Error: Could not find user with email $Email" -ForegroundColor Red
    Write-Host "Make sure the user has signed up first!" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found user ID: $userId" -ForegroundColor Green

# Step 2: Call the promotion API
Write-Host "`nStep 2: Calling promotion API..." -ForegroundColor Yellow

$body = @{
    userId = $userId
    clinicName = $ClinicName
    address = $Address
    adminKey = "super_secret_admin_key_2025"
} | ConvertTo-Json

try {
    # Workaround for PowerShell 5.1 - ignore SSL errors
    add-type @"
        using System.Net;
        using System.Security.Cryptography.X509Certificates;
        public class TrustAllCertsPolicy : ICertificatePolicy {
            public bool CheckValidationResult(
                ServicePoint sPoint, X509Certificate cert,
                WebRequest wRequest, int certProb) {
                return true;
            }
        }
"@
    [System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

    $result = Invoke-RestMethod -Uri "https://localhost/api/admin/promote-with-key" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "SUCCESS! User promoted to doctor" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`nDoctor ID: $($result.doctorId)" -ForegroundColor Cyan
    Write-Host "New Token: $($result.token)" -ForegroundColor Yellow
    Write-Host "`nIMPORTANT: The user must LOG OUT and LOG BACK IN for the changes to take effect!" -ForegroundColor Magenta
    
} catch {
    Write-Host "`nError calling API:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
    exit 1
}
