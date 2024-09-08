pipeline {
    
    agent {
	    label 'agent1'
    }
    

    environment {
	    def btime="${BUILD_TIMESTAMP}"
	    GIT_COMMIT_HASH = sh (script: "git log -n 1 --pretty=format:'%H'", returnStdout: true) 
	    SHORT_COMMIT = "${GIT_COMMIT_HASH[0..7]}"
            BRANCH = "${env.gitlabBranch}"
	    DOCKER_IMAGE_NAME = "positions:${SHORT_COMMIT}"
            GITHUB_REPO = "yisraelberman/positions"
            GITHUB_TOKEN = credentials('github-token')
            GITHUB_USER = credentials('github-user')

    }


    stages {
        // TODO add test
		stage('test'){
			steps {
				echo 'To be added someday. '
			

			}
		}
        
        stage('Build') {
            steps {
                sh 'echo build'
                // sh "docker build -t ${DOCKER_IMAGE_NAME} -f ./escape_room-Q-order/dockerfile ./escape_room-Q-order"
            }
        }
/*
        stage('Docker Login') {
            steps {
                sh "echo ${GITHUB_TOKEN} | docker login ghcr.io -u ${GITHUB_USER} --password-stdin"
            }
        }

        stage('Push Image to GitHub') {
            steps {
                sh "docker tag ${DOCKER_IMAGE_NAME} ghcr.io/${GITHUB_REPO}:${SHORT_COMMIT}"
                sh "docker push ghcr.io/${GITHUB_REPO}:${SHORT_COMMIT}"
                sh "docker tag ${DOCKER_IMAGE_NAME} ghcr.io/${GITHUB_REPO}:latest"
                sh "docker push ghcr.io/${GITHUB_REPO}:latest"
            }
        }

        stage('deploy'){
			steps {
				script{
                    withCredentials([sshUserPrivateKey(credentialsId: 'forssh', keyFileVariable: 'secret')]) {
                	
						script {
                            
                            // on first connection add:  -o StrictHostKeyChecking=no
                            sh 'ssh -i "$secret" ubuntu@54.164.81.151 "sudo docker stop bm-app && docker rm bm-app"'
                            
                            sh 'ssh -i "$secret" ubuntu@54.164.81.151 "sudo docker run -d -p 3000:3000 --name bm-app ghcr.io/yisraelberman/escape-room:${SHORT_COMMIT}"'

						}
            		}
            	}

			}
		}*/
    }
    
    
    post {
        always {
            // Clean up the workspace
            cleanWs()
            sh "docker rmi ${DOCKER_IMAGE_NAME} || true"

           
        }
    }
}
