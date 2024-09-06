import React from 'react';
import axios from './axiosConfig'; // Ensure axios is correctly set up

function VolunteerList({ volunteers, onStatusChange }) {
  const containerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '10px',
    width: '100%',
    marginBottom: '20px',
  };

  const volunteerCardStyle = (available) => ({
    padding: '10px',
    border: `4px solid ${available ? 'green' : 'red'}`, // Set border color based on availability
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  });

  const toggleAvailability = async (volunteer) => {
    try {
      // Log the action for debugging
      console.log(`Toggling availability for: ${volunteer.name}`);

      // Make the API call to update availability
      const response = await axios.post('/update_status', {
        id: volunteer.id,
        available: !volunteer.available,
      });

      // Log the response for debugging
      console.log('API response:', response.data);

      // Call the onStatusChange callback to refresh the list
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
          <button onClick={() => toggleAvailability(volunteer)}>
            {volunteer.available ? 'סמן כלא נמצא' : 'סמן כנמצא'}
          </button>
        </div>
      ))}
    </div>
  );
}

export default VolunteerList;
