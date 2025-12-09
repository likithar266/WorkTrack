import React, { useEffect, useState } from 'react';
import API from '../../api';
import { useNavigate } from 'react-router-dom';
import '../../styles/freelancer/earnings.css';

const Earnings = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const freelancerId = localStorage.getItem('userId');
      const response = await API.get(`/fetch-payments/freelancer/${freelancerId}`);
      setPayments(response.data);
      
      // Calculate total earnings from completed payments
      const total = response.data
        .filter(p => p.paymentStatus === 'Completed')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);
      setTotalEarnings(total);
      
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
    <div className="earnings-page">
      <div className="earnings-header">
        <h2>My Earnings</h2>
        <button className="btn-back" onClick={() => navigate('/freelancer')}>
          Back to Dashboard
        </button>
      </div>

      <div className="total-earnings-card">
        <h3>Total Earnings</h3>
        <p className="earnings-amount">₹{totalEarnings.toFixed(2)}</p>
      </div>

      {loading ? (
        <div className="loading">Loading payments...</div>
      ) : payments.length === 0 ? (
        <div className="no-payments">
          <p>No payments yet.</p>
        </div>
      ) : (
        <div className="payments-list">
          <h3>Payment History</h3>
          {payments.map((payment) => (
            <div className="payment-card" key={payment._id}>
              <div className="payment-header">
                <h4>Payment ID: {payment._id.substring(0, 8)}...</h4>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Earnings;
