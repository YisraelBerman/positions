import Keycloak from 'keycloak-js';

// const keycloakUrl = process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080';

const keycloakConfig = {
  //url: keycloakUrl,
  url: 'http://34.205.129.2:8443',
  realm: 'my-app-realm',
  clientId: 'my-app-client'
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;