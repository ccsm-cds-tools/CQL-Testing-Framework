const LibraryCoverageReporter = require('../src/exporters/coverage');

describe('LibraryCoverageReporter', () => {
  describe('writeReport', () => {
    it('should write Istanbul HTML report', () => {
      const coverageData = {
        path: 'test/yaml/other/cql/OtherFHIRv401Test.cql',
        statementMap: {
          '0': {
            start: { line: 2, column: 0 },
            end: { line: 2, column: 29 }
          },
          '1': {
            start: { line: 3, column: 0 },
            end: { line: 3, column: 47 }
          },
          '2': {
            start: { line: 5, column: 0 },
            end: { line: 5, column: 47 }
          }          
        },
        fnMap: {},
        branchMap: {},
        s: {
          '0': 0,
          '1': 0,
          '2': 0
        },
        f: {},
        b: {}
      };

      LibraryCoverageReporter.writeReport([coverageData], 'coverage');
    });
  });
});