# VirtualBox Setup Guide for Thea DevSecOps Environment

This guide provides detailed instructions for setting up 6 VMs in VirtualBox with proper networking to implement the Thea DevSecOps environment. This setup ensures all VMs can communicate with each other and access the internet.

## VM Specifications

| VM Name | Purpose | OS | CPU | RAM | Storage |
|---------|---------|----|----|-----|---------|
| thea-cicd | CI/CD Server | Ubuntu Server 22.04 LTS | 4 | 8GB | 50GB |
| thea-monitor | Monitoring Server | Ubuntu Server 22.04 LTS | 2 | 4GB | 30GB |
| thea-security | Security Scanning | Kali Purple 2025.1c | 4 | 8GB | 40GB |
| thea-loadbalancer | Load Balancer | Ubuntu Server 22.04 LTS | 2 | 2GB | 20GB |
| thea-app1 | Application Server 1 | Ubuntu Server 22.04 LTS | 8 | 16GB | 100GB |
| thea-app2 | Application Server 2 | Ubuntu Server 22.04 LTS | 8 | 16GB | 100GB |

## Network Configuration

We'll create two network interfaces for each VM:
1. **NAT** - For internet access
2. **Internal Network** - For inter-VM communication

### Network Setup in VirtualBox

1. First, create two internal networks in VirtualBox:
   - `thea-app-network` (192.168.1.0/24) - Primary application network
   - `thea-mgmt-network` (10.0.2.0/24) - Management/backup network

## Step-by-Step VM Setup

### 1. thea-cicd (CI/CD Server)

1. **Create VM**:
   - Name: thea-cicd
   - Type: Linux
   - Version: Ubuntu (64-bit)
   - Memory: 8192 MB
   - Create a virtual hard disk (VDI, dynamically allocated, 50GB)

2. **Configure Network**:
   - Adapter 1: NAT (for internet access)
   - Adapter 2: Internal Network, name: `thea-app-network`
   - Adapter 3: Internal Network, name: `thea-mgmt-network`

3. **Install Ubuntu Server 22.04 LTS**:
   - Download ISO from [Ubuntu website](https://ubuntu.com/download/server)
   - Mount ISO and start VM
   - Follow installation prompts, choose minimal installation

4. **Network Configuration (post-installation)**:
   - Edit `/etc/netplan/00-installer-config.yaml`:

```yaml
network:
  version: 2
  ethernets:
    enp0s3:  # NAT interface
      dhcp4: yes
    enp0s8:  # App network
      addresses: [192.168.1.10/24]
    enp0s9:  # Management network
      addresses: [10.0.2.10/24]
```

5. **Apply network configuration**:
```bash
sudo netplan apply
```

6. **Set hostname**:
```bash
sudo hostnamectl set-hostname thea-cicd
```

7. **Update `/etc/hosts`**:
```
127.0.0.1 localhost
127.0.1.1 thea-cicd

# Thea network
192.168.1.10 thea-cicd
192.168.1.20 thea-monitor
192.168.1.30 thea-security
192.168.1.40 thea-loadbalancer
192.168.1.50 thea-app1
192.168.1.60 thea-app2

# Management network
10.0.2.10 thea-cicd-mgmt
10.0.2.20 thea-monitor-mgmt
10.0.2.30 thea-security-mgmt
10.0.2.40 thea-loadbalancer-mgmt
10.0.2.50 thea-app1-mgmt
10.0.2.60 thea-app2-mgmt
```

### 2. thea-monitor (Monitoring Server)

1. **Create VM**:
   - Name: thea-monitor
   - Type: Linux
   - Version: Ubuntu (64-bit)
   - Memory: 4096 MB
   - Create a virtual hard disk (VDI, dynamically allocated, 30GB)

2. **Configure Network**:
   - Adapter 1: NAT (for internet access)
   - Adapter 2: Internal Network, name: `thea-app-network`
   - Adapter 3: Internal Network, name: `thea-mgmt-network`

3. **Install Ubuntu Server 22.04 LTS** (same as thea-cicd)

4. **Network Configuration (post-installation)**:
   - Edit `/etc/netplan/00-installer-config.yaml`:

```yaml
network:
  version: 2
  ethernets:
    enp0s3:  # NAT interface
      dhcp4: yes
    enp0s8:  # App network
      addresses: [192.168.1.20/24]
    enp0s9:  # Management network
      addresses: [10.0.2.20/24]
```

5. **Apply network configuration and set hostname**:
```bash
sudo netplan apply
sudo hostnamectl set-hostname thea-monitor
```

6. **Update `/etc/hosts`** (same as thea-cicd)

### 3. thea-security (Security Scanning)

1. **Create VM**:
   - Name: thea-security
   - Type: Linux
   - Version: Debian (64-bit)
   - Memory: 8192 MB
   - Create a virtual hard disk (VDI, dynamically allocated, 40GB)

2. **Configure Network**:
   - Adapter 1: NAT (for internet access)
   - Adapter 2: Internal Network, name: `thea-app-network`
   - Adapter 3: Internal Network, name: `thea-mgmt-network`

3. **Install Kali Purple 2025.1c**:
   - Download ISO from [Kali Purple website](https://www.kali.org/get-kali/#kali-platforms)
   - Mount ISO and start VM
   - Follow installation prompts
   - Select the defensive security tools during installation

4. **Network Configuration (post-installation)**:
   - Edit `/etc/network/interfaces`:

```
# NAT interface
auto eth0
iface eth0 inet dhcp

# App network
auto eth1
iface eth1 inet static
    address 192.168.1.30
    netmask 255.255.255.0

# Management network
auto eth2
iface eth2 inet static
    address 10.0.2.30
    netmask 255.255.255.0
```

5. **Apply network configuration and set hostname**:
```bash
sudo systemctl restart networking
sudo hostnamectl set-hostname thea-security
```

6. **Update `/etc/hosts`** (same as thea-cicd)

### 4. thea-loadbalancer (Load Balancer)

1. **Create VM**:
   - Name: thea-loadbalancer
   - Type: Linux
   - Version: Ubuntu (64-bit)
   - Memory: 2048 MB
   - Create a virtual hard disk (VDI, dynamically allocated, 20GB)

2. **Configure Network**:
   - Adapter 1: NAT (for internet access)
   - Adapter 2: Internal Network, name: `thea-app-network`
   - Adapter 3: Internal Network, name: `thea-mgmt-network`

3. **Install Ubuntu Server 22.04 LTS** (same as thea-cicd)

4. **Network Configuration (post-installation)**:
   - Edit `/etc/netplan/00-installer-config.yaml`:

```yaml
network:
  version: 2
  ethernets:
    enp0s3:  # NAT interface
      dhcp4: yes
    enp0s8:  # App network
      addresses: [192.168.1.40/24]
    enp0s9:  # Management network
      addresses: [10.0.2.40/24]
```

5. **Apply network configuration and set hostname**:
```bash
sudo netplan apply
sudo hostnamectl set-hostname thea-loadbalancer
```

6. **Update `/etc/hosts`** (same as thea-cicd)

### 5. thea-app1 (Application Server 1)

1. **Create VM**:
   - Name: thea-app1
   - Type: Linux
   - Version: Ubuntu (64-bit)
   - Memory: 16384 MB
   - Create a virtual hard disk (VDI, dynamically allocated, 100GB)

2. **Configure Network**:
   - Adapter 1: NAT (for internet access)
   - Adapter 2: Internal Network, name: `thea-app-network`
   - Adapter 3: Internal Network, name: `thea-mgmt-network`

3. **Install Ubuntu Server 22.04 LTS** (same as thea-cicd)

4. **Network Configuration (post-installation)**:
   - Edit `/etc/netplan/00-installer-config.yaml`:

```yaml
network:
  version: 2
  ethernets:
    enp0s3:  # NAT interface
      dhcp4: yes
    enp0s8:  # App network
      addresses: [192.168.1.50/24]
    enp0s9:  # Management network
      addresses: [10.0.2.50/24]
```

5. **Apply network configuration and set hostname**:
```bash
sudo netplan apply
sudo hostnamectl set-hostname thea-app1
```

6. **Update `/etc/hosts`** (same as thea-cicd)

### 6. thea-app2 (Application Server 2)

1. **Create VM**:
   - Name: thea-app2
   - Type: Linux
   - Version: Ubuntu (64-bit)
   - Memory: 16384 MB
   - Create a virtual hard disk (VDI, dynamically allocated, 100GB)

2. **Configure Network**:
   - Adapter 1: NAT (for internet access)
   - Adapter 2: Internal Network, name: `thea-app-network`
   - Adapter 3: Internal Network, name: `thea-mgmt-network`

3. **Install Ubuntu Server 22.04 LTS** (same as thea-cicd)

4. **Network Configuration (post-installation)**:
   - Edit `/etc/netplan/00-installer-config.yaml`:

```yaml
network:
  version: 2
  ethernets:
    enp0s3:  # NAT interface
      dhcp4: yes
    enp0s8:  # App network
      addresses: [192.168.1.60/24]
    enp0s9:  # Management network
      addresses: [10.0.2.60/24]
```

5. **Apply network configuration and set hostname**:
```bash
sudo netplan apply
sudo hostnamectl set-hostname thea-app2
```

6. **Update `/etc/hosts`** (same as thea-cicd)

## Verify Network Connectivity

After setting up all VMs, verify they can communicate with each other:

1. **Test connectivity from thea-cicd to all other VMs**:
```bash
ping -c 3 thea-monitor
ping -c 3 thea-security
ping -c 3 thea-loadbalancer
ping -c 3 thea-app1
ping -c 3 thea-app2
```

2. **Test internet connectivity**:
```bash
ping -c 3 google.com
```

## Next Steps After VM Setup

Once all VMs are set up and networked properly:

1. **Set up SSH keys** for passwordless authentication between VMs
2. **Install Docker** on all application servers
3. **Set up Jenkins** on the CI/CD server
4. **Configure monitoring tools** on the monitoring server
5. **Set up security scanning tools** on the security server

## DevSecOps Implementation Steps

After the VM infrastructure is ready, follow these steps to implement the complete DevSecOps pipeline:

### 1. Infrastructure Setup
- **VM Provisioning**: Set up the 6 VM types we identified (CI/CD, Monitoring, Security, Load Balancer, 2x App Servers, Backup)
- **Network Configuration**: Configure the two subnets (192.168.1.0/24 for applications, 10.0.2.0/24 for management)
- **Base Software Installation**: Install required OS packages and dependencies

### 2. CI/CD Pipeline Configuration
- **Jenkins Setup**: Install and configure Jenkins on the CI/CD VM
- **Pipeline Creation**: Create Jenkinsfiles for each microservice
- **Security Scanning Integration**: Configure SonarQube, Snyk, and Trivy

### 3. Container Infrastructure
- **Docker Registry**: Set up the local Docker registry
- **Container Definitions**: Finalize Dockerfiles for each service
- **Docker Compose**: Configure environment-specific compose files

### 4. Monitoring & Observability
- **Prometheus Setup**: Install and configure Prometheus for metrics collection
- **Grafana Dashboards**: Create dashboards for application and infrastructure monitoring
- **Alert Configuration**: Set up alerting rules and notification channels

### 5. Security Implementation
- **Vulnerability Scanning**: Configure Nessus, ZAP, and Trivy scans
- **Security Policies**: Implement security gates in the CI/CD pipeline
- **Compliance Checks**: Set up automated compliance verification

### 6. Deployment Automation
- **Ansible Playbooks**: Create deployment playbooks for each environment
- **Load Balancer Configuration**: Set up Nginx for service routing
- **Zero-Downtime Deployment**: Implement blue-green or rolling deployment strategies

### 7. Backup & Disaster Recovery
- **Backup Procedures**: Configure database and object storage backups
- **Restore Testing**: Validate backup restoration procedures
- **Failover Automation**: Implement automated failover for critical services

### 8. Documentation & Training
- **Runbooks**: Create operational runbooks for common tasks
- **Incident Response**: Document incident response procedures
- **Team Training**: Conduct training sessions on the DevSecOps workflow
