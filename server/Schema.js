// server/Schema.js
import initSqlJs from 'sql.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'freelancing.db');

let db = null;
let SQL = null;

const initDatabase = async () => {
  try {
    SQL = await initSqlJs();
    let buffer;
    if (fs.existsSync(DB_PATH)) {
      buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    db.run('PRAGMA foreign_keys = ON');

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          usertype TEXT NOT NULL,
          createdAt TEXT DEFAULT (datetime('now'))
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS freelancers (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL UNIQUE,
          skills TEXT DEFAULT '[]',
          description TEXT DEFAULT '',
          funds INTEGER DEFAULT 0,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          clientId TEXT NOT NULL,
          clientName TEXT,
          clientEmail TEXT,
          title TEXT NOT NULL,
          description TEXT,
          budget INTEGER,
          skills TEXT DEFAULT '[]',
          bids TEXT DEFAULT '[]',
          bidAmounts TEXT DEFAULT '[]',
          postedDate TEXT,
          status TEXT DEFAULT 'Available',
          freelancerId TEXT,
          freelancerName TEXT,
          deadline TEXT,
          submission INTEGER DEFAULT 0,
          submissionAccepted INTEGER DEFAULT 0,
          projectLink TEXT DEFAULT '',
          manulaLink TEXT DEFAULT '',
          submissionDescription TEXT DEFAULT '',
          FOREIGN KEY (clientId) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (freelancerId) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS applications (
          id TEXT PRIMARY KEY,
          projectId TEXT NOT NULL,
          clientId TEXT NOT NULL,
          clientName TEXT,
          clientEmail TEXT,
          freelancerId TEXT NOT NULL,
          freelancerName TEXT,
          freelancerEmail TEXT,
          freelancerSkills TEXT DEFAULT '[]',
          title TEXT,
          description TEXT,
          budget INTEGER,
          requiredSkills TEXT DEFAULT '[]',
          proposal TEXT,
          bidAmount INTEGER,
          estimatedTime INTEGER,
          status TEXT DEFAULT 'Pending',
          FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY (clientId) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (freelancerId) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS chats (
          id TEXT PRIMARY KEY,
          messages TEXT DEFAULT '[]'
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS freelancer_projects (
          freelancerId TEXT NOT NULL,
          projectId TEXT NOT NULL,
          type TEXT NOT NULL,
          PRIMARY KEY (freelancerId, projectId, type),
          FOREIGN KEY (freelancerId) REFERENCES freelancers(userId) ON DELETE CASCADE,
          FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS freelancer_applications (
          freelancerId TEXT NOT NULL,
          applicationId TEXT NOT NULL,
          PRIMARY KEY (freelancerId, applicationId),
          FOREIGN KEY (freelancerId) REFERENCES freelancers(userId) ON DELETE CASCADE,
          FOREIGN KEY (applicationId) REFERENCES applications(id) ON DELETE CASCADE
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS payments (
          id TEXT PRIMARY KEY,
          projectId TEXT NOT NULL,
          clientId TEXT NOT NULL,
          freelancerId TEXT NOT NULL,
          amount REAL NOT NULL,
          paymentMethod TEXT DEFAULT 'Card',
          paymentStatus TEXT DEFAULT 'Pending',
          transactionId TEXT,
          paymentDate TEXT,
          createdAt TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY (clientId) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (freelancerId) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          paymentId TEXT NOT NULL,
          projectId TEXT NOT NULL,
          clientId TEXT NOT NULL,
          freelancerId TEXT NOT NULL,
          amount REAL NOT NULL,
          tax REAL DEFAULT 0,
          totalAmount REAL NOT NULL,
          invoiceNumber TEXT UNIQUE,
          invoiceDate TEXT,
          dueDate TEXT,
          status TEXT DEFAULT 'Unpaid',
          description TEXT,
          createdAt TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (paymentId) REFERENCES payments(id) ON DELETE CASCADE,
          FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY (clientId) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (freelancerId) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    saveDatabase();
    console.log('SQLite database initialized with sql.js');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

const saveDatabase = () => {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (error) {
    console.error('Error saving database:', error);
  }
};

const queryToObjects = (sql, params = []) => {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results = [];
  const columns = stmt.getColumnNames();
  while (stmt.step()) {
    const row = stmt.get();
    const obj = {};
    columns.forEach((col, index) => {
      obj[col] = row[index];
    });
    results.push(obj);
  }
  stmt.free();
  return results;
};

const queryToObject = (sql, params = []) => {
  const results = queryToObjects(sql, params);
  return results.length > 0 ? results[0] : null;
};

const parseJSON = (str) => {
  try {
    return JSON.parse(str || '[]');
  } catch {
    return [];
  }
};
const stringifyJSON = (arr) => JSON.stringify(arr || []);

await initDatabase();

/* -----------------------------
   User model
   ----------------------------- */
export const User = {
  create: (data) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO users (id, username, email, password, usertype)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.bind([id, data.username, data.email, data.password, data.usertype]);
    stmt.step();
    stmt.free();
    saveDatabase();
    return User.findById(id);
  },
  findById: (id) => {
    const res = queryToObject('SELECT * FROM users WHERE id = ?', [id]);
    if (res) res._id = res.id;
    return res;
  },
  findOne: (query) => {
    if (query.email) {
      const res = queryToObject('SELECT * FROM users WHERE email = ?', [query.email]);
      if (res) res._id = res.id;
      return res;
    }
    return null;
  },
  findAll: () => {
    const results = queryToObjects('SELECT * FROM users');
    return results.map(r => { r._id = r.id; return r; });
  }
};

/* -----------------------------
   Freelancer model
   ----------------------------- */
export const Freelancer = {
  create: (data) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO freelancers (id, userId, skills, description, funds)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.bind([id, data.userId, stringifyJSON(data.skills || []), data.description || '', data.funds || 0]);
    stmt.step(); stmt.free(); saveDatabase();
    return Freelancer.findOne({ userId: data.userId });
  },
  findById: (id) => {
    const result = queryToObject('SELECT * FROM freelancers WHERE id = ?', [id]);
    if (result) {
      result.skills = parseJSON(result.skills);
      result._id = result.id;
    }
    return result;
  },
  findOne: (query) => {
    if (query.userId) {
      const result = queryToObject('SELECT * FROM freelancers WHERE userId = ?', [query.userId]);
      if (result) {
        result.skills = parseJSON(result.skills);
        // current projects
        const currentProjects = queryToObjects(`
          SELECT projectId FROM freelancer_projects WHERE freelancerId = ? AND type = 'current'
        `, [query.userId]);
        result.currentProjects = currentProjects.map(r => r.projectId);
        const completedProjects = queryToObjects(`
          SELECT projectId FROM freelancer_projects WHERE freelancerId = ? AND type = 'completed'
        `, [query.userId]);
        result.completedProjects = completedProjects.map(r => r.projectId);
        const applications = queryToObjects(`
          SELECT applicationId FROM freelancer_applications WHERE freelancerId = ?
        `, [query.userId]);
        result.applications = applications.map(r => r.applicationId);
        result._id = result.id;
      }
      return result;
    }
    return null;
  },
  update: (id, data) => {
    const updates = [];
    const values = [];
    if (data.skills !== undefined) { updates.push('skills = ?'); values.push(stringifyJSON(data.skills)); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.funds !== undefined) { updates.push('funds = ?'); values.push(data.funds); }
    if (updates.length > 0) {
      values.push(id);
      const stmt = db.prepare(`UPDATE freelancers SET ${updates.join(', ')} WHERE id = ?`);
      stmt.bind(values); stmt.step(); stmt.free(); saveDatabase();
    }
    return Freelancer.findById(id);
  },
  addCurrentProject: (freelancerId, projectId) => {
    const exists = queryToObject(`
      SELECT 1 FROM freelancer_projects WHERE freelancerId = ? AND projectId = ? AND type = 'current'
    `, [freelancerId, projectId]);
    if (!exists) {
      const stmt = db.prepare(`
        INSERT INTO freelancer_projects (freelancerId, projectId, type) VALUES (?, ?, 'current')
      `);
      stmt.bind([freelancerId, projectId]); stmt.step(); stmt.free(); saveDatabase();
    }
  },
  removeCurrentProject: (freelancerId, projectId) => {
    const stmt = db.prepare(`
      DELETE FROM freelancer_projects WHERE freelancerId = ? AND projectId = ? AND type = 'current'
    `);
    stmt.bind([freelancerId, projectId]); stmt.step(); stmt.free(); saveDatabase();
  },
  addCompletedProject: (freelancerId, projectId) => {
    const exists = queryToObject(`
      SELECT 1 FROM freelancer_projects WHERE freelancerId = ? AND projectId = ? AND type = 'completed'
    `, [freelancerId, projectId]);
    if (!exists) {
      const stmt = db.prepare(`
        INSERT INTO freelancer_projects (freelancerId, projectId, type) VALUES (?, ?, 'completed')
      `);
      stmt.bind([freelancerId, projectId]); stmt.step(); stmt.free(); saveDatabase();
    }
  },
  addApplication: (freelancerId, applicationId) => {
    const exists = queryToObject(`
      SELECT 1 FROM freelancer_applications WHERE freelancerId = ? AND applicationId = ?
    `, [freelancerId, applicationId]);
    if (!exists) {
      const stmt = db.prepare(`
        INSERT INTO freelancer_applications (freelancerId, applicationId) VALUES (?, ?)
      `);
      stmt.bind([freelancerId, applicationId]); stmt.step(); stmt.free(); saveDatabase();
    }
  }
};

/* -----------------------------
   Project model
   ----------------------------- */
export const Project = {
  create: (data) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO projects (id, clientId, clientName, clientEmail, title, description, budget, skills, postedDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.bind([
      id,
      data.clientId,
      data.clientName,
      data.clientEmail,
      data.title,
      data.description,
      data.budget,
      stringifyJSON(data.skills || []),
      data.postedDate || new Date().toISOString()
    ]);
    stmt.step(); stmt.free(); saveDatabase();
    return Project.findById(id);
  },
  findById: (id) => {
    const result = queryToObject('SELECT * FROM projects WHERE id = ?', [id]);
    if (result) {
      result.skills = parseJSON(result.skills);
      result.bids = parseJSON(result.bids);
      result.bidAmounts = parseJSON(result.bidAmounts);
      result.submission = Boolean(result.submission);
      result.submissionAccepted = Boolean(result.submissionAccepted);
      result._id = result.id;
    }
    return result;
  },
  findAll: () => {
    const results = queryToObjects('SELECT * FROM projects');
    return results.map(result => {
      result.skills = parseJSON(result.skills);
      result.bids = parseJSON(result.bids);
      result.bidAmounts = parseJSON(result.bidAmounts);
      result.submission = Boolean(result.submission);
      result.submissionAccepted = Boolean(result.submissionAccepted);
      result._id = result.id;
      return result;
    });
  },
  update: (id, data) => {
    const updates = [];
    const values = [];
    Object.keys(data).forEach(key => {
      if (key === 'skills' || key === 'bids' || key === 'bidAmounts') {
        updates.push(`${key} = ?`);
        values.push(stringifyJSON(data[key]));
      } else if (key === 'submission' || key === 'submissionAccepted') {
        updates.push(`${key} = ?`);
        values.push(data[key] ? 1 : 0);
      } else {
        updates.push(`${key} = ?`);
        values.push(data[key]);
      }
    });
    if (updates.length > 0) {
      values.push(id);
      const stmt = db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`);
      stmt.bind(values); stmt.step(); stmt.free(); saveDatabase();
    }
    return Project.findById(id);
  }
};

/* -----------------------------
   Application model
   ----------------------------- */
export const Application = {
  create: (data) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO applications (id, projectId, clientId, clientName, clientEmail, freelancerId,
        freelancerName, freelancerEmail, freelancerSkills, title, description, budget,
        requiredSkills, proposal, bidAmount, estimatedTime, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.bind([
      id,
      data.projectId,
      data.clientId,
      data.clientName,
      data.clientEmail,
      data.freelancerId,
      data.freelancerName,
      data.freelancerEmail,
      stringifyJSON(data.freelancerSkills || []),
      data.title,
      data.description,
      data.budget,
      stringifyJSON(data.requiredSkills || []),
      data.proposal,
      data.bidAmount,
      data.estimatedTime,
      data.status || 'Pending'
    ]);
    stmt.step(); stmt.free(); saveDatabase();
    return Application.findById(id);
  },
  findById: (id) => {
    const result = queryToObject('SELECT * FROM applications WHERE id = ?', [id]);
    if (result) {
      result.freelancerSkills = parseJSON(result.freelancerSkills);
      result.requiredSkills = parseJSON(result.requiredSkills);
      result._id = result.id;
    }
    return result;
  },
  findAll: () => {
    const results = queryToObjects('SELECT * FROM applications');
    return results.map(result => {
      result.freelancerSkills = parseJSON(result.freelancerSkills);
      result.requiredSkills = parseJSON(result.requiredSkills);
      result._id = result.id;
      return result;
    });
  },
  findByProjectId: (projectId) => {
    const results = queryToObjects('SELECT * FROM applications WHERE projectId = ?', [projectId]);
    return results.map(result => {
      result.freelancerSkills = parseJSON(result.freelancerSkills);
      result.requiredSkills = parseJSON(result.requiredSkills);
      result._id = result.id;
      return result;
    });
  },
  update: (id, data) => {
    const updates = [];
    const values = [];
    Object.keys(data).forEach(key => {
      if (key === 'freelancerSkills' || key === 'requiredSkills') {
        updates.push(`${key} = ?`);
        values.push(stringifyJSON(data[key]));
      } else {
        updates.push(`${key} = ?`);
        values.push(data[key]);
      }
    });
    if (updates.length > 0) {
      values.push(id);
      const stmt = db.prepare(`UPDATE applications SET ${updates.join(', ')} WHERE id = ?`);
      stmt.bind(values); stmt.step(); stmt.free(); saveDatabase();
    }
    return Application.findById(id);
  }
};

/* -----------------------------
   Chat model
   ----------------------------- */
export const Chat = {
  findById: (id) => {
    const result = queryToObject('SELECT * FROM chats WHERE id = ?', [id]);
    if (result) {
      result.messages = parseJSON(result.messages);
      result._id = result.id;
    }
    return result;
  },
  findOne: (query) => {
    if (query._id) return Chat.findById(query._id);
    if (query.projectId) return Chat.findById(query.projectId);
    return null;
  },
  create: (data) => {
    const stmt = db.prepare(`
      INSERT INTO chats (id, messages) VALUES (?, ?)
    `);
    stmt.bind([data._id || data.id, stringifyJSON(data.messages || [])]);
    stmt.step(); stmt.free(); saveDatabase();
    return Chat.findById(data._id || data.id);
  },
  updateMessages: (id, messages) => {
    const stmt = db.prepare('UPDATE chats SET messages = ? WHERE id = ?');
    stmt.bind([stringifyJSON(messages), id]); stmt.step(); stmt.free(); saveDatabase();
    return Chat.findById(id);
  },
  addMessage: (id, message) => {
    const chat = Chat.findById(id);
    if (!chat) {
      Chat.create({ id, messages: [message] });
    } else {
      const messages = parseJSON(chat.messages);
      messages.push(message);
      Chat.updateMessages(id, messages);
    }
    return Chat.findById(id);
  }
};

/* -----------------------------
   Payment model
   ----------------------------- */
export const Payment = {
  create: (data) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO payments (id, projectId, clientId, freelancerId, amount, paymentMethod, paymentStatus, transactionId, paymentDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.bind([
      id, 
      data.projectId, 
      data.clientId, 
      data.freelancerId, 
      data.amount, 
      data.paymentMethod || 'Card', 
      data.paymentStatus || 'Pending', 
      data.transactionId || null,
      data.paymentDate || new Date().toISOString()
    ]);
    stmt.step(); stmt.free(); saveDatabase();
    return Payment.findById(id);
  },
  findById: (id) => {
    const result = queryToObject('SELECT * FROM payments WHERE id = ?', [id]);
    if (result) result._id = result.id;
    return result;
  },
  findOne: (query) => {
    if (query.id) return Payment.findById(query.id);
    if (query.projectId) {
      const result = queryToObject('SELECT * FROM payments WHERE projectId = ?', [query.projectId]);
      if (result) result._id = result.id;
      return result;
    }
    return null;
  },
  findAll: () => {
    const results = queryToObjects('SELECT * FROM payments');
    return results.map(r => { r._id = r.id; return r; });
  },
  findByClientId: (clientId) => {
    const results = queryToObjects('SELECT * FROM payments WHERE clientId = ?', [clientId]);
    return results.map(r => { r._id = r.id; return r; });
  },
  findByFreelancerId: (freelancerId) => {
    const results = queryToObjects('SELECT * FROM payments WHERE freelancerId = ?', [freelancerId]);
    return results.map(r => { r._id = r.id; return r; });
  },
  update: (id, data) => {
    const updates = [];
    const values = [];
    if (data.paymentStatus !== undefined) { updates.push('paymentStatus = ?'); values.push(data.paymentStatus); }
    if (data.transactionId !== undefined) { updates.push('transactionId = ?'); values.push(data.transactionId); }
    if (data.paymentDate !== undefined) { updates.push('paymentDate = ?'); values.push(data.paymentDate); }
    if (updates.length > 0) {
      values.push(id);
      const stmt = db.prepare(`UPDATE payments SET ${updates.join(', ')} WHERE id = ?`);
      stmt.bind(values); stmt.step(); stmt.free(); saveDatabase();
    }
    return Payment.findById(id);
  }
};

/* -----------------------------
   Invoice model
   ----------------------------- */
export const Invoice = {
  create: (data) => {
    const id = uuidv4();
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const stmt = db.prepare(`
      INSERT INTO invoices (id, paymentId, projectId, clientId, freelancerId, amount, tax, totalAmount, invoiceNumber, invoiceDate, dueDate, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.bind([
      id,
      data.paymentId,
      data.projectId,
      data.clientId,
      data.freelancerId,
      data.amount,
      data.tax || 0,
      data.totalAmount,
      invoiceNumber,
      data.invoiceDate || new Date().toISOString(),
      data.dueDate || null,
      data.status || 'Unpaid',
      data.description || ''
    ]);
    stmt.step(); stmt.free(); saveDatabase();
    return Invoice.findById(id);
  },
  findById: (id) => {
    const result = queryToObject('SELECT * FROM invoices WHERE id = ?', [id]);
    if (result) result._id = result.id;
    return result;
  },
  findOne: (query) => {
    if (query.id) return Invoice.findById(query.id);
    if (query.paymentId) {
      const result = queryToObject('SELECT * FROM invoices WHERE paymentId = ?', [query.paymentId]);
      if (result) result._id = result.id;
      return result;
    }
    if (query.invoiceNumber) {
      const result = queryToObject('SELECT * FROM invoices WHERE invoiceNumber = ?', [query.invoiceNumber]);
      if (result) result._id = result.id;
      return result;
    }
    return null;
  },
  findAll: () => {
    const results = queryToObjects('SELECT * FROM invoices');
    return results.map(r => { r._id = r.id; return r; });
  },
  findByClientId: (clientId) => {
    const results = queryToObjects('SELECT * FROM invoices WHERE clientId = ?', [clientId]);
    return results.map(r => { r._id = r.id; return r; });
  },
  findByFreelancerId: (freelancerId) => {
    const results = queryToObjects('SELECT * FROM invoices WHERE freelancerId = ?', [freelancerId]);
    return results.map(r => { r._id = r.id; return r; });
  },
  update: (id, data) => {
    const updates = [];
    const values = [];
    if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status); }
    if (data.dueDate !== undefined) { updates.push('dueDate = ?'); values.push(data.dueDate); }
    if (updates.length > 0) {
      values.push(id);
      const stmt = db.prepare(`UPDATE invoices SET ${updates.join(', ')} WHERE id = ?`);
      stmt.bind(values); stmt.step(); stmt.free(); saveDatabase();
    }
    return Invoice.findById(id);
  }
};

export { db };
