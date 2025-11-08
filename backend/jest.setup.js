// Jest setup: start an in-memory MongoDB and set MONGODB_URI so tests always have a DB
process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.MONGO_INITDB_DATABASE = process.env.MONGO_INITDB_DATABASE || 'shadowme_test'
process.env.MONGOMS_FORCE_DOWNLOAD = process.env.MONGOMS_FORCE_DOWNLOAD || 'true'

let _mongoServer
const mongoose = require('mongoose')

beforeAll(async () => {
	try {
		const { MongoMemoryServer } = require('mongodb-memory-server')
		_mongoServer = await MongoMemoryServer.create()
		process.env.MONGODB_URI = _mongoServer.getUri()
		// Ensure mongoose uses the test URI if any code connects during tests
	} catch (err) {
		// If mongodb-memory-server can't start, tests will attempt to use MONGODB_URI if provided
		// Log a warning for visibility
		// eslint-disable-next-line no-console
		console.warn('jest.setup: failed to start mongodb-memory-server:', err && err.message)
	}
})

afterAll(async () => {
	try {
		await mongoose.disconnect()
	} catch (e) {}
	try {
		if (_mongoServer) await _mongoServer.stop()
	} catch (e) {}
})
