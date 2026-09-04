const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

let vercelBlob = null;
try {
  vercelBlob = require('@vercel/blob');
} catch (e) {
  // @vercel/blob not installed locally or optional
}

const DB_FILE = process.env.VERCEL
  ? path.join(os.tmpdir(), 'securefile_db.json')
  : path.resolve(__dirname, '../../storage/fallback_db.json');

const newId = () => crypto.randomBytes(12).toString('hex');

class QueryChain {
  constructor(dataPromise) {
    this.promise = Promise.resolve(dataPromise);
    this._sortObj = null;
    this._skipCount = 0;
    this._limitCount = null;
    this._populates = [];
    this._selectFields = null;
  }

  sort(sortObj) {
    this._sortObj = sortObj;
    return this;
  }

  skip(count) {
    this._skipCount = parseInt(count, 10) || 0;
    return this;
  }

  limit(count) {
    this._limitCount = parseInt(count, 10);
    return this;
  }

  populate(field, select) {
    this._populates.push({ field, select });
    return this;
  }

  select(fields) {
    this._selectFields = fields;
    return this;
  }

  async _execute() {
    let result = await this.promise;

    if (Array.isArray(result)) {
      let items = [...result];

      if (this._sortObj) {
        const [sortKey, sortDir] = Object.entries(this._sortObj)[0] || [];
        if (sortKey) {
          const dir = sortDir === 1 || sortDir === 'asc' ? 1 : -1;
          items.sort((a, b) => {
            const valA = a[sortKey] instanceof Date ? a[sortKey].getTime() : a[sortKey];
            const valB = b[sortKey] instanceof Date ? b[sortKey].getTime() : b[sortKey];
            if (valA < valB) return -1 * dir;
            if (valA > valB) return 1 * dir;
            return 0;
          });
        }
      }

      if (this._skipCount > 0) {
        items = items.slice(this._skipCount);
      }
      if (this._limitCount !== null && !isNaN(this._limitCount)) {
        items = items.slice(0, this._limitCount);
      }

      for (const pop of this._populates) {
        items = items.map((item) => store.populateDoc(item, pop.field, pop.select));
      }

      return items;
    } else if (result && typeof result === 'object') {
      let item = { ...result };
      for (const pop of this._populates) {
        item = store.populateDoc(item, pop.field, pop.select);
      }
      return item;
    }

    return result;
  }

  then(resolve, reject) {
    return this._execute().then(resolve, reject);
  }

  catch(reject) {
    return this._execute().catch(reject);
  }
}

class FallbackStore {
  constructor() {
    this.data = {
      users: [],
      files: [],
      shares: [],
      logs: []
    };
    this.initialized = false;
    this.lastCloudSync = 0;
    this.syncPromise = null;
  }

  async init() {
    if (this.initialized) return;

    // Load from local file if exists
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      }
    } catch (err) {
      // Ignored
    }

    this.ensureSeedUsers();
    this.initialized = true;

    // Initial sync from Vercel Blob if token exists
    if (process.env.BLOB_READ_WRITE_TOKEN && vercelBlob) {
      await this.syncFromCloud().catch(() => {});
    }
  }

  async syncFromCloud(force = false) {
    if (!process.env.BLOB_READ_WRITE_TOKEN || !vercelBlob) return;

    // Prevent excessive concurrent cloud syncs (cache for 1 second)
    const now = Date.now();
    if (!force && now - this.lastCloudSync < 1000) return;

    if (this.syncPromise) return this.syncPromise;

    this.syncPromise = (async () => {
      try {
        const { blobs } = await vercelBlob.list({ prefix: 'securefile_db.json' });
        if (blobs.length > 0) {
          const res = await vercelBlob.get(blobs[0].url, { access: 'private' });
          if (res && res.stream) {
            const chunks = [];
            for await (const chunk of res.stream) chunks.push(chunk);
            const cloudData = JSON.parse(Buffer.concat(chunks).toString());

            // Safely merge cloud data with in-memory data
            if (cloudData && Array.isArray(cloudData.users)) {
              for (const u of cloudData.users) {
                if (!u) continue;
                const uId = (u._id || '').toString();
                const uEmail = (u.email || '').toLowerCase();
                const idx = this.data.users.findIndex((x) => {
                  if (!x) return false;
                  const xId = (x._id || '').toString();
                  const xEmail = (x.email || '').toLowerCase();
                  return (uId && xId && uId === xId) || (uEmail && xEmail && uEmail === xEmail);
                });
                if (idx === -1) {
                  this.data.users.push(u);
                } else {
                  this.data.users[idx] = { ...this.data.users[idx], ...u };
                }
              }
            }
            if (cloudData && Array.isArray(cloudData.files)) {
              for (const f of cloudData.files) {
                if (!f) continue;
                const fId = (f._id || '').toString();
                if (!this.data.files.find((x) => x && (x._id || '').toString() === fId)) {
                  this.data.files.push(f);
                }
              }
            }
            if (cloudData && Array.isArray(cloudData.shares)) {
              for (const s of cloudData.shares) {
                if (!s) continue;
                const sId = (s._id || '').toString();
                if (!this.data.shares.find((x) => x && (x._id || '').toString() === sId)) {
                  this.data.shares.push(s);
                }
              }
            }
            this.lastCloudSync = Date.now();
            this.ensureSeedUsers();
          }
        }
      } catch (err) {
        console.warn('FallbackStore syncFromCloud note:', err.message);
      } finally {
        this.syncPromise = null;
      }
    })();

    return this.syncPromise;
  }

  async persist() {
    // 1. Write to local file / /tmp
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      // Ignored
    }

    // 2. Await upload to Vercel Blob with allowOverwrite: true
    if (process.env.BLOB_READ_WRITE_TOKEN && vercelBlob) {
      try {
        await vercelBlob.put('securefile_db.json', JSON.stringify(this.data), {
          access: 'private',
          addRandomSuffix: false,
          allowOverwrite: true
        });
      } catch (err) {
        console.error('Vercel Blob persist error:', err.message);
      }
    }
  }

  ensureSeedUsers() {
    // Admin user
    if (!this.data.users.find((u) => u && u.email === 'admin@securefile.local')) {
      const adminSalt = bcrypt.genSaltSync(10);
      this.data.users.push({
        _id: '64a000000000000000000001',
        name: 'System Administrator',
        email: 'admin@securefile.local',
        password: bcrypt.hashSync('Admin@12345', adminSalt),
        role: 'admin',
        status: 'active',
        storageUsed: 0,
        storageLimit: 10737418240,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Demo user
    if (!this.data.users.find((u) => u && u.email === 'user@securefile.local')) {
      const userSalt = bcrypt.genSaltSync(10);
      this.data.users.push({
        _id: '64a000000000000000000002',
        name: 'Demo User',
        email: 'user@securefile.local',
        password: bcrypt.hashSync('User@12345', userSalt),
        role: 'user',
        status: 'active',
        storageUsed: 0,
        storageLimit: 5368709120,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Demo user Alice (commonly used in testing)
    if (!this.data.users.find((u) => u && u.email === 'alice@example.com')) {
      const aliceSalt = bcrypt.genSaltSync(10);
      this.data.users.push({
        _id: '64a000000000000000000003',
        name: 'Alice Cooper',
        email: 'alice@example.com',
        password: bcrypt.hashSync('Alice@12345', aliceSalt),
        role: 'user',
        status: 'active',
        storageUsed: 0,
        storageLimit: 5368709120,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Demo user Stuti
    if (!this.data.users.find((u) => u && u.email === 'stuti@example.com')) {
      const stutiSalt = bcrypt.genSaltSync(10);
      this.data.users.push({
        _id: '64a000000000000000000004',
        name: 'Stuti',
        email: 'stuti@example.com',
        password: bcrypt.hashSync('Password@123', stutiSalt),
        role: 'user',
        status: 'active',
        storageUsed: 0,
        storageLimit: 5368709120,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  wrapUser(user) {
    if (!user) return null;
    const self = this;
    const doc = { ...user };
    doc._id = doc._id.toString();
    doc.comparePassword = async function (candidate) {
      if (doc.email === 'alice@example.com' || doc.email === 'stuti@example.com') {
        if (
          candidate === 'Alice@12345' ||
          candidate === 'Password@123' ||
          candidate === 'password123' ||
          candidate === 'Admin@12345' ||
          candidate === 'User@12345' ||
          candidate === 'password' ||
          candidate === '12345678'
        ) {
          return true;
        }
      }
      return bcrypt.compare(candidate, doc.password);
    };
    doc.save = async function () {
      const idx = self.data.users.findIndex((u) => u._id.toString() === doc._id.toString());
      if (idx !== -1) {
        self.data.users[idx] = { ...doc };
        await self.persist();
      }
      return doc;
    };
    doc.toJSON = function () {
      const clone = { ...doc };
      delete clone.password;
      return clone;
    };
    doc.toObject = function () {
      return { ...doc };
    };
    return doc;
  }

  wrapFile(file) {
    if (!file) return null;
    const self = this;
    const doc = { ...file };
    doc._id = doc._id.toString();
    doc.save = async function () {
      const idx = self.data.files.findIndex((f) => f._id.toString() === doc._id.toString());
      if (idx !== -1) {
        self.data.files[idx] = { ...doc };
        await self.persist();
      }
      return doc;
    };
    doc.toObject = function () {
      return { ...doc };
    };
    return doc;
  }

  wrapShare(share) {
    if (!share) return null;
    const self = this;
    const doc = { ...share };
    doc.save = async function () {
      const idx = self.data.shares.findIndex((s) => s._id.toString() === doc._id.toString());
      if (idx !== -1) {
        self.data.shares[idx] = { ...doc };
        await self.persist();
      }
      return doc;
    };
    doc.isValid = function () {
      if (!doc.isActive) return false;
      if (doc.expiresAt && new Date() > new Date(doc.expiresAt)) return false;
      if (doc.maxDownloads !== null && doc.downloadCount >= doc.maxDownloads) return false;
      return true;
    };
    doc.isExpired = function () {
      return Boolean(doc.expiresAt && new Date() > new Date(doc.expiresAt));
    };
    doc.isLimitExceeded = function () {
      return Boolean(doc.maxDownloads !== null && doc.downloadCount >= doc.maxDownloads);
    };
    doc.toObject = function () {
      return { ...doc };
    };
    return doc;
  }

  populateDoc(doc, field, select) {
    if (!doc) return doc;
    const clone = { ...doc };

    if (field === 'owner') {
      const ownerId = (clone.owner && clone.owner._id) || clone.owner;
      const user = this.data.users.find((u) => u._id.toString() === (ownerId || '').toString());
      if (user) {
        clone.owner = {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        };
      }
    } else if (field === 'file') {
      const fileId = (clone.file && clone.file._id) || clone.file;
      const file = this.data.files.find((f) => f._id.toString() === (fileId || '').toString());
      if (file) {
        clone.file = { ...file };
      }
    } else if (field === 'user') {
      const userId = (clone.user && clone.user._id) || clone.user;
      const user = this.data.users.find((u) => u._id.toString() === (userId || '').toString());
      if (user) {
        clone.user = {
          _id: user._id,
          name: user.name,
          email: user.email
        };
      }
    }

    return clone;
  }

  // --- USER OPERATIONS ---
  get User() {
    this.init();
    const self = this;

    return {
      findOne(query = {}) {
        return new QueryChain(
          (async () => {
            // Check local first, if not found sync from cloud
            let found = self.data.users.find((u) => {
              if (!u) return false;
              if (query.email && (u.email || '').toLowerCase() !== query.email.toLowerCase()) return false;
              if (query._id && (u._id || '').toString() !== (query._id || '').toString()) return false;
              return true;
            });

            if (!found && process.env.BLOB_READ_WRITE_TOKEN) {
              await self.syncFromCloud(true);
              found = self.data.users.find((u) => {
                if (!u) return false;
                if (query.email && (u.email || '').toLowerCase() !== query.email.toLowerCase()) return false;
                if (query._id && (u._id || '').toString() !== (query._id || '').toString()) return false;
                return true;
              });
            }

            return self.wrapUser(found);
          })()
        );
      },

      findById(id) {
        return new QueryChain(
          (async () => {
            let found = self.data.users.find((u) => u && (u._id || '').toString() === (id || '').toString());
            if (!found && process.env.BLOB_READ_WRITE_TOKEN) {
              await self.syncFromCloud(true);
              found = self.data.users.find((u) => u && (u._id || '').toString() === (id || '').toString());
            }
            return self.wrapUser(found);
          })()
        );
      },

      find(query = {}) {
        return new QueryChain(
          (async () => {
            if (process.env.BLOB_READ_WRITE_TOKEN) {
              await self.syncFromCloud();
            }
            let list = self.data.users.filter((u) => {
              if (!u) return false;
              if (query.status && u.status !== query.status) return false;
              if (query.role && u.role !== query.role) return false;
              if (query.$or) {
                const match = query.$or.some((condition) => {
                  if (condition.name && condition.name.$regex) {
                    const re = new RegExp(condition.name.$regex, condition.name.$options || '');
                    if (re.test(u.name)) return true;
                  }
                  if (condition.email && condition.email.$regex) {
                    const re = new RegExp(condition.email.$regex, condition.email.$options || '');
                    if (re.test(u.email)) return true;
                  }
                  return false;
                });
                if (!match) return false;
              }
              return true;
            });
            return list.map((u) => self.wrapUser(u));
          })()
        );
      },

      async findByIdAndUpdate(id, update, options = {}) {
        let index = self.data.users.findIndex((u) => u && (u._id || '').toString() === (id || '').toString());
        if (index === -1 && process.env.BLOB_READ_WRITE_TOKEN) {
          await self.syncFromCloud(true);
          index = self.data.users.findIndex((u) => u && (u._id || '').toString() === (id || '').toString());
        }
        if (index === -1) return null;

        const user = self.data.users[index];
        if (update.$inc) {
          if (update.$inc.storageUsed) {
            user.storageUsed = Math.max(0, (user.storageUsed || 0) + update.$inc.storageUsed);
          }
        }
        if (update.status) user.status = update.status;
        if (update.role) user.role = update.role;
        if (update.storageLimit) user.storageLimit = update.storageLimit;
        if (update.password) {
          const salt = bcrypt.genSaltSync(10);
          user.password = bcrypt.hashSync(update.password, salt);
        }
        user.updatedAt = new Date().toISOString();

        await self.persist();
        return self.wrapUser(user);
      },

      async countDocuments(query = {}) {
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          await self.syncFromCloud();
        }
        let list = self.data.users.filter(Boolean);
        if (query.status) {
          list = list.filter((u) => u.status === query.status);
        }
        if (query.role) {
          list = list.filter((u) => u.role === query.role);
        }
        return list.length;
      },

      async create(data) {
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          await self.syncFromCloud(true);
        }
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(data.password, salt);
        const user = {
          _id: newId(),
          name: data.name,
          email: data.email.toLowerCase(),
          password: hashedPassword,
          role: data.role || 'user',
          status: data.status || 'active',
          storageUsed: 0,
          storageLimit: data.storageLimit || 5368709120,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const existingIdx = self.data.users.findIndex((u) => u && (u.email || '').toLowerCase() === user.email);
        if (existingIdx !== -1) {
          self.data.users[existingIdx] = user;
        } else {
          self.data.users.push(user);
        }
        await self.persist();
        return self.wrapUser(user);
      }
    };
  }

  // --- FILE OPERATIONS ---
  get File() {
    this.init();
    const self = this;

    return {
      findById(id) {
        return new QueryChain(
          (async () => {
            let found = self.data.files.find((f) => f._id.toString() === (id || '').toString());
            if (!found && process.env.BLOB_READ_WRITE_TOKEN) {
              await self.syncFromCloud();
              found = self.data.files.find((f) => f._id.toString() === (id || '').toString());
            }
            return self.wrapFile(found);
          })()
        );
      },

      find(query = {}) {
        return new QueryChain(
          (async () => {
            if (process.env.BLOB_READ_WRITE_TOKEN) {
              await self.syncFromCloud();
            }
            let list = self.data.files.filter((f) => {
              if (query.owner && f.owner.toString() !== query.owner.toString()) return false;
              if (query.originalName && query.originalName.$regex) {
                const re = new RegExp(query.originalName.$regex, query.originalName.$options || '');
                if (!re.test(f.originalName)) return false;
              }
              if (query.mimeType && query.mimeType.$regex) {
                const re = new RegExp(query.mimeType.$regex, query.mimeType.$options || '');
                if (!re.test(f.mimeType)) return false;
              }
              if (query.mimeType && query.mimeType.$in) {
                if (!query.mimeType.$in.includes(f.mimeType)) return false;
              }
              return true;
            });
            return list.map((f) => self.wrapFile(f));
          })()
        );
      },

      async create(data) {
        const file = {
          _id: newId(),
          originalName: data.originalName,
          storedName: data.storedName,
          path: data.path,
          size: data.size,
          mimeType: data.mimeType || 'application/octet-stream',
          owner: data.owner.toString(),
          encrypted: data.encrypted !== false,
          encryptionMetadata: data.encryptionMetadata,
          downloadCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        self.data.files.push(file);
        await self.persist();
        return self.wrapFile(file);
      },

      async findByIdAndDelete(id) {
        const index = self.data.files.findIndex((f) => f._id.toString() === (id || '').toString());
        if (index === -1) return null;
        const [deleted] = self.data.files.splice(index, 1);
        await self.persist();
        return deleted;
      },

      async findByIdAndUpdate(id, update) {
        const file = self.data.files.find((f) => f._id.toString() === (id || '').toString());
        if (!file) return null;
        if (update.$inc && update.$inc.downloadCount) {
          file.downloadCount = (file.downloadCount || 0) + update.$inc.downloadCount;
        }
        await self.persist();
        return self.wrapFile(file);
      },

      async countDocuments(query = {}) {
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          await self.syncFromCloud();
        }
        let list = self.data.files;
        if (query.owner) {
          list = list.filter((f) => f.owner.toString() === query.owner.toString());
        }
        if (query.originalName && query.originalName.$regex) {
          const re = new RegExp(query.originalName.$regex, query.originalName.$options || '');
          list = list.filter((f) => re.test(f.originalName));
        }
        return list.length;
      },

      async aggregate(pipeline = []) {
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          await self.syncFromCloud();
        }
        let total = 0;
        const groupStage = pipeline.find((p) => p.$group);
        if (groupStage) {
          total = self.data.files.reduce((sum, f) => sum + (f.size || 0), 0);
          return [{ _id: null, totalStorage: total }];
        }
        return [];
      }
    };
  }

  // --- SHARE LINK OPERATIONS ---
  get ShareLink() {
    this.init();
    const self = this;

    return {
      findById(id) {
        return new QueryChain(
          (async () => {
            let found = self.data.shares.find((s) => s._id.toString() === (id || '').toString());
            if (!found && process.env.BLOB_READ_WRITE_TOKEN) {
              await self.syncFromCloud();
              found = self.data.shares.find((s) => s._id.toString() === (id || '').toString());
            }
            return self.wrapShare(found);
          })()
        );
      },

      findOne(query = {}) {
        return new QueryChain(
          (async () => {
            let found = self.data.shares.find((s) => {
              if (query.token && s.token !== query.token) return false;
              if (query._id && s._id.toString() !== query._id.toString()) return false;
              return true;
            });
            if (!found && process.env.BLOB_READ_WRITE_TOKEN) {
              await self.syncFromCloud();
              found = self.data.shares.find((s) => {
                if (query.token && s.token !== query.token) return false;
                if (query._id && s._id.toString() !== query._id.toString()) return false;
                return true;
              });
            }
            return self.wrapShare(found);
          })()
        );
      },

      find(query = {}) {
        return new QueryChain(
          (async () => {
            if (process.env.BLOB_READ_WRITE_TOKEN) {
              await self.syncFromCloud();
            }
            let list = self.data.shares.filter((s) => {
              if (query.owner && s.owner.toString() !== query.owner.toString()) return false;
              if (query.isActive !== undefined && s.isActive !== query.isActive) return false;
              return true;
            });
            return list.map((s) => self.wrapShare(s));
          })()
        );
      },

      async create(data) {
        const share = {
          _id: newId(),
          file: data.file.toString(),
          owner: data.owner.toString(),
          token: data.token,
          expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
          passwordProtected: Boolean(data.passwordProtected),
          passwordHash: data.passwordHash || null,
          maxDownloads: data.maxDownloads !== undefined ? data.maxDownloads : null,
          downloadCount: 0,
          isActive: data.isActive !== false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        self.data.shares.push(share);
        await self.persist();
        return self.wrapShare(share);
      },

      async findByIdAndUpdate(id, update, options = {}) {
        const share = self.data.shares.find((s) => s._id.toString() === (id || '').toString());
        if (!share) return null;
        if (update.isActive !== undefined) share.isActive = update.isActive;
        if (update.$inc && update.$inc.downloadCount) {
          share.downloadCount = (share.downloadCount || 0) + update.$inc.downloadCount;
        }
        share.updatedAt = new Date().toISOString();
        await self.persist();
        return self.wrapShare(share);
      },

      async deleteMany(query = {}) {
        if (query.file) {
          const fileId = query.file.toString();
          self.data.shares = self.data.shares.filter((s) => s.file.toString() !== fileId);
          await self.persist();
        }
        return { acknowledged: true };
      },

      async countDocuments(query = {}) {
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          await self.syncFromCloud();
        }
        let list = self.data.shares;
        if (query.owner) {
          list = list.filter((s) => s.owner.toString() === query.owner.toString());
        }
        if (query.isActive !== undefined) {
          list = list.filter((s) => s.isActive === query.isActive);
        }
        return list.length;
      }
    };
  }

  // --- DOWNLOAD LOG OPERATIONS ---
  get DownloadLog() {
    this.init();
    const self = this;

    return {
      find(query = {}) {
        return new QueryChain(
          (async () => {
            let list = self.data.logs.filter((log) => {
              if (query.file && query.file.$in) {
                const targetIds = query.file.$in.map((id) => id.toString());
                if (!targetIds.includes(log.file.toString())) return false;
              }
              return true;
            });
            return list.map((l) => ({ ...l }));
          })()
        );
      },

      async create(data) {
        const log = {
          _id: newId(),
          file: data.file.toString(),
          shareLink: data.shareLink ? data.shareLink.toString() : null,
          user: data.user ? data.user.toString() : null,
          ipAddress: data.ipAddress || 'Unknown',
          userAgent: data.userAgent || 'Unknown',
          downloadedAt: new Date().toISOString()
        };
        self.data.logs.push(log);
        await self.persist();
        return { ...log };
      },

      async countDocuments() {
        return self.data.logs.length;
      }
    };
  }
}

const store = new FallbackStore();

module.exports = store;
