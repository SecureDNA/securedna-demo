curl "localhost:80/v1/screen" \
--header "Content-Type: application/json" \
--no-progress-meter \
--data-raw '
{
"fasta": ">NC_007373.1\nGAATCGCAATTAACAATAACTAAAGAGAAAAAAGAAGAACTC",
"region": "all",
"provider_reference": "documentation"
}
' | jq