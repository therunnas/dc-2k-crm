Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

projectDir = fso.GetParentFolderName(WScript.ScriptFullName)
htaPath = projectDir & "\launchers\windows\2K Command OS.hta"

If Not fso.FileExists(htaPath) Then
    MsgBox "Executor visual n?o encontrado:" & vbCrLf & htaPath, vbCritical, "2K Command OS"
    WScript.Quit
End If

shell.Run "mshta.exe """ & htaPath & """", 1, False
