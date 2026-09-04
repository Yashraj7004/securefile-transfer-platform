const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
require('./setup');

describe('Admin RBAC and User Management Endpoints', () => {
  let adminToken;
  let normalUserToken;
  let normalUserId;

  beforeEach(async () => {
    // First registered user becomes admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin Boss',
        email: 'admin@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    adminToken = adminRes.body.data.token;

    // Second registered user becomes regular user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Regular Joe',
        email: 'joe@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    normalUserToken = userRes.body.data.token;
    normalUserId = userRes.body.data.user._id;
  });

  it('should allow admin to access system stats', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalUsers).toBe(2);
  });

  it('should block non-admin users from accessing admin routes with 403', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${normalUserToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow admin to disable a user and verify disabled user is blocked', async () => {
    // Admin disables user
    const disableRes = await request(app)
      .patch(`/api/admin/users/${normalUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'disabled' });

    expect(disableRes.statusCode).toBe(200);
    expect(disableRes.body.data.status).toBe('disabled');

    // Disabled user tries to get profile -> should receive 403
    const blockedProfile = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${normalUserToken}`);

    expect(blockedProfile.statusCode).toBe(403);
    expect(blockedProfile.body.message).toContain('deactivated');

    // Disabled user tries to login -> should receive 403
    const blockedLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'joe@example.com',
        password: 'Password123!'
      });

    expect(blockedLogin.statusCode).toBe(403);
  });
});
