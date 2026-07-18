#!/usr/bin/env bash
# Import already-provisioned AWS resources into Terraform state when the remote
# state object is empty (first run after enabling the shared-bucket backend, or
# recovery). No-ops once `aws_dynamodb_table.mixes` is already in state.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "${ROOT}/.." && pwd)"
cd "$ROOT"

read -r PREFIX POOL_ID REGION < <(
  REPO_ROOT="$REPO_ROOT" python3 - <<'PY'
import json, os
root = os.environ["REPO_ROOT"]
shared = json.load(open(f"{root}/config/shared.json"))
generated = json.load(open(f"{root}/src/config.generated.json"))
print(
    f"{shared['project']}-{shared['environment']}",
    generated["cognitoIdentityPoolId"],
    shared["region"],
)
PY
)

if terraform state list 2>/dev/null | grep -q '^aws_dynamodb_table\.mixes$'; then
  echo "Terraform state already contains resources — skipping import"
  exit 0
fi

echo "Importing existing ${PREFIX} resources into Terraform state"
echo "  Cognito pool: ${POOL_ID}"

# Prefer the pool id the SPA already ships; fall back to looking up by name.
if ! aws cognito-identity describe-identity-pool \
  --identity-pool-id "$POOL_ID" --region "$REGION" >/dev/null 2>&1; then
  echo "Configured pool ${POOL_ID} not found; resolving by name ${PREFIX}-identity"
  POOL_ID="$(
    aws cognito-identity list-identity-pools --max-results 60 --region "$REGION" \
      --query "IdentityPools[?IdentityPoolName=='${PREFIX}-identity'].IdentityPoolId | [0]" \
      --output text
  )"
  if [[ -z "$POOL_ID" || "$POOL_ID" == "None" ]]; then
    echo "No identity pool named ${PREFIX}-identity found — cannot import" >&2
    exit 1
  fi
  echo "  Using pool: ${POOL_ID}"
fi

terraform import -input=false aws_dynamodb_table.mixes "${PREFIX}-mixes"
terraform import -input=false aws_dynamodb_table.user_settings "${PREFIX}-user-settings"
terraform import -input=false aws_cognito_identity_pool.main "$POOL_ID"
terraform import -input=false aws_iam_role.authenticated "${PREFIX}-authenticated"
terraform import -input=false \
  aws_iam_role_policy.authenticated_dynamodb \
  "${PREFIX}-authenticated:${PREFIX}-authenticated-dynamodb"
terraform import -input=false aws_cognito_identity_pool_roles_attachment.main "$POOL_ID"

echo "Import complete"
