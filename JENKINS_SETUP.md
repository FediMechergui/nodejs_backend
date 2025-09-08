# Jenkins Setup Guide for Thea Backend DevSecOps Pipeline

## Overview
This guide provides instructions for setting up Jenkins on the CI/CD VM (192.168.1.10) to execute the Thea Backend DevSecOps pipeline.

## Prerequisites

### 1. VirtualBox VM Setup
Ensure the following VMs are configured according to the VirtualBox Setup Guide:
- **thea-cicd** (192.168.1.10) - CI/CD Server with Jenkins
- **thea-monitor** (192.168.1.20) - Monitoring with Prometheus/Grafana
- **thea-security** (192.168.1.30) - Security scanning tools
- **thea-loadbalancer** (192.168.1.40) - Load balancer
- **thea-app1** (192.168.1.50) - Application server 1
- **thea-app2** (192.168.1.60) - Application server 2

### 2. Required Software Installation

#### On CI/CD VM (192.168.1.10):
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Java 11 (required for Jenkins)
sudo apt install -y openjdk-11-jdk

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js and NPM
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Ansible
sudo apt install -y software-properties-common
sudo add-apt-repository --yes --update ppa:ansible/ansible
sudo apt install -y ansible

# Install Trivy
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt update && sudo apt install -y trivy
```

## Jenkins Installation and Configuration

### 1. Install Jenkins
```bash
# Add Jenkins repository
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
sudo sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
sudo apt update

# Install Jenkins
sudo apt install -y jenkins

# Start and enable Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Get initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

### 2. Initial Jenkins Setup
1. Access Jenkins at http://192.168.1.10:8080
2. Enter the initial admin password
3. Install suggested plugins
4. Create admin user
5. Configure Jenkins URL as http://192.168.1.10:8080

### 3. Required Jenkins Plugins
Install the following plugins via Manage Jenkins → Manage Plugins:

#### Essential Plugins:
- **Pipeline** - For pipeline support
- **Git** - Git integration
- **Docker Pipeline** - Docker integration
- **NodeJS** - Node.js support
- **SonarQube Scanner** - Code quality analysis
- **JUnit** - Test result publishing
- **Coverage** - Code coverage reporting
- **Slack Notification** - Notifications
- **Ansible** - Deployment automation

#### Security Plugins:
- **Role-based Authorization Strategy** - Access control
- **OWASP Markup Formatter** - Secure markup
- **Build Timeout** - Prevent runaway builds

### 4. Global Tool Configuration
Go to Manage Jenkins → Global Tool Configuration:

#### Node.js Installations:
- Name: `Node18`
- Version: `NodeJS 18.19.0`
- Global npm packages: `npm@latest`

#### SonarQube Scanner:
- Name: `SonarQube Scanner`
- Install automatically: ✓
- Version: Latest

#### Docker:
- Name: `Docker`
- Install automatically: ✓

### 5. System Configuration

#### Environment Variables (Manage Jenkins → Configure System):
```
DOCKER_REGISTRY=192.168.1.10:5000
SONARQUBE_URL=http://192.168.1.10:9000
```

#### SonarQube Server Configuration:
- Name: `SonarQube`
- Server URL: `http://192.168.1.10:9000`
- Server authentication token: [Create in SonarQube]

## Credentials Setup

### 1. Add Credentials (Manage Jenkins → Manage Credentials)

#### Docker Registry Credentials:
- Kind: Username with password
- Scope: Global
- Username: admin
- Password: [registry password]
- ID: `docker-registry-creds`

#### SonarQube Token:
- Kind: Secret text
- Scope: Global
- Secret: [SonarQube authentication token]
- ID: `sonarqube-token`

#### Snyk Token:
- Kind: Secret text
- Scope: Global
- Secret: [Snyk authentication token]
- ID: `snyk-token`

#### Ansible SSH Key:
- Kind: SSH Username with private key
- Scope: Global
- Username: ansible
- Private Key: [SSH private key for deployment]
- ID: `ansible-ssh-key`

## Docker Registry Setup

### 1. Local Docker Registry
```bash
# Create registry directory
sudo mkdir -p /opt/docker-registry/data

# Run Docker registry
docker run -d \
  --restart=always \
  --name registry \
  -p 5000:5000 \
  -v /opt/docker-registry/data:/var/lib/registry \
  registry:2

# Configure Docker daemon to allow insecure registry
sudo tee /etc/docker/daemon.json <<EOF
{
  "insecure-registries": ["192.168.1.10:5000"]
}
EOF

sudo systemctl restart docker
```

## SonarQube Setup

### 1. Install SonarQube
```bash
# Create SonarQube user
sudo adduser --system --no-create-home --group --disabled-login sonarqube

# Download and install SonarQube
cd /opt
sudo wget https://binaries.sonarsource.com/Distribution/sonarqube/sonarqube-9.9.3.79811.zip
sudo unzip sonarqube-9.9.3.79811.zip
sudo mv sonarqube-9.9.3.79811 sonarqube
sudo chown -R sonarqube:sonarqube /opt/sonarqube

# Configure SonarQube
sudo tee /etc/systemd/system/sonarqube.service <<EOF
[Unit]
Description=SonarQube service
After=syslog.target network.target

[Service]
Type=forking
ExecStart=/opt/sonarqube/bin/linux-x86-64/sonar.sh start
ExecStop=/opt/sonarqube/bin/linux-x86-64/sonar.sh stop
User=sonarqube
Group=sonarqube
Restart=always
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

# Start SonarQube
sudo systemctl enable sonarqube
sudo systemctl start sonarqube
```

### 2. SonarQube Initial Configuration
1. Access SonarQube at http://192.168.1.10:9000
2. Login with admin/admin
3. Change default password
4. Create project token for Jenkins integration

## Pipeline Job Creation

### 1. Create Multibranch Pipeline
1. Go to Jenkins dashboard
2. Click "New Item"
3. Enter name: `thea-backend-pipeline`
4. Select "Multibranch Pipeline"
5. Configure:
   - **Branch Sources**: Git
   - **Repository URL**: [Your Git repository URL]
   - **Credentials**: [Git credentials if needed]
   - **Script Path**: `Jenkinsfile`

### 2. Configure Webhooks (Optional)
For automatic builds on Git commits:
1. In your Git repository settings
2. Add webhook URL: `http://192.168.1.10:8080/git/notifyCommit?url=[REPO_URL]`

## Monitoring Integration

### 1. Prometheus Configuration
Add Jenkins metrics endpoint to Prometheus configuration on monitoring VM:

```yaml
# /opt/prometheus/prometheus.yml
scrape_configs:
  - job_name: 'jenkins'
    static_configs:
      - targets: ['192.168.1.10:8080']
    metrics_path: '/prometheus'
```

### 2. Grafana Dashboard
Import Jenkins dashboard from Grafana Labs or create custom dashboard for:
- Build success rate
- Build duration
- Pipeline stage performance
- Queue length

## Security Considerations

### 1. Jenkins Security
- Enable CSRF protection
- Configure proper user permissions
- Regular security updates
- Secure script approval for pipeline scripts

### 2. Network Security
- Configure firewall rules
- Use HTTPS for external access
- Implement VPN for remote access

### 3. Credential Management
- Use Jenkins credential store
- Rotate credentials regularly
- Limit credential scope

## Backup Strategy

### 1. Jenkins Configuration Backup
```bash
# Create backup script
sudo tee /opt/scripts/jenkins-backup.sh <<EOF
#!/bin/bash
BACKUP_DIR="/opt/backups/jenkins"
JENKINS_HOME="/var/lib/jenkins"

mkdir -p \$BACKUP_DIR
tar -czf \$BACKUP_DIR/jenkins-backup-\$(date +%Y%m%d).tar.gz \$JENKINS_HOME
find \$BACKUP_DIR -name "jenkins-backup-*.tar.gz" -mtime +7 -delete
EOF

chmod +x /opt/scripts/jenkins-backup.sh

# Add to crontab
echo "0 2 * * * /opt/scripts/jenkins-backup.sh" | sudo crontab -
```

## Troubleshooting

### Common Issues:

1. **Jenkins won't start**
   - Check Java installation
   - Verify port 8080 is available
   - Check logs: `sudo journalctl -u jenkins`

2. **Docker permission denied**
   - Add jenkins user to docker group: `sudo usermod -aG docker jenkins`
   - Restart Jenkins: `sudo systemctl restart jenkins`

3. **SonarQube connection failed**
   - Verify SonarQube is running: `sudo systemctl status sonarqube`
   - Check network connectivity
   - Verify authentication token

4. **Pipeline fails on deployment**
   - Check Ansible connectivity
   - Verify SSH keys
   - Check target server status

## Additional Resources

- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [SonarQube Documentation](https://docs.sonarqube.org/)
- [Docker Documentation](https://docs.docker.com/)
- [Ansible Documentation](https://docs.ansible.com/)

## Support

For issues related to this setup:
1. Check Jenkins system logs
2. Review pipeline console output
3. Verify all VMs are accessible
4. Check security tool configurations
