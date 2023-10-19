import fs from 'fs';
import csvParser from 'async-csv';

const dataSetFromCSV = async (filePath) => {
    console.log(`READING DATA FROM CSV ${filePath}`);
    const csvString = fs.readFileSync(filePath, 'utf-8');
    const columns = [
      'project',
      'startDate',
      'endDate',
      'cost',
    ];
    return csvParser.parse(csvString, { columns, trim: true, from_line: 2, delimiter: ',' });
  };


async function main() {

    const data = await dataSetFromCSV('set2.csv')
    console.log("data: ", data);
}

main().catch((e) => console.error(e));
