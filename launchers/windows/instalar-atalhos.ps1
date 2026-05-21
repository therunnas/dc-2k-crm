$ProjectDir = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Launcher = Join-Path $ProjectDir "launchers\windows\2K Command OS.bat"

$Desktop = [Environment]::GetFolderPath("Desktop")
$StartMenu = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs"

$Shell = New-Object -ComObject WScript.Shell

$DesktopShortcut = Join-Path $Desktop "2K Command OS.lnk"
$Shortcut = $Shell.CreateShortcut($DesktopShortcut)
$Shortcut.TargetPath = $Launcher
$Shortcut.WorkingDirectory = $ProjectDir
$Shortcut.IconLocation = "$env:SystemRoot\System32\SHELL32.dll,220"
$Shortcut.Save()

$StartShortcut = Join-Path $StartMenu "2K Command OS.lnk"
$Shortcut2 = $Shell.CreateShortcut($StartShortcut)
$Shortcut2.TargetPath = $Launcher
$Shortcut2.WorkingDirectory = $ProjectDir
$Shortcut2.IconLocation = "$env:SystemRoot\System32\SHELL32.dll,220"
$Shortcut2.Save()

Write-Host ""
Write-Host "Atalhos criados:"
Write-Host "- Area de Trabalho: 2K Command OS"
Write-Host "- Menu Iniciar: 2K Command OS"
Write-Host ""
