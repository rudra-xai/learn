# Converts the training source files into the view-only web formats used by
# the portal. Run it on a Windows PC after changing any course file, then
# commit and push the updated media/ folder.
#
#   powershell -ExecutionPolicy Bypass -File tools\build-media.ps1 -Source "C:\...\Education_Training"
#   (add -IncludeInsured to also publish Module 0 and the Insured Edition deck)
#
# Needs: ffmpeg + Poppler (winget install Gyan.FFmpeg.Essentials oschwartz10612.Poppler)
#        Microsoft PowerPoint (to export slides)
#
# What it produces (original MP4 / PDF / PPTX files are never copied in):
#   media/video/<id>/index.m3u8 + seg-*.ts   videos split into 6-second chunks
#   media/video/<id>/captions.vtt            captions from the video's subtitle track
#   media/slides/<deck>/s-NNN.jpg            slides, watermarked
#   media/handbook/p-NNN.jpg                 handbook pages, watermarked
#   downloads/RudraX_AI_Desk_Reference.pdf   the one downloadable file
#   assets/js/build.js                       which optional content was built
param(
  [Parameter(Mandatory)] [string] $Source,
  [switch] $IncludeInsured,
  [switch] $SkipVideo
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$media = Join-Path $root 'media'

function Find-Tool($name) {
  $cmd = Get-Command $name -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $hit = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter "$name.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($hit) { return $hit.FullName }
  throw "$name not found. Install it with winget (see the top of this script)."
}
$ffmpeg = Find-Tool 'ffmpeg'
$pdftoppm = Find-Tool 'pdftoppm'

Add-Type -AssemblyName System.Drawing
$jpeg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$jpegParams = New-Object System.Drawing.Imaging.EncoderParameters 1
$jpegParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 82L

# Resize to $Width, tile a diagonal "view only" watermark over it, save as JPEG.
function Save-Watermarked([string] $in, [string] $out, [int] $Width) {
  $src = [System.Drawing.Image]::FromFile($in)
  $h = [int][math]::Round($Width * $src.Height / $src.Width)
  $bmp = New-Object System.Drawing.Bitmap $Width, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAliasGridFit'
  $g.Clear([System.Drawing.Color]::White)
  $g.DrawImage($src, 0, 0, $Width, $h)
  $font = New-Object System.Drawing.Font 'Arial', ([float]($Width / 70)), ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(26, 128, 128, 128))
  $text = 'RUDRA-X AI  |  VIEW ONLY  |  NOT FOR DISTRIBUTION'
  $size = $g.MeasureString($text, $font)
  $g.TranslateTransform($Width / 2, $h / 2); $g.RotateTransform(-24)
  $span = [math]::Sqrt($Width * $Width + $h * $h)
  for ($y = -$span / 2; $y -lt $span / 2; $y += $size.Height * 9) {
    $offset = if ([int]($y / ($size.Height * 9)) % 2) { $size.Width / 2 } else { 0 }
    for ($x = -$span / 2 - $offset; $x -lt $span / 2; $x += $size.Width * 1.7) { $g.DrawString($text, $font, $brush, [float]$x, [float]$y) }
  }
  $bmp.Save($out, $jpeg, $jpegParams)
  $font.Dispose(); $brush.Dispose(); $g.Dispose(); $bmp.Dispose(); $src.Dispose()
}

function Reset-Dir($path) { if (Test-Path $path) { Remove-Item -Recurse -Force $path }; New-Item -ItemType Directory -Force $path | Out-Null }
$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("rx-build-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force $tmp | Out-Null

try {
  # ---- Videos: HLS chunks + captions -------------------------------------
  $videos = [ordered]@{
    'm00' = 'Module_00_*.mp4'; 'm01' = 'Module_01_*.mp4'; 'm02' = 'Module_02_*.mp4'; 'm03' = 'Module_03_*.mp4'
    'm04' = 'Module_04_*.mp4'; 'm05' = 'Module_05_*.mp4'; 'm06' = 'Module_06_*.mp4'; 'm07' = 'Module_07_*.mp4'
    'm08a' = 'Module_08A_*.mp4'; 'm08b' = 'Module_08B_*.mp4'; 'm09' = 'Module_09_*.mp4'; 'm10' = 'Module_10_*.mp4'
  }
  if (-not $SkipVideo) {
    Reset-Dir (Join-Path $media 'video')
    foreach ($id in $videos.Keys) {
      if ($id -eq 'm00' -and -not $IncludeInsured) { continue }
      $file = Get-ChildItem $Source -Filter $videos[$id] | Select-Object -First 1
      if (-not $file) { throw "No video matching $($videos[$id]) in $Source" }
      $out = Join-Path $media "video\$id"; New-Item -ItemType Directory -Force $out | Out-Null
      Write-Host "video $id  <- $($file.Name)"
      & $ffmpeg -v error -y -i $file.FullName -map 0:v:0 -map 0:a:0 -c copy -f hls -hls_time 6 -hls_playlist_type vod `
        -hls_segment_filename (Join-Path $out 'seg-%03d.ts') (Join-Path $out 'index.m3u8')
      if ($LASTEXITCODE) { throw "ffmpeg failed on $($file.Name)" }
      & $ffmpeg -v error -y -i $file.FullName -map 0:s:0 (Join-Path $out 'captions.vtt')
      if ($LASTEXITCODE) { Write-Warning "No caption track in $($file.Name)" }
    }
  }

  # ---- Slides: export with PowerPoint, watermark -------------------------
  $decks = [ordered]@{ 'market' = 'RudraX_AI_Practice_Assurance_Market_Edition.pptx' }
  if ($IncludeInsured) { $decks['insured'] = 'RudraX_AI_Practice_Assurance_Insured_Edition_PRESENTER_ONLY.pptx' }
  Reset-Dir (Join-Path $media 'slides')
  $counts = @{}
  $ppt = New-Object -ComObject PowerPoint.Application
  try {
    foreach ($deck in $decks.Keys) {
      $pres = $ppt.Presentations.Open((Join-Path $Source $decks[$deck]), $true, $false, $false)
      $raw = Join-Path $tmp "slides-$deck"; New-Item -ItemType Directory -Force $raw | Out-Null
      $out = Join-Path $media "slides\$deck"; New-Item -ItemType Directory -Force $out | Out-Null
      $w = $pres.PageSetup.SlideWidth; $h = $pres.PageSetup.SlideHeight
      foreach ($s in $pres.Slides) { $s.Export((Join-Path $raw ('s-{0:D3}.png' -f $s.SlideIndex)), 'PNG', 1920, [int](1920 * $h / $w)) }
      $counts[$deck] = $pres.Slides.Count
      $pres.Close()
      Get-ChildItem $raw -Filter *.png | ForEach-Object { Save-Watermarked $_.FullName (Join-Path $out ($_.BaseName + '.jpg')) 1600 }
      Write-Host "slides ${deck}: $($counts[$deck])"
    }
  } finally { $ppt.Quit(); [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null }

  # ---- Handbook: render pages, watermark ---------------------------------
  $hb = Join-Path $media 'handbook'; Reset-Dir $hb
  $raw = Join-Path $tmp 'handbook'; New-Item -ItemType Directory -Force $raw | Out-Null
  & $pdftoppm -png -r 150 (Join-Path $Source '3_Course_Handbook_VIEW_ONLY.pdf') (Join-Path $raw 'p')
  if ($LASTEXITCODE) { throw 'pdftoppm failed on the handbook' }
  $i = 0
  Get-ChildItem $raw -Filter *.png | Sort-Object Name | ForEach-Object { $i++; Save-Watermarked $_.FullName (Join-Path $hb ('p-{0:D3}.jpg' -f $i)) 1240 }
  $counts['handbook'] = $i
  Write-Host "handbook pages: $i"

  # ---- Desk reference: the one downloadable file -------------------------
  $dl = Join-Path $root 'downloads'; Reset-Dir $dl
  Copy-Item (Join-Path $Source '4_Desk_Reference_CARRY_ON.pdf') (Join-Path $dl 'RudraX_AI_Desk_Reference.pdf')

  # ---- Record what was built, for the site to read -----------------------
  $built = @{ insured = [bool]$IncludeInsured; counts = $counts; builtAt = (Get-Date).ToString('yyyy-MM-dd') } | ConvertTo-Json -Compress
  Set-Content -Encoding UTF8 (Join-Path $root 'assets\js\build.js') "// Generated by tools/build-media.ps1 - do not edit by hand.`nwindow.RX_BUILD = $built;"
  Write-Host 'Done.'
} finally { Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue }
