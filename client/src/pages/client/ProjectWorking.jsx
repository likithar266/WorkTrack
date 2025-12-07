import React, { useContext, useEffect, useState } from 'react'
import '../../styles/client/ProjectWorking.css'
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { GeneralContext } from '../../context/GeneralContext';

const ProjectWorking = () => {

  const {socket} = useContext(GeneralContext);


  const params = useParams();

  console.log(params['id']);

  const [project, setProject] = useState();
  const [clientId, setClientId] = useState(localStorage.getItem('userId'));
  const [projectId, setProjectId] = useState(params['id']);

  useEffect(()=>{
    if(params['id']) {
      fetchProject(params['id']);
      joinSocketRoom();
    }
  }, [params['id']])

  const joinSocketRoom = async() =>{
    if(params['id']) {
      await socket.emit("join-chat-room-client", {projectId: params['id']});
    }
  }

  const fetchProject = async(id) =>{
    if(!id) {
      console.error('No project ID provided');
      return;
    }
    
    try {
      console.log('Fetching project with ID:', id);
      const response = await axios.get(`http://localhost:6001/fetch-project/${id}`);
      console.log('Project response:', response.data);
      
      if(response.data) {
        // Check if response has _id or id
        const projectId = response.data._id || response.data.id;
        if(projectId) {
          setProject(response.data);
          setProjectId(projectId);
          setClientId(response.data.clientId);
        } else {
          console.error('Project response missing ID field:', response.data);
          alert('Invalid project data received');
        }
      } else {
        console.error('Empty response from server');
        alert('Project not found');
      }
    } catch (err) {
      console.error('Error fetching project:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch project';
      alert(errorMessage);
    }
  }


  const handleApproveSubmission = async() =>{
    await axios.get(`http://localhost:6001/approve-submission/${params['id']}`).then(
      (response)=>{
        fetchProject(params['id']);
        alert("Submission approved!!");
      }
    ).catch((err)=>{
      console.log(err);
    })
  }

  const handleRejectSubmission = async() =>{
    await axios.get(`http://localhost:6001/reject-submission/${params['id']}`).then(
      (response)=>{
        fetchProject(params['id']);
        alert("Submission rejected!!");
      }
    ).catch((err)=>{
      console.log(err);
    })
  }


  
  const [message, setMessage] = useState('');

  const handleMessageSend = async() =>{
    socket.emit("new-message", {projectId: params['id'], senderId: localStorage.getItem("userId"), message, time: new Date()})
    setMessage("");
    fetchChats();
  }



  useEffect(()=>{
    fetchChats();
  },[])

  const [chats, setChats] = useState(null);
  const fetchChats = async() =>{
    try {
      const response = await axios.get(`http://localhost:6001/fetch-chats/${params['id']}`);
      if(response.data) {
        setChats(response.data);
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
      // Set empty chats on error
      setChats({ messages: [] });
    }
  }

  useEffect(()=>{
    socket.on("message-from-user", ()=>{
      fetchChats();
    })
  },[socket])

  return (

    <>
    {project ? 
    
      <div className="project-data-page">

          <div className="project-data-container">

              <div className="project-data">

                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <span>
                      <h5>Required skills</h5>
                      <div className="required-skills">
                          {project.skills.map((skill)=>(
                            <p key={skill}>{skill}</p>
                          ))}
                      </div>
                    </span>
                    <span>
                      <h5>Budget</h5>
                      <h6>&#8377; {project.budget}</h6>
                    </span>

              </div>

              {project.freelancerId && project.freelancerId !== ""   ?
              
              <div className="project-submissions-container">

                  <h4>Submission</h4>

                  <div className="project-submissions">

                      {project.submission ? 
                      
                        <div className="project-submission">

                              <span>
                                <h5>Project Link: </h5>
                                <a href={project.projectLink} target='_blank' >{project.projectLink}</a>
                              </span>

                              <span>
                                <h5>Manual Link: </h5>
                                <a href={project.manulaLink} target='_blank'>{project.manulaLink}</a>
                              </span>

                              
                                <h5>Description for work</h5>
                                <p>{project.submissionDescription}</p>
                            
                              {project.submissionAccepted ?
                                <h5 style={{color: "green"}} >project completed!!</h5>
                              :
                              
                                <div className="submission-btns">
                                  <button className='btn btn-success' onClick={handleApproveSubmission} >Approve </button>
                                  <button className='btn btn-danger' onClick={handleRejectSubmission} >Reject</button>
                                </div>
                              }

                        </div>
                      :
                      <p>No submissions yet!!</p>
                      }


                  </div>

              </div>
              :""}




          </div>



          <div className="project-chat-container">

              <h4>Chat with the Freelancer</h4>
              <hr />

              {project.freelancerId ?
                
                    <div className="chat-body">

                        {chats && chats.messages ? 

                        <div className="chat-messages">

                          {chats.messages.length > 0 ? chats.messages.map((message)=>(

                              <div className={message.senderId === localStorage.getItem("userId") ? "my-message": "received-message"} key={message.id || Math.random()}>
                                <div>
                                    <p>{message.text}</p>
                                    <h6>{message.time ? (typeof message.time === 'string' ? message.time.slice(5,10) + ' - ' + message.time.slice(11,19) : new Date(message.time).toLocaleString()) : ''}</h6>
                                </div>
                              </div>
                          )) : <p style={{color: '#938f8f', textAlign: 'center', padding: '20px'}}>No messages yet. Start the conversation!</p>}
                          

                        </div>

                        : <p style={{color: '#938f8f', textAlign: 'center', padding: '20px'}}>Loading chat...</p>}


                        <hr />
                        <div className="chat-input">
                          <input type="text" className='form-control' placeholder='Enter something...' value={message} onChange={(e)=> setMessage(e.target.value)} />
                          <button onClick={handleMessageSend} >Send</button>
                        </div>

                    </div>
                :
                <i style={{color: '#938f8f'}} >Chat will be enabled if the project is assigned to you!!</i>
                }

          </div>

      </div>
    :""}
    </>
  )
}

export default ProjectWorking