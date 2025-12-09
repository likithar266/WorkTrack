-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- =====================================================
-- TABLE DEFINITIONS
-- =====================================================

-- -----------------------------------------------------
-- Table: users
-- Description: Stores all user accounts (clients, freelancers, admins)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    usertype TEXT NOT NULL CHECK(usertype IN ('client', 'freelancer', 'admin')),
    createdAt TEXT DEFAULT (datetime('now'))
);

-- -----------------------------------------------------
-- Table: freelancers
-- Description: Extended profile information for freelancer users
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS freelancers (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL UNIQUE,
    skills TEXT DEFAULT '[]',
    description TEXT DEFAULT '',
    funds REAL DEFAULT 0,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Table: projects
-- Description: All projects posted by clients
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    budget REAL,
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'assigned', 'completed', 'cancelled')),
    postedDate TEXT DEFAULT (datetime('now')),
    deadline TEXT,
    clientId TEXT NOT NULL,
    clientName TEXT,
    clientEmail TEXT,
    freelancerId TEXT,
    freelancerName TEXT,
    FOREIGN KEY (clientId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (freelancerId) REFERENCES users(id) ON DELETE SET NULL
);

-- -----------------------------------------------------
-- Table: applications
-- Description: Applications submitted by freelancers for projects
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    freelancerId TEXT NOT NULL,
    freelancerName TEXT,
    proposal TEXT,
    budget REAL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
    appliedDate TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (freelancerId) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Table: chats
-- Description: Chat messages between users
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    senderId TEXT NOT NULL,
    receiverId TEXT NOT NULL,
    message TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Table: freelancer_projects
-- Description: Junction table linking freelancers to their current and completed projects
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS freelancer_projects (
    freelancerId TEXT NOT NULL,
    projectId TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('current', 'completed')),
    PRIMARY KEY (freelancerId, projectId, type),
    FOREIGN KEY (freelancerId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Table: freelancer_applications
-- Description: Junction table linking freelancers to their applications
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS freelancer_applications (
    freelancerId TEXT NOT NULL,
    applicationId TEXT NOT NULL,
    PRIMARY KEY (freelancerId, applicationId),
    FOREIGN KEY (freelancerId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (applicationId) REFERENCES applications(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Table: payments
-- Description: Payment records from clients to freelancers
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    clientId TEXT NOT NULL,
    freelancerId TEXT NOT NULL,
    amount REAL NOT NULL,
    paymentDate TEXT DEFAULT (datetime('now')),
    paymentMethod TEXT DEFAULT 'Bank Transfer',
    paymentStatus TEXT DEFAULT 'Pending' CHECK(paymentStatus IN ('Pending', 'Completed', 'Failed')),
    description TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (clientId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (freelancerId) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Table: invoices
-- Description: Invoices generated by freelancers for received payments
-- -----------------------------------------------------
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
    status TEXT DEFAULT 'Unpaid' CHECK(status IN ('Unpaid', 'Paid', 'Overdue', 'Cancelled')),
    description TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (paymentId) REFERENCES payments(id) ON DELETE CASCADE,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (clientId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (freelancerId) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Table: notifications
-- Description: System notifications for users
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK(type IN ('info', 'warning', 'payment', 'project')),
    isRead INTEGER DEFAULT 0 CHECK(isRead IN (0, 1)),
    relatedId TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- VIEWS
-- =====================================================

-- -----------------------------------------------------
-- View: project_view
-- Description: Comprehensive view of projects with aggregated data
-- Returns: Project details with client info, application count, payment count, invoice count
-- -----------------------------------------------------
CREATE VIEW IF NOT EXISTS project_view AS
SELECT 
    p.id,
    p.title,
    p.description,
    p.budget,
    p.status,
    p.postedDate,
    p.deadline,
    p.clientId,
    p.clientName,
    p.clientEmail,
    p.freelancerId,
    p.freelancerName,
    u.username as clientUsername,
    u.email as clientUserEmail,
    COUNT(DISTINCT a.id) as applicationCount,
    (SELECT COUNT(*) FROM payments pay WHERE pay.projectId = p.id) as paymentCount,
    (SELECT COUNT(*) FROM invoices inv WHERE inv.projectId = p.id) as invoiceCount
FROM projects p
LEFT JOIN users u ON p.clientId = u.id
LEFT JOIN applications a ON p.id = a.projectId
GROUP BY p.id;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- -----------------------------------------------------
-- Trigger: update_invoice_payment_status
-- Description: Automatically updates invoice status to 'Overdue' when due date passes
-- Fires: AFTER UPDATE on invoices table
-- Condition: When invoice is unpaid and due date has passed
-- -----------------------------------------------------
CREATE TRIGGER IF NOT EXISTS update_invoice_payment_status
AFTER UPDATE ON invoices
FOR EACH ROW
WHEN NEW.dueDate < datetime('now') AND NEW.status = 'Unpaid'
BEGIN
    UPDATE invoices 
    SET status = 'Overdue' 
    WHERE id = NEW.id;
END;

-- -----------------------------------------------------
-- Trigger: invoice_payment_after_insert
-- Description: Creates notifications for both parties when a payment is made
-- Fires: AFTER INSERT on payments table
-- Actions: 
--   1. Notifies freelancer of payment received
--   2. Notifies client of payment sent
-- -----------------------------------------------------
CREATE TRIGGER IF NOT EXISTS invoice_payment_after_insert
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    -- Notify freelancer
    INSERT INTO notifications (id, userId, title, message, type, relatedId)
    VALUES (
        lower(hex(randomblob(16))),
        NEW.freelancerId,
        'Payment Received',
        'You have received a payment of ₹' || NEW.amount || ' for project.',
        'payment',
        NEW.id
    );
    
    -- Notify client
    INSERT INTO notifications (id, userId, title, message, type, relatedId)
    VALUES (
        lower(hex(randomblob(16))),
        NEW.clientId,
        'Payment Sent',
        'Your payment of ₹' || NEW.amount || ' has been sent successfully.',
        'payment',
        NEW.id
    );
END;

-- -----------------------------------------------------
-- Trigger: invoice_payment_after_update
-- Description: Notifies freelancer when payment status changes
-- Fires: AFTER UPDATE on payments table
-- Condition: When paymentStatus field is modified
-- -----------------------------------------------------
CREATE TRIGGER IF NOT EXISTS invoice_payment_after_update
AFTER UPDATE ON payments
FOR EACH ROW
WHEN NEW.paymentStatus != OLD.paymentStatus
BEGIN
    INSERT INTO notifications (id, userId, title, message, type, relatedId)
    VALUES (
        lower(hex(randomblob(16))),
        NEW.freelancerId,
        'Payment Status Updated',
        'Payment status changed to ' || NEW.paymentStatus,
        'payment',
        NEW.id
    );
END;

-- -----------------------------------------------------
-- Trigger: invoice_payment_after_delete
-- Description: Notifies freelancer when a payment is deleted
-- Fires: AFTER DELETE on payments table
-- -----------------------------------------------------
CREATE TRIGGER IF NOT EXISTS invoice_payment_after_delete
AFTER DELETE ON payments
FOR EACH ROW
BEGIN
    INSERT INTO notifications (id, userId, title, message, type, relatedId)
    VALUES (
        lower(hex(randomblob(16))),
        OLD.freelancerId,
        'Payment Deleted',
        'A payment of ₹' || OLD.amount || ' has been deleted.',
        'payment',
        OLD.id
    );
END;

-- -----------------------------------------------------
-- Trigger: assign_freelancer
-- Description: Notifies both parties when a freelancer is assigned to a project
-- Fires: AFTER UPDATE on projects table
-- Condition: When freelancerId is newly set or changed
-- Actions:
--   1. Notifies freelancer of project assignment
--   2. Notifies client of freelancer assignment
-- -----------------------------------------------------
CREATE TRIGGER IF NOT EXISTS assign_freelancer
AFTER UPDATE ON projects
FOR EACH ROW
WHEN NEW.freelancerId IS NOT NULL AND (OLD.freelancerId IS NULL OR OLD.freelancerId != NEW.freelancerId)
BEGIN
    -- Notify freelancer
    INSERT INTO notifications (id, userId, title, message, type, relatedId)
    VALUES (
        lower(hex(randomblob(16))),
        NEW.freelancerId,
        'Project Assigned',
        'You have been assigned to project: ' || NEW.title,
        'project',
        NEW.id
    );
    
    -- Notify client
    INSERT INTO notifications (id, userId, title, message, type, relatedId)
    VALUES (
        lower(hex(randomblob(16))),
        NEW.clientId,
        'Freelancer Assigned',
        'A freelancer has been assigned to your project: ' || NEW.title,
        'project',
        NEW.id
    );
END;



-- -----------------------------------------------------
-- Procedure: updateInvoicePaymentStatus()
-- Description: Checks all invoices and marks overdue ones
-- Implementation: server/Schema.js - updateInvoicePaymentStatus()
-- Schedule: Runs every hour via setInterval in server/index.js
-- Actions:
--   1. Updates invoices with status 'Unpaid' and past due date to 'Overdue'
--   2. Creates notifications for clients about overdue invoices
-- Returns: Number of invoices updated
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Procedure: getProjectView()
-- Description: Returns all projects with aggregated information
-- Implementation: server/Schema.js - getProjectView()
-- Uses: project_view VIEW
-- Returns: Array of project objects with counts
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Procedure: getProjectViewById(projectId)
-- Description: Returns single project with aggregated information
-- Implementation: server/Schema.js - getProjectViewById()
-- Uses: project_view VIEW
-- Parameters: projectId - UUID of the project
-- Returns: Single project object with counts
-- -----------------------------------------------------

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_projects_clientId ON projects(clientId);
CREATE INDEX IF NOT EXISTS idx_projects_freelancerId ON projects(freelancerId);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_applications_projectId ON applications(projectId);
CREATE INDEX IF NOT EXISTS idx_applications_freelancerId ON applications(freelancerId);
CREATE INDEX IF NOT EXISTS idx_payments_projectId ON payments(projectId);
CREATE INDEX IF NOT EXISTS idx_payments_clientId ON payments(clientId);
CREATE INDEX IF NOT EXISTS idx_payments_freelancerId ON payments(freelancerId);
CREATE INDEX IF NOT EXISTS idx_invoices_paymentId ON invoices(paymentId);
CREATE INDEX IF NOT EXISTS idx_invoices_clientId ON invoices(clientId);
CREATE INDEX IF NOT EXISTS idx_invoices_freelancerId ON invoices(freelancerId);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_chats_senderId ON chats(senderId);
CREATE INDEX IF NOT EXISTS idx_chats_receiverId ON chats(receiverId);
