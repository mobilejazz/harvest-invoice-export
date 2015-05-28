#!/usr/bin/env node
var program = require('commander');
var fs = require('fs');
var assert = require('assert');

program
  .version('0.1.0')
  .option('-o, --out <dir>', 'Output directory. Must exist.')
  .option('-u, --email <email>', 'Harvest email address.')
  .option('-p, --password <password>', 'Harvest password.')
  .option('-s, --subdomain <subdomain>', 'Harvest subdomain.')
  .option('-f, --from <YYYYMMDD>', 'Starting issue date (inclusive)')
  .option('-t, --to <YYYYMMDD>', 'Ending issue date (inclusive)')
  .parse(process.argv);

assert.equal(typeof (program.email), 'string', "Please specify e-mail address");
assert.equal(typeof (program.password), 'string', "Please specify password");
assert.equal(typeof (program.subdomain), 'string', "Please specify subdomain");
assert.equal(typeof (program.from), 'string', "Please specify from");
assert.ok(/^\d{8}$/.test(program.from), "Please specify from in format YYYYMMDD");
assert.equal(typeof (program.to), 'string', "Please specify to");
assert.ok(/^\d{8}$/.test(program.to), "Please specify to in format YYYYMMDD");
assert.equal(typeof (program.out), 'string', "Please specify directory");
assert.ok(fs.lstatSync(program.out).isDirectory(), "Output specified is not a directory");

var Harvest = require('harvest'),
    harvest = new Harvest({
        subdomain: program.subdomain,
        email: program.email,
        password: program.password
    });
var sanitize = require("sanitize-filename");

getInvoices(function(err, invoices) {
    if (err) throw new Error(err);
    printInvoiceSummary(invoices);
    downloadInvoicesToDisk(invoices);
});

function getInvoices(cb, knownInvoices, pageToRequest) {
	var pageToRequest = pageToRequest || 1;
	harvest.Invoices.client.get('/invoices', {"from":program.from, "to":program.to, "page": pageToRequest}, function(err, invoices) {
		if (err) {
			cb(err);
			return;
		}
		knownInvoices = knownInvoices || [];
		knownInvoices = knownInvoices.concat(invoices);
		if (invoices.length == 50) getInvoices(cb, knownInvoices, pageToRequest+1); // next page
		else cb(null, knownInvoices); // all pages done
	});
}

function printInvoiceSummary(invoices) {
	var json2csv = require('json2csv');
	var headers = ["Invoice Date", "Serial No", "Company", "Base", "IVA", "Total", "Currency"];

	// transform
	var json = invoices.reverse().map(function (inv) {
		var invoice = inv.invoices; // weird, I dont know why they do that
		console.log(invoice);

		return {
			"Invoice Date": invoice.issued_at,
			"Serial No": invoice.number,
			"Company": invoice.client_name,
			"Base": invoice.amount - invoice.tax_amount - invoice.tax2_amount,
			"IVA": invoice.tax_amount + invoice.tax2_amount,
			"Total": invoice.amount,
			"Currency": invoice.currency
		};
	});

	// print
	json2csv({ data: json, fields: headers }, function(err, csv) {
	  if (err) console.log(err);
	  console.log(csv);
	});
}

function downloadInvoicesToDisk(invoices) {
	invoices.forEach(function (inv) {
		var invoice = inv.invoices; // weird, I dont know why they do that
		var filename = program.out + '/' + sanitize(invoice.issued_at.replace(/-/g, "_") + " " + invoice.number + " " + invoice.client_name + ".pdf");
		var url = "https://" + program.subdomain + ".harvestapp.com/client/invoices/" + invoice.client_key + ".pdf"
		downloadFile(url, filename);
	});
}

function downloadFile(url, filename) {
		var https = require('https');
		var fs = require('fs');

		var file = fs.createWriteStream(filename);
		var request = https.get(url, function(response) {
		  response.pipe(file);
		});
}

