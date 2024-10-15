# SecureDNA Synthclient

## Template instructions

1. Get a Certificate from the SecureDNA team
1.1 First generate a certificate request
1.2 Submit the cert request on https://securedna.org/start/
2. With the certificate you have recevied from SecuerDNA Generate your tokens - https://securedna.org/synth-token/ 
3. Open this repository in a codespace
4. Drag your token files into the codespace root directory, they should be named token
6. Run the following commands in the terminal
```bash
sh run.sh
```
6.1 to check if everything is ok, run the following command
```bash
docker ps -a
docker logs [insert CONTAINER ID from previous command]
```

7. Open a new terminal window and run the following command to test the synthclient
```bash
sh simple_test.sh
```
8. Try a more complex example by running the following command. This example shows how to use the synthclient to process a fasta file and calculate some statistics
```bash
npx ts-node test.ts
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



