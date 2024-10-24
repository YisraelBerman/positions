node {
    def backendChanged = false
    def frontendChanged = false
    
    stage('Checkout Jenkinsfile') {
        script {
            def branchName = env.BRANCH_NAME

            // Checkout the 'jenkinsfiles' branch
            checkout([$class: 'GitSCM', branches: [[name: "*/jenkinsfiles"]],
                userRemoteConfigs: [[url: 'https://github.com/YisraelBerman/test.git', credentialsId: 'github']]])

            if (branchName == 'main') {
                echo "Using Jenkinsfile for the main branch"
                sh "cp Jenkinsfile-main ./Jenkinsfile"
            } else if (branchName.startsWith('feature/')) {
                echo "Using Jenkinsfile for the feature branch"
                sh "cp Jenkinsfile-feature ./Jenkinsfile"
            } else {
                error('No Jenkinsfile for this branch')
            }

            // Manually detect changes before proceeding
            backendChanged = sh(
                script: 'git diff --name-only HEAD~1..HEAD | grep "app/backend/" || true',
                returnStatus: true
            ) == 0

            frontendChanged = sh(
                script: 'git diff --name-only HEAD~1..HEAD | grep "app/frontend/" || true',
                returnStatus: true
            ) == 0
        }
    }

    stage('Execute Pipeline') {
        script {
            // Pass the change detection to the loaded pipeline
            def loadedJenkinsfile = load './Jenkinsfile'
            loadedJenkinsfile(backendChanged, frontendChanged)  // Pass the change flags to the loaded Jenkinsfile
        }
    }
}
