const fs = require('fs');

class ChecklistReporter {
  constructor() {
    this.lines = [];
  }

  onTestEnd(test, result) {
    const passed = result.status === 'passed' ? '[x]' : '[ ]';
    this.lines.push(`${passed} ${test.title}`);
  }

  onEnd() {
    fs.writeFileSync('checklist.md', this.lines.join('\n'));
  }
}

module.exports = ChecklistReporter;
