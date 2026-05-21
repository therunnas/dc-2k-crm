property appName : "2K Command OS"

on run
	set projectDir to my loadProjectDir()
	
	repeat
		set menuItems to {"Selecionar pasta do projeto", "Primeira configuração guiada", "Configurar ENV / Discord Bot", "Instalar dependências", "Abrir App Completo", "Abrir Backend", "Abrir Frontend", "Abrir navegador", "Atualizar projeto", "Testar status", "Parar tudo", "Sair"}
		
		set picked to choose from list menuItems with title appName with prompt ("Projeto atual:" & return & projectDir) OK button name "Executar" cancel button name "Sair"
		
		if picked is false then exit repeat
		
		set actionName to item 1 of picked
		
		if actionName is "Selecionar pasta do projeto" then
			set projectDir to my chooseProjectFolder()
			
		else if actionName is "Primeira configuração guiada" then
			if my requireProject(projectDir) then
				my configureEnv(projectDir)
				my firstSetup(projectDir)
			end if
			
		else if actionName is "Configurar ENV / Discord Bot" then
			if my requireProject(projectDir) then
				my configureEnv(projectDir)
			end if
			
		else if actionName is "Instalar dependências" then
			if my requireProject(projectDir) then
				my installDependencies(projectDir)
			end if
			
		else if actionName is "Abrir App Completo" then
			if my requireProject(projectDir) then
				my openFullApp(projectDir)
			end if
			
		else if actionName is "Abrir Backend" then
			if my requireProject(projectDir) then
				my openBackend(projectDir)
			end if
			
		else if actionName is "Abrir Frontend" then
			if my requireProject(projectDir) then
				my openFrontend(projectDir)
			end if
			
		else if actionName is "Abrir navegador" then
			open location "http://localhost:5173/dashboard"
			
		else if actionName is "Atualizar projeto" then
			if my requireProject(projectDir) then
				my updateProject(projectDir)
			end if
			
		else if actionName is "Testar status" then
			my testStatus()
			
		else if actionName is "Parar tudo" then
			my stopAll()
			display dialog "Backend e frontend finalizados." with title appName buttons {"OK"} default button "OK"
			
		else if actionName is "Sair" then
			exit repeat
		end if
	end repeat
end run

on appSupportDir()
	set basePath to POSIX path of (path to application support folder from user domain)
	return basePath & "2KCommandOS/"
end appSupportDir

on configFile()
	return (my appSupportDir()) & "executor-project-path.txt"
end configFile

on cleanPath(pathText)
	if pathText ends with "/" then
		return text 1 thru -2 of pathText
	end if
	
	return pathText
end cleanPath

on saveProjectDir(projectDir)
	do shell script "mkdir -p " & quoted form of (my appSupportDir())
	do shell script "printf %s " & quoted form of projectDir & " > " & quoted form of (my configFile())
end saveProjectDir

on loadProjectDir()
	try
		set savedPath to do shell script "cat " & quoted form of (my configFile())
		if savedPath is not "" then return my cleanPath(savedPath)
	on error
		return ""
	end try
	
	return ""
end loadProjectDir

on chooseProjectFolder()
	set chosenFolder to choose folder with prompt "Selecione a pasta raiz do projeto dc-2k-crm"
	set projectDir to my cleanPath(POSIX path of chosenFolder)
	my saveProjectDir(projectDir)
	display dialog "Pasta salva:" & return & projectDir with title appName buttons {"OK"} default button "OK"
	return projectDir
end chooseProjectFolder

on serverDir(projectDir)
	return projectDir & "/apps/server"
end serverDir

on webDir(projectDir)
	return projectDir & "/apps/web"
end webDir

on envPath(projectDir)
	return (my serverDir(projectDir)) & "/.env"
end envPath

on requireProject(projectDir)
	if projectDir is "" then
		display dialog "Nenhuma pasta do projeto foi configurada. Selecione a pasta raiz dc-2k-crm." with title appName buttons {"OK"} default button "OK" with icon caution
		return false
	end if
	
	try
		do shell script "test -d " & quoted form of (my serverDir(projectDir)) & " && test -d " & quoted form of (my webDir(projectDir))
		return true
	on error
		display dialog "Pasta inválida. Selecione a raiz do projeto dc-2k-crm." & return & return & projectDir with title appName buttons {"OK"} default button "OK" with icon caution
		return false
	end try
end requireProject

on readEnvValue(projectDir, keyName, defaultValue)
	try
		set envFile to my envPath(projectDir)
		set valueText to do shell script "if [ -f " & quoted form of envFile & " ]; then grep '^" & keyName & "=' " & quoted form of envFile & " | sed 's/^" & keyName & "=//'; fi"
		if valueText is "" then return defaultValue
		return valueText
	on error
		return defaultValue
	end try
end readEnvValue

on configureEnv(projectDir)
	set currentPort to my readEnvValue(projectDir, "PORT", "3333")
	set currentEnabled to my readEnvValue(projectDir, "DISCORD_BOT_ENABLED", "false")
	set currentGuild to my readEnvValue(projectDir, "DISCORD_GUILD_ID", "")
	set currentChannel to my readEnvValue(projectDir, "DISCORD_ALERT_CHANNEL_ID", "")
	
	set portAnswer to text returned of (display dialog "Porta do backend:" default answer currentPort with title appName buttons {"Continuar"} default button "Continuar")
	
	if currentEnabled is "true" then
		set defaultDiscordButton to "Sim"
	else
		set defaultDiscordButton to "Não"
	end if
	
	set enabledChoice to button returned of (display dialog "Ativar Discord Bot?" with title appName buttons {"Não", "Sim"} default button defaultDiscordButton)
	
	if enabledChoice is "Sim" then
		set botEnabled to "true"
		set tokenAnswer to text returned of (display dialog "Cole o DISCORD_BOT_TOKEN:" default answer "" with hidden answer with title appName buttons {"Continuar"} default button "Continuar")
		set guildAnswer to text returned of (display dialog "DISCORD_GUILD_ID / ID do servidor:" default answer currentGuild with title appName buttons {"Continuar"} default button "Continuar")
		set channelAnswer to text returned of (display dialog "DISCORD_ALERT_CHANNEL_ID / ID do canal padrão:" default answer currentChannel with title appName buttons {"Salvar"} default button "Salvar")
	else
		set botEnabled to "false"
		set tokenAnswer to ""
		set guildAnswer to ""
		set channelAnswer to ""
	end if
	
	set envContent to "PORT=" & portAnswer & linefeed & linefeed & "DISCORD_BOT_ENABLED=" & botEnabled & linefeed & "DISCORD_BOT_TOKEN=" & tokenAnswer & linefeed & "DISCORD_GUILD_ID=" & guildAnswer & linefeed & "DISCORD_ALERT_CHANNEL_ID=" & channelAnswer & linefeed
	
	do shell script "printf %s " & quoted form of envContent & " > " & quoted form of (my envPath(projectDir))
	
	display dialog ".env salvo com sucesso em:" & return & my envPath(projectDir) with title appName buttons {"OK"} default button "OK"
end configureEnv

on installDependencies(projectDir)
	tell application "Terminal"
		activate
		do script "cd " & quoted form of (my serverDir(projectDir)) & " && npm install && cd " & quoted form of (my webDir(projectDir)) & " && npm install && echo ''; echo 'Dependências instaladas. Pode fechar esta janela.'"
	end tell
end installDependencies

on firstSetup(projectDir)
	tell application "Terminal"
		activate
		do script "cd " & quoted form of (my serverDir(projectDir)) & " && npm install && npm run build && cd " & quoted form of (my webDir(projectDir)) & " && npm install && npm run build && echo ''; echo 'Primeira configuração concluída. Depois use Abrir App Completo.'"
	end tell
end firstSetup

on openBackend(projectDir)
	try
		do shell script "test -f " & quoted form of (my envPath(projectDir))
	on error
		display dialog ".env não encontrado. Configure o ENV antes de abrir o backend." with title appName buttons {"OK"} default button "OK" with icon caution
		return
	end try
	
	do shell script "/bin/zsh -lc " & quoted form of ("source ~/.zshrc >/dev/null 2>&1; export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH; cd " & quoted form of (my serverDir(projectDir)) & " && nohup npm run dev > backend.log 2>&1 < /dev/null &")
	display dialog "Backend iniciado em segundo plano." & return & "http://localhost:3333" with title appName buttons {"OK"} default button "OK"
end openBackend

on openFrontend(projectDir)
	do shell script "/bin/zsh -lc " & quoted form of ("source ~/.zshrc >/dev/null 2>&1; export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH; cd " & quoted form of (my webDir(projectDir)) & " && nohup npm run dev > frontend.log 2>&1 < /dev/null &")
	display dialog "Frontend iniciado em segundo plano." & return & "http://localhost:5173" with title appName buttons {"OK"} default button "OK"
end openFrontend

on openFullApp(projectDir)
	try
		do shell script "test -f " & quoted form of (my envPath(projectDir))
	on error
		display dialog ".env não encontrado. Configure o ENV antes de abrir o app." with title appName buttons {"OK"} default button "OK" with icon caution
		return
	end try
	
	my stopAll()
	
	do shell script "/bin/zsh -lc " & quoted form of ("source ~/.zshrc >/dev/null 2>&1; export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH; cd " & quoted form of (my serverDir(projectDir)) & " && nohup npm run dev > backend.log 2>&1 < /dev/null &")
	delay 5
	
	do shell script "/bin/zsh -lc " & quoted form of ("source ~/.zshrc >/dev/null 2>&1; export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH; cd " & quoted form of (my webDir(projectDir)) & " && nohup npm run dev > frontend.log 2>&1 < /dev/null &")
	delay 7
	
	open location "http://localhost:5173/dashboard"
	
	display dialog "App completo iniciado." & return & "Backend + Frontend + Navegador." with title appName buttons {"OK"} default button "OK"
end openFullApp

on updateProject(projectDir)
	tell application "Terminal"
		activate
		do script "cd " & quoted form of projectDir & " && git pull origin main && cd " & quoted form of (my serverDir(projectDir)) & " && npm install && npm run build && cd " & quoted form of (my webDir(projectDir)) & " && npm install && npm run build && echo ''; echo 'Atualização concluída. Pode fechar esta janela.'"
	end tell
end updateProject

on testStatus()
	set backendStatus to "OFFLINE"
	set frontendStatus to "OFFLINE"
	set botStatus to "OFFLINE"
	
	try
		do shell script "curl -s http://localhost:3333/health"
		set backendStatus to "ONLINE"
	end try
	
	try
		set botResponse to do shell script "curl -s http://localhost:3333/api/discord/bot/status"
		if botResponse contains "ready" and botResponse contains "true" then
			set botStatus to "ONLINE"
		else
			set botStatus to "CONFIGURADO, MAS OFFLINE"
		end if
	end try
	
	try
		do shell script "curl -I -s http://localhost:5173 | head -n 1"
		set frontendStatus to "ONLINE"
	end try
	
	display dialog "STATUS DO SISTEMA" & return & return & "Backend: " & backendStatus & return & "Frontend: " & frontendStatus & return & "Discord Bot: " & botStatus with title appName buttons {"OK"} default button "OK"
end testStatus

on stopAll()
	do shell script "lsof -ti:3333 | xargs kill -9 2>/dev/null || true; lsof -ti:5173 | xargs kill -9 2>/dev/null || true"
end stopAll
