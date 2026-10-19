#!/bin/bash

# Script para configurar variáveis de ambiente

ENV_NAME=$1

if [ -z "$ENV_NAME" ]; then
  echo "Usage: ./variables.sh <environment-name>"
  exit 1
fi

echo "Setting up environment for: $ENV_NAME"

# Aqui você pode adicionar lógica para buscar variáveis do AWS Secrets Manager,
# Azure Key Vault, ou outro gerenciador de segredos

# Exemplo:
# aws secretsmanager get-secret-value --secret-id "$ENV_NAME" --query SecretString --output text > .env

echo "Environment setup complete!"
