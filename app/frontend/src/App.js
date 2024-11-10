import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import VolunteerList from './VolunteerList';
import Assignments from './Assignments';
import MapPage from './MapPage';
import Header from './Header'; 
import Footer from './Footer';
import axios from './axiosConfig';
import { debounce } from 'lodash';

const APP_VERSION = process.env.REACT_APP_VERSION || '0.1.1'; 
const DEVELOPER_NAME = 'Yisrael Berman  058-404-6555';

function App() {
  const [volunteers, setVolunteers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  const fetchData = useCallback(async (force = false) => {
    if (!force && Date.now() - lastFetchTime < 60000) return;

    setLoading(true);
    try {
      const [volunteersRes, assignmentsRes, locationsRes] = await Promise.all([
        axios.get('/volunteers'),
        axios.get('/assignments'),
        axios.get('/locations')
      ]);

      setVolunteers(volunteersRes.data || []);
      setAssignments(assignmentsRes.data || []);
      setLocations(locationsRes.data || []);
      setLastFetchTime(Date.now());
    } catch (error) {
      console.error('Error fetching data:', error);
      setVolunteers([]);
      setAssignments([]);
      setLocations([]);
    }
    setLoading(false);
  }, [lastFetchTime]);

  const debouncedFetchData = useMemo(() => debounce(fetchData, 1000), [fetchData]);

  useEffect(() => {
    debouncedFetchData();
  }, [debouncedFetchData]);

  const handleStatusChange = useCallback(() => fetchData(true), [fetchData]);

  return (
    <Router>
      <div className="App">
        <Header />
        {loading ? (
          <div>Loading data...</div>
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