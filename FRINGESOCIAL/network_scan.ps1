$subnet = "192.168.0"
$results = @()

Write-Host "Scanning network $subnet.0/24..." -ForegroundColor Cyan
Write-Host ""

for ($i = 1; $i -le 254; $i++) {
    $ip = "$subnet.$i"
    Write-Progress -Activity "Scanning network" -Status "Checking $ip" -PercentComplete (($i / 254) * 100)
    
    if (Test-Connection -ComputerName $ip -Count 1 -Quiet) {
        $hostname = try { 
            [System.Net.Dns]::GetHostEntry($ip).HostName 
        } catch { 
            "Unknown" 
        }
        
        $result = [PSCustomObject]@{
            IP = $ip
            Hostname = $hostname
            Status = "Online"
        }
        
        $results += $result
        Write-Host "[+] $ip - $hostname" -ForegroundColor Green
    }
}

Write-Progress -Activity "Scanning network" -Completed

Write-Host ""
Write-Host "Scan complete. Found $($results.Count) active hosts:" -ForegroundColor Cyan
Write-Host ""

$results | Format-Table -AutoSize

# Export to CSV
$csvPath = "C:\Users\urukk\network_scan_results.csv"
$results | Export-Csv -Path $csvPath -NoTypeInformation
Write-Host "Results saved to: $csvPath" -ForegroundColor Yellow
