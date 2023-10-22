# Reimbursement Calculator

This project is a simple reimbursement calculator which will calculate a reimbursement total for a trip, or a sequence of trips, provided in an input file. 

To get started, we need to add 2 project libraries: 

The first is async-csv, which is used to process our input files.

    npm install async-csv --save

Next is moment.js, which we use for date comparisons, etc. 

    npm install moment --save

The script can be run from the terminal using the following command: 

    Node index.js set1.csv

set1.csv in the line above represent the relative path to the input file with the travel information. Additional test input files can be added/used, assuming they follow the same format as the existing input sets. It is important to note that moment.js expects the input file dates in the format YYYY-MM-DD. If other date formats are passed in the input file, an error will likely be output to the terminal when moment.js parses the dates.