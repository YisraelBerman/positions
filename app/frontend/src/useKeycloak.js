import { useState, useEffect, useCallback } from 'react';
import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: 'https://3.86.189.1:8443',
  realm: 'my-app-realm',
  clientId: 'my-app-client'
};

const useKeycloak = () => {
  const [keycloak, setKeycloak] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = useCallback(() => {
    if (keycloak) {
      keycloak.login();
    }
  }, [keycloak]);

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        const keycloakInstance = new Keycloak(keycloakConfig);
        const authenticated = await keycloakInstance.init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
          pkceMethod: 'S256',
          checkLoginIframe: false,
          promiseType: 'native'
        });

        keycloakInstance.onTokenExpired = () => {
          console.log('Token expired. Refreshing...');
          keycloakInstance.updateToken(30).then((refreshed) => {
            if (refreshed) {
              console.log('Token refreshed successfully');
              setIsAuthenticated(true);
            } else {
              console.log('Token not refreshed. Manual login required');
              setIsAuthenticated(false);
              login();
            }
          }).catch((error) => {
            console.error('Failed to refresh token', error);
            setIsAuthenticated(false);
            login();
          });
        };

        setKeycloak(keycloakInstance);
        setIsAuthenticated(authenticated);
        setInitialized(true);

        if (!authenticated) {
          console.warn('User is not authenticated');
        }
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