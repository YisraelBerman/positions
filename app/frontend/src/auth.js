import keycloak from './keycloak';

const isUndefined = o => typeof o === 'undefined';

export const initKeycloak = async (onAuthenticatedCallback) => {
  try {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      pkceMethod: 'S256'
    });

    if (!authenticated) {
      console.warn('User is not authenticated');
      keycloak.login();
    } else {
      onAuthenticatedCallback();
    }
  } catch (error) {
    console.error('Failed to initialize Keycloak', error);
  }
};

export const logout = () => keycloak.logout();

export const login = () => keycloak.login();

export const getToken = () => keycloak.token;

export const isLoggedIn = () => !!keycloak.token;

export const updateToken = (successCallback) => {
  keycloak.updateToken(30)
    .then(successCallback)
    .catch(login);
};

export const getUsername = () => keycloak.tokenParsed?.preferred_username;

export const getFullName = () => keycloak.tokenParsed?.name;

export const hasRole = (roles) => {
  return roles.some(role => keycloak.hasRealmRole(role));
};

export default {
  initKeycloak,
  logout,
  login,
  getToken,
  isLoggedIn,
  updateToken,
  getUsername,
  getFullName,
  hasRole
};