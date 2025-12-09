import React, { useState } from 'react'
import API from '../../api';
import {useNavigate} from 'react-router-dom';
import '../../styles/client/newProject.css'


const NewProject = () => {

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState(0);
    const [skills, setSkills] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async() =>{
      await API.post("/new-project", {title, description, budget, skills, clientId: localStorage.getItem('userId'),  clientName: localStorage.getItem('username'),  clientEmail: localStorage.getItem('email')}).then(
        (response)=>{
            alert("new project added!!");
            setTitle('');
            setDescription('');
            setBudget(0);
            setSkills('');
            navigate('/client');
        }
      ).catch((err)=>{
        alert("operation failed!!");
      })
    }

  return (
    <div className="new-project-page">

          <h3>Post new project</h3>

          <div className="new-project-form">

              <div className="form-floating">
                <input type="text" className="form-control mb-3" id="floatingTitle" placeholder="Project Title" onChange={(e)=>setTitle(e.target.value)} />
                <label htmlFor="floatingTitle">Project title</label>
              </div>

              <div className="form-floating">
                <textarea type="text" className="form-control mb-3" id="floatingDescription" placeholder="Description"  onChange={(e)=>setDescription(e.target.value)}/>
                <label htmlFor="floatingDescription">Description</label>
              </div>

              <span>
                <div className="form-floating">
                  <input type="number" className="form-control mb-3" id="floatingBudget" placeholder="Budget" onChange={(e)=>setBudget(e.target.value)} />
                  <label htmlFor="floatingBudget">Budget (in ₹)</label>
                </div>

                <div className="form-floating">
                  <input type="text" className="form-control mb-3" id="floatingSkills" placeholder="Required Skills" onChange={(e)=>setSkills(e.target.value)} />
                  <label htmlFor="floatingSkills">Required skills (seperate each with ,)</label>
                </div>
              </span>

              <button className='btn' onClick={handleSubmit} >Submit</button>

          </div>

    </div>
  )
}

export default NewProject