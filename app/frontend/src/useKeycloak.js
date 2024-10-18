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

  const login = useCallback(() => {
    console.log('Attempting to log in...');
    keycloak?.login().catch(error => {
      console.error('Login failed:', error);
      setError(error);
    });
  }, [keycloak]);

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        console.log('Initializing Keycloak with config:', keycloakConfig);
        const keycloakInstance = new Keycloak(keycloakConfig);
        
        keycloakInstance.onAuthSuccess = () => console.log('Auth Success');
        keycloakInstance.onAuthError = (error) => console.error('Auth Error:', error);
        keycloakInstance.onAuthRefreshSuccess = () => console.log('Auth Refresh Success');
        keycloakInstance.onAuthRefreshError = (error) => console.error('Auth Refresh Error:', error);
        keycloakInstance.onAuthLogout = () => console.log('Auth Logout');
        keycloakInstance.onTokenExpired = () => console.log('Token Expired');

        const authenticated = await keycloakInstance.init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
          pkceMethod: 'S256',
          checkLoginIframe: false,
          promiseType: 'native'
        });
        console.log('Keycloak initialized, authenticated:', authenticated);

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
  }, []);

  return { keycloak, initialized, isAuthenticated, login, error };
};

export default useKeycloak;