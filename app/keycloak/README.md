# for self signed certs
mkdir certs
openssl req -newkey rsa:2048 -nodes -keyout certs/tls.key -x509 -days 365 -out certs/tls.crt