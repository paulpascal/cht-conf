const { expect } = require('chai');
const joi = require('@hapi/joi');
const rewire = require('rewire');

const validateDeclarativeSchema = rewire('../../src/lib/validate-declarative-schema');

const buildContactAction = typeName => ({
  name: 'patient_create',
  icon: 'icon-person',
  title: 'patient_create',
  appliesTo: 'contacts',
  appliesToType: ['clinic'],
  appliesIf: () => true,
  resolvedIf: () => false,
  actions: [
    {
      type: typeName || 'contact',
      form: 'home_visit',
      modifyContent: function (content, contact) {
        content.type = 'person';
        content.parent_id = contact && contact.contact._id;
      }
    }
  ],
  events: [
    {
      id: 'creation-follow-up',
      start: 3, end: 7,
      dueDate: function (event, contact) {
        return contact.contact.reported_date;
      }
    }
  ]
});

describe('validate-declarative-schema', () => {
  describe('validate', () => {
    const validate = (...args) => validateDeclarativeSchema.__get__('validate')('desc', ...args);
    const TaskSchema = validateDeclarativeSchema.__get__('TaskSchema');

    it('array.unique', () => {
      const schema = joi.array().items(joi.object()).unique('name');
      const actual = validate([{ name: 'a' }, { name: 'a' }], schema);
      expect(actual).to.deep.eq(['desc[1] contains duplicate value for the "name" field: "a"']);
    });

    it('actions[].type = report no errors', () => {
      const actual = validate([buildContactAction('report')], TaskSchema);
      expect(actual).to.be.empty;
    });

    it('actions[].type = contact no errors', () => {
      const actual = validate([buildContactAction()], TaskSchema);
      expect(actual).to.be.empty;
    });

    it('actions[].type = wrong-type-name then error', () => {
      const actual = validate([buildContactAction('wrong-type-name')], TaskSchema);
      expect(actual).to.deep.eq([
        '"[0].actions[0].type" must be one of [report, contact]. Value is: "wrong-type-name"'
      ]);
    });

    it('a[0].events or [0].actions empty then required error', () => {
      const actual = validate([
        {
          name: 'patient_create',
          icon: 'icon-person',
          title: 'patient_create',
          appliesTo: 'contacts',
          appliesToType: ['clinic'],
          appliesIf: () => true,
          resolvedIf: () => false
        }
      ], TaskSchema);
      expect(actual).to.deep.eq([
        '"[0].events" is required',
        '"[0].actions" is required'
      ]);
    });

    it('array.unique internal', () => {
      const schema = joi.array().items(joi.object({
        event: joi.array().items(joi.object()).unique('id'),
      }));
      const actual = validate([{ event: [{ id: 'x' }, { id: 'x' }] }], schema);
      expect(actual).to.deep.eq(['desc[0].event[1] contains duplicate value for the "id" field: "x"']);
    });

    it('custom errors', () => {
      const schema = joi.array().items(
        joi.object({
          priority: joi.object().required().error(new Error('custom error'))
        })
      ).required();
      const actual = validate([{ priority: 'high' }], schema);
      expect(actual).to.deep.eq(['custom error']);
    });

    it('string set', () => {
      const schema = joi.string().valid('contacts', 'reports', 'scheduled_tasks').required();
      const actual = validate('no', schema);
      expect(actual).to.deep.eq(['"value" must be one of [contacts, reports, scheduled_tasks]. Value is: "no"']);
    });
  });
});
