node {
    stage('Checkout Jenkinsfile') {
        script {
            def branchName = env.BRANCH_NAME

            // Checkout the 'jenkinsfiles' branch
            checkout([$class: 'GitSCM', branches: [[name: "*/jenkinsfiles"]],
                userRemoteConfigs: [[url: 'https://github.com/YisraelBerman/positions.git', credentialsId: 'github']]])

            if (branchName == 'master') {
                echo "Using Jenkinsfile for the master branch"
                sh "cp Jenkinsfile-master ./Jenkinsfile"
            } else if (branchName.startsWith('feature/')) {
                echo "Using Jenkinsfile for the feature branch"
                sh "cp Jenkinsfile-feature ./Jenkinsfile"
            } else {
                error('No Jenkinsfile for this branch')
            }
        }
    }

    stage('Execute Pipeline') {
        script {
             load './Jenkinsfile'
        }
    }
}