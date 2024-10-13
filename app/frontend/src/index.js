import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import useKeycloak from './useKeycloak';

function KeycloakWrapper() {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return <div>Loading...</div>;
  }

  return <App keycloak={keycloak} />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <KeycloakWrapper />
  </React.StrictMode>
);

reportWebVitals();