const path = require('path')

module.exports = {
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.resolve(__dirname, 'vitest.setup.js')]
  }
}
