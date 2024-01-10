const util = require('util');

const {
	PUBLIC_BACKEND_URL,
	SC_DOMAIN = 'localhost',
	SC_THEME = 'default',
	SC_TITLE = 'dBildungscloud',
	DOCUMENT_BASE_DIR = 'https://s3.hidrive.strato.com/cloud-instances/',
	CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS,
	REDIS_URI,
	REDIS_CLUSTER_ENABLED,
	NODE_ENV = 'development',
	JWT_SHOW_TIMEOUT_WARNING_SECONDS = 3600, // 60 min
	JWT_TIMEOUT_SECONDS,
	MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE = (5 * 1024 * 1024), // 5MB
	MINIMAL_PASSWORD_LENGTH = 12,
	FEATURE_INSIGHTS_ENABLED,
	INSIGHTS_COLLECTOR_URI,
	NOTIFICATION_SERVICE_ENABLED,
	FEATURE_TEAMS_ENABLED = 'true',
	LIBRE_OFFICE_CLIENT_URL,
	NEXBOARD_USER_ID,
	NEXBOARD_API_KEY,
	FEATURE_EXTENSIONS_ENABLED,
	SHOW_VERSION,
	SW_ENABLED,
	HOST,
	PORT = '3100',
	FEATURE_ENTERTHECLOUD,
	FEATURE_JWT_EXTENDED_TIMEOUT_ENABLED,
	FEATURE_CONTACT_FORM_ATTACHMENTS_ENABLED,
	FEATURE_MINT_PAGES_ENABLED,
	FEATURE_NEXBOARD_ENABLED,
	SC_DEMO_USER_PASSWORD = 'Schulcloud1!',
	SC_DEMO_USER_NAME = 'schueler@schul-cloud.org',
	SC_SUPERHERO_USER_PASSWORD = 'Schulcloud1!',
	SC_SUPERHERO_USER_NAME = 'superhero@schul-cloud.org',
	FEATURE_NUXT_SCHOOL_ADMIN_BETA,
	ALERT_STATUS_URL = 'https://status.dbildungscloud.de',
	FEATURE_NEW_SCHOOL_ADMINISTRATION_PAGE_AS_DEFAULT_ENABLED,
	FEATURE_ALERTS_ON_HOMEPAGE_ENABLED,
	FEATURE_BUTTONS_ON_LOGINPAGE_ENABLED,
	FEATURE_SHOW_NEW_CLASS_VIEW_ENABLED,
	FEATURE_GROUPS_IN_COURSE_ENABLED,
	FEATURE_NEST_SYSTEMS_API_ENABLED,
} = process.env;

const exp = {
	PUBLIC_BACKEND_URL,
	SC_DOMAIN,
	SC_THEME,
	SC_TITLE,
	DOCUMENT_BASE_DIR,
	CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS: parseInt(CONSENT_WITHOUT_PARENTS_MIN_AGE_YEARS || 16, 10),
	REDIS_URI,
	REDIS_CLUSTER_ENABLED,
	NODE_ENV,
	JWT_SHOW_TIMEOUT_WARNING_SECONDS,
	JWT_TIMEOUT_SECONDS,
	MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE,
	MINIMAL_PASSWORD_LENGTH,
	FEATURE_INSIGHTS_ENABLED,
	INSIGHTS_COLLECTOR_URI,
	NOTIFICATION_SERVICE_ENABLED,
	FEATURE_TEAMS_ENABLED,
	LIBRE_OFFICE_CLIENT_URL,
	NEXBOARD_USER_ID,
	NEXBOARD_API_KEY,
	FEATURE_EXTENSIONS_ENABLED,
	SHOW_VERSION,
	SW_ENABLED,
	HOST,
	PORT,
	FEATURE_ENTERTHECLOUD,
	FEATURE_JWT_EXTENDED_TIMEOUT_ENABLED,
	FEATURE_CONTACT_FORM_ATTACHMENTS_ENABLED,
	FEATURE_MINT_PAGES_ENABLED,
	FEATURE_NEXBOARD_ENABLED,
	SC_DEMO_USER_PASSWORD,
	SC_DEMO_USER_NAME,
	SC_SUPERHERO_USER_PASSWORD,
	SC_SUPERHERO_USER_NAME,
	FEATURE_NUXT_SCHOOL_ADMIN_BETA,
	ALERT_STATUS_URL,
	FEATURE_NEW_SCHOOL_ADMINISTRATION_PAGE_AS_DEFAULT_ENABLED,
	FEATURE_ALERTS_ON_HOMEPAGE_ENABLED,
	FEATURE_BUTTONS_ON_LOGINPAGE_ENABLED,
	FEATURE_SHOW_NEW_CLASS_VIEW_ENABLED,
	FEATURE_GROUPS_IN_COURSE_ENABLED,
	FEATURE_NEST_SYSTEMS_API_ENABLED,
};

// eslint-disable-next-line no-console
console.log(util.inspect(exp, { depth: 1, compact: false, sorted: true }));

module.exports = exp;
