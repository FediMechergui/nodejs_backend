// Custom test sequencer to run auth tests first to avoid interference
const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Copy tests array to avoid mutating the original
    const testsArray = Array.from(tests);
    
    // Sort tests to run auth tests first
    return testsArray.sort((testA, testB) => {
      const pathA = testA.path;
      const pathB = testB.path;
      
      // Run auth tests first
      if (pathA.includes('auth.test.js') && !pathB.includes('auth.test.js')) {
        return -1;
      }
      if (!pathA.includes('auth.test.js') && pathB.includes('auth.test.js')) {
        return 1;
      }
      
      // For all other tests, maintain alphabetical order
      return pathA.localeCompare(pathB);
    });
  }
}

module.exports = CustomSequencer;
