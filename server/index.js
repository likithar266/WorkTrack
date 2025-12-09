// server/index.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { Application, Chat, Freelancer, Project, User, Payment, Invoice, Notification, updateInvoicePaymentStatus, getProjectView, getProjectViewById } from './Schema.js';
import { Server } from 'socket.io';
import http from 'http';
import SocketHandler from './SocketHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const formatUserResponse = (user) => {
  if (!user) return null;
  const response = { ...user };
  response._id = user.id;
  delete response.id;
  return response;
};

const app = express();

// === NEW CORS CONFIGURATION START ===
// We will allow requests from your deployed client and localhost for development
const allowedOrigins = [
  'https://freelancer-client.onrender.com', // Your deployed frontend
  'http://localhost:3000'                   // Your local development environment
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow all localhost origins
    if (/^http:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    // Allow deployed frontend
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  }
}));
// === NEW CORS CONFIGURATION END ===

app.use(express.json());
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

// Serve static files from the React app
// The 'build' folder is now inside the 'server' directory
app.use(express.static(path.join(__dirname, 'build')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin
      if (!origin) return callback(null, true);
      // Allow all localhost origins
      if (/^http:\/\/localhost(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      // Allow deployed frontend
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});
io.on("connection", (socket) => {
  console.log("User connected");
  SocketHandler(socket);
});

const PORT = process.env.PORT || 6001;
console.log('SQLite database initialized');

// register
app.post('/register', async (req, res) => {
  try {
    const { username, email, password, usertype } = req.body;
    if (!username || !email || !password || !usertype) return res.status(400).json({ error: "All fields are required" });

    const existingUser = User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User with this email already exists" });

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const user = User.create({ username, email, password: passwordHash, usertype });
    if (!user) return res.status(500).json({ error: "Failed to create user" });

    if (usertype === 'freelancer') {
      Freelancer.create({ userId: user.id });
    }

    const userResponse = formatUserResponse(user);
    res.status(200).json(userResponse);
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message || "Registration failed" });
  }
});

// login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: "Email and password are required" });

    const user = User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User does not exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const userResponse = formatUserResponse(user);
    res.status(200).json(userResponse);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || "Login failed" });
  }
});

// fetch freelancer (returns _id)
app.get('/fetch-freelancer/:id', (req, res) => {
  try {
    const freelancer = Freelancer.findOne({ userId: req.params.id });
    if (!freelancer) return res.status(404).json({ error: "Freelancer not found" });
    const freelancerResponse = { ...freelancer, _id: freelancer.id };
    delete freelancerResponse.id;
    res.status(200).json(freelancerResponse);
  } catch (err) {
    console.error('Fetch freelancer error:', err);
    res.status(500).json({ error: err.message });
  }
});

// update freelancer
app.post('/update-freelancer', (req, res) => {
  const { freelancerId, updateSkills, description } = req.body;
  try {
    let id = freelancerId;
    if (!id) return res.status(400).json({ error: "Freelancer ID is required" });

    let freelancer = Freelancer.findById(id);
    if (!freelancer) {
      freelancer = Freelancer.findOne({ userId: id });
      if (freelancer) id = freelancer.id;
    }
    if (!freelancer) return res.status(404).json({ error: "Freelancer not found" });

    let skills = [];
    if (updateSkills) {
      if (Array.isArray(updateSkills)) skills = updateSkills.filter(s => s && s.trim());
      else if (typeof updateSkills === 'string') skills = updateSkills.split(',').map(s => s.trim()).filter(s => s);
    }

    Freelancer.update(id, { skills, description: description || freelancer.description });
    const updatedFreelancer = Freelancer.findById(id);
    const freelancerResponse = { ...updatedFreelancer, _id: updatedFreelancer.id };
    delete freelancerResponse.id;
    res.status(200).json(freelancerResponse);
  } catch (err) {
    console.error('Update freelancer error:', err);
    res.status(500).json({ error: err.message });
  }
});

const formatProjectResponse = (project) => {
  if (!project) return null;
  const response = { ...project };
  response._id = project.id;
  delete response.id;
  return response;
};

// fetch single project
app.get('/fetch-project/:id', (req, res) => {
  try {
    const projectId = req.params.id;
    if (!projectId) return res.status(400).json({ error: "Project ID is required" });

    const project = Project.findById(projectId);
    if (!project) {
      const allProjects = Project.findAll();
      console.error(`Project not found with id: ${projectId}. Total projects: ${allProjects.length}`);
      return res.status(404).json({ error: "Project not found" });
    }
    const projectResponse = formatProjectResponse(project);
    res.status(200).json(projectResponse);
  } catch (err) {
    console.error('Fetch project error:', err);
    res.status(500).json({ error: err.message || "Failed to fetch project" });
  }
});

// fetch all projects (returns _id)
app.get('/fetch-projects', (req, res) => {
  try {
    const projects = Project.findAll();
    const projectsResponse = projects.map(p => ({ ...p, _id: p.id }));
    res.status(200).json(projectsResponse);
  } catch (err) {
    console.error('Fetch projects error:', err);
    res.status(500).json({ error: err.message });
  }
});

// new project
app.post('/new-project', (req, res) => {
  const { title, description, budget, skills, clientId, clientName, clientEmail } = req.body;
  try {
    const projectSkills = (skills || '').split(',').map(s => s.trim()).filter(s => s);
    Project.create({ title, description, budget, skills: projectSkills, clientId, clientName, clientEmail, postedDate: new Date().toISOString() });
    res.status(200).json({ message: "Project added" });
  } catch (err) {
    console.error('New project error:', err);
    res.status(500).json({ error: err.message });
  }
});

// make bid (create application)
app.post('/make-bid', (req, res) => {
  const { clientId, freelancerId, projectId, proposal, bidAmount, estimatedTime } = req.body;
  try {
    const freelancer = User.findById(freelancerId);
    const freelancerData = Freelancer.findOne({ userId: freelancerId });
    const project = Project.findById(projectId);
    const client = User.findById(clientId);

    if (!freelancer || !freelancerData || !project || !client) return res.status(404).json({ error: "Required data not found" });

    const application = Application.create({
      projectId,
      clientId,
      clientName: client.username,
      clientEmail: client.email,
      freelancerId,
      freelancerName: freelancer.username,
      freelancerEmail: freelancer.email,
      freelancerSkills: freelancerData.skills || [],
      title: project.title,
      description: project.description,
      budget: project.budget,
      requiredSkills: project.skills || [],
      proposal,
      bidAmount,
      estimatedTime
    });

    const bids = project.bids || [];
    const bidAmounts = project.bidAmounts || [];
    bids.push((freelancerId));
    bidAmounts.push(parseInt(bidAmount));

    Project.update(projectId, { bids, bidAmounts });

    if (application) {
      Freelancer.addApplication(freelancerId, application.id);
    }

    res.status(200).json({ message: "bidding successful" });
  } catch (err) {
    console.error('Make bid error:', err);
    res.status(500).json({ error: err.message });
  }
});

// fetch all applications (ensure _id field)
app.get('/fetch-applications', (req, res) => {
  try {
    const applications = Application.findAll();
    // attach _id for each application so frontend can rely on _id consistently
    const apps = applications.map(a => ({ ...a, _id: a.id }));
    res.status(200).json(apps);
  } catch (err) {
    console.error('Fetch applications error:', err);
    res.status(500).json({ error: err.message });
  }
});

// approve application
app.get('/approve-application/:id', (req, res) => {
  try {
    const id = req.params.id;
    // Accept either id or _id
    const application = Application.findById(id);
    if (!application) return res.status(404).json({ error: "Application not found" });

    const project = Project.findById(application.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const freelancer = Freelancer.findOne({ userId: application.freelancerId });
    if (!freelancer) return res.status(404).json({ error: "Freelancer not found" });

    const user = User.findById(application.freelancerId);
    if (!user) return res.status(404).json({ error: "User not found" });

    Application.update(application.id, { status: 'Accepted' });

    const remainingApplications = Application.findByProjectId(application.projectId)
      .filter(app => app.status === "Pending" && app.id !== application.id);

    remainingApplications.forEach(app => Application.update(app.id, { status: 'Rejected' }));

    Project.update(application.projectId, {
    //   freelancerId: freelancer.userId,
      freelancerId: (freelancer.userId),
      freelancerName: user.email,
      budget: application.bidAmount,
      status: "Assigned"
    });

    Freelancer.addCurrentProject(freelancer.userId, project.id);

    res.status(200).json({ message: "Application approved!!" });
  } catch (err) {
    console.error('Approve application error:', err);
    res.status(500).json({ error: err.message });
  }
});

// reject application
app.get('/reject-application/:id', (req, res) => {
  try {
    const application = Application.findById(req.params.id);
    if (!application) return res.status(404).json({ error: "Application not found" });

    Application.update(application.id, { status: 'Rejected' });
    res.status(200).json({ message: "Application rejected!!" });
  } catch (err) {
    console.error('Reject application error:', err);
    res.status(500).json({ error: err.message });
  }
});

// submit project
app.post('/submit-project', (req, res) => {
  const { clientId, freelancerId, projectId, projectLink, manualLink, submissionDescription } = req.body;
  try {
    const project = Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    Project.update(projectId, {
      projectLink,
      manulaLink: manualLink,
      submissionDescription,
      submission: true
    });

    res.status(200).json({ message: "Project added" });
  } catch (err) {
    console.error('Submit project error:', err);
    res.status(500).json({ error: err.message });
  }
});

// approve submission
app.get('/approve-submission/:id', (req, res) => {
  try {
    const project = Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const freelancer = Freelancer.findOne({ userId: project.freelancerId });
    if (!freelancer) return res.status(404).json({ error: "Freelancer not found" });

    Project.update(project.id, { submissionAccepted: true, status: "Completed" });
    Freelancer.removeCurrentProject(freelancer.userId, project.id);
    Freelancer.addCompletedProject(freelancer.userId, project.id);
    const newFunds = parseInt(freelancer.funds || 0) + parseInt(project.budget || 0);
    Freelancer.update(freelancer.id, { funds: newFunds });

    res.status(200).json({ message: "submission approved" });
  } catch (err) {
    console.error('Approve submission error:', err);
    res.status(500).json({ error: err.message });
  }
});

// reject submission
app.get('/reject-submission/:id', (req, res) => {
  try {
    const project = Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    Project.update(project.id, { submission: false, projectLink: "", manulaLink: "", submissionDescription: "" });
    res.status(200).json({ message: "submission rejected" });
  } catch (err) {
    console.error('Reject submission error:', err);
    res.status(500).json({ error: err.message });
  }
});

// fetch all users
app.get('/fetch-users', (req, res) => {
  try {
    const users = User.findAll();
    const resp = users.map(u => ({ ...u, _id: u.id }));
    res.status(200).json(resp);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: err.message });
  }
});

// fetch chats
app.get('/fetch-chats/:id', (req, res) => {
  try {
    const chats = Chat.findById(req.params.id);
    if (!chats) {
      return res.status(200).json({ id: req.params.id, _id: req.params.id, messages: [] });
    }
    const chatsResponse = { ...chats, _id: chats.id };
    delete chatsResponse.id;
    res.status(200).json(chatsResponse);
  } catch (err) {
    console.error('Fetch chats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== PAYMENT ENDPOINTS =====

// Create payment
app.post('/create-payment', (req, res) => {
  try {
    const { projectId, clientId, freelancerId, amount, paymentMethod } = req.body;
    if (!projectId || !clientId || !freelancerId || !amount) {
      return res.status(400).json({ error: "Required fields missing" });
    }
    
    const payment = Payment.create({
      projectId,
      clientId,
      freelancerId,
      amount,
      paymentMethod: paymentMethod || 'Card',
      paymentStatus: 'Pending',
      transactionId: `TXN-${Date.now()}`,
      paymentDate: new Date().toISOString()
    });
    
    res.status(200).json(payment);
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch all payments
app.get('/fetch-payments', (req, res) => {
  try {
    const payments = Payment.findAll();
    res.status(200).json(payments);
  } catch (err) {
    console.error('Fetch payments error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch payment by ID
app.get('/fetch-payment/:id', (req, res) => {
  try {
    const payment = Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    res.status(200).json(payment);
  } catch (err) {
    console.error('Fetch payment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch payments by client ID
app.get('/fetch-payments/client/:clientId', (req, res) => {
  try {
    const payments = Payment.findByClientId(req.params.clientId);
    res.status(200).json(payments);
  } catch (err) {
    console.error('Fetch client payments error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch payments by freelancer ID
app.get('/fetch-payments/freelancer/:freelancerId', (req, res) => {
  try {
    const payments = Payment.findByFreelancerId(req.params.freelancerId);
    res.status(200).json(payments);
  } catch (err) {
    console.error('Fetch freelancer payments error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update payment status
app.post('/update-payment/:id', (req, res) => {
  try {
    const { paymentStatus, transactionId } = req.body;
    const payment = Payment.update(req.params.id, { paymentStatus, transactionId });
    res.status(200).json(payment);
  } catch (err) {
    console.error('Update payment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== INVOICE ENDPOINTS =====

// Create invoice
app.post('/create-invoice', (req, res) => {
  try {
    const { paymentId, projectId, clientId, freelancerId, amount, tax, description } = req.body;
    if (!paymentId || !projectId || !clientId || !freelancerId || !amount) {
      return res.status(400).json({ error: "Required fields missing" });
    }
    
    const totalAmount = parseFloat(amount) + (parseFloat(tax) || 0);
    
    const invoice = Invoice.create({
      paymentId,
      projectId,
      clientId,
      freelancerId,
      amount: parseFloat(amount),
      tax: parseFloat(tax) || 0,
      totalAmount,
      invoiceDate: new Date().toISOString(),
      status: 'Unpaid',
      description: description || ''
    });
    
    res.status(200).json(invoice);
  } catch (err) {
    console.error('Create invoice error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch all invoices
app.get('/fetch-invoices', (req, res) => {
  try {
    const invoices = Invoice.findAll();
    res.status(200).json(invoices);
  } catch (err) {
    console.error('Fetch invoices error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch invoice by ID
app.get('/fetch-invoice/:id', (req, res) => {
  try {
    const invoice = Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.status(200).json(invoice);
  } catch (err) {
    console.error('Fetch invoice error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch invoices by client ID
app.get('/fetch-invoices/client/:clientId', (req, res) => {
  try {
    const invoices = Invoice.findByClientId(req.params.clientId);
    res.status(200).json(invoices);
  } catch (err) {
    console.error('Fetch client invoices error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch invoices by freelancer ID
app.get('/fetch-invoices/freelancer/:freelancerId', (req, res) => {
  try {
    const invoices = Invoice.findByFreelancerId(req.params.freelancerId);
    res.status(200).json(invoices);
  } catch (err) {
    console.error('Fetch freelancer invoices error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update invoice status
app.post('/update-invoice/:id', (req, res) => {
  try {
    const { status } = req.body;
    const invoice = Invoice.update(req.params.id, { status });
    res.status(200).json(invoice);
  } catch (err) {
    console.error('Update invoice error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* -----------------------------
   Notification endpoints
   ----------------------------- */

// Get notifications for a user
app.get('/notifications/:userId', (req, res) => {
  try {
    const notifications = Notification.findByUserId(req.params.userId);
    res.status(200).json(notifications);
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Mark notification as read
app.post('/notifications/read/:id', (req, res) => {
  try {
    const notification = Notification.markAsRead(req.params.id);
    res.status(200).json(notification);
  } catch (err) {
    console.error('Mark notification as read error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Mark all notifications as read for user
app.post('/notifications/read-all/:userId', (req, res) => {
  try {
    Notification.markAllAsReadForUser(req.params.userId);
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all notifications as read error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete notification
app.delete('/notifications/:id', (req, res) => {
  try {
    Notification.deleteById(req.params.id);
    res.status(200).json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* -----------------------------
   Project View endpoints (using VIEW)
   ----------------------------- */

// Get all projects with detailed view
app.get('/projects-view', (req, res) => {
  try {
    const projects = getProjectView();
    res.status(200).json(projects);
  } catch (err) {
    console.error('Fetch project view error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get single project detailed view
app.get('/projects-view/:id', (req, res) => {
  try {
    const project = getProjectViewById(req.params.id);
    res.status(200).json(project);
  } catch (err) {
    console.error('Fetch project view by id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Schedule automatic check for overdue invoices (runs every hour)
setInterval(() => {
  try {
    const count = updateInvoicePaymentStatus();
    if (count > 0) {
      console.log(`Updated ${count} overdue invoices`);
    }
  } catch (err) {
    console.error('Error updating invoice status:', err);
  }
}, 3600000); // 1 hour = 3600000 ms

// Run once on startup
setTimeout(() => {
  try {
    updateInvoicePaymentStatus();
    console.log('Initial invoice status check completed');
  } catch (err) {
    console.error('Error on initial invoice status check:', err);
  }
}, 5000); // 5 seconds after startup

server.listen(PORT, () => console.log(`Server Port: ${PORT}`));
