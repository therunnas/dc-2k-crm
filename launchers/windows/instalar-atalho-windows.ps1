$ProjectDir = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Launcher = Join-Path $ProjectDir "2K Command OS.vbs"

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

Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show("Atalhos criados na Área de Trabalho e no Menu Iniciar.", "2K Command OS")
