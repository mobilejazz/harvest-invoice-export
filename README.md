# Harvest invoice exporter

CLI to export invoices into PDF format for long-term storage purposes. Also generates a summary of exported invoices in CSV format.

Install like this:

    sudo npm install -g

Use like this:

	mkdir invoices
    harvest-invoice-export -u someone@mobilejazz.com -p s00p3rs3cr31 -s mobilejazz -o invoices -f 20150101 -t 20150331

Full usage instructions:
```
  Usage: harvest-invoice-export [options]

  Options:

    -h, --help                   output usage information
    -V, --version                output the version number
    -o, --out <dir>              Output directory. Must exist.
    -u, --email <email>          Harvest email address.
    -p, --password <password>    Harvest password.
    -s, --subdomain <subdomain>  Harvest subdomain.
    -f, --from <YYYYMMDD>        Starting issue date (inclusive)
    -t, --to <YYYYMMDD>          Ending issue date (inclusive)
```

Note from the author: this is my first Javascript in ages. Please don't judge me by this code :)
