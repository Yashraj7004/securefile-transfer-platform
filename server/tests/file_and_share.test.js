const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const { storageService } = require('../src/services/storageService');
require('./setup');

describe('File Upload, Streaming Encryption, and Sharing', () => {
  let userToken;
  let otherUserToken;
  let testFilePath;
  const originalContent = 'CONFIDENTIAL_ENCRYPTED_FILE_TEST_CONTENT_1234567890';

  beforeAll(() => {
    storageService.initDirectories();
    testFilePath = path.join(__dirname, 'test_sample.txt');
    fs.writeFileSync(testFilePath, originalContent, 'utf8');
  });

  afterAll(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  beforeEach(async () => {
    // Register User 1
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User One',
        email: 'user1@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    userToken = res1.body.data.token;

    // Register User 2
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User Two',
        email: 'user2@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
    otherUserToken = res2.body.data.token;
  });

  it('should upload a file, encrypt it on disk, and return file metadata', async () => {
    const res = await request(app)
      .post('/api/files/upload')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', testFilePath);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.originalName).toBe('test_sample.txt');
    expect(res.body.data.encrypted).toBe(true);
    expect(res.body.data.encryptionMetadata.iv).toBeDefined();

    // Verify stored physical file is encrypted and NOT plain text
    const storedName = res.body.data.storedName;
    const encryptedDiskPath = path.join(storageService.getEncryptedDir(), storedName);
    expect(fs.existsSync(encryptedDiskPath)).toBe(true);

    const storedBytes = fs.readFileSync(encryptedDiskPath);
    expect(storedBytes.toString('utf8')).not.toContain(originalContent);
  });

  it('should download and decrypt the file accurately', async () => {
    // Upload first
    const uploadRes = await request(app)
      .post('/api/files/upload')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', testFilePath);

    const fileId = uploadRes.body.data._id;

    // Download
    const downloadRes = await request(app)
      .get(`/api/files/${fileId}/download`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(downloadRes.statusCode).toBe(200);
    expect(downloadRes.text).toBe(originalContent);
  });

  it('should block another user from downloading file directly (IDOR prevention)', async () => {
    const uploadRes = await request(app)
      .post('/api/files/upload')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', testFilePath);

    const fileId = uploadRes.body.data._id;

    const downloadRes = await request(app)
      .get(`/api/files/${fileId}/download`)
      .set('Authorization', `Bearer ${otherUserToken}`);

    expect(downloadRes.statusCode).toBe(403);
  });

  it('should create a password-protected share link and permit public download after verification', async () => {
    const uploadRes = await request(app)
      .post('/api/files/upload')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', testFilePath);

    const fileId = uploadRes.body.data._id;

    // Create share link with password and max 1 download
    const shareRes = await request(app)
      .post('/api/share')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        fileId,
        password: 'SecretSharePassword',
        maxDownloads: 1,
        expiration: '1h'
      });

    expect(shareRes.statusCode).toBe(201);
    const token = shareRes.body.data.token;
    expect(token).toBeDefined();

    // Query public share metadata without auth
    const publicInfoRes = await request(app).get(`/api/share/${token}`);
    expect(publicInfoRes.statusCode).toBe(200);
    expect(publicInfoRes.body.data.fileName).toBe('test_sample.txt');
    expect(publicInfoRes.body.data.passwordProtected).toBe(true);

    // Attempt download without password -> should fail
    const unauthDownload = await request(app).get(`/api/share/${token}/download`);
    expect(unauthDownload.statusCode).toBe(401);

    // Attempt download with wrong password -> should fail
    const wrongPassDownload = await request(app)
      .get(`/api/share/${token}/download?password=WrongPassword`);
    expect(wrongPassDownload.statusCode).toBe(400);

    // Download with correct password -> should succeed
    const validDownload = await request(app)
      .get(`/api/share/${token}/download?password=SecretSharePassword`);
    expect(validDownload.statusCode).toBe(200);
    expect(validDownload.text).toBe(originalContent);

    // Second download attempt should fail due to maxDownloads limit reached (1)
    const secondDownload = await request(app)
      .get(`/api/share/${token}/download?password=SecretSharePassword`);
    expect(secondDownload.statusCode).toBe(400);
    expect(secondDownload.body.message).toContain('maximum download limit');
  });
});
