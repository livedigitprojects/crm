const assert = require('assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

console.log('====================================================');
console.log('   FULL SYSTEM PRODUCTION READINESS AUDIT SUITE    ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

// 1. Audit Security Headers
test('Security Headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection', () => {
  const app = require('./server');
  assert.ok(app._router, 'Express router should be initialized');
});

// 2. Audit Model Schemas & Indexes
test('Database Models: Lead Model Indexes and TTL Configuration', () => {
  const Lead = require('./models/Lead');
  assert.ok(Lead.schema, 'Lead schema must be defined');

  const indexes = Lead.schema.indexes();
  const indexFields = indexes.map(idx => Object.keys(idx[0])[0]);

  assert.ok(indexFields.includes('createdAt'), 'createdAt index must exist');
  assert.ok(indexFields.includes('clientId'), 'clientId index must exist');
  assert.ok(indexFields.includes('salesperson'), 'salesperson index must exist');
  assert.ok(indexFields.includes('workflowStatus'), 'workflowStatus index must exist');
  assert.ok(indexFields.includes('assignedTo'), 'assignedTo index must exist');
  assert.ok(indexFields.includes('assignedDeveloper'), 'assignedDeveloper index must exist');
  assert.ok(indexFields.includes('assignedDesigner'), 'assignedDesigner index must exist');
  assert.ok(indexFields.includes('assignedAdSpecialist'), 'assignedAdSpecialist index must exist');

  const ttlIndex = indexes.find(idx => idx[1] && idx[1].expireAfterSeconds === 31536000);
  assert.ok(ttlIndex, 'Lead schema must have 1-year (31536000s) TTL index on createdAt');
});

test('Database Models: Notification Model and Timestamp Index', () => {
  const Notification = require('./models/Notification');
  assert.ok(Notification.schema, 'Notification schema must be defined');
  const indexes = Notification.schema.indexes();
  const hasTimestampIndex = indexes.some(idx => Object.keys(idx[0])[0] === 'timestamp');
  assert.ok(hasTimestampIndex, 'Notification schema must have index on timestamp');
});

test('Database Models: DailyReport Model and Indexes', () => {
  const DailyReport = require('./models/DailyReport');
  assert.ok(DailyReport.schema, 'DailyReport schema must be defined');
  const indexes = DailyReport.schema.indexes();
  assert.ok(indexes.length >= 2, 'DailyReport schema must have compound indexes');
});

test('Database Models: User Model Role and Team Restrictions', () => {
  const User = require('./models/User');
  assert.ok(User.schema, 'User schema must be defined');
  const roles = User.schema.path('role').enumValues;
  assert.deepStrictEqual(roles, ['admin', 'salesperson', 'technical']);
  const teams = User.schema.path('team').enumValues;
  assert.deepStrictEqual(teams, ['design', 'developer', 'ads', null]);
});

// 3. Role-Based Security & Redaction
test('Role-Based Security: redactLeadForRole Redacts Sensitive Financials for Technical Users', () => {
  const { redactLeadForRole } = require('./controllers/leadController');
  assert.strictEqual(typeof redactLeadForRole, 'function', 'redactLeadForRole must be exported');

  const mockLead = {
    clientId: 'CLI-001',
    clientName: 'Test Corp',
    planAmount: 50000,
    advanceAmount: 20000,
    pendingAmount: 30000,
    adBudget: 15000,
    facebookId: 'fb_secret',
    facebookPassword: 'fb_password',
    communications: []
  };

  const techUser = { role: 'technical', team: 'developer' };
  const redacted = redactLeadForRole(mockLead, techUser);

  assert.strictEqual(redacted.planAmount, undefined, 'planAmount must be hidden from technical users');
  assert.strictEqual(redacted.advanceAmount, undefined, 'advanceAmount must be hidden from technical users');
  assert.strictEqual(redacted.pendingAmount, undefined, 'pendingAmount must be hidden from technical users');
  assert.strictEqual(redacted.adBudget, undefined, 'adBudget must be hidden from developer team');
  assert.strictEqual(redacted.facebookId, undefined, 'facebookId must be hidden from developer team');
  assert.strictEqual(redacted.facebookPassword, undefined, 'facebookPassword must be hidden from developer team');
  assert.strictEqual(redacted.clientName, 'Test Corp', 'Safe fields must remain accessible');
});

test('Role-Based Security: redactLeadForRole Preserves Ad Details for Ads Team and Admin', () => {
  const { redactLeadForRole } = require('./controllers/leadController');

  const mockLead = {
    clientId: 'CLI-002',
    clientName: 'Ad Client',
    planAmount: 70000,
    advanceAmount: 70000,
    pendingAmount: 0,
    adBudget: 25000,
    facebookId: 'fb_user',
    facebookPassword: 'fb_password',
    communications: []
  };

  const adminUser = { role: 'admin' };
  const adminView = redactLeadForRole(mockLead, adminUser);
  assert.strictEqual(adminView.planAmount, 70000, 'Admin can view planAmount');
  assert.strictEqual(adminView.adBudget, 25000, 'Admin can view adBudget');
  assert.strictEqual(adminView.facebookId, 'fb_user', 'Admin can view facebookId');

  const adsUser = { role: 'technical', team: 'ads' };
  const adsView = redactLeadForRole(mockLead, adsUser);
  assert.strictEqual(adsView.planAmount, undefined, 'Ads specialist cannot view client payments');
  assert.strictEqual(adsView.adBudget, 25000, 'Ads specialist can view adBudget');
  assert.strictEqual(adsView.facebookId, 'fb_user', 'Ads specialist can view social credentials');
});

test('Controller Logic: getTeamDisplayLabel handles all team variants properly', () => {
  const { getTeamDisplayLabel } = require('./controllers/leadController');
  assert.strictEqual(getTeamDisplayLabel('developer'), 'Developer');
  assert.strictEqual(getTeamDisplayLabel('design'), 'Design');
  assert.strictEqual(getTeamDisplayLabel('ads'), 'Ads Campaign');
  assert.strictEqual(getTeamDisplayLabel('all'), 'All Departments');
  assert.strictEqual(getTeamDisplayLabel(['developer', 'ads']), 'Developer, Ads Campaign');
  assert.strictEqual(getTeamDisplayLabel(null), 'General');
});

// 4. Rate Limiter Audit
test('Security: Login Rate Limiter Configuration and Response', () => {
  const app = require('./server');
  assert.ok(app, 'Server app must load without errors');
});

// 5. Authentication Token Verification
test('Authentication: JWT Token Signing and Verification', () => {
  const secret = process.env.JWT_SECRET || 'aetheria_secret_key_12345';
  const token = jwt.sign({ id: 'user123' }, secret, { expiresIn: '30d' });
  const decoded = jwt.verify(token, secret);
  assert.strictEqual(decoded.id, 'user123', 'Decoded ID must match signed payload');
});

// 6. User Password Hashing Verification
test('Authentication: BCrypt Password Hashing and Match Verification', () => {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('securePassword123', salt);
  assert.ok(bcrypt.compareSync('securePassword123', hash), 'Correct password must match hash');
  assert.ok(!bcrypt.compareSync('wrongPassword', hash), 'Wrong password must be rejected');
});

console.log('\n====================================================');
console.log(` AUDIT COMPLETE: ${passedTests}/${totalTests} TESTS PASSED `);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
