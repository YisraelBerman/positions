import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: 'http://localhost:8080',  // Make sure this matches your Keycloak server URL
  realm: 'my-app-realm',         // Make sure this matches your realm name
  clientId: 'my-app-client'     // Make sure this matches your client ID
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;