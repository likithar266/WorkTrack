import React, { useContext } from 'react';
import '../styles/navbar.css'; // We will replace this CSS file
import { useNavigate } from 'react-router-dom';
import { GeneralContext } from '../context/GeneralContext';

const Navbar = () => {
  // --- YOUR LOGIC (UNCHANGED) ---
  const usertype = localStorage.getItem('usertype');
  const navigate = useNavigate();
  const { logout } = useContext(GeneralContext);
  // --- END OF YOUR LOGIC ---

  return (
    <>
      {/* === 1. FREELANCER NAVBAR === */}
      {usertype === 'freelancer' ? (
        <div className="navbar-v4">
          <h3 className="logo-v4" onClick={() => navigate('/freelancer')}>WorkTrack</h3>
          <div className="nav-options-v4">
            <p className="nav-link-v4" onClick={() => navigate('/freelancer')}>Dashboard</p>
            <p className="nav-link-v4" onClick={() => navigate('/all-projects')}>All Projects</p>
            <p className="nav-link-v4" onClick={() => navigate('/my-projects')}>My Projects</p>
            <p className="nav-link-v4" onClick={() => navigate('/myApplications')}>Applications</p>
            <button className="btn-logout-v4" onClick={() => logout()}>Logout</button>
          </div>
        </div>
      ) : (
        ""
      )}

      {/* === 2. CLIENT NAVBAR === */}
      {usertype === 'client' ? (
        <div className="navbar-v4">
          <h3 className="logo-v4" onClick={() => navigate('/client')}>WorkTrack</h3>
          <div className="nav-options-v4">
            <p className="nav-link-v4" onClick={() => navigate('/client')}>Dashboard</p>
            <p className="nav-link-v4" onClick={() => navigate('/new-project')}>New Project</p>
            <p className="nav-link-v4" onClick={() => navigate('/project-applications')}>Applications</p>
            <button className="btn-logout-v4" onClick={() => logout()}>Logout</button>
          </div>
        </div>
      ) : (
        ""
      )}

      {/* === 3. ADMIN NAVBAR === */}
      {usertype === 'admin' ? (
        <div className="navbar-v4">
          <h3 className="logo-v4" onClick={() => navigate('/admin')}>WorkTrack (Admin)</h3>
          <div className="nav-options-v4">
            <p className="nav-link-v4" onClick={() => navigate('/admin')}>Home</p>
            <p className="nav-link-v4" onClick={() => navigate('/all-users')}>All users</p>
            <p className="nav-link-v4" onClick={() => navigate('/admin-projects')}>Projects</p>
            <p className="nav-link-v4" onClick={() => navigate('/admin-applications')}>Applications</p>
            <button className="btn-logout-v4" onClick={() => logout()}>Logout</button>
          </div>
        </div>
      ) : (
        ""
      )}

      {/* === 4. NEW: LANDING PAGE NAVBAR (Logged-out) === */}
      {!usertype ? (
        <div className="navbar-v4">
          <h3 className="logo-v4" onClick={() => navigate('/')}>WorkTrack</h3>
          <div className="nav-options-v4">
            {/* You can add more links here if you want, e.g., "Find Talent" */}
            <button onClick={() => navigate('/authenticate')} className="btn-signin-v4-nav">
              Sign In
            </button>
            <button onClick={() => navigate('/authenticate')} className="btn-join-v4-nav">
              Join
            </button>
          </div>
        </div>
      ) : (
        ""
      )}
    </>
  );
};

export default Navbar;