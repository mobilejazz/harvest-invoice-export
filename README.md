# Harvest invoice exporter

CLI to export invoices into PDF format for long-term storage purposes. Also generates a summary of exported invoices in CSV format.

Install like this:

    sudo npm install -g

Use like this:

	mkdir invoices
    harvest-invoice-export -u someone@mobilejazz.com -p s00p3rs3cr31 -o invoices -f 20150101 -t 20150331

Note from the author: this is my first Javascript in ages. Please don't judge me by this code :)