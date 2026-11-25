#!/usr/bin/env bash
# Creates the ECR repositories (if missing), tags both images and pushes them.
# Run after scripts/run-stack.sh has built the images.
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGISTRY="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
echo "Account: $ACCOUNT_ID  Region: $REGION"

aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY"

for svc in catalog-service admin-service; do
  aws ecr describe-repositories --repository-names "$svc" --region "$REGION" >/dev/null 2>&1 \
    || aws ecr create-repository --repository-name "$svc" --region "$REGION" >/dev/null
  docker tag "$svc:latest" "$REGISTRY/$svc:latest"
  docker push "$REGISTRY/$svc:latest"
done

echo
aws ecr describe-images --repository-name catalog-service --region "$REGION" \
  --query 'imageDetails[].{tags:imageTags[0],pushed:imagePushedAt,sizeMB:imageSizeInBytes}' --output table
aws ecr describe-images --repository-name admin-service --region "$REGION" \
  --query 'imageDetails[].{tags:imageTags[0],pushed:imagePushedAt,sizeMB:imageSizeInBytes}' --output table
