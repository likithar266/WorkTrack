import React, { useEffect, useState } from 'react';
import '../../styles/client/ClientApplications.css';
import API from '../../api';

const ProjectApplications = () => {
  const [applications, setApplications] = useState([]);
  const [displayApplications, setDisplayApplications] = useState([]);
  const [projectTitles, setProjectTitles] = useState([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await API.get("/fetch-applications");
      // ensure we always have _id available
      const apps = (response.data || []).map(a => ({ ...a, _id: a._id || a.id }));
      const myApps = apps.filter(application => application.clientId === localStorage.getItem('userId'));
      setApplications(myApps);
      setDisplayApplications([...myApps].reverse());
      // set unique project titles
      const titles = [...new Set(myApps.map(a => a.title).filter(Boolean))];
      setProjectTitles(titles);
    } catch (err) {
      console.log('Fetch applications error', err);
    }
  };

  const handleApprove = async (_id) => {
    const realId = _id || '';
    if (!realId) {
      alert('Application id missing');
      return;
    }
    try {
      await API.get(`/approve-application/${realId}`);
      alert("Application approved");
      fetchApplications();
    } catch (err) {
      console.log(err);
      alert("Operation failed!!");
    }
  };

  const handleReject = async (id) => {
    const realId = id || '';
    if (!realId) {
      alert('Application id missing');
      return;
    }
    try {
      await API.get(`/reject-application/${realId}`);
      alert("Application rejected!!");
      fetchApplications();
    } catch (err) {
      console.log(err);
      alert("Operation failed!!");
    }
  };

  const handleFilterChange = (value) => {
    if (value === '') {
      setDisplayApplications([...applications].reverse());
    } else {
      setDisplayApplications([...applications.filter(application => application.title === value)].reverse());
    }
  };

  return (
    <div className="client-applications-page">
      {projectTitles && projectTitles.length > 0 ? (
        <span>
          <h3>Applications</h3>
          <select className='form-control' onChange={(e) => handleFilterChange(e.target.value)}>
            <option value="">All Projects</option>
            {projectTitles.map((title) => (
              <option key={title} value={title}>{title}</option>
            ))}
          </select>
        </span>
      ) : null}

      <div className="client-applications-body">
        {displayApplications.map((application, appIndex) => (
          <div
            className="client-application"
            key={application._id || application.id || `app-${appIndex}`}
          >
            <div className="client-application-body">
              <div className="client-application-half">
                <h4>{application.title}</h4>
                <p>{application.description}</p>
                <span>
                  <h5>Skills</h5>
                  <div className="application-skills">
                    {(application.requiredSkills || []).map((skill, idx) => (
                      <p key={`${skill}-${idx}`}>{skill}</p>
                    ))}
                  </div>
                </span>
                <h6>Budget - &#8377; {application.budget}</h6>
              </div>

              <div className="vertical-line"></div>

              <div className="client-application-half">
                <span>
                  <h5>Proposal</h5>
                  <p>{application.proposal}</p>
                </span>
                <span>
                  <h5>Skills</h5>
                  <div className="application-skills">
                    {(application.freelancerSkills || []).map((skill, idx) => (
                      <p key={`${skill}-${idx}`}>{skill}</p>
                    ))}
                  </div>
                </span>
                <h6>Proposed Budget - &#8377; {application.bidAmount}</h6>
                <div className="approve-btns">
                  {application.status === 'Pending' ? (
                    <>
                      <button className="btn btn-success" onClick={() => handleApprove(application.id)}>Approve</button>
                      <button className="btn btn-danger" onClick={() => handleReject(application.id)}>Decline</button>
                    </>
                  ) : (
                    <h6>Status: <b>{application.status}</b></h6>
                  )}
                </div>
              </div>
            </div>
            <hr />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectApplications;
