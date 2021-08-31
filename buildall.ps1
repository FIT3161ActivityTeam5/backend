Set-Location lib/src
Get-ChildItem |
Where-Object {$_.PsIsContainer} |
ForEach-Object {
    Set-Location $_.name
    $dir = Split-Path -leaf -path (Get-Location)
    Write-Output "Building $dir..."  
    tsc
    Set-Location ..
}
Set-Location ../..