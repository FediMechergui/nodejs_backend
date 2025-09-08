pipeline {
    agent {
        label 'thea-cicd'
    }
    
    environment {
        // Docker Registry Configuration
        DOCKER_REGISTRY = '192.168.1.10:5000'
        IMAGE_NAME = 'thea-backend'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        
        // Application Environment
        NODE_ENV = 'production'
        
        // SonarQube Configuration
        SONARQUBE_URL = 'http://192.168.1.10:9000'
        SONAR_PROJECT_KEY = 'thea-backend'
        
        // Security Scanning Configuration
        TRIVY_DB_REPOSITORY = 'ghcr.io/aquasecurity/trivy-db'
        
        // Deployment Configuration
        APP_SERVER_1 = '192.168.1.50'
        APP_SERVER_2 = '192.168.1.60'
        LOAD_BALANCER = '192.168.1.40'
        
        // Credentials
        DOCKER_REGISTRY_CREDENTIALS = credentials('docker-registry-creds')
        SONAR_TOKEN = credentials('sonarqube-token')
        SNYK_TOKEN = credentials('snyk-token')
        ANSIBLE_SSH_KEY = credentials('ansible-ssh-key')
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 45, unit: 'MINUTES')
        timestamps()
    }
    
    stages {
        stage('Checkout & Environment Setup') {
            steps {
                echo "🚀 Starting Thea Backend CI/CD Pipeline - Build #${env.BUILD_NUMBER}"
                
                // Clean workspace
                cleanWs()
                
                // Checkout code
                checkout scm
                
                // Display build information
                sh '''
                    echo "=== Build Information ==="
                    echo "Branch: ${GIT_BRANCH}"
                    echo "Commit: ${GIT_COMMIT}"
                    echo "Build Number: ${BUILD_NUMBER}"
                    echo "Node.js Version: $(node --version)"
                    echo "NPM Version: $(npm --version)"
                    echo "Docker Version: $(docker --version)"
                    echo "=========================="
                '''
            }
        }
        
        stage('Dependency Installation & Audit') {
            steps {
                echo "📦 Installing dependencies and running security audit"
                
                sh '''
                    # Install dependencies
                    npm ci --only=production
                    
                    # Run npm audit for known vulnerabilities
                    npm audit --audit-level=high --production
                    
                    # Generate dependency tree for analysis
                    npm list --depth=0 > dependency-report.txt
                '''
                
                // Archive dependency report
                archiveArtifacts artifacts: 'dependency-report.txt', fingerprint: true
            }
        }
        
        stage('Static Code Analysis') {
            parallel {
                stage('ESLint Analysis') {
                    steps {
                        echo "🔍 Running ESLint static analysis"
                        
                        sh '''
                            # Run ESLint with JUnit reporter
                            npx eslint src/ --format junit --output-file eslint-report.xml || true
                            
                            # Run ESLint with stylish format for console output
                            npx eslint src/ --format stylish || true
                        '''
                        
                        // Publish ESLint results
                        publishTestResults testResultsPattern: 'eslint-report.xml'
                    }
                }
                
                stage('SonarQube Analysis') {
                    steps {
                        echo "📊 Running SonarQube quality analysis"
                        
                        script {
                            def scannerHome = tool 'SonarQube Scanner'
                            withSonarQubeEnv('SonarQube') {
                                sh """
                                    ${scannerHome}/bin/sonar-scanner \\
                                        -Dsonar.projectKey=${SONAR_PROJECT_KEY} \\
                                        -Dsonar.projectName=Thea-Backend \\
                                        -Dsonar.projectVersion=${BUILD_NUMBER} \\
                                        -Dsonar.sources=src/ \\
                                        -Dsonar.tests=tests/ \\
                                        -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \\
                                        -Dsonar.testExecutionReportPaths=test-report.xml \\
                                        -Dsonar.coverage.exclusions=tests/**,**/*.test.js \\
                                        -Dsonar.cpd.exclusions=**/*.test.js
                                """
                            }
                        }
                    }
                }
                
                stage('Snyk Security Scan') {
                    steps {
                        echo "🛡️ Running Snyk dependency vulnerability scan"
                        
                        sh '''
                            # Authenticate with Snyk
                            npx snyk auth ${SNYK_TOKEN}
                            
                            # Test for vulnerabilities
                            npx snyk test --severity-threshold=high --json > snyk-report.json || true
                            
                            # Generate HTML report
                            npx snyk test --severity-threshold=high > snyk-report.txt || true
                            
                            # Monitor project (if not exists)
                            npx snyk monitor --project-name="thea-backend" || true
                        '''
                        
                        // Archive Snyk reports
                        archiveArtifacts artifacts: 'snyk-report.*', fingerprint: true
                    }
                }
            }
        }
        
        stage('Unit Testing & Coverage') {
            steps {
                echo "🧪 Running unit tests and generating coverage report"
                
                sh '''
                    # Run tests with coverage
                    npm test -- --coverage --testResultsProcessor=jest-junit --coverageReporters=lcov,text,html
                    
                    # Generate coverage badge
                    npx istanbul-badges-readme
                '''
                
                // Publish test results and coverage
                publishTestResults testResultsPattern: 'junit.xml'
                publishCoverage adapters: [istanbulCoberturaAdapter('coverage/cobertura-coverage.xml')], sourceFileResolver: sourceFiles('STORE_LAST_BUILD')
                
                // Archive coverage reports
                archiveArtifacts artifacts: 'coverage/**', fingerprint: true
            }
        }
        
        stage('SonarQube Quality Gate') {
            steps {
                echo "🚪 Waiting for SonarQube Quality Gate result"
                
                script {
                    timeout(time: 10, unit: 'MINUTES') {
                        def qg = waitForQualityGate()
                        if (qg.status != 'OK') {
                            error "Pipeline aborted due to quality gate failure: ${qg.status}"
                        }
                    }
                }
            }
        }
        
        stage('Docker Build & Vulnerability Scan') {
            steps {
                echo "🐳 Building Docker image and scanning for vulnerabilities"
                
                script {
                    // Build Docker image
                    def image = docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}", "--target production .")
                    
                    // Tag with latest
                    sh "docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest"
                    
                    // Scan image with Trivy
                    sh '''
                        # Update Trivy database
                        trivy image --download-db-only
                        
                        # Scan the built image for vulnerabilities
                        trivy image --format json --output trivy-report.json ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                        
                        # Generate human-readable report
                        trivy image --format table --output trivy-report.txt ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                        
                        # Check for CRITICAL vulnerabilities
                        trivy image --exit-code 1 --severity CRITICAL ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                    '''
                    
                    // Archive Trivy reports
                    archiveArtifacts artifacts: 'trivy-report.*', fingerprint: true
                    
                    // Push to registry if scan passes
                    docker.withRegistry("http://${DOCKER_REGISTRY}", 'docker-registry-creds') {
                        image.push("${IMAGE_TAG}")
                        image.push("latest")
                    }
                }
            }
        }
        
        stage('DAST Security Testing') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                echo "🕷️ Running OWASP ZAP dynamic security testing"
                
                script {
                    // Start application in background for testing
                    sh '''
                        # Create temporary test environment
                        docker-compose -f docker-compose.test.yml up -d
                        
                        # Wait for application to be ready
                        timeout 60s bash -c 'until curl -f http://localhost:3000/health; do sleep 2; done'
                    '''
                    
                    // Run ZAP baseline scan
                    sh '''
                        # Run ZAP baseline scan
                        docker run -v $(pwd):/zap/wrk/:rw \\
                            -t owasp/zap2docker-stable zap-baseline.py \\
                            -t http://192.168.1.50:3000 \\
                            -J zap-report.json \\
                            -r zap-report.html \\
                            -x zap-report.xml || true
                    '''
                    
                    // Cleanup test environment
                    sh 'docker-compose -f docker-compose.test.yml down -v'
                    
                    // Archive ZAP reports
                    archiveArtifacts artifacts: 'zap-report.*', fingerprint: true
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'main'
                }
            }
            steps {
                echo "🚀 Deploying to staging environment"
                
                script {
                    // Deploy using Ansible
                    sh '''
                        cd deploying/ansible
                        
                        # Deploy to staging
                        ansible-playbook -i inventory/staging \\
                            playbooks/app-deploy.yml \\
                            --extra-vars "image_tag=${IMAGE_TAG}" \\
                            --extra-vars "environment=staging" \\
                            --private-key=${ANSIBLE_SSH_KEY}
                    '''
                    
                    // Verify deployment
                    sh '''
                        # Wait for deployment to be ready
                        timeout 120s bash -c 'until curl -f http://192.168.1.50:3000/health; do sleep 5; done'
                        
                        # Run smoke tests
                        curl -f http://192.168.1.50:3000/api/v1/health
                        curl -f http://192.168.1.50:3000/api/v1/metrics
                    '''
                }
            }
        }
        
        stage('Integration Testing') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'main'
                }
            }
            steps {
                echo "🔗 Running integration tests against staging"
                
                sh '''
                    # Set test environment variables
                    export TEST_BASE_URL=http://192.168.1.50:3000
                    export TEST_ENV=staging
                    
                    # Run integration tests
                    npm run test:integration
                '''
                
                // Publish integration test results
                publishTestResults testResultsPattern: 'integration-test-results.xml'
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            input {
                message "Deploy to Production?"
                ok "Deploy"
                parameters {
                    choice(name: 'DEPLOYMENT_STRATEGY', choices: ['blue-green', 'rolling'], description: 'Deployment strategy')
                }
            }
            steps {
                echo "🌟 Deploying to production environment"
                
                script {
                    // Deploy using Ansible with chosen strategy
                    sh '''
                        cd deploying/ansible
                        
                        # Deploy to production
                        ansible-playbook -i inventory/production \\
                            playbooks/app-deploy.yml \\
                            --extra-vars "image_tag=${IMAGE_TAG}" \\
                            --extra-vars "environment=production" \\
                            --extra-vars "deployment_strategy=${DEPLOYMENT_STRATEGY}" \\
                            --private-key=${ANSIBLE_SSH_KEY}
                    '''
                    
                    // Verify production deployment
                    sh '''
                        # Wait for all instances to be ready
                        for server in ${APP_SERVER_1} ${APP_SERVER_2}; do
                            timeout 120s bash -c "until curl -f http://\$server:3000/health; do sleep 5; done"
                        done
                        
                        # Verify load balancer
                        timeout 60s bash -c "until curl -f http://${LOAD_BALANCER}/health; do sleep 5; done"
                    '''
                }
            }
        }
        
        stage('Post-Deployment Monitoring') {
            when {
                branch 'main'
            }
            steps {
                echo "📊 Setting up post-deployment monitoring"
                
                sh '''
                    # Trigger Prometheus to start collecting metrics
                    curl -X POST http://192.168.1.20:9090/-/reload
                    
                    # Wait and verify metrics are flowing
                    sleep 30
                    
                    # Check key metrics
                    curl -s "http://192.168.1.20:9090/api/v1/query?query=up{job='thea-backend'}" | jq '.data.result[0].value[1]'
                '''
            }
        }
    }
    
    post {
        always {
            echo "🧹 Cleaning up workspace and collecting artifacts"
            
            // Archive all reports
            archiveArtifacts artifacts: '**/*-report.*', allowEmptyArchive: true
            
            // Clean Docker images to save space
            sh '''
                # Remove old images to save space
                docker image prune -f
                docker system prune -f
            '''
        }
        
        success {
            echo "✅ Pipeline completed successfully!"
            
            // Send success notification
            script {
                if (env.BRANCH_NAME == 'main') {
                    slackSend(
                        channel: '#deployments',
                        color: 'good',
                        message: "✅ Thea Backend v${IMAGE_TAG} deployed successfully to production!"
                    )
                }
            }
        }
        
        failure {
            echo "❌ Pipeline failed!"
            
            // Send failure notification
            slackSend(
                channel: '#deployments',
                color: 'danger',
                message: "❌ Thea Backend pipeline failed at stage: ${env.STAGE_NAME}. Build: ${env.BUILD_URL}"
            )
            
            // Collect failure logs
            sh '''
                # Collect container logs if deployment failed
                if [ -f docker-compose.test.yml ]; then
                    docker-compose -f docker-compose.test.yml logs > failure-logs.txt 2>&1
                fi
                
                # Collect system information
                echo "=== System Information ===" >> failure-logs.txt
                df -h >> failure-logs.txt
                free -h >> failure-logs.txt
                docker ps -a >> failure-logs.txt
            '''
            
            archiveArtifacts artifacts: 'failure-logs.txt', allowEmptyArchive: true
        }
        
        unstable {
            echo "⚠️ Pipeline completed with warnings"
            
            slackSend(
                channel: '#deployments',
                color: 'warning',
                message: "⚠️ Thea Backend pipeline completed with warnings. Build: ${env.BUILD_URL}"
            )
        }
    }
}
