# SecureDNA Synthclient

## Template instructions

### Getting certificate and generate tokens

1. Get a Certificate from the SecureDNA team

    1.1. First generate a certificate request, https://securedna.org/cert-request/

    1.2. Submit the cert request on https://securedna.org/start/

2. With the certificate you have received from SecuerDNA, generate your tokens here https://securedna.org/synth-token/ 
3. Open this repository in a codespace (press the green "Use this template" button and click "Open in Codespace"
4. Drag your token files (generated in 2)`token.priv`, `token.st` into the codespace root directory (the left tree view)
5. Create a new file called `token.passphrase` and paste your passphrase into it (password used in 2)

### Start Docker instance

6. Run the following commands in the terminal

    ```bash
    bash run.sh
    ```

### Run simple test

7. If started correctly, run the following command to test the synthclient

      ```bash
      sh simple_test.sh
      ```

    You should see a JSON output in the terminal. Check the file to see a minimal example on how to use the client.

### Advanced

8. Try a more complex example by running the following command. This example shows how to use the synthclient to process a fasta file and calculate some statistics

    ```bash
    npx ts-node adv_test.ts
    ```

    The output should look like this:
    ```
    === Processing file:  test.fasta
    [
      {
        organism: 'Ricin',
        percentageHit: 11.182795698924732,
        longestHitregion: 96,
        longestUniqueHitRegion: 96
      }
    ]
    ```

9. Enjoy!



