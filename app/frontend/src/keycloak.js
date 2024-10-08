import Keycloak from 'keycloak-js';

const keycloakUrl = process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080';

const keycloakConfig = {
  url: keycloakUrl,
  realm: 'my-app-realm',
  clientId: 'my-app-client'
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;