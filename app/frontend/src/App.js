import React, { useState, useEffect } from 'react';
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
  const { keycloak, initialized } = useKeycloak();

  useEffect(() => {
    if (initialized && keycloak) {
      if (keycloak.authenticated) {
        setAxiosAuth(keycloak);
        fetchData();
      } else {
        console.log('User is not authenticated, redirecting to login...');
        keycloak.login();
      }
    }
  }, [initialized, keycloak]);

  const fetchData = async () => {
    try {
      const [volunteersRes, assignmentsRes, locationsRes] = await Promise.all([
        axios.get('/volunteers'),
        axios.get('/assignments'),
        axios.get('/locations')
      ]);
      setVolunteers(volunteersRes.data);
      setAssignments(assignmentsRes.data);
      setLocations(locationsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleStatusChange = () => {
    fetchData();
  };

  if (!initialized) {
    return <div>Loading...</div>;
  }

  if (!keycloak) {
    return <div>Error initializing Keycloak. Please refresh the page or contact support.</div>;
  }

  if (!keycloak.authenticated) {
    return <div>You are not authenticated. Redirecting to login...</div>;
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
                  <VolunteerList volunteers={volunteers} onStatusChange={handleStatusChange} />
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