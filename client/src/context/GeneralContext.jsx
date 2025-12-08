import React, { createContext, useEffect, useState } from 'react';
import API from '../api';
import { useNavigate } from "react-router-dom";
import socketIoClient from 'socket.io-client';

export const GeneralContext = createContext();

const GeneralContextProvider = ({children}) => {

  const WS = process.env.REACT_APP_API_URL || 'http://localhost:6001';

  const socket = socketIoClient(WS);


  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usertype, setUsertype] = useState('');
  const [err, setErr] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const login = async (loginInputs) => {
    try {
      const res = await API.post('/login', loginInputs);
      if (res.data) {
        localStorage.setItem('user', JSON.stringify(res.data));
        setErr(false);

        if (res.data.usertype === 'freelancer') {
          navigate('/freelancer');
        } else if (res.data.usertype === 'client') {
          navigate('/client');
        } else if (res.data.usertype === 'admin') {
          navigate('/admin');
        }
      }
    } catch (err) {
      setErr(true);
      setErrMsg(err.response.data.msg);
    }
  }

  const register = async (inputs) => {
    try {
      const res = await API.post('/register', inputs);
      if (res.data) {
        localStorage.setItem('user', JSON.stringify(res.data));
        setErr(false);

        if (res.data.usertype === 'freelancer') {
          navigate('/freelancer');
        } else if (res.data.usertype === 'client') {
          navigate('/client');
        } else if (res.data.usertype === 'admin') {
          navigate('/admin');
        }
      }
    } catch (err) {
      setErr(true);
      setErrMsg(err.response.data.error);
    }
  }

  const logout = () =>{
    
    localStorage.clear();
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        localStorage.removeItem(key);
      }
    }
    
    navigate('/');
  }


  return (
    <GeneralContext.Provider value={{
      socket, 
      login, 
      register, 
      logout, 
      username, 
      setUsername, 
      email, 
      setEmail, 
      password, 
      setPassword, 
      usertype, 
      setUsertype,
      err,
      errMsg
    }}>
      {children}
    </GeneralContext.Provider>
  )
}

export default GeneralContextProvider