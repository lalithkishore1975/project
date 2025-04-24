pipeline {
    agent any
    
    environment {
        APP_NAME = 'project-app'
        APP_PORT = '3000'
        NODE_ENV = 'development'
    }

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }
        
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t ${APP_NAME} ."
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    sh "docker-compose up -d"
                }
            }
        }
        
        stage('Verify') {
            steps {
                script {
                    sh "curl -I http://localhost:${APP_PORT} || exit 1"
                }
            }
        }
    }
    
    post {
        always {
            echo "Pipeline status: ${currentBuild.currentResult}"
        }
    }
}