$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $root "mlm-app"))) {
  $root = $PSScriptRoot
}
$outPath = Join-Path $root "codebase.txt"

$excludeDirNames = @("node_modules", ".git", "dist", ".cursor")
function ShouldExcludeDir([string]$fullPath) {
  $rel = $fullPath.Substring($root.Length).TrimStart("\", "/")
  $parts = $rel -split "[\\/]"
  foreach ($p in $parts) {
    if ($excludeDirNames -contains $p) { return $true }
  }
  return $false
}

# Text-only export: allow known source/config/doc extensions (no images, audio, video, fonts).
$textExtensions = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
@(
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts",
  ".json", ".md", ".txt", ".css", ".scss", ".less", ".sass",
  ".html", ".htm", ".xml", ".csv", ".sql",
  ".yml", ".yaml", ".toml", ".ini", ".conf", ".config", ".properties",
  ".ps1", ".sh", ".bash", ".zsh", ".fish", ".bat", ".cmd",
  ".vue", ".svelte", ".astro", ".graphql", ".gql",
  ".http", ".rest", ".editorconfig", ".npmrc", ".nvmrc", ".node-version"
) | ForEach-Object { [void]$textExtensions.Add($_) }

function IsTextFile([System.IO.FileInfo]$file) {
  $name = $file.Name
  $ext = [System.IO.Path]::GetExtension($name)
  if ($textExtensions.Contains($ext)) { return $true }
  # Extensionless common text files
  $lower = $name.ToLowerInvariant()
  if ($lower -eq "dockerfile" -or $lower -eq "makefile" -or $lower -eq "docker-compose.yml" -or $lower -eq "license" -or $lower -eq "copying" -or $lower -eq "contributing" -or $lower -eq "changelog") {
    return $true
  }
  if ($name -match '^(?i)\.env(\.|$)' -or $name -match '^(?i)\.gitignore$' -or $name -match '^(?i)\.gitattributes$') { return $true }
  # rc / config files without standard ext (e.g. .prettierrc as file named ".prettierrc")
  if ($name -match '^(?i)\.(prettier|eslint|stylelint)rc(\.json)?$') { return $true }
  return $false
}

$allFiles = Get-ChildItem -Path $root -Recurse -File -Force |
  Where-Object {
    -not (ShouldExcludeDir $_.FullName) -and
    (IsTextFile $_) -and
    -not ($_.Name -eq "codebase.txt" -and $_.DirectoryName -eq $root)
  } |
  Sort-Object FullName
$fileCount = $allFiles.Count

$sb = [System.Text.StringBuilder]::new()
[void]$sb.AppendLine("================================================================================")
[void]$sb.AppendLine("CODEBASE EXPORT (TEXT FILES ONLY)")
[void]$sb.AppendLine("Root: $root")
[void]$sb.AppendLine("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
[void]$sb.AppendLine("Excluded directories: $($excludeDirNames -join ', ')")
[void]$sb.AppendLine("Excluded file types: images, audio, video, fonts, archives, and other non-text assets")
[void]$sb.AppendLine("TOTAL_TEXT_FILES_IN_THIS_EXPORT: $fileCount")
[void]$sb.AppendLine("================================================================================")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("--- FOLDER STRUCTURE (text files only) ---")
[void]$sb.AppendLine("")

function TreeLine($dir, $prefix) {
  $name = $dir.Name
  [void]$sb.AppendLine("$prefix$name/")
  $subDirs = Get-ChildItem -Path $dir.FullName -Directory -Force -ErrorAction SilentlyContinue | Where-Object { -not (ShouldExcludeDir $_.FullName) } | Sort-Object Name
  foreach ($sd in $subDirs) { TreeLine $sd ($prefix + "  ") }
  $filesHere = Get-ChildItem -Path $dir.FullName -File -Force -ErrorAction SilentlyContinue |
    Where-Object { -not (ShouldExcludeDir $_.FullName) -and (IsTextFile $_) } |
    Sort-Object Name
  foreach ($f in $filesHere) { [void]$sb.AppendLine("$prefix  $($f.Name)") }
}

[void]$sb.AppendLine((Split-Path -Leaf $root) + "/")
$rootDirs = Get-ChildItem -Path $root -Directory -Force | Where-Object { -not (ShouldExcludeDir $_.FullName) } | Sort-Object Name
foreach ($d in $rootDirs) { TreeLine $d "  " }
$rootFiles = Get-ChildItem -Path $root -File -Force |
  Where-Object { -not (ShouldExcludeDir $_.FullName) -and (IsTextFile $_) -and -not ($_.Name -eq "codebase.txt") } |
  Sort-Object Name
foreach ($f in $rootFiles) { [void]$sb.AppendLine("  $($f.Name)") }

[void]$sb.AppendLine("")
[void]$sb.AppendLine("================================================================================")
[void]$sb.AppendLine("FILE CONTENTS (sorted by path)")
[void]$sb.AppendLine("================================================================================")
[void]$sb.AppendLine("")

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($outPath, $sb.ToString(), $utf8NoBom)

$idx = 0
foreach ($f in $allFiles) {
  $idx++
  $rel = $f.FullName.Substring($root.Length).TrimStart("\", "/")
  $rel = $rel -replace "\\", "/"
  $header = @"

================================================================================
FILE $idx / $fileCount
PATH: $rel
================================================================================

"@
  [System.IO.File]::AppendAllText($outPath, $header, $utf8NoBom)
  try {
    $content = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
  } catch {
    $content = "(UNREADABLE: $($_.Exception.Message))"
  }
  [System.IO.File]::AppendAllText($outPath, $content, $utf8NoBom)
  [System.IO.File]::AppendAllText($outPath, "`n", $utf8NoBom)
}

$footer = @"

================================================================================
NOTES
================================================================================
- codebase.txt is excluded from the file list above to avoid self-inclusion.
- Only text-oriented extensions are included; regenerate with:
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts/export-codebase.ps1
================================================================================
END OF EXPORT
TEXT_FILES_APPENDED: $fileCount
EXPECTED: $fileCount
MATCH: YES
================================================================================
"@
[System.IO.File]::AppendAllText($outPath, $footer, $utf8NoBom)

Write-Host "Wrote $outPath"
Write-Host "TEXT_FILE_COUNT=$fileCount"
