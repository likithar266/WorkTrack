import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { FaArrowLeft } from 'react-icons/fa'; // Import the back arrow icon
import Login from '../components/Login';
import Register from '../components/Register';
import '../styles/auth.css'; // Import the CSS here

const Authenticate = () => {
  const [authType, setAuthType] = useState('login'); // 'login' or 'register'
  const navigate = useNavigate(); // Initialize navigate

  return (
    <div className="auth-page-container">
      
      {/* --- NEW: Back to Home Link --- */}
      <div className="auth-back-link-v4" onClick={() => navigate('/')}>
        <FaArrowLeft />
        <span>Back to Home</span>
      </div>
      {/* --- End of New Section --- */}

      {/* This is your existing logic for switching forms */}
      {authType === 'login' ? (
        <Login setAuthType={setAuthType} />
      ) : (
        <Register setAuthType={setAuthType} />
      )}
    </div>
  );
};

export default Authenticate;