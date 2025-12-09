# Database Triggers, Views, and Procedures Documentation

## Overview
This document describes the automated database features implemented in the Freelancer Management System using SQLite triggers, views, and application-level procedures.

## Database Views

### 1. project_view
**Purpose**: Provides a comprehensive overview of projects with aggregated statistics.

**Description**: This view consolidates project information with client details and counts related entities (applications, payments, invoices).

**Columns**:
- `id`: Project unique identifier
- `title`: Project title
- `description`: Project description
- `budget`: Project budget
- `status`: Current status (open, assigned, completed, cancelled)
- `postedDate`: Date when project was posted
- `deadline`: Project deadline
- `clientId`: Client's user ID
- `clientName`: Client's name
- `clientEmail`: Client's email
- `freelancerId`: Assigned freelancer's ID (if any)
- `freelancerName`: Assigned freelancer's name (if any)
- `clientUsername`: Client's username
- `clientUserEmail`: Client's user email
- `applicationCount`: Number of applications received
- `paymentCount`: Number of payments made
- `invoiceCount`: Number of invoices generated

**Usage**:
```javascript
// Get all projects with stats
const projects = getProjectView();

// Get single project with stats
const project = getProjectViewById(projectId);
```

**API Endpoints**:
- `GET /projects-view` - Returns all projects with statistics
- `GET /projects-view/:id` - Returns single project with statistics

## Database Triggers

### 1. update_invoice_payment_status
**Event**: AFTER UPDATE on invoices table  
**Condition**: When invoice's `dueDate` has passed and `status` is 'Unpaid'

**Purpose**: Automatically marks invoices as 'Overdue' when the due date has passed.

**Behavior**:
- Fires every time an invoice record is updated
- Checks if the invoice is unpaid and past due date
- Updates status from 'Unpaid' to 'Overdue'

**Example Scenario**:
```
Day 1: Invoice created with dueDate = "2024-01-15", status = "Unpaid"
Day 2 (2024-01-16): Any update to this invoice triggers check
       → Current date > dueDate AND status = "Unpaid"
       → Status automatically changes to "Overdue"
```

### 2. invoice_payment_after_insert
**Event**: AFTER INSERT on payments table

**Purpose**: Notifies both client and freelancer when a payment is created.

**Behavior**:
- Creates notification for freelancer: "Payment Received - You have received a payment of ₹X for project."
- Creates notification for client: "Payment Sent - Your payment of ₹X has been sent successfully."

**Notification Details**:
- Type: 'payment'
- Auto-generated unique ID
- Links to payment via `relatedId`

### 3. invoice_payment_after_update
**Event**: AFTER UPDATE on payments table  
**Condition**: When `paymentStatus` field changes

**Purpose**: Notifies freelancer when payment status is modified (e.g., Pending → Completed, Completed → Failed).

**Behavior**:
- Only fires when payment status actually changes
- Creates notification for freelancer: "Payment Status Updated - Payment status changed to [NEW_STATUS]"

**Example Scenario**:
```
Update payment status from "Pending" to "Completed"
→ Freelancer receives notification about status change
```

### 4. invoice_payment_after_delete
**Event**: AFTER DELETE on payments table

**Purpose**: Notifies freelancer when a payment record is deleted.

**Behavior**:
- Creates notification for freelancer: "Payment Deleted - A payment of ₹X has been deleted."
- Uses OLD values since record is being deleted

**Use Case**: Administrative corrections or payment cancellations

### 5. assign_freelancer
**Event**: AFTER UPDATE on projects table  
**Condition**: When `freelancerId` is newly assigned or changed

**Purpose**: Notifies both parties when a freelancer is assigned to a project.

**Behavior**:
- Creates notification for freelancer: "Project Assigned - You have been assigned to project: [PROJECT_TITLE]"
- Creates notification for client: "Freelancer Assigned - A freelancer has been assigned to your project: [PROJECT_TITLE]"

**Example Scenario**:
```
Client accepts application and assigns freelancer to project
→ Project.freelancerId updated from NULL to freelancer's ID
→ Both parties receive notifications
```

## Application-Level Procedures

Since SQLite doesn't support traditional stored procedures, these are implemented as JavaScript functions in `server/Schema.js`.

### 1. updateInvoicePaymentStatus()
**Implementation**: `server/Schema.js` - `updateInvoicePaymentStatus()`  
**Execution**: Scheduled to run every hour + once at server startup

**Purpose**: Batch updates overdue invoices and sends notifications.

**Behavior**:
1. Finds all invoices with `status = 'Unpaid'` and `dueDate < current_date`
2. Updates status to 'Overdue'
3. For recently overdue invoices (within last 24 hours):
   - Creates notification for client: "Invoice Overdue - Invoice #[NUMBER] is overdue. Please make payment."

**Scheduling**:
```javascript
// Runs every hour
setInterval(() => {
  updateInvoicePaymentStatus();
}, 3600000);

// Initial run 5 seconds after server startup
setTimeout(() => {
  updateInvoicePaymentStatus();
}, 5000);
```

**Returns**: Number of invoices updated

**Manual Invocation**:
```javascript
const count = updateInvoicePaymentStatus();
console.log(`Updated ${count} overdue invoices`);
```

### 2. getProjectView()
**Implementation**: `server/Schema.js` - `getProjectView()`

**Purpose**: Fetches all projects using the `project_view` VIEW.

**Returns**: Array of project objects with aggregated statistics

### 3. getProjectViewById(projectId)
**Implementation**: `server/Schema.js` - `getProjectViewById()`

**Purpose**: Fetches single project with statistics using the `project_view` VIEW.

**Parameters**:
- `projectId`: UUID of the project

**Returns**: Single project object with aggregated statistics

## Notification System

### Notification Table Structure
```sql
CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',  -- 'info', 'warning', 'payment', 'project'
    isRead INTEGER DEFAULT 0,  -- 0 = unread, 1 = read
    relatedId TEXT,            -- Links to related payment/project/invoice
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### Notification API Endpoints
- `GET /notifications/:userId` - Get all notifications for user
- `POST /notifications/read/:id` - Mark notification as read
- `POST /notifications/read-all/:userId` - Mark all user's notifications as read
- `DELETE /notifications/:id` - Delete notification

### Frontend Component
**Location**: `client/src/pages/Notifications.jsx`

**Features**:
- Real-time notification display
- Badge showing unread count
- Mark individual notifications as read
- Mark all as read functionality
- Delete notifications
- Visual differentiation by type (payment, project, warning, info)
- Relative timestamps (e.g., "2h ago", "3d ago")

## Automated Workflow Examples

### Example 1: Payment Flow
```
1. Client makes payment from ProjectWorking page
   → Payment inserted into payments table
   → Trigger: invoice_payment_after_insert fires
   → Freelancer receives: "Payment Received - ₹5000"
   → Client receives: "Payment Sent - ₹5000"

2. Freelancer creates invoice for payment
   → Invoice created with dueDate = 30 days from now

3. After 30 days pass
   → Scheduled job: updateInvoicePaymentStatus() runs
   → Invoice status changes from "Unpaid" to "Overdue"
   → Client receives: "Invoice Overdue - Please make payment"
```

### Example 2: Freelancer Assignment
```
1. Freelancer applies to project
   → Application created with status = "pending"

2. Client reviews and accepts application
   → Application.status updated to "accepted"
   → Project.freelancerId updated to freelancer's ID
   → Trigger: assign_freelancer fires
   → Freelancer receives: "Project Assigned - You have been assigned to project: Website Redesign"
   → Client receives: "Freelancer Assigned - A freelancer has been assigned to your project: Website Redesign"
```

### Example 3: Payment Status Change
```
1. Payment initially created with status = "Pending"
   
2. Payment processing completes
   → Payment.paymentStatus updated to "Completed"
   → Trigger: invoice_payment_after_update fires
   → Freelancer receives: "Payment Status Updated - Payment status changed to Completed"
```

## Performance Optimization

### Indexes Created
```sql
-- For faster notification queries
CREATE INDEX idx_notifications_userId ON notifications(userId);

-- For faster payment lookups
CREATE INDEX idx_payments_projectId ON payments(projectId);
CREATE INDEX idx_payments_clientId ON payments(clientId);
CREATE INDEX idx_payments_freelancerId ON payments(freelancerId);

-- For faster invoice queries
CREATE INDEX idx_invoices_paymentId ON invoices(paymentId);
CREATE INDEX idx_invoices_clientId ON invoices(clientId);
CREATE INDEX idx_invoices_freelancerId ON invoices(freelancerId);
CREATE INDEX idx_invoices_status ON invoices(status);

-- For faster project queries
CREATE INDEX idx_projects_clientId ON projects(clientId);
CREATE INDEX idx_projects_freelancerId ON projects(freelancerId);
CREATE INDEX idx_projects_status ON projects(status);
```

## Testing Triggers

### Test Trigger 1: Create Payment
```javascript
// Insert a payment
const payment = await Payment.create({
  projectId: 'project-uuid',
  clientId: 'client-uuid',
  freelancerId: 'freelancer-uuid',
  amount: 5000,
  paymentStatus: 'Completed'
});

// Check notifications created
const clientNotifs = await Notification.findByUserId('client-uuid');
const freelancerNotifs = await Notification.findByUserId('freelancer-uuid');
// Should find "Payment Sent" and "Payment Received" notifications
```

### Test Trigger 2: Assign Freelancer
```javascript
// Update project to assign freelancer
await Project.update('project-uuid', {
  freelancerId: 'freelancer-uuid'
});

// Check notifications
const notifications = await Notification.findByUserId('freelancer-uuid');
// Should find "Project Assigned" notification
```

### Test Procedure: Check Overdue Invoices
```javascript
// Create invoice with past due date
const invoice = await Invoice.create({
  dueDate: '2024-01-01',  // Past date
  status: 'Unpaid'
});

// Run procedure
const count = updateInvoicePaymentStatus();

// Verify invoice updated
const updated = await Invoice.findById(invoice.id);
console.log(updated.status);  // Should be "Overdue"
```

## Monitoring and Logs

The application logs trigger activities:
```
[Server Startup]
Initial invoice status check completed

[Hourly Check]
Updated 3 overdue invoices

[Payment Created]
Trigger: invoice_payment_after_insert - Created notifications for payment-uuid

[Freelancer Assigned]
Trigger: assign_freelancer - Notified parties for project-uuid
```

## Database Maintenance

### Cleanup Old Notifications
```javascript
// Delete notifications older than 30 days
db.run(`
  DELETE FROM notifications 
  WHERE datetime(createdAt) < datetime('now', '-30 days')
`);
```

### Reset Overdue Invoices (Manual Fix)
```javascript
// Manually run overdue check
const count = updateInvoicePaymentStatus();
console.log(`Checked and updated ${count} invoices`);
```

## Future Enhancements

1. **Email Integration**: Send email alerts in addition to in-app notifications
2. **SMS Notifications**: Critical payment reminders via SMS
3. **Configurable Schedules**: Allow users to set custom payment reminder frequencies
4. **Escalation Rules**: Automatically escalate overdue invoices after certain periods
5. **Notification Preferences**: Let users choose which notifications they receive
6. **Batch Operations**: Add procedure for bulk invoice generation

## Conclusion

These automated database features ensure that:
- ✅ Users are promptly notified of important events
- ✅ Invoice statuses are automatically maintained
- ✅ Payment tracking is transparent for both parties
- ✅ Project assignments trigger proper notifications
- ✅ System runs efficiently with scheduled maintenance

