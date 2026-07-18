#!/usr/bin/env bash
# Ensure the S3 bucket (and optional lock table) for the Terraform remote
# backend exist. Safe to re-run — creates only when missing.
set -euo pipefail

ACCOUNT_ID="${AWS_ACCOUNT_ID:-904581404707}"
REGION="${AWS_REGION:-ap-southeast-2}"
BUCKET="sound-light-tfstate-${ACCOUNT_ID}"
LOCK_TABLE="sound-light-tf-locks"

if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "State bucket s3://${BUCKET} already exists"
else
  echo "Creating state bucket s3://${BUCKET} in ${REGION}"
  if [[ "$REGION" == "us-east-1" ]]; then
    aws s3api create-bucket --bucket "$BUCKET" --region "$REGION"
  else
    aws s3api create-bucket \
      --bucket "$BUCKET" \
      --region "$REGION" \
      --create-bucket-configuration "LocationConstraint=${REGION}"
  fi
  aws s3api put-bucket-versioning \
    --bucket "$BUCKET" \
    --versioning-configuration Status=Enabled
  aws s3api put-public-access-block \
    --bucket "$BUCKET" \
    --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
fi

if aws dynamodb describe-table --table-name "$LOCK_TABLE" --region "$REGION" >/dev/null 2>&1; then
  echo "Lock table ${LOCK_TABLE} already exists"
else
  echo "Creating lock table ${LOCK_TABLE}"
  aws dynamodb create-table \
    --table-name "$LOCK_TABLE" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION" >/dev/null
  aws dynamodb wait table-exists --table-name "$LOCK_TABLE" --region "$REGION"
fi
