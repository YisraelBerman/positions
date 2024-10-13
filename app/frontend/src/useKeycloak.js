import { useState, useEffect, useCallback } from 'react';
import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL || 'https://3.86.189.1:8443',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'my-app-realm',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'my-app-client'
};

// Fallback UUID generation function
function fallbackUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const useKeycloak = () => {
  const [keycloak, setKeycloak] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = useCallback(() => keycloak?.login(), [keycloak]);

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        // Override Keycloak's UUID generation method if Web Crypto is not available
        if (typeof window.crypto === 'undefined' || !window.crypto.getRandomValues) {
          window.crypto = { getRandomValues: () => {} };
          Keycloak.prototype.createUUID = fallbackUUID;
        }

        const keycloakInstance = new Keycloak(keycloakConfig);
        const authenticated = await keycloakInstance.init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
          pkceMethod: 'S256',
          checkLoginIframe: false,
          promiseType: 'native'
        });

        keycloakInstance.onTokenExpired = () => {
          keycloakInstance.updateToken(30)
            .then((refreshed) => {
              if (refreshed) {
                setIsAuthenticated(true);
              } else {
                setIsAuthenticated(false);
                login();
              }
            })
            .catch(() => {
              setIsAuthenticated(false);
              login();
            });
        };

        setKeycloak(keycloakInstance);
        setIsAuthenticated(authenticated);
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Keycloak', error);
        setInitialized(true);
      }
    };

    initKeycloak();
  }, [login]);

  return { keycloak, initialized, isAuthenticated, login };
};

export default useKeycloak;