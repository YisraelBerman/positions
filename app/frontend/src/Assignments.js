import React from 'react';

function Assignments({ assignments = [], locations = [] }) {
  const containerStyle = {
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto',
  };

  const titleStyle = {
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginBottom: '5px',
  };

  const volunteerStyle = {
    marginLeft: '10px',
  };

  const renderAssignments = () => {
    if (assignments.length === 0) {
      return <p>No assignments available.</p>;
    }

    return assignments.map((assignment, index) => (
      <dev key={index} style={{ marginBottom: '20px' }}>
        <div style={titleStyle}>
          קו דיווח {assignment.key_point}:
          </div>
        {assignment.volunteers.map((volunteer, i) => (
          <div key={i} style={volunteerStyle}>{volunteer}</div>
        ))}
        <hr />
      </dev>
    ));
  };

  const renderLocationGroups = () => {
    if (!locations || locations.length === 0) {
      return <p>No location data available.</p>;
    }

    return locations.map((location, index) => (
      <div key={index} style={{ marginBottom: '20px' }}>
        <div style={titleStyle}>
          {location.name}:
          </div>
        {location.volunteers.map((volunteer, i) => (
          <div key={i} style={volunteerStyle}>{volunteer}</div>
        ))}
        <hr />
      </div>
    ));
  };

  return (
    <div style={containerStyle}>
      {assignments.length > 0 ? renderAssignments() : null}
      {locations.length > 0 ? renderLocationGroups() : null}
    </div>
  );
}

export default Assignments;
