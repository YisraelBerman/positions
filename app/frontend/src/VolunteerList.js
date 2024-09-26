import React from 'react';
import axios from './axiosConfig'; // Ensure axios is correctly set up
import { useAuth } from './contexts/AuthContext'; // Import useAuth hook

function VolunteerList({ volunteers, onStatusChange }) {
  const { user } = useAuth(); // Use the useAuth hook to get the current user

  const containerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '10px',
    width: '100%',
    marginBottom: '20px',
  };

  const volunteerCardStyle = (available) => ({
    padding: '10px',
    border: `4px solid ${available ? 'green' : 'red'}`,
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  });

  const loginMessageStyle = {
    fontSize: '0.6rem',  
    color: '#666',       
    marginTop: '5px'     
  };

  const toggleAvailability = async (volunteer) => {
    if (!user) {
      alert('Please log in to change volunteer status.');
      return;
    }

    try {
      console.log(`Toggling availability for: ${volunteer.name}`);

      const response = await axios.post('/update_status', {
        id: volunteer.id,
        available: !volunteer.available,
      });

      console.log('API response:', response.data);
      onStatusChange();
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  return (
    <div style={containerStyle}>
      {volunteers.map((volunteer) => (
        <div key={volunteer.id} style={volunteerCardStyle(volunteer.available)}>
          <p>{volunteer.name}</p>
          <p>{volunteer.available ? 'נמצא' : 'לא נמצא'}</p>
          {user ? (
            <button onClick={() => toggleAvailability(volunteer)}>
              {volunteer.available ? 'סמן כלא נמצא' : 'סמן כנמצא'}
            </button>
          ) : (
            <p style={loginMessageStyle}>התחבר כדי לשנות סטטוס</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default VolunteerList;