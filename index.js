import fs from 'fs';
import csvParser from 'async-csv';
import moment from 'moment';

// Define our constant rate values ot use later
const lowCostRateFullDay = 75;
const lowCostRateTravelDay = 45;
const highCostRateFullDay = 85;
const highCostRateTravelDay = 55;

const newTestVarioable = 20;
console.log("newTestVariable: ", newTestVarioable);

// Function used to read the data from the csv input files
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

  // Function used to check whether or not dates abut
  const doDatesPushUp = async(endDate, startDate) => {
    const start = moment.utc(startDate);
    const end = moment.utc(endDate);
    const nextDay = end.add(1, 'days');
    return start.isSame(nextDay);
  }

 // Function used to check whether or not dates overlap
  const doDatesOverlap = async(endDate, startDate) => {
    const start = moment.utc(startDate);
    const end = moment.utc(endDate);
    return (end.isSame(start));
  }

  // Function that fills in a list of all dates between the given start and end dates
  const getDatesBetween = async(startDate, endDate, rate, project) => {
    const start = moment.utc(startDate);
    const end = moment.utc(endDate);
    const current = start.clone();
    let datesBetween = [];

    while(current.isSameOrBefore(end)){
        datesBetween.push({
            date: current.format('YYYY-MM-DD'),
            rate: rate,
            project: project,
            skip: false
        });
        current.add(1, 'days');
    }
    return datesBetween;
  }

  // Function that builds an array of all dates from a list of dates
  const getDays = async(data) => {
    const promises = data.map(async(item) => await getDatesBetween(item.startDate, item.endDate, item.cost, item.project));
    await Promise.all(promises);
    return promises;
  }

  // Function used to calculate total reimbursement amount for a trip or sequence of trips
  const calculateReimbursement = async(days) => {
    const promises = days.map(async (day, index) => {
        // Start with a default half day (travel day)
        day.length = 'H';
        
        // If this isn't our first day in a sequence, we'll compare to the previous day
        if(index !== 0){
            const pushingUp = await doDatesPushUp(days[index - 1].date, day.date);
            const overlapping = await doDatesOverlap(days[index - 1].date, day.date);

            // Adjustments based on overlapping or abutting days
            if(pushingUp || overlapping){
                
                // If two different projects, we count the previous day as a full day
                if(day.project != days[index - 1].project){
                    days[index - 1].length = 'F';
                }
                // If we aren't on the last day of the sequence and current day is a new project
                // current day will be full day, otherwise (same project as yesterday) it's a travel day
                if(index < days.length - 1){
                    if(day.project != days[index + 1].project){
                        day.length = 'H';
                    }
                    else day.length = 'F';
                }
                // If we are on the last day of a sequence, if the current project is the same as yesterday's
                // this is a travel day. Otherwise, it's a full day
                else{
                    if(day.project == days[index - 1].project){
                        day.length = 'H';
                    }
                    else day.length = 'F';
                }
            }
            // We never count the same day two times so we will mark an overlapping date with a 'skip'
            // indicator and should keep the higher rate date when applicable
            if(overlapping){
               if(day.rate == days[index - 1].rate){
                day.skip = true;
               }
               else if(day.rate == 'High' && days[index - 1].rate == 'Low'){
                days[index - 1].skip = true;
               }
               else if(day.rate == 'Low' && days[index - 1].rate == 'High'){
                day.skip = true;
               }
            }
        }
    });
    
    // Wait for all promises to resolve and then calculate totals
    await Promise.all(promises);
    const totals = days.map(day => {
        if(day.skip) return 0;
        if(day.rate == 'Low'){
            return day.length == 'H' ? lowCostRateTravelDay : lowCostRateFullDay;
        }
        else{
            return day.length == 'H' ? highCostRateTravelDay : highCostRateFullDay;
        }
        
    })

    //Return the sum of the total for each day in the sequence
    return totals.reduce((sum, x) => sum + x);
  }

  // Main function - this is our entry point
  async function main() {
    // Make sure we receive an input file location
    if (process.argv.length === 2) {
        console.error('Expected at least one argument!');
        process.exit(1);
    }

    // Set the input file location
    const file = process.argv[2];

    // Read in the dataset
    const data = await dataSetFromCSV(file);

    // Create an array of day objects with the needed information
    const daysPromises = await getDays(data);
    const days = await Promise.all(daysPromises);
   
    // Calculate our reimbursement total and log the result to the console
    const reimbursementTotal = await calculateReimbursement(days.flat());
    console.log("REIMBURSEMENT AMOUNT: ", reimbursementTotal);
 }

main().catch((e) => console.error(e));
