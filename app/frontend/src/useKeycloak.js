import { useState, useEffect, useCallback } from 'react';
import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL || 'https://3.86.189.1:8443',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'my-app-realm',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'my-app-client'
};

// Robust UUID generation function
function robustUUID() {
  let d = new Date().getTime();
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now(); // use high-precision timer if available
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

const useKeycloak = () => {
  const [keycloak, setKeycloak] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(() => keycloak?.login(), [keycloak]);

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        // Override Keycloak's UUID generation method
        Keycloak.prototype.createUUID = robustUUID;

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
            .catch((refreshError) => {
              console.error('Token refresh failed:', refreshError);
              setIsAuthenticated(false);
              login();
            });
        };

        setKeycloak(keycloakInstance);
        setIsAuthenticated(authenticated);
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Keycloak', error);
        setError(error);
        setInitialized(true);
      }
    };

    initKeycloak();
  }, [login]);

  return { keycloak, initialized, isAuthenticated, login, error };
};

export default useKeycloak;