import dotenv from 'dotenv';
dotenv.config();

export const IN_PROD = process.env.NODE_ENV === 'production';

export const {
	SESS_NAME = 'tsid',
	SESS_SECRET = 'aspa98hf9hwiu93',
	SESS_LIFETIME = 1000 * 60 * 30, // 5 minutes
	CAS_HOST,
	CAS_SERVICE_VALIDATE,
	CAS_LOGIN,
	ADMIN_NETID,
	ADMIN_EMAIL,
	ADMIN_PASSWORD,
	TEST_USER_NETID = 'testuser',
	TEST_USER_EMAIL = 'test@example.com',
	TEST_USER_PASSWORD = 'password',
} = process.env;
