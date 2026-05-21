$ErrorActionPreference = "Stop"

$ProjectDir = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$ServerDir = Join-Path $ProjectDir "apps\server"
$EnvPath = Join-Path $ServerDir ".env"
$GitignorePath = Join-Path $ProjectDir ".gitignore"

function Convert-SecureStringToPlainText {
  param([Security.SecureString]$SecureString)

  $BSTR = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureString)

  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($BSTR)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
  }
}

Write-Host ""
Write-Host "=================================================="
Write-Host "        2K COMMAND OS - CONFIGURAR .ENV"
Write-Host "=================================================="
Write-Host ""

if (!(Test-Path $ServerDir)) {
  Write-Host "ERRO: Pasta apps/server nao encontrada."
  exit 1
}

if (Test-Path $EnvPath) {
  Write-Host "Ja existe um arquivo .env em:"
  Write-Host $EnvPath
  Write-Host ""
  $overwrite = Read-Host "Deseja substituir o .env atual? (S/N)"

  if ($overwrite.ToUpper() -ne "S") {
    Write-Host ""
    Write-Host "Configuracao cancelada. O .env atual foi mantido."
    exit 0
  }
}

$port = Read-Host "Porta do backend [3333]"
if ([string]::IsNullOrWhiteSpace($port)) {
  $port = "3333"
}

$enableDiscord = Read-Host "Ativar Discord Bot agora? (S/N)"

if ($enableDiscord.ToUpper() -eq "S") {
  Write-Host ""
  Write-Host "Cole o TOKEN do bot. Ele nao sera exibido na tela."
  $secureToken = Read-Host "DISCORD_BOT_TOKEN" -AsSecureString
  $token = Convert-SecureStringToPlainText $secureToken

  $guildId = Read-Host "DISCORD_GUILD_ID"
  $channelId = Read-Host "DISCORD_ALERT_CHANNEL_ID"

  if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "ERRO: Token nao pode ficar vazio se o bot estiver ativo."
    exit 1
  }

  if ([string]::IsNullOrWhiteSpace($guildId)) {
    Write-Host "ERRO: Guild ID nao pode ficar vazio se o bot estiver ativo."
    exit 1
  }

  if ([string]::IsNullOrWhiteSpace($channelId)) {
    Write-Host "ERRO: Channel ID nao pode ficar vazio se o bot estiver ativo."
    exit 1
  }

  $botEnabled = "true"
} else {
  $botEnabled = "false"
  $token = ""
  $guildId = ""
  $channelId = ""
}

@"
PORT=$port

DISCORD_BOT_ENABLED=$botEnabled
DISCORD_BOT_TOKEN=$token
DISCORD_GUILD_ID=$guildId
DISCORD_ALERT_CHANNEL_ID=$channelId
"@ | Set-Content -Encoding UTF8 $EnvPath

if (Test-Path $GitignorePath) {
  $gitignore = Get-Content $GitignorePath -Raw

  if ($gitignore -notmatch "apps/server/\.env") {
    Add-Content $GitignorePath "`n# Local environment`napps/server/.env`n"
  }
}

Write-Host ""
Write-Host "=================================================="
Write-Host " .env configurado com sucesso."
Write-Host " Caminho: $EnvPath"
Write-Host "=================================================="
Write-Host ""
Write-Host "DISCORD_BOT_ENABLED=$botEnabled"
Write-Host "PORT=$port"
Write-Host ""
Write-Host "Token protegido: nao exiba nem suba para o GitHub."
Write-Host ""
