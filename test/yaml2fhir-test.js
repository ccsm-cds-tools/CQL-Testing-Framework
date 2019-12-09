const yaml = require('js-yaml');
const {expect} = require('chai');
const yaml2fhir = require('../src/yaml2fhir');

describe('#yaml2fhir', () => {
  describe('#dstu2', () => {
    it('should convert a simple blank Patient', () => {
      const data = yaml.safeLoad(`
        resourceType: Patient
      `);
      const result = yaml2fhir(data, null, 'dstu2');
      idFriendlyExpectEqual(result, {
        resourceType: 'Patient',
        id: 'assigned'
      });
    });

    it('should convert a simple blank Patient with supplied patientId', () => {
      const data = yaml.safeLoad(`
        resourceType: Patient
      `);
      const result = yaml2fhir(data, '123', 'dstu2');
      expect(result).to.eql({
        resourceType: 'Patient',
        id: '123'
      });
    });

    it('should convert a simple blank Encounter with proper defaults and reference to Patient', () => {
      const data = yaml.safeLoad(`
        resourceType: Encounter
      `);
      const result = yaml2fhir(data, '123', 'dstu2');
      idFriendlyExpectEqual(result, {
        resourceType: 'Encounter',
        patient: { reference: 'Patient/123'},
        status: 'finished'
      });
    });

    it.skip('should convert a Patient with top-level properties', () => {
      const data = yaml.safeLoad(`
        resourceType: Patient
        active: true
        name: Bobby Jones
        gender: male
        birthDate: 2000-11-30
        maritalStatus: http://hl7.org/fhir/marital-status#U Unmarried
      `);
      const result = yaml2fhir(data, '123', 'dstu2');
      expect(result).to.eql({
        resourceType: 'Patient',
        id: '123',
        active: true,
        name: [{
          family: ['Jones'],
          given: ['Bobby']
        }],
        gender: 'male',
        birthDate: '2000-11-30',
        maritalStatus: {
          coding: [{
            system: 'http://hl7.org/fhir/marital-status',
            code: 'U',
            display: 'Unmarried'
          }],
          text: 'Unmarried'
        }
      });
    });

    it('should convert an Observation with top-level properties', () => {
      const data = yaml.safeLoad(`
        resourceType: Observation
        id: 456
        status: amended
        code: LOINC#12345-6 Fake LOINC Code
        issued: 2018-10-10
        comments: My Comments
      `);
      const result = yaml2fhir(data, '123', 'dstu2');
      expect(result).to.eql({
        resourceType: 'Observation',
        id: '456',
        subject: { reference: 'Patient/123'},
        status: 'amended',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '12345-6',
            display: 'Fake LOINC Code'
          }],
          text: 'Fake LOINC Code'
        },
        issued: '2018-10-10T00:00:00.000Z',
        comments: 'My Comments'
      });
    });

    it('should throw an error for an unsupported version of FHIR', () => {
      const data = yaml.safeLoad(`
        resourceType: Patient
      `);
      expect(() => yaml2fhir(data, '123', 'r4')).to.throw('Unsupported version of FHIR: r4');
    });

    it('should throw an error if the data does not declare its resourceType', () => {
      const data = yaml.safeLoad(`
        id: abc
      `);
      expect(() => yaml2fhir(data, '123', 'dstu2')).to.throw('Each data object must specify its "resourceType"');
    });

    it('should throw an error for an unsupported FHIR resource type', () => {
      const data = yaml.safeLoad(`
        resourceType: MedicationRequest
      `);
      // Note: MedicationRequests is not in DSTU2 (it is called MedicationOrder in DSTU2)
      expect(() => yaml2fhir(data, '123', 'dstu2')).to.throw('Unsupported resourceType: MedicationRequest');
    });

    it('should throw an error for an invalid property', () => {
      const data = yaml.safeLoad(`
        resourceType: Procedure
        notDone: true
      `);
      // Note: Procedure.notDone is not in DSTU2 (it is "notPerformed" in DSTU2)
      expect(() => yaml2fhir(data, '123', 'dstu2')).to.throw('Procedure does not contain the property: notDone');
    });
  });
});

// Checks equality, allowing for a run-time assigned id
function idFriendlyExpectEqual(actual, expected) {
  // First make sure an id was assigned
  expect(typeof actual.id).to.equal('string');
  expect(actual.id.length).to.be.greaterThan(0);
  // Then set the id on the expected object, so at least that is equal
  expected.id = actual.id;
  // And finally check equality
  expect(actual).to.eql(expected);
}
