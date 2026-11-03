#!/usr/bin/env bash
# Publishes https://duvagiang.web.app: one HTML page on Firebase, everything else from GitHub Pages.
# Firebase's free plan allows about 360 MB/day, too little for photos and music across all guests.
# Push to GitHub first, then run this from the repo root whenever index.html changes.
set -euo pipefail
OUT=dist-short-domain
rm -rf "$OUT"
mkdir "$OUT"
sed 's|<head>|<head>\n    <base href="https://thaideptrai218.github.io/tien-du-huong-giang/" />|' index.html > "$OUT/index.html"
grep -q '<base href=' "$OUT/index.html"
firebase deploy --only hosting --project duvagiang
