docker run -p 5000:5000 \
  -e KEYCLOAK_URL=https://your-keycloak-url \           #https://3.86.189.1:8443
  -e KEYCLOAK_REALM=your-realm \
  -e KEYCLOAK_CLIENT_ID=your-client-id \
  -e CORS_ORIGIN=http://your-frontend-url \            #http://localhost:3000
  my-flask-app