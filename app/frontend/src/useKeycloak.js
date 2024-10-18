import { useState, useEffect, useCallback } from 'react';
import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL || 'https://keycloak.yisraelberman.com',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'my-app-realm',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'my-app-client'
};

const useKeycloak = () => {
  const [keycloak, setKeycloak] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(() => keycloak?.login(), [keycloak]);

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        const keycloakInstance = new Keycloak(keycloakConfig);
        const authenticated = await keycloakInstance.init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
          pkceMethod: 'S256',
          checkLoginIframe: true,
          promiseType: 'native'
        });

        if (authenticated) {
          console.log("User is authenticated");
        } else {
          console.log("User not authenticated, redirecting to login");
        }

        keycloakInstance.onTokenExpired = () => {
          keycloakInstance.updateToken(60)
            .then((refreshed) => {
              if (refreshed) {
                console.log("Token refreshed successfully");
                setIsAuthenticated(true);
              } else {
                console.log("Token not refreshed, forcing login");
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
        setInitialized(true); // Ensure the app knows initialization completed, even on failure
      }
    };

    initKeycloak();
  }, [login]);

  return { keycloak, initialized, isAuthenticated, login, error };
};

export default useKeycloak;
