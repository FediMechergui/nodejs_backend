# Thea Project DevSecOps Implementation Guide  
**Last Updated**: [DATE]  
**Version**: 1.2  
**Architecture Owner**: [YOUR NAME]  

![System Architecture Diagram](./deploying/architecture-diagram.png)  
*Diagram 1.0: Full system architecture with DevSecOps workflow*

---

## Executive Summary  
### Key Components  
- **CI/CD Pipeline**: Jenkins-driven workflow with SonarQube (SAST), Snyk (SCA), and Trivy (container scanning)  
- **Runtime Environment**: 2x App Servers with Node.js/FastAPI/Chatbot services + supporting data stores  
- **Security Layer**: Tri-level scanning (Nessus→ZAP→Trivy) across infrastructure/app/container layers  
- **Observability**: Prometheus metrics collection with Grafana dashboards and Alertmanager notifications  
- **Infrastructure**: 6 specialized VMs with Ansible-provisioned components  

### Critical Data Flows  
1. Code → Git → Jenkins → Built Containers → Local Registry → App Servers  
2. User Traffic → Nginx → Backend Services → Data Stores ↔ Backup VM  
3. Security Scans → Findings Database → Grafana Dashboards → Alertmanager  

---

## 1. Repository Structure Deep Dive  

```bash
thea-monorepo/
├── nodejs-backend/
│   ├── src/                  # Core application logic
│   ├── prisma/               # Database ORM configurations
│   │   ├── migrations/       # Version-controlled DB changes
│   │   └── schema.prisma    # Data model definitions
│   ├── tests/                # Jest unit/integration tests
│   │   ├── unit/            
│   │   └── integration/
│   ├── Dockerfile            # Multi-stage build configuration
│   └── jenkinsfile           # Pipeline definitions
│
├── fastapi-backend/          # (Similar structure as Node.js)
├── chatbot-service/          # (Similar structure)
│
├── deploying/
│   ├── docker-compose/       # Environment-specific compose files
│   │   ├── dev/
│   │   ├── staging/
│   │   └── prod/
│   ├── ansible/
│   │   ├── inventory/        # VM groupings
│   │   ├── roles/            # Reusable configuration modules
│   │   │   ├── jenkins/
│   │   │   ├── prometheus/
│   │   │   └── nginx/
│   │   └── playbooks/        # Execution workflows
│   │       ├── infra-setup.yml
│   │       └── app-deploy.yml
│   ├── monitoring/           # Prometheus rules & Grafana dashboards
│   └── security/             # Scan configurations & policies
│
├── docs/
│   ├── ARCHITECTURE.md       # Technical decision records
│   └── INCIDENT_RESPONSE.md  # Security protocols
└── .gitignore
```
**Key Structural Decisions**:

1. Mono-repo pattern enables cross-service testing and atomic commits
2. Separate compose files per environment prevent config drift
3. Ansible roles allow reusable infrastructure patterns
4. Centralized security policies maintain scan consistency

---

## 2. Infrastructure Architecture

### 2.1 VM Specifications

|VM Type|CPU|RAM|Storage|OS|Primary Purpose|
|---|---|---|---|---|---|
|Ubuntu CI/CD|4|8GB|50GB|Ubuntu 22.04|Jenkins, Docker Registry, Ansible|
|Monitoring|2|4GB|30GB|Ubuntu 22.04|Metrics collection & visualization|
|Security|4|8GB|40GB|Kali Linux|Vulnerability scanning|
|Load Balancer|2|2GB|20GB|Ubuntu 22.04|Nginx reverse proxy|
|App Server (x2)|8|16GB|100GB|Ubuntu 22.04|Application runtime + data stores|
|Backup|4|4GB|500GB|Ubuntu 22.04|Database/Object storage replication|

### 2.2 Network Configuration

**Subnets**:

- 192.168.1.0/24 - Primary application network
- 10.0.2.0/24 - Management/backup network

**Critical Ports**:

|Service|Port|Protocol|Access Scope|
|---|---|---|---|
|Jenkins|8080|TCP|Internal VPN|
|Grafana|3000|TCP|Internal VPN|
|Local Registry|5000|TCP|App Servers only|
|MinIO|9000|TCP|Backend services|
|RabbitMQ|5672|TCP|Internal services|

---

## 3. CI/CD Pipeline Implementation

### 3.1 Pipeline Stages

|Stage|Tools Used|Success Criteria|Failure Handling|
|---|---|---|---|
|1. Code Checkout|Git|Clean branch merge|Merge conflict resolution|
|2. Static Analysis|SonarQube + Snyk|<5% code smells, 0 critical CVEs|Block pipeline|
|3. Unit Testing|Jest/PyTest|>80% coverage|Test failure review|
|4. Container Build|Docker|Successful image push|Build log analysis|
|5. Security Scan|Trivy + ZAP|0 HIGH vulnerabilities|Manual override if false +ve|
|6. Deployment|Ansible + Compose|All services healthy|Automatic rollback|
|7. Monitoring|Prometheus|Metrics flowing|Alert investigation|

### 3.2 Security Gates

1. **Pre-merge**:
    - SonarQube quality gate (block on major issues)
    - Snyk license compliance check

2. **Pre-deployment**:
    - Trivy container scan (fail on CRITICAL CVEs)
    - ZAP baseline scan (max Medium severity)

3. **Post-deployment**:
    - Nessus credentialed scans (weekly)
    - Prometheus SLA monitoring (95% uptime)

---

## 4. Toolchain Integration Matrix

|Tool|Integration Points|Data Flow|Configuration Location|
|---|---|---|---|
|Jenkins|- Git webhooks  <br>- Ansible API|Triggers → Pipeline steps → Artifacts|`deploying/jenkins/`|
|SonarQube|Jenkins plugins|Code analysis → Quality gates|`deploying/sonar-project.properties`|
|Trivy|Registry webhooks|Scan on image push → JIRA tickets|`deploying/security/trivy.yaml`|
|Prometheus|Service exporters|Metrics → Time-series DB|`deploying/monitoring/prometheus.yml`|
|Nessus|Scheduled scans|Findings → Grafana|Security VM policy configs|

---

## 5. Security Implementation Details

### 5.1 Scan Types

| Scan Layer     | Tool   | Frequency  | Scanned Components          | Output Location            |
| -------------- | ------ | ---------- | --------------------------- | -------------------------- |
| Infrastructure | Nessus | Weekly     | VM OS, open ports, services | `security-reports/nessus/` |
| Application    | ZAP    | Per deploy | API endpoints, auth flows   | `security-reports/zap/`    |
| Container      | Trivy  | On build   | Docker images, packages     | Registry metadata          |

### 5.2 Penetration Testing Protocol

1. **Reconnaissance**: ZAP spidering + manual testing
    
2. **Vulnerability Mapping**:
    - SQLi testing on API endpoints
    - XSS checks on chatbot interface

3. **Exploitation**:
    - Credential stuffing tests
    - Session hijacking simulations

4. **Reporting**:
    - CVSS scoring of findings
    - Remediation timelines

---

## 6. Disaster Recovery Plan

### 6.1 Backup Strategy

| Data Type  | Tool          | Frequency | Retention  | Recovery Process                 |
| ---------- | ------------- | --------- | ---------- | -------------------------------- |
| MySQL      | mysqldump     | Hourly    | 7 days     | 1. Stop app  <br>2. Restore dump |
| Redis      | RDB snapshots | 15 min    | 24 hrs     | Replace AOF files                |
| MinIO      | mc mirror     | Real-time | 30 days    | Bucket synchronization           |
| VM Configs | Ansible       | On change | Indefinite | Re-run playbooks                 |

### 6.2 Failover Procedures

1. **App Server Failure**:
    - Load balancer detects unhealthy node
    - Traffic rerouted to healthy instance
    - Auto-scaling triggers new VM provision
        
2. **Database Corruption**:
    - Promote backup replica
    - Initiate point-in-time recovery

---

## 7. Monitoring & Alert Framework

### 7.1 Key Metrics

| Category        | Metrics Tracked                              | Alert Threshold             |
| --------------- | -------------------------------------------- | --------------------------- |
| API Performance | - Response time (p95)  <br>- Error rate      | >2s latency  <br>>5% errors |
| Data Stores     | - Connection pool usage  <br>- Query latency | >80% pool used              |
| Security        | - Critical CVEs  <br>- Scan frequency        | >24h since last scan        |

### 7.2 Escalation Matrix

|Alert Severity|Notification Channels|Response SLA|
|---|---|---|
|Critical|PagerDuty + SMS|15 minutes|
|High|Email + Slack|4 hours|
|Medium|Slack channel|1 business day|

---

## Appendix A: Architecture Diagram Legend

![Diagram Key](https://./deploying/diagram-legend.png)  
_Color Coding_:

- 🔵 Blue: CI/CD components
- 🟢 Green: Container runtime
- 🔴 Red: Security tools
- 🟠 Orange: Application services
    

_Connection Types_:
- Solid: Primary data flow
- Dashed: Management traffic
- Dotted: Security scanning

---

## Appendix B: Revision History

|Version|Date|Changes Made|Author|
|---|---|---|---|
|1.0|2024-03-01|Initial document structure|[Your Name]|
|1.1|2024-03-15|Added security protocols|[Your Name]|
|1.2|2024-04-01|Expanded monitoring section|[Your Name]|
