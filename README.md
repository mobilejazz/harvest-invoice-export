# Harvest invoice exporter

CLI to export invoices into PDF format for long-term storage purposes. Also generates a summary of exported invoices in CSV format.

Install like this:

    sudo npm install -g

Use like this:

    mkdir invoices
    harvest-invoice-export -k 1234.abababbkks33cret -a 12345 -o invoices -f 20150101 -t 20150331

Full usage instructions:
```
Usage: harvest-invoice-export [options]

Options:
  -V, --version                      output the version number
  -o, --out <dir>                    Output directory. Must exist.
  -k, --access-token <access-token>  Harvest personal access token (https://id.getharvest.com/developers).
  -a, --account-id <account-id>      Harvest account ID (https://id.getharvest.com/developers).
  -f, --from <YYYYMMDD>              Starting issue date (inclusive)
  -t, --to <YYYYMMDD>                Ending issue date (inclusive)
  -h, --help                         display help for command
```

Note from the author: this is my first Javascript in ages. Please don't judge me by this code :)
