import React, { useEffect, useState } from 'react';
import API from '../../api';
import { useNavigate } from 'react-router-dom';
import '../../styles/client/payments.css';

const Payments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const clientId = localStorage.getItem('userId');
      const response = await API.get(`/fetch-payments/client/${clientId}`);
      setPayments(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return '#28a745';
      case 'Pending':
        return '#ffc107';
      case 'Failed':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  return (
    <div className="payments-page">
      <div className="payments-header">
        <h2>My Payments</h2>
        <button className="btn-back" onClick={() => navigate('/client')}>
          Back to Dashboard
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading payments...</div>
      ) : payments.length === 0 ? (
        <div className="no-payments">
          <p>No payments yet.</p>
        </div>
      ) : (
        <div className="payments-list">
          {payments.map((payment) => (
            <div className="payment-card" key={payment._id}>
              <div className="payment-header">
                <h3>Payment ID: {payment._id.substring(0, 8)}...</h3>
                <span
                  className="payment-status"
                  style={{ backgroundColor: getStatusColor(payment.paymentStatus) }}
                >
                  {payment.paymentStatus}
                </span>
              </div>
              <div className="payment-details">
                <div className="detail-row">
                  <span className="label">Amount:</span>
                  <span className="value">₹{payment.amount}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Payment Method:</span>
                  <span className="value">{payment.paymentMethod}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Transaction ID:</span>
                  <span className="value">{payment.transactionId || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Payment Date:</span>
                  <span className="value">{formatDate(payment.paymentDate)}</span>
                </div>
              </div>
              <div className="payment-actions">
                <button
                  className="btn-view-invoice"
                  onClick={() => navigate(`/invoice/${payment._id}`)}
                >
                  View Invoice
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Payments;
