import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import VolunteerList from './VolunteerList';
import Assignments from './Assignments';
import MapPage from './MapPage';
import Header from './Header'; // Import the new header component
import axios from './axiosConfig';

function App() {
  const [volunteers, setVolunteers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetchVolunteers();
    fetchAssignments();
    fetchLocations();
  }, []);

  const fetchVolunteers = async () => {
    try {
      const response = await axios.get('/volunteers');
      setVolunteers(response.data);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await axios.get('/assignments');
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get('/locations');
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleStatusChange = () => {
    fetchVolunteers();
    fetchAssignments();
    fetchLocations();
  };

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

  return (
    <Router>
      <div className="App">
        <Header /> {/* Display the header on all pages */}
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
                    <Assignments assignments={[]} locations={locations} /> {/* Pass locations only */}
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

export default App;
