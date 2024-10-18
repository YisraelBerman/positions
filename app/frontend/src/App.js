import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import VolunteerList from './VolunteerList';
import Assignments from './Assignments';
import MapPage from './MapPage';
import Header from './Header'; 
import Footer from './Footer';
import axios, { setAxiosAuth } from './axiosConfig';
import useKeycloak from './useKeycloak';
import { debounce } from 'lodash';

const APP_VERSION = '0.1.0'; 
const DEVELOPER_NAME = 'Yisrael Berman  058-404-6555';

function App() {
  const [volunteers, setVolunteers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [error, setError] = useState(null);
  const { keycloak, initialized, isAuthenticated, login, error: keycloakError } = useKeycloak();

  const fetchData = useCallback(async (force = false) => {
    if (!keycloak?.token || (!force && Date.now() - lastFetchTime < 60000)) return;

    setLoading(true);
    setError(null);
    try {
      const config = { headers: { Authorization: `Bearer ${keycloak.token}` } };
      const [volunteersRes, assignmentsRes, locationsRes] = await Promise.all([
        axios.get('/volunteers', config),
        axios.get('/assignments', config),
        axios.get('/locations', config)
      ]);

      setVolunteers(volunteersRes.data || []);
      setAssignments(assignmentsRes.data || []);
      setLocations(locationsRes.data || []);
      setLastFetchTime(Date.now());
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again later.');
      setVolunteers([]);
      setAssignments([]);
      setLocations([]);
    }
    setLoading(false);
  }, [keycloak, lastFetchTime]);

  const debouncedFetchData = useMemo(() => debounce(fetchData, 1000), [fetchData]);

  useEffect(() => {
    if (initialized && isAuthenticated && keycloak) {
      setAxiosAuth(keycloak);
      debouncedFetchData();
    } else if (initialized && !isAuthenticated) {
      login();
    }
  }, [initialized, isAuthenticated, keycloak, login, debouncedFetchData]);

  const handleStatusChange = useCallback(() => fetchData(true), [fetchData]);

  if (!initialized) {
    return (
      <div>
        <p>Initializing Keycloak...</p>
        <p>Keycloak URL: {process.env.REACT_APP_KEYCLOAK_URL}</p>
        <p>Realm: {process.env.REACT_APP_KEYCLOAK_REALM}</p>
        <p>Client ID: {process.env.REACT_APP_KEYCLOAK_CLIENT_ID}</p>
      </div>
    );
  }
  
  if (keycloakError) {
    return (
      <div>
        <p>Error initializing Keycloak: {keycloakError.message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div>
        <p>Not authenticated. Please log in.</p>
        <button onClick={login}>Login</button>
        <p>Keycloak initialized: {initialized ? 'Yes' : 'No'}</p>
        <p>Is authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Header />
        {loading ? (
          <div>Loading data...</div>
        ) : error ? (
          <div>Error: {error}</div>
        ) : (
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
        )}
        <Footer name={DEVELOPER_NAME} version={APP_VERSION} />
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