// custom-end-reporter.js
const Mocha = require('mocha');
const fs = require('fs');
const path = require('path');

class LibraryCoverageReporter extends Mocha.reporters.Base{
  constructor(runner) {
    super(runner);

    let currentSuite = null;

    runner.on(Mocha.Runner.constants.EVENT_SUITE_BEGIN, (suite) => {
      currentSuite = suite;
    });

    runner.on(Mocha.Runner.constants.EVENT_SUITE_END, () => {
      if(currentSuite.coverageReport){
        const cr = currentSuite.coverageReport;
        // eslint-disable-next-line no-console
        console.log(`${cr.library.id}: ${cr.covered}/${cr.total} ${100 * (cr.covered/cr.total)}%`);
        const jsonOutput = JSON.stringify(cr, null, 2);
        // only write file if dumpResultsPath set, otherwise just write summary to console
        if(cr.resultsPath){
          const filePath = path.join(cr.resultsPath, `${cr.library.id}.coverage.json`);
          fs.writeFileSync(filePath, jsonOutput, 'utf8');
        }        
      }
    });
  }

  static initCoverageReport(librarySource, dumpResultsPath) {
    const coverageReport = {
      library: librarySource.identifier,
      resultsPath: dumpResultsPath
    };
    coverageReport.uncoveredExpressions = this.extractLocalIdData(librarySource.statements.def);
    coverageReport.total = Object.keys(coverageReport.uncoveredExpressions).length;
    coverageReport.covered = 0;
    return coverageReport;
  }
  
  static extractLocalIdData(jsonArray) {
    const resultObject = {};
  
    function recursiveSearch(obj) {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }
  
      // Check if the current object has a 'localId' property
      if (Object.prototype.hasOwnProperty.call(obj, 'localId')) {
        const localId = obj.localId;
        const extractedData = {};
  
        // Iterate over the properties of the object
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            // Check if the value is a literal (not an object or array)
            if (value !== null && typeof value !== 'object') {
              extractedData[key] = value;
            }
          }
        }
  
        // Check if 'locator' and 'type' is not null in the extracted data
        // Skip types that don't require unit testing - alias, as, type specifiers, literal and property extractors
        if (extractedData.locator !== undefined && extractedData.type !== undefined &&
          extractedData.alias === undefined &&
          (extractedData.type !== 'As' && !extractedData.type.includes('TypeSpecifier') && extractedData.type !== 'Literal' && extractedData.type !== 'Property')
        ) {
          resultObject[localId] = extractedData;
        }
      }
  
      // Recursively search through all properties of the object, skipping signature and resultTypeSpecifier
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && key !== 'signature' && key !== 'resultTypeSpecifier') {
          recursiveSearch(obj[key]);
        }
      }
    }
  
    // Iterate over each JSON object in the array
    jsonArray.forEach(jsonObject => {
      recursiveSearch(jsonObject);
    });
  
    return resultObject;
  }
  
  static addLocalIdResultMap(testCaseResults, patientId, coverageReport) {
    // Iterate over each key in the results map
    const keys = Object.keys(testCaseResults[patientId][coverageReport.library.id]);
    for (const key of keys) {
      // Check if the key exists in the expressions map
      if (Object.prototype.hasOwnProperty.call(coverageReport.uncoveredExpressions, key)) {
        // Remove the key from the expressions map
        delete coverageReport.uncoveredExpressions[key];
        coverageReport.covered += 1;
      }
    }
  }
}

module.exports = LibraryCoverageReporter;