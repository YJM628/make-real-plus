/**
 * Mock for ?raw imports in Jest
 * This allows Jest to handle Vite's ?raw import syntax
 */

const fs = require('fs');
const path = require('path');

module.exports = {
  process(sourceText, sourcePath) {
    // The sourcePath will be the actual .md file path without ?raw
    // Read the file content
    const content = fs.readFileSync(sourcePath, 'utf-8');
    
    // Return as a module that exports the content as a string
    return {
      code: `module.exports = ${JSON.stringify(content)};`,
    };
  },
};
