$ErrorActionPreference = "Stop"

$mysqlBin = "C:\xampp\mysql\bin"
$mysql = Join-Path $mysqlBin "mysql.exe"
$mysqlcheck = Join-Path $mysqlBin "mysqlcheck.exe"

if (-not (Test-Path -LiteralPath $mysql)) {
    throw "mysql.exe was not found at $mysql"
}

if (-not (Test-Path -LiteralPath $mysqlcheck)) {
    throw "mysqlcheck.exe was not found at $mysqlcheck"
}

Write-Host "Checking MySQL port 3306..."
$portCheck = Test-NetConnection 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue
if (-not $portCheck.TcpTestSucceeded) {
    throw "MySQL is not reachable on 127.0.0.1:3306. Start MySQL in XAMPP first."
}

Write-Host "Checking TRAMS tables..."
& $mysql -h 127.0.0.1 -P 3306 -u root -e "USE attendance_system; SELECT COUNT(*) AS accounts_count FROM accounts; SELECT COUNT(*) AS attendance_logs_count FROM attendance_logs;"

Write-Host "Running fast table checks..."
& $mysqlcheck -h 127.0.0.1 -P 3306 -u root --fast --databases attendance_system mysql phpmyadmin

Write-Host "MySQL health check complete."
