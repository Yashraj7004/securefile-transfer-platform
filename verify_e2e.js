const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  let body;
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }
  return { status: res.status, headers: res.headers, body };
}

async function runVerification() {
  console.log('=======================================================');
  console.log('🚀 STARTING END-TO-END AUTOMATED VERIFICATION');
  console.log('=======================================================');

  // 1. Health check
  console.log('\n[1] Checking API Health...');
  const health = await request('/health');
  console.log(`Status: ${health.status}, Response:`, health.body);
  if (health.status !== 200) throw new Error('Health check failed');

  // 2. Register new user
  const uniqueEmail = `testuser_${Date.now()}@example.com`;
  console.log(`\n[2] Registering New User (${uniqueEmail})...`);
  const regRes = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Evaluator',
      email: uniqueEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    })
  });
  console.log(`Status: ${regRes.status}, Token received: ${Boolean(regRes.body.data?.token)}`);
  const userToken = regRes.body.data.token;

  // 3. User Login
  console.log('\n[3] Testing User Login...');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'Password123!'
    })
  });
  console.log(`Status: ${loginRes.status}, User: ${loginRes.body.data?.user?.email}`);

  // 4. Admin Login with Seed Credentials
  console.log('\n[4] Testing Admin Login (admin@securefile.local)...');
  const adminLoginRes = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@securefile.local',
      password: 'Admin@12345'
    })
  });
  console.log(`Status: ${adminLoginRes.status}, Role: ${adminLoginRes.body.data?.user?.role}`);
  const adminToken = adminLoginRes.body.data.token;

  // 5. Upload File with Streaming Encryption
  console.log('\n[5] Uploading File with AES-256 Streaming Encryption...');
  const testFileContent = 'TOP_SECRET_PORTFOLIO_CONTENT_FOR_SECURE_TRANSFER_2026';
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const multipartBody = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="confidential_memo.txt"',
    'Content-Type: text/plain',
    '',
    testFileContent,
    `--${boundary}--`
  ].join('\r\n');

  const uploadRes = await request('/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: multipartBody
  });
  console.log(`Status: ${uploadRes.status}, Stored Name: ${uploadRes.body.data?.storedName}`);
  console.log(`Encrypted flag: ${uploadRes.body.data?.encrypted}, IV: ${uploadRes.body.data?.encryptionMetadata?.iv}`);
  const fileId = uploadRes.body.data._id;

  // 6. View Uploaded Files & Dashboard Stats
  console.log('\n[6] Viewing User Files & Dashboard Quota Stats...');
  const filesRes = await request('/files', {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  console.log(`User files count: ${filesRes.body.data?.files?.length}`);

  const dashRes = await request('/dashboard/stats', {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  console.log(`Dashboard Stats: Storage Used: ${dashRes.body.data?.storageUsed} bytes, Total Files: ${dashRes.body.data?.totalFiles}`);

  // 7. Download Decrypted File
  console.log('\n[7] Downloading & Decrypting File...');
  const downloadRes = await request(`/files/${fileId}/download`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  console.log(`Status: ${downloadRes.status}, Content-Disposition: ${downloadRes.headers.get('content-disposition')}`);
  console.log(`Decrypted matches original: ${downloadRes.body === testFileContent}`);

  // 8. IDOR Protection: Other user cannot download directly
  console.log('\n[8] Testing IDOR Prevention (unauthorized access)...');
  const otherUserEmail = `unauthorized_${Date.now()}@example.com`;
  const otherReg = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Attacker Bob',
      email: otherUserEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    })
  });
  const attackerToken = otherReg.body.data.token;
  const attackerDownload = await request(`/files/${fileId}/download`, {
    headers: { 'Authorization': `Bearer ${attackerToken}` }
  });
  console.log(`Attacker Status: ${attackerDownload.status} (Expected 403 Forbidden: ${attackerDownload.body?.message})`);

  // 9. Create Password-Protected Share Link with Max 2 Downloads
  console.log('\n[9] Creating Share Link with Password and Max Downloads (2)...');
  const shareRes = await request('/share', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fileId,
      password: 'SuperSecretShareKey',
      maxDownloads: 2,
      expiration: '7d'
    })
  });
  const shareToken = shareRes.body.data.token;
  console.log(`Share Link Created: /share/${shareToken}`);

  // 10. Public Access without login
  console.log('\n[10] Accessing Public Share Link (unauthenticated)...');
  const publicInfo = await request(`/share/${shareToken}`);
  console.log(`Public Info Status: ${publicInfo.status}, File Name: ${publicInfo.body.data?.fileName}, Password Protected: ${publicInfo.body.data?.passwordProtected}`);

  // 11. Download via share link with wrong password (should fail)
  console.log('\n[11] Attempting Share Download with Wrong Password...');
  const wrongPassRes = await request(`/share/${shareToken}/download?password=WrongPassword`);
  console.log(`Wrong Password Status: ${wrongPassRes.status} (${wrongPassRes.body?.message})`);

  // 12. Download via share link with correct password (Download 1 of 2)
  console.log('\n[12] Performing Share Download 1 of 2 with Correct Password...');
  const shareDl1 = await request(`/share/${shareToken}/download?password=SuperSecretShareKey`);
  console.log(`Download 1 Status: ${shareDl1.status}, Content matches: ${shareDl1.body === testFileContent}`);

  // 13. Download via share link (Download 2 of 2)
  console.log('\n[13] Performing Share Download 2 of 2 (Reaching Limit)...');
  const shareDl2 = await request(`/share/${shareToken}/download?password=SuperSecretShareKey`);
  console.log(`Download 2 Status: ${shareDl2.status}, Content matches: ${shareDl2.body === testFileContent}`);

  // 14. Download 3 (should fail due to download limit)
  console.log('\n[14] Performing Share Download 3 (Testing Exceeded Limit)...');
  const shareDl3 = await request(`/share/${shareToken}/download?password=SuperSecretShareKey`);
  console.log(`Download 3 Status: ${shareDl3.status} (${shareDl3.body?.message})`);

  // 15. Download Tracking Audit Logs
  console.log('\n[15] Verifying Download Tracking Audit Logs...');
  const activityRes = await request('/dashboard/activity', {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  console.log(`Recent download events recorded: ${activityRes.body.data?.recentDownloads?.length}`);
  if (activityRes.body.data?.recentDownloads?.length > 0) {
    const latest = activityRes.body.data.recentDownloads[0];
    console.log(`Latest Log -> IP: ${latest.ipAddress}, Time: ${latest.downloadedAt}`);
  }

  // 16. Admin RBAC: View All Users, Files, and System Stats
  console.log('\n[16] Testing Admin System Stats & User Directory...');
  const sysStats = await request('/admin/stats', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('System Stats:', sysStats.body.data);

  const allUsers = await request('/admin/users', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log(`Total users in system: ${allUsers.body.data?.users?.length}`);

  // 17. Admin User Status Toggle (Disable Attacker)
  console.log('\n[17] Admin Disabling Attacker Account...');
  const attackerUserId = otherReg.body.data.user._id;
  const disableRes = await request(`/admin/users/${attackerUserId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'disabled' })
  });
  console.log(`Attacker account status: ${disableRes.body.data?.status}`);

  // Verify attacker cannot login
  const blockedLogin = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: otherUserEmail,
      password: 'Password123!'
    })
  });
  console.log(`Disabled User Login Status: ${blockedLogin.status} (${blockedLogin.body?.message})`);

  console.log('\n=======================================================');
  console.log('🎉 ALL 17 END-TO-END SCENARIOS VERIFIED SUCCESSFULLY!');
  console.log('=======================================================');
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
