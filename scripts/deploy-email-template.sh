#!/bin/bash
set -euo pipefail

PROJECT_REF="forfvifldysmnrpgreym"

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "❌ SUPABASE_ACCESS_TOKEN no está definido."
  echo "   Creá uno en https://supabase.com/dashboard/account/tokens"
  echo "   Luego: export SUPABASE_ACCESS_TOKEN='sbp_...'"
  exit 1
fi

CONTENT=$(cat supabase/templates/confirmation.html | sed 's/"/\\"/g' | tr -d '\n')

echo "📧 Actualizando template de confirmación…"

curl -s -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"mailer_subjects_confirmation\": \"Confirmá tu correo — Upiti\",
    \"mailer_templates_confirmation_content\": \"$CONTENT\"
  }" | jq .

echo ""
echo "✅ Template actualizado."
echo "   Verificá en https://supabase.com/dashboard/project/$PROJECT_REF/auth/templates"
