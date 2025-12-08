import React, { createContext, useEffect, useState } from 'react';
import axios from "axios";
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
 
  
  
  
  const login = async () => {
    try {
      // Validate inputs
      if (!email || !password) {
        alert("Please enter both email and password");
        return;
      }

      const loginInputs = { email, password };
      const res = await axios.post('http://localhost:6001/login', loginInputs);

      if (res.data && res.data._id) {
        localStorage.setItem('userId', res.data._id);
        localStorage.setItem('usertype', res.data.usertype);
        localStorage.setItem('username', res.data.username);
        localStorage.setItem('email', res.data.email);

        if (res.data.usertype === 'freelancer') {
          navigate('/freelancer');
        } else if (res.data.usertype === 'client') {
          navigate('/client');
        } else if (res.data.usertype === 'admin') {
          navigate('/admin');
        }
      } else {
        alert("Login failed: Invalid response from server");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.msg || err.response?.data?.error || "Login failed. Please try again.";
      alert(errorMessage);
      console.error('Login error:', err);
    }
  };

  const register = async () => {
    try {
      // Validate inputs
      if (!username || !email || !password || !usertype) {
        alert("Please fill in all fields");
        return;
      }

      const inputs = { username, email, usertype, password };
      const res = await axios.post('http://localhost:6001/register', inputs);

      if (res.data && res.data._id) {
        localStorage.setItem('userId', res.data._id);
        localStorage.setItem('usertype', res.data.usertype);
        localStorage.setItem('username', res.data.username);
        localStorage.setItem('email', res.data.email);

        if (res.data.usertype === 'freelancer') {
          navigate('/freelancer');
        } else if (res.data.usertype === 'client') {
          navigate('/client');
        } else if (res.data.usertype === 'admin') {
          navigate('/admin');
        }
      } else {
        alert("Registration failed: Invalid response from server");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.msg || "Registration failed. Please try again.";
      alert(errorMessage);
      console.error('Registration error:', err);
    }
  }


  const logout = async () =>{
    
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
      setUsertype
    }}>
      {children}
    </GeneralContext.Provider>
  )
}

export default GeneralContextProvider