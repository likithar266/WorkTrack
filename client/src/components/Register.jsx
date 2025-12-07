import React, { useContext, useState } from 'react';
import { GeneralContext } from '../context/GeneralContext';
import { FaGoogle, FaApple } from 'react-icons/fa';
import '../styles/auth.css';

const Register = ({ setAuthType }) => {
  // New state for the terms and conditions checkbox
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { username, setUsername, email, setEmail, password, setPassword, usertype, setUsertype, register } = useContext(GeneralContext);

  const handleRegister = async (e) => {
    e.preventDefault();
    // A check to ensure logic matches UI
    if (!agreedToTerms) {
      alert("Please agree to the terms and conditions.");
      return;
    }
    await register();
  };
  // --- END OF YOUR LOGIC (with a small guard clause) ---

  return (
    <form className="auth-form-v4">
      <h2 className="auth-title-v4">Create an account</h2>
      <p className="auth-subtitle-v4">Join Hire_Work and start your journey.</p>

      {/* Social Buttons (UI Only - for consistency) */}
      <button type="button" className="btn-social-v4 btn-google-v4">
        <FaGoogle /> Continue with Google
      </button>

      <div className="auth-separator-v4">
        <span>OR</span>
      </div>

      {/* Usertype Selection (Replaced <select>) */}
      <div className="form-group-v4">
        <label>You are a:</label>
        <div className="usertype-select-v4">
          <label>
            <input
              type="radio"
              name="usertype"
              value="client"
              checked={usertype === 'client'}
              onChange={(e) => setUsertype(e.target.value)}
            />
            <span>Client (Hiring)</span>
          </label>
          <label>
            <input
              type="radio"
              name="usertype"
              value="freelancer"
              checked={usertype === 'freelancer'}
              onChange={(e) => setUsertype(e.target.value)}
            />
            <span>Freelancer (Working)</span>
          </label>
          <label>
            <input
              type="radio"
              name="usertype"
              value="admin"
              checked={usertype === 'admin'}
              onChange={(e) => setUsertype(e.target.value)}
            />
            <span>Admin (Internal)</span>
          </label>
        </div>
      </div>

      {/* Username Input */}
      <div className="form-group-v4">
        <label htmlFor="register-username">Username</label>
        <input
          type="text"
          id="register-username"
          className="form-control-v4"
          placeholder="Your username"
          value={username || ''}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>

      {/* Email Input */}
      <div className="form-group-v4">
        <label htmlFor="register-email">Email Address</label>
        <input
          type="email"
          id="register-email"
          className="form-control-v4"
          placeholder="name@example.com"
          value={email || ''}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {/* Password Input */}
      <div className="form-group-v4">
        <label htmlFor="register-password">Password</label>
        <input
          type="password"
          id="register-password"
          className="form-control-v4"
          placeholder="Create a password"
          value={password || ''}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {/* --- NEW: reCAPTCHA + Terms & Conditions --- */}
      


      {/* Terms and Conditions */}
      <div className="form-group-v4">
        <label className="terms-v4">
          <input 
            type="checkbox" 
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
          />
          <span>
            Yes, I understand and agree to the 
            <a href="/terms-of-service" target="_blank"> Hire_Work Terms of Service</a>, 
            including the 
            <a href="/privacy-policy" target="_blank"> Privacy Policy</a>.
          </span>
        </label>
      </div>

      {/* --- END OF NEW SECTION --- */}


      {/* Submit Button (now with disabled logic) */}
      <button
        type="submit"
        className="btn-submit-v4"
        onClick={handleRegister} // LOGIC PRESERVED
        disabled={!agreedToTerms} // Button is disabled until user agrees to terms
      >
        Sign up
      </button>

      {/* Footer Link */}
      <p className="auth-footer-v4">
        Already registered?{' '}
        <span onClick={() => setAuthType('login')}> {/* LOGIC PRESERVED */}
          Login
        </span>
      </p>
    </form>
  );
};

export default Register;