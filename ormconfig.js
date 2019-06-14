module.exports = {
	type: 'postgres',
	host: 'localhost',
	port: 5432,
	username: 'postgres',
	password: 'postgres',
	database: 'timeclock',
	synchronize: true,
	logging: process.env.NODE_ENV === 'development',
	entities: ['src/entity/**/*'],
};
