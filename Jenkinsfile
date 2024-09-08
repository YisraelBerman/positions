pipeline {
    agent {
        label 'agent1'
    }

    environment {
        GITHUB_TOKEN = credentials('github-token')
        GITHUB_USER = credentials('github-user')
        SSH_TARGET = 'ubuntu@54.164.81.151' // Update with your server's IP or hostname
    }

    stages {
        stage('Initialize') {
            steps {
                script {
                    // Fetch the full commit hash
                    env.GIT_COMMIT_HASH = sh(script: "git log -n 1 --pretty=format:'%H'", returnStdout: true).trim()
                    
                    // Extract the short commit hash
                    env.SHORT_COMMIT = env.GIT_COMMIT_HASH.substring(0, 7)
                    
                    // Define image names with commit tags
                    env.BACKEND_IMAGE = "ghcr.io/yisraelberman/positions-backend:${env.SHORT_COMMIT}"
                    env.FRONTEND_IMAGE = "ghcr.io/yisraelberman/positions-frontend:${env.SHORT_COMMIT}"
                }
            }
        }

        stage('Test') {
            steps {
                echo 'To be added someday.'
            }
        }

        stage('Build') {
            steps {
                script {
                    sh "docker build -t ${env.BACKEND_IMAGE} -f ./app/backend/Dockerfile ./app/backend"
                    sh "docker build -t ${env.FRONTEND_IMAGE} -f ./app/frontend/Dockerfile ./app/frontend"
                }
            }
        }

        stage('Docker Login') {
            steps {
                sh "echo ${env.GITHUB_TOKEN} | docker login ghcr.io -u ${env.GITHUB_USER} --password-stdin"
            }
        }

        stage('Push Images to GitHub') {
            steps {
                script {
                    // Push backend image to positions-backend repository
                    sh "docker push ${env.BACKEND_IMAGE}"

                    // Push frontend image to positions-frontend repository
                    sh "docker push ${env.FRONTEND_IMAGE}"
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    withCredentials([sshUserPrivateKey(credentialsId: 'forssh', keyFileVariable: 'secret')]) {
                        // Stop and remove existing containers
                        sh """
                        ssh -i "$secret" ${env.SSH_TARGET} "
                            sudo docker stop backend || true && sudo docker rm backend || true;
                            sudo docker stop frontend || true && sudo docker rm frontend || true;
                        "
                        """
                        
                        // Pull new images from the correct repositories
                        sh """
                        ssh -i "$secret" ${env.SSH_TARGET} "
                            sudo docker pull ${env.BACKEND_IMAGE};
                            sudo docker pull ${env.FRONTEND_IMAGE};
                        "
                        """
                        
                        // Run backend container
                        sh """
                        ssh -i "$secret" ${env.SSH_TARGET} "
                            sudo docker run -d --name backend -p 5000:5000 \\
                            -e FLASK_ENV=production \\
                            ${env.BACKEND_IMAGE};
                        "
                        """
                        
                        // Run frontend container
                        sh """
                        ssh -i "$secret" ${env.SSH_TARGET} "
                            sudo docker run -d --name frontend -p 3002:3002 \\
                            -e REACT_APP_BACKEND_URL=http://<backend-ip>:5000 \\
                            ${env.FRONTEND_IMAGE};
                        "
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            // Clean up the workspace and remove images
            cleanWs()
            sh "docker rmi ${env.BACKEND_IMAGE} || true"
            sh "docker rmi ${env.FRONTEND_IMAGE} || true"
        }
    }
}
