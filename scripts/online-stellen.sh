#!/usr/bin/env bash
# Stellt Wissenstag auf GitHub Pages online (öffentliches Repository „wissenstag“).
# Aufruf im Projektordner: bash scripts/online-stellen.sh
set -e
GH="${GH:-gh}"
command -v "$GH" >/dev/null 2>&1 || GH="/c/Users/pauls/AppData/Local/Microsoft/WinGet/Packages/GitHub.cli_Microsoft.Winget.Source_8wekyb3d8bbwe/bin/gh.exe"
NUTZER=$("$GH" api user --jq .login)
"$GH" auth setup-git
if ! "$GH" repo view "$NUTZER/wissenstag" >/dev/null 2>&1; then
  "$GH" repo create wissenstag --public --description "Wissenstag: Lernseite für Allgemeinwissen" --source . --remote origin
fi
git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$NUTZER/wissenstag.git"
# Die GitHub Action darf neue Nachrichten speichern
"$GH" api -X PUT "repos/$NUTZER/wissenstag/actions/permissions/workflow" -f default_workflow_permissions=write -F can_approve_pull_request_reviews=false
# GitHub Pages über GitHub Actions einschalten
"$GH" api -X POST "repos/$NUTZER/wissenstag/pages" -f build_type=workflow >/dev/null 2>&1 || true
git push -u origin main
echo ""
echo "Fertig. In zwei bis drei Minuten ist die Seite hier erreichbar:"
echo "https://$NUTZER.github.io/wissenstag/"
