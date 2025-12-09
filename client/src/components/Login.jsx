import React, { useContext } from 'react';
import { GeneralContext } from '../context/GeneralContext';
import { FaGoogle, FaApple } from 'react-icons/fa'; // Added for social buttons
import '../styles/auth.css'; // <-- **Import the new CSS file**

const Login = ({ setAuthType }) => {
  const { email, setEmail, password, setPassword, login } = useContext(GeneralContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    await login();
  };
  // --- END OF YOUR LOGIC ---

  return (
    <form className="auth-form-v4">
      <h2 className="auth-title-v4">Welcome back</h2>
      <p className="auth-subtitle-v4">Login to your WorkTrack account.</p>

      {/* Social Buttons (UI Only) */}
      <button type="button" className="btn-social-v4 btn-google-v4">
        <FaGoogle /> Continue with Google
      </button>
      <button type="button" className="btn-social-v4 btn-apple-v4">
        <FaApple /> Continue with Apple
      </button>

      <div className="auth-separator-v4">
        <span>OR</span>
      </div>

      {/* Email Input */}
      <div className="form-group-v4">
        <label htmlFor="login-email">Email Address</label>
        <input
          type="email"
          id="login-email"
          className="form-control-v4"
          placeholder="name@example.com"
          value={email || ''}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {/* Password Input */}
      <div className="form-group-v4">
        <label htmlFor="login-password">Password</label>
        <input
          type="password"
          id="login-password"
          className="form-control-v4"
          placeholder="Your password"
          value={password || ''}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="btn-submit-v4"
        onClick={handleLogin} // LOGIC PRESERVED
      >
        Sign in
      </button>

      {/* Footer Link */}
      <p className="auth-footer-v4">
        Not registered?{' '}
        <span onClick={() => setAuthType('register')}> {/* LOGIC PRESERVED */}
          Create an account
        </span>
      </p>
    </form>
  );
};

export default Login;