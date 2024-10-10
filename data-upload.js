const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Open the serial port with a baud rate of 9600 (must match with Arduino)
const port = new SerialPort({
  path: 'COM5',  // Replace with your actual serial port address
  baudRate: 9600  // Baud rate
});

const fs = require('fs');
let flowEventCount = 0;  // To track the number of flow events

// Example function: receive and save the flow data
function saveFlowData(flowRate) {
  flowEventCount++;  // Increment the flow event count
  
  // Example: save the data to a file
  fs.appendFileSync('flowData.txt', `[Flow Event #${flowEventCount}] (Water Flow: ${flowRate} mL) (Time: ${getCurrentFormattedTime()})\n`, (err) => {
    if (err) throw err;
  });

  console.log(`Flow Event #${flowEventCount} exported successfully.`);
}

// Set up a line parser to process incoming data line by line
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// Listen for incoming data from the serial port
parser.on('data', (data) => {
  // Extract the flow rate from the data using a regex match
  const flowRateMatch = data.match(/Water Flow: (\d+(\.\d+)?)/);
  if (flowRateMatch) {
    const flowRate = parseFloat(flowRateMatch[1]);
    
    // Pass the extracted flow data to the export function
    saveFlowData(flowRate);
  }
});

function getCurrentFormattedTime() {
  const now = new Date();  // Get the current date and time

  // Extract the hours, minutes, and seconds
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // Extract the day, month, and year
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = String(now.getFullYear()).slice(-2);  // Get last two digits of the year

  // Format the time and date as HH:MM:SS DD/MM/YY
  const formattedTime = `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;

  return formattedTime;
}