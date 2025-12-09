import React, { useEffect, useState } from 'react';
import API from '../../api';
import { useNavigate } from 'react-router-dom';
import '../../styles/freelancer/createInvoice.css';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invoice form state
  const [selectedPayment, setSelectedPayment] = useState('');
  const [amount, setAmount] = useState('');
  const [tax, setTax] = useState('');
  const [description, setDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const freelancerId = localStorage.getItem('userId');
      
      // Fetch payments received by freelancer
      const paymentsRes = await API.get(`/fetch-payments/freelancer/${freelancerId}`);
      const completedPayments = paymentsRes.data.filter(p => p.paymentStatus === 'Completed');
      setPayments(completedPayments);

      // Fetch existing invoices
      const invoicesRes = await API.get(`/fetch-invoices/freelancer/${freelancerId}`);
      setInvoices(invoicesRes.data);

      // Fetch projects
      const projectsRes = await API.get('/fetch-projects');
      const myProjects = projectsRes.data.filter(p => p.freelancerId === freelancerId);
      setProjects(myProjects);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  const handlePaymentSelect = (paymentId) => {
    const payment = payments.find(p => p._id === paymentId);
    if (payment) {
      setSelectedPayment(paymentId);
      setAmount(payment.amount.toString());
      setTax((payment.amount * 0.18).toFixed(2)); // 18% tax
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedPayment || !amount) {
      alert('Please select a payment and enter amount');
      return;
    }

    try {
      const payment = payments.find(p => p._id === selectedPayment);
      const totalAmount = parseFloat(amount) + parseFloat(tax || 0);

      await API.post('/create-invoice', {
        paymentId: selectedPayment,
        projectId: payment.projectId,
        clientId: payment.clientId,
        freelancerId: localStorage.getItem('userId'),
        amount: parseFloat(amount),
        tax: parseFloat(tax || 0),
        totalAmount: totalAmount,
        description: description || 'Invoice for completed project'
      });

      alert('Invoice created and sent to client successfully!');
      setShowCreateForm(false);
      setSelectedPayment('');
      setAmount('');
      setTax('');
      setDescription('');
      fetchData();
    } catch (err) {
      console.error('Error creating invoice:', err);
      alert('Failed to create invoice');
    }
  };

  const getPaymentProject = (projectId) => {
    const project = projects.find(p => p._id === projectId);
    return project ? project.title : 'Unknown Project';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return '#28a745';
      case 'Unpaid':
        return '#ffc107';
      case 'Overdue':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  // Filter out payments that already have invoices
  const paymentsWithoutInvoice = payments.filter(
    payment => !invoices.some(invoice => invoice.paymentId === payment._id)
  );

  return (
    <div className="create-invoice-page">
      <div className="invoice-header">
        <h2>My Invoices</h2>
        <div className="header-actions">
          <button 
            className="btn-create" 
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : 'Create Invoice'}
          </button>
          <button className="btn-back" onClick={() => navigate('/freelancer')}>
            Back to Dashboard
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="create-invoice-form">
          <h3>Create New Invoice</h3>
          
          <div className="form-group">
            <label>Select Payment</label>
            <select
              className="form-control"
              value={selectedPayment}
              onChange={(e) => handlePaymentSelect(e.target.value)}
            >
              <option value="">-- Select a payment --</option>
              {paymentsWithoutInvoice.map((payment) => (
                <option key={payment._id} value={payment._id}>
                  {getPaymentProject(payment.projectId)} - ₹{payment.amount} ({payment.transactionId})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                className="form-control"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>

            <div className="form-group">
              <label>Tax (₹)</label>
              <input
                type="number"
                className="form-control"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                placeholder="Enter tax amount"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Total: ₹{(parseFloat(amount || 0) + parseFloat(tax || 0)).toFixed(2)}</label>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter invoice description"
              rows="3"
            />
          </div>

          <button className="btn-submit" onClick={handleCreateInvoice}>
            Create & Send Invoice
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div className="no-invoices">
          <p>No invoices created yet.</p>
        </div>
      ) : (
        <div className="invoices-list">
          <h3>My Invoices</h3>
          {invoices.map((invoice) => (
            <div className="invoice-card" key={invoice._id}>
              <div className="invoice-header-card">
                <h4>Invoice #{invoice.invoiceNumber}</h4>
                <span
                  className="invoice-status"
                  style={{ backgroundColor: getStatusColor(invoice.status) }}
                >
                  {invoice.status}
                </span>
              </div>
              <div className="invoice-details">
                <div className="detail-row">
                  <span className="label">Project:</span>
                  <span className="value">{getPaymentProject(invoice.projectId)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Amount:</span>
                  <span className="value">₹{invoice.amount}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Tax:</span>
                  <span className="value">₹{invoice.tax}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Total Amount:</span>
                  <span className="value total">₹{invoice.totalAmount}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Invoice Date:</span>
                  <span className="value">{formatDate(invoice.invoiceDate)}</span>
                </div>
                {invoice.description && (
                  <div className="detail-row">
                    <span className="label">Description:</span>
                    <span className="value">{invoice.description}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CreateInvoice;
