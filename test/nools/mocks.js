let idCounter;
const TEST_DATE = 1431143098575;
// make the tests work in any timezone.  TODO it's not clear if this is a hack,
// or actually correct.  see https://github.com/medic/medic-webapp/issues/4928
const TEST_DAY = new Date(TEST_DATE);
TEST_DAY.setHours(0, 0, 0, 0);

const jsToString = require('../../src/lib/js-to-string');
const parseJs = require('../../src/lib/simple-js-parser');

function aReportBasedTask() {
  return aTask('reports');
}

function aPersonBasedTask() {
  var task = aTask('contacts');
  task.appliesToType = ['person'];
  return task;
}

function aPlaceBasedTask() {
  var task = aTask('contacts');
  task.appliesToType = ['clinic'];
  return task;
}

function aTask(type) {
  ++idCounter;
  return {
    appliesTo: type,
    name: `task-${idCounter}`,
    title: [ { locale:'en', content:`Task ${idCounter}` } ],
    actions: [ { form:'example-form' } ],
    events: [ {
      id: `task`,
      days:0, start:0, end:1,
    } ],
    resolvedIf: function() { return false; },
  };
}

function aScheduledTaskBasedTask() {
  ++idCounter;
  return {
    appliesTo: 'scheduled_tasks',
    name: `task-${idCounter}`,
    title: [ { locale:'en', content:`Task ${idCounter}` } ],
    actions: [],
    events: [ {
      id: `task-${idCounter}`,
      days:0, start:0, end:1,
    } ],
    resolvedIf: function() { return false; },
    appliesIf: function() { return true; },
  };
}

function aPersonBasedTarget() {
  ++idCounter;
  return {
    id: `pT-${idCounter}`,
    appliesTo: 'contacts',
    appliesToType: ['person'],
  };
}

function aPlaceBasedTarget() {
  ++idCounter;
  return {
    id: `plT-${idCounter}`,
    appliesTo: 'contacts',
    appliesToType: ['clinic'],
  };
}

function aReportBasedTarget() {
  ++idCounter;
  return {
    id: `rT-${idCounter}`,
    appliesTo: 'reports',
  };
}

function aReport() {
  ++idCounter;
  return { _id:`r-${idCounter}`, form:'F', reported_date:TEST_DATE };
}

function aReportWithScheduledTasks(scheduledTaskCount) {
  ++idCounter;

  const scheduled_tasks = [];
  while(scheduledTaskCount--) scheduled_tasks.push({ due:TEST_DATE });

  return { _id:`r-${idCounter}`, form:'F', scheduled_tasks };
}

function personWithoutReports() {
  return personWithReports();
}

function personWithReports(...reports) {
  ++idCounter;
  return { contact:{ _id:`c-${idCounter}`, type:'person', reported_date:TEST_DATE }, reports };
}

function placeWithoutReports() {
  return placeWithReports();
}

function placeWithReports(...reports) {
  ++idCounter;
  return { contact:{ _id:`c-${idCounter}`, type:'clinic', reported_date:TEST_DATE }, reports };
}

function aRandomTimestamp() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

function loadLibWith({ c, targets, tasks }) {
  return parseJs({
    jsFiles: [ `${__dirname}/../../src/nools/lib.js` ],
    header: `
        let idx1, idx2, r, target;
        const now     = new Date(${TEST_DATE});
        const c       = ${jsToString(c)};
        const targets = ${jsToString(targets)};
        const tasks   = ${jsToString(tasks)};
        const emitted = [];
        const Utils = {
          addDate: function(date, days) {
            const d = new Date(date.getTime());
            d.setDate(d.getDate() + days);
            d.setHours(0, 0, 0, 0);
            return d;
          },
          isTimely: function() { return true; },
        };
        const Target = function(props) {
          this._id = props._id;
        };
        const Task = function(props) {
          // Any property whose value you want to assert in tests needs to be
          // copied from 'props' to 'this' here.
          this._id = props._id;
          this.date = props.date;
          this.actions = props.actions;
          this.resolved = props.resolved;
        };
        function emit(type, taskOrTarget) {
          taskOrTarget._type = type;
          emitted.push(taskOrTarget);
        };
        `,
    export: [ 'emitted' ],
  });
}

module.exports = {
  reset: () => { idCounter = 0; },
  TEST_DATE,
  TEST_DAY,
  aReportBasedTask,
  aPersonBasedTask,
  aPlaceBasedTask,
  aTask,
  aScheduledTaskBasedTask,
  aPersonBasedTarget,
  aPlaceBasedTarget,
  aReportBasedTarget,
  aReport,
  aReportWithScheduledTasks,
  personWithoutReports,
  personWithReports,
  placeWithoutReports,
  placeWithReports,
  aRandomTimestamp,
  loadLibWith,
};