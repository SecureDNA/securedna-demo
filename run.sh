docker run --name synthclient \
--env SECUREDNA_SYNTHCLIENT_TOKEN_FILE="/certs/token.st" \
--env SECUREDNA_SYNTHCLIENT_KEYPAIR_FILE="/certs/token.priv" \
--env SECUREDNA_SYNTHCLIENT_KEYPAIR_PASSPHRASE_FILE="/certs/token.passphrase" \
--volume ./:/certs/:z \
--detach \
-p 80:80 \
ghcr.io/securedna/synthclient \
./synthclient