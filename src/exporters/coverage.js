const Mocha = require('mocha');
const path = require('path');
const libReport = require('istanbul-lib-report');
const createMap = require('istanbul-lib-coverage').createCoverageMap;
const reports = require('istanbul-reports');

class LibraryCoverageReporter extends Mocha.reporters.Base {
  constructor(runner) {
    super(runner);

    let currentSuite = null;
    const coverageReports = [];

    runner.on(Mocha.Runner.constants.EVENT_SUITE_BEGIN, (suite) => {
      currentSuite = suite;
    });

    runner.on(Mocha.Runner.constants.EVENT_SUITE_END, () => {
      if (currentSuite.coverageReport) {
        coverageReports.push(currentSuite.coverageReport);
      }
    });

    runner.on(Mocha.Runner.constants.EVENT_RUN_END, () => {
      const coverage = [];
      for (const coverageReport of coverageReports) {
        const coverageData = {
          path: path.join(coverageReport.paths[0], `${coverageReport.library.id}.cql`), //will fail if multiple paths
          statementMap: this.parseExpressonLocator(coverageReport.expressions),
          fnMap: {},
          branchMap: {},
          s: coverageReport.covered,
          f: {},
          b: {}
        };      
        coverage.push(coverageData);
      }
      LibraryCoverageReporter.writeReport(coverage, 'coverage');
    });
  }

  parseExpressonLocator(originalObject) {
    const parsedObject = {};

    for (const key in originalObject) {
      if (originalObject[key].locator) {
        const locator = originalObject[key].locator;
        const [start, end] = locator.split('-');
        const [startLine, startColumn] = start.split(':').map(Number);
        const [endLine, endColumn] = end.split(':').map(Number);

        parsedObject[key] = {
          start: { line: startLine, column: startColumn },
          end: { line: endLine, column: endColumn }
        };
      }
    }

    return parsedObject;
  }

  static writeReport(coverage, coveragePath) {
    const coverageMap = createMap({});
    for (const coverageData of coverage) {
      coverageMap.addFileCoverage(coverageData);
    }    

    // create a context for report generation
    const context = libReport.createContext({
      dir: `${coveragePath}`,
      // The summarizer to default to (may be overridden by some reports)
      // values can be nested/flat/pkg. Defaults to 'pkg'
      defaultSummarizer: 'nested',
      coverageMap
    });

    // create an instance of the relevant report class, passing the
    // report name e.g. json/html/html-spa/text
    const report = reports.create('lcov', {});

    // call execute to synchronously create and write the report to disk
    report.execute(context);
  }

  static initCoverageReport(librarySource, libraryPaths) {
    const coverageReport = {
      library: librarySource.identifier,
      paths: libraryPaths
    };
    coverageReport.expressions = this.extractLocalIdData(librarySource.statements.def);
    coverageReport.covered = Object.keys(coverageReport.expressions).reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});
    return coverageReport;
  }

  static extractLocalIdData(jsonArray) {
    const resultObject = {};

    function recursiveSearch(obj) {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }

      // Check if the current object has a 'localId' property
      if (obj['localId']) {
        const localId = obj.localId;
        const extractedData = {};

        // Iterate over the properties of the object
        for (const key in obj) {
          const value = obj[key];
          // Check if the value is a literal (not an object or array)
          if (value !== null && typeof value !== 'object') {
            extractedData[key] = value;
          }          
        }

        // Check if 'locator' and 'type' is not null in the extracted data
        // Skip types that don't require unit testing - alias, as, type specifiers, literals and property extractors
        if (extractedData.locator !== undefined && extractedData.type !== undefined &&
          extractedData.alias === undefined &&
          (extractedData.type !== 'As' && !extractedData.type.includes('TypeSpecifier') && extractedData.type !== 'Literal' && extractedData.type !== 'Property')
        ) {
          resultObject[localId] = extractedData;
        }
      }

      // Recursively search through all properties of the object, skipping signature and resultTypeSpecifier
      for (const key in obj) {
        if (typeof obj[key] === 'object' && key !== 'signature' && key !== 'resultTypeSpecifier') {
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
    for (const localId of keys) {
      // Check if the key exists in the expressions map
      if (coverageReport.expressions[localId]) {
        coverageReport.covered[localId] += 1;
      }
    }
  }
}

module.exports = LibraryCoverageReporter;