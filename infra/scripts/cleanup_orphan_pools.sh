#!/usr/bin/env bash
# Delete Cognito identity pools named like this stack that are NOT the pool
# referenced by src/config.generated.json (left behind by empty-state applies).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

read -r PREFIX KEEP_ID REGION < <(
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

POOL_NAME="${PREFIX}-identity"
echo "Keeping Cognito pool ${KEEP_ID}; scanning for orphan '${POOL_NAME}' pools"

aws cognito-identity list-identity-pools --max-results 60 --region "$REGION" \
  --query "IdentityPools[?IdentityPoolName=='${POOL_NAME}'].[IdentityPoolId,IdentityPoolName]" \
  --output text | while read -r pool_id pool_name; do
  [[ -z "$pool_id" ]] && continue
  if [[ "$pool_id" == "$KEEP_ID" ]]; then
    echo "  keep  ${pool_id}"
    continue
  fi
  echo "  delete ${pool_id} (${pool_name})"
  aws cognito-identity delete-identity-pool --identity-pool-id "$pool_id" --region "$REGION"
done
