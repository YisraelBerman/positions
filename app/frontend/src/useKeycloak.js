import { useState, useEffect } from 'react';
import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url:  'https://3.86.189.1:8443',
  realm: 'my-app-realm',
  clientId: 'my-app-client'
};

const useKeycloak = () => {
  const [keycloak, setKeycloak] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        const keycloakInstance = new Keycloak(keycloakConfig);
        const authenticated = await keycloakInstance.init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
          pkceMethod: 'S256',
          checkLoginIframe: false, // Disable iframe checking
          promiseType: 'native' // Use native promises
        });

        keycloakInstance.onTokenExpired = () => {
          console.log('Token expired. Refreshing...');
          keycloakInstance.updateToken(30).then((refreshed) => {
            if (refreshed) {
              console.log('Token refreshed successfully');
            } else {
              console.log('Token not refreshed. Manual login required');
              keycloakInstance.login();
            }
          }).catch((error) => {
            console.error('Failed to refresh token', error);
            keycloakInstance.login();
          });
        };

        setKeycloak(keycloakInstance);
        setInitialized(true);

        if (!authenticated) {
          console.warn('User is not authenticated');
          keycloakInstance.login();
        }
      } catch (error) {
        console.error('Failed to initialize Keycloak', error);
        setInitialized(true);
      }
    };

    initKeycloak();
  }, []);

  return { keycloak, initialized };
};

export default useKeycloak;