# SecureDNA Synthclient

This SecureDNA Codespaces demo is an interactive, hands-on environment that allows users to experience our screening system directly from their browser. Users can run synthclient to test sample sequences, observe how hazards are identified and reported, and explore integration capabilities with our API, all without needing to install anything locally. This demo provides an authentic experience of how SecureDNA's platform functions in real-world applications, making it ideal for professionals looking to evaluate or integrate our advanced screening technologies.

## Template instructions



### Getting certificate and generate tokens

1. Get a Certificate from the SecureDNA team

    1.1. First generate a certificate request, https://securedna.org/cert-request/

    1.2. Submit the cert request on https://securedna.org/start/

2. With the certificate you have received from SecuerDNA, generate your tokens here https://securedna.org/synth-token/ 
3. Login to Github, open this repository in a codespace (press the green "Use this template" button and click "Open in Codespace" -
4. Drag your token files (generated in 2)`token.priv`, `token.st` into the codespace root directory (the left tree view)
5. Create a new file called `token.passphrase` and paste your passphrase into it (password used in 2)

### Start Docker instance and use web interface

6. Run the following commands in the terminal

    ```bash
    bash run.sh
    ```
    - Ignore the popup
    - in the terminal, you will see a URL, copy that and paste it into your browser.
    - In the browser, you should now see the web interface which you can play around with.

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



