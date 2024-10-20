pipeline {
    agent {
        label 'agent1'
    }

    environment {
        GITHUB_TOKEN = credentials('github-token')
        GITHUB_USER = credentials('github-user')
        AWS_APPS_IP = credentials('AWS_apps_IP') 
        SSH_TARGET = "ubuntu@${env.AWS_APPS_IP}"
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
                    
                    // Initialize flags
                    env.BUILD_BACKEND = 'false'
                    env.BUILD_FRONTEND = 'false'
                }
            }
        } // Initialize

        
        stage('Test') {
            steps {
                echo 'To be added someday.'
            }
        } // test

        stage('Build') {
            parallel {
                stage('Build Backend') {
                    when {
                        changeset "app/backend/**"
                    }
                    steps {
                        script {
                            echo 'Changes detected in the backend directory. Building backend image...'
                            sh "docker build -t ${env.BACKEND_IMAGE} -f ./app/backend/dockerfile ./app/backend"
                            env.BUILD_BACKEND = 'true' 
                        }
                    }
                } // Build Backend
                stage('Build Frontend') {
                    when {
                        changeset "app/frontend/**"
                    }
                    steps {
                        script {
                            echo 'Changes detected in the frontend directory. Building frontend image...'
                            sh "docker build --build-arg REACT_APP_BACKEND_URL=https://app.yisraelberman.com:5000 -t ${env.FRONTEND_IMAGE} -f ./app/frontend/dockerfile ./app/frontend"                            
                            env.BUILD_FRONTEND = 'true' 
                        }
                    }
                } // Build Frontend
            }
        } // Build

        stage('Docker Login') {
            when {
                expression { return env.BUILD_BACKEND == 'true' || env.BUILD_FRONTEND == 'true' }
            }
            steps {
                sh "echo ${env.GITHUB_TOKEN} | docker login ghcr.io -u ${env.GITHUB_USER} --password-stdin"
            }
        } // Docker Login

        stage('Push Images to GitHub') {
            parallel {
                stage('Push Backend Image') {
                    when {
                        expression { return env.BUILD_BACKEND == 'true' }
                    }
                    steps {
                        script {
                            echo 'Pushing backend image to GitHub...'
                            sh "docker push ${env.BACKEND_IMAGE}"
                        }
                    }
                }
                stage('Push Frontend Image') {
                    when {
                        expression { return env.BUILD_FRONTEND == 'true' }
                    }
                    steps {
                        script {
                            echo 'Pushing frontend image to GitHub...'
                            sh "docker push ${env.FRONTEND_IMAGE}"
                        }
                    }
                }
            }
        } // Push Images to GitHub

        // Stop and remove existing containers and Pull new images from the correct repositories and run them
        stage('Deploy') {
        when {
            expression { return env.BUILD_BACKEND == 'true' || env.BUILD_FRONTEND == 'true' }
        }
        steps {
            script {
                withCredentials([sshUserPrivateKey(credentialsId: 'forssh', keyFileVariable: 'secret')]) {
                    
                    if (env.BUILD_BACKEND == 'true') {
                        sh """
                        ssh -o StrictHostKeyChecking=no -i "$secret" ${env.SSH_TARGET} "
                            sudo docker stop backend || true && sudo docker rm backend || true && \
                            sudo docker pull ${env.BACKEND_IMAGE} && \
                            sudo docker run -d --name backend -p 5000:5000 \
                            -e FLASK_ENV=production \
                            -e CORS_ORIGIN=https://app.yisraelberman.com \
                            -v /etc/letsencrypt/live/app.yisraelberman.com/fullchain.pem:/etc/letsencrypt/live/app.yisraelberman.com/fullchain.pem:ro \
                            -v /etc/letsencrypt/live/app.yisraelberman.com/privkey.pem:/etc/letsencrypt/live/app.yisraelberman.com/privkey.pem:ro \
                            ${env.BACKEND_IMAGE}
                        "
                        """
                    }

                    if (env.BUILD_FRONTEND == 'true') {
                        sh """
                        ssh -o StrictHostKeyChecking=no -i "$secret" ${env.SSH_TARGET} "
                            sudo docker stop frontend || true && sudo docker rm frontend || true;
                            sudo docker pull ${env.FRONTEND_IMAGE};
                            sudo docker run -d --name frontend -p 443:3002 \\
                            -e REACT_APP_BACKEND_URL=https://app.yisraelberman.com:5000 \\
                            -v /etc/letsencrypt/live/app.yisraelberman.com/fullchain.pem:/etc/letsencrypt/live/app.yisraelberman.com/fullchain.pem:ro \\
                            -v /etc/letsencrypt/live/app.yisraelberman.com/privkey.pem:/etc/letsencrypt/live/app.yisraelberman.com/privkey.pem:ro \\
                            ${env.FRONTEND_IMAGE};
                        "
                        """
                    }
                } 
            }
        }
    } //deploy
    } //stages

    post {
        always {
            // Clean up the workspace
            cleanWs()
        }
    }
}
