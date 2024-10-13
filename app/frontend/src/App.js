import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import VolunteerList from './VolunteerList';
import Assignments from './Assignments';
import MapPage from './MapPage';
import Header from './Header'; 
import axios, { setAxiosAuth } from './axiosConfig';
import useKeycloak from './useKeycloak';

function App() {
  const [volunteers, setVolunteers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [locations, setLocations] = useState([]);
  const { keycloak, initialized, isAuthenticated, login } = useKeycloak();

  const fetchData = useCallback(async () => {
    if (!keycloak || !keycloak.token) {
      console.error('No token available');
      return;
    }

    try {
      console.log('Fetching data...');
      console.log('Current token:', keycloak.token);
      
      const config = {
        headers: { Authorization: `Bearer ${keycloak.token}` }
      };

      const [volunteersRes, assignmentsRes, locationsRes] = await Promise.all([
        axios.get('/volunteers', config),
        axios.get('/assignments', config),
        axios.get('/locations', config)
      ]);

      console.log('Data fetched successfully');
      setVolunteers(volunteersRes.data);
      setAssignments(assignmentsRes.data);
      setLocations(locationsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
    }
  }, [keycloak]);

  useEffect(() => {
    if (initialized) {
      if (isAuthenticated) {
        console.log('User is authenticated');
        console.log('Token available:', !!keycloak.token);
        setAxiosAuth(keycloak);
        fetchData();
      } else {
        console.log('User is not authenticated, redirecting to login...');
        login();
      }
    }
  }, [initialized, isAuthenticated, keycloak, login, fetchData]);

  if (!initialized) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Not authenticated. Please log in.</div>;
  }

  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/map" element={<MapPage />} />
          <Route
            path="/"
            element={
              <div style={mainPageStyle}>
                <div style={{ ...sectionStyle, width: '100%' }}>
                  <VolunteerList volunteers={volunteers} onStatusChange={fetchData} />
                </div>
                <div style={contentStyle}>
                  <div style={sectionStyle}>
                    <h2>עמדות</h2>
                    <Assignments assignments={assignments} />
                  </div>
                  <div style={sectionStyle}>
                    <h2>שכונות</h2>
                    <Assignments assignments={[]} locations={locations} />
                  </div>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

  const mainPageStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
  };

  const contentStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: '1200px',
    marginTop: '20px',
  };

  const sectionStyle = {
    flex: '1',
    padding: '20px',
    border: '1px solid #ddd',
    margin: '0 10px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  };

  

export default App;