# End-to-End Notification Test Script for PowerShell

Write-Host "🧪 Testing GhostReply Push Notifications Flow" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$DOMAIN = "http://localhost:3000"
$TEST_DEVICE_ID = "test-device-$(Get-Date -Format yyyyMMddHHmmss)"

Write-Host "Step 1: Check Backend Health" -ForegroundColor Yellow
Write-Host "---"

try {
    $response = Invoke-WebRequest -Uri "$DOMAIN/" -Method GET -ErrorAction SilentlyContinue
    Write-Host "✅ Backend is responding (HTTP $($response.StatusCode))"
} catch {
    Write-Host "⚠️  Backend check: $($_.Exception.Message)"
}

Write-Host ""

# Step 2: Generate test expo token
$timestamp = Get-Date -Format yyyyMMddHHmmssfff
$testToken = "ExponentPushToken[TEST$timestamp]"

Write-Host "Step 2: Generate Test Expo Push Token" -ForegroundColor Yellow
Write-Host "---"
Write-Host "Generated token: $testToken"
Write-Host ""

# Step 3: Test token registration endpoint
Write-Host "Step 3: Register Push Token" -ForegroundColor Yellow
Write-Host "---"

$body = @{
    token = $testToken
} | ConvertTo-Json

Write-Host "Request Body:"
Write-Host $body
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$DOMAIN/api/notifications/token" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "X-Device-Id" = $TEST_DEVICE_ID
        } `
        -Body $body

    Write-Host "Response:"
    Write-Host ($response | ConvertTo-Json)
    Write-Host "✅ Token registration successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Token registration failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Step 4: Test notification sending
Write-Host "Step 4: Send Test Notification" -ForegroundColor Yellow
Write-Host "---"

$testBody = @{
    token = $testToken
} | ConvertTo-Json

Write-Host "Request Body:"
Write-Host $testBody
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$DOMAIN/api/notifications/test" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "X-Device-Id" = $TEST_DEVICE_ID
        } `
        -Body $testBody

    Write-Host "Response:"
    Write-Host ($response | ConvertTo-Json)
    Write-Host "✅ Test notification sent successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Test notification failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================================" 
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "================================================================" 
Write-Host "Device ID: $TEST_DEVICE_ID"
Write-Host "Token: $($testToken.Substring(0, [Math]::Min(50, $testToken.Length)))..."
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Run app on device/emulator and grant notification permissions"
Write-Host "2. App will automatically register real token at startup"
Write-Host "3. Token will be stored in push_tokens database table"
Write-Host "4. Check notification_history table for sent notifications"
Write-Host ""
