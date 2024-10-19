#!/bin/bash

# Define the expected file paths
TOKEN_FILE="./token.st"
PASSPHRASE_FILE="./token.passphrase"
KEYPAIR_FILE="./token.priv"

echo "Starting synthclient:"
echo "====================="

# Check if the required files exist
if [[ ! -f "$TOKEN_FILE" ]]; then
  echo "Error: $TOKEN_FILE does not exist."
  exit 1
fi

if [[ ! -f "$PASSPHRASE_FILE" ]]; then
  echo "Error: $PASSPHRASE_FILE does not exist."
  exit 1
fi

if [[ ! -f "$KEYPAIR_FILE" ]]; then
  echo "Error: $KEYPAIR_FILE does not exist."
  exit 1
fi


docker run --name synthclient \
--env SECUREDNA_SYNTHCLIENT_TOKEN_FILE="/certs/token.st" \
--env SECUREDNA_SYNTHCLIENT_KEYPAIR_FILE="/certs/token.priv" \
--env SECUREDNA_SYNTHCLIENT_KEYPAIR_PASSPHRASE_FILE="/certs/token.passphrase" \
--volume ./:/certs/:z \
--detach \
-p 80:80 \
ghcr.io/securedna/synthclient \
./synthclient

# Get container status
container_status=$(docker inspect --format '{{.State.Status}}' synthclient)
container_id=$(docker inspect --format '{{.Id}}' synthclient)

# Check if the status contains "running"
if [[ $container_status == "running" ]]; then
  echo "Successful start"
  echo "Please visit"
  gh codespace ports visibility  80:public  -c  $CODESPACE_NAME
  echo "https://pages.securedna.org/web-interface/?api=https://${CODESPACE_NAME}-80.app.github.dev"
  echo "Enjoy!"
else
  echo "Failed to start. Showing logs:"
  echo "=============================="
  docker logs synthclient
  echo "=============================="
  echo "Removing unused container"
  docker rm $container_id
fi