import React, { useEffect, useState } from 'react';
import API from '../../api';
import { useNavigate } from 'react-router-dom';
import '../../styles/client/invoices.css';

const Invoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const clientId = localStorage.getItem('userId');
      const response = await API.get(`/fetch-invoices/client/${clientId}`);
      setInvoices(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setLoading(false);
    }
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

  const handlePayInvoice = async (invoiceId) => {
    try {
      await API.post(`/update-invoice/${invoiceId}`, { status: 'Paid' });
      alert('Invoice paid successfully!');
      fetchInvoices();
    } catch (err) {
      console.error('Error paying invoice:', err);
      alert('Failed to pay invoice');
    }
  };

  return (
    <div className="invoices-page">
      <div className="invoices-header">
        <h2>My Invoices</h2>
        <button className="btn-back" onClick={() => navigate('/client')}>
          Back to Dashboard
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div className="no-invoices">
          <p>No invoices yet.</p>
        </div>
      ) : (
        <div className="invoices-list">
          {invoices.map((invoice) => (
            <div className="invoice-card" key={invoice._id}>
              <div className="invoice-header">
                <h3>Invoice #{invoice.invoiceNumber}</h3>
                <span
                  className="invoice-status"
                  style={{ backgroundColor: getStatusColor(invoice.status) }}
                >
                  {invoice.status}
                </span>
              </div>
              <div className="invoice-details">
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
              {invoice.status === 'Unpaid' && (
                <div className="invoice-actions">
                  <button
                    className="btn-pay"
                    onClick={() => handlePayInvoice(invoice._id)}
                  >
                    Pay Now
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Invoices;
