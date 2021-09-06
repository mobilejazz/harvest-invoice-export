#!/usr/bin/env node
var program = require('commander');
var fs = require('fs');
var assert = require('assert');
const https = require("https");
var sanitize = require("sanitize-filename");

program
  .version('2.0.0')
  .requiredOption('-o, --out <dir>', 'Output directory. Must exist.')
  .requiredOption('-k, --access-token <access-token>', 'Harvest personal access token (https://id.getharvest.com/developers).')
  .requiredOption('-a, --account-id <account-id>', 'Harvest account ID (https://id.getharvest.com/developers).')
  .requiredOption('-f, --from <YYYYMMDD>', 'Starting issue date (inclusive)')
  .requiredOption('-t, --to <YYYYMMDD>', 'Ending issue date (inclusive)')
  .parse(process.argv);

const options = program.opts();
assert.equal(typeof (options.accessToken), 'string', "Please specify your access token");
assert.equal(typeof (options.accountId), 'string', "Please specify your account id");
assert.equal(typeof (options.from), 'string', "Please specify from");
assert.ok(/^\d{8}$/.test(options.from), "Please specify from in format YYYYMMDD");
assert.equal(typeof (options.to), 'string', "Please specify to");
assert.ok(/^\d{8}$/.test(options.to), "Please specify to in format YYYYMMDD");
assert.equal(typeof (options.out), 'string', "Please specify directory");
assert.ok(fs.lstatSync(options.out).isDirectory(), "Output specified is not a directory");

getDomain(options.accessToken, options.accountId).then(domain => {
	getInvoices(options.from, options.to, options.accessToken, options.accountId).then(invoices => {
		printInvoiceSummary(invoices);
		downloadInvoicesToDisk(domain, invoices, options.out);
	});	
});

function getInvoices(from, to, accessToken, accountId) {
	return new Promise((resolve, reject) => {
		https.get({
			protocol: "https:",
			host: "api.harvestapp.com",
			path: "/v2/invoices?" + new URLSearchParams({
				"from": from, 
				"to": to, 
				"page": "1",
				"per_page": "100",
			}).toString(),
			headers: {
			  "User-Agent": "Mobile Jazz Harvest invoice exporter",
			  "Authorization": "Bearer " + accessToken,
			  "Harvest-Account-Id": accountId,
			}
		}, (res) => {
			const { statusCode } = res;
			if (statusCode !== 200) throw `Request failed with status: ${statusCode}`;
			
			res.setEncoding('utf8');
			let rawData = '';
			res.on('data', (chunk) => { rawData += chunk; });
			res.on('end', () => {
				let parsedData;
				try {
					parsedData = JSON.parse(rawData);
					if (parsedData.total_pages > 1) {
						throw 'not implemented: more than 100 invoices in time frame';
					}
				} catch (e) {
					reject(e);
				}
				resolve(parsedData.invoices);
			});
		}).on('error', (e) => {
			reject(e);
		});
	});
}

function getDomain(accessToken, accountId) {
	return new Promise((resolve, reject) => {
		https.get({
			protocol: "https:",
			host: "api.harvestapp.com",
			path: "/v2/company",
			headers: {
			  "User-Agent": "Mobile Jazz Harvest invoice exporter",
			  "Authorization": "Bearer " + accessToken,
			  "Harvest-Account-Id": accountId,
			}
		}, (res) => {
			const { statusCode } = res;
			if (statusCode !== 200) throw `Request failed with status: ${statusCode}`;
			
			res.setEncoding('utf8');
			let rawData = '';
			res.on('data', (chunk) => { rawData += chunk; });
			res.on('end', () => {
				let parsedData;
				try {
					parsedData = JSON.parse(rawData);
				} catch (e) {
					reject(e);
				}
				resolve(parsedData.full_domain);
			});
		}).on('error', (e) => {
			reject(e);
		});
	});
}

function printInvoiceSummary(invoices) {
	var json2csv = require('json2csv');
	var headers = ["Invoice Date", "Serial No", "Company", "Base", "IVA", "Total", "Currency"];

	// transform
	var json = invoices.reverse().map(function (invoice) {
		return {
			"Invoice Date": invoice.issue_date,
			"Serial No": invoice.number,
			"Company": invoice.client.name,
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

function downloadInvoicesToDisk(domain, invoices, outFolder) {
	invoices.forEach(function (invoice) {
		var filename = outFolder + '/' + sanitize(invoice.issue_date.replace(/-/g, "_") + " " + invoice.number + " " + invoice.client.name + ".pdf");
		var url = "https://" + domain + "/client/invoices/" + invoice.client_key + ".pdf"
		downloadFile(url, filename);
	});
}

function downloadFile(url, filename) {
	const file = fs.createWriteStream(filename);
	https.get(url, function(response) {
		response.pipe(file);
	});
}

