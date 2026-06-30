# Roadwarden — Complete Implementation Strategy
## The Open-Source Compliance Automation Platform
### Full Vanta Parity: 35+ Frameworks · 400+ Integrations · AI-Native · Self-Hostable

---

## Preamble: Why Open Source Changes Everything

Vanta is a $4.15B unicorn. It is also completely closed-source. Every competitor—Drata, Secureframe, Sprinto—is equally opaque. Organizations stake their compliance posture on a black box they cannot inspect, customize, or self-host. Roadwarden breaks that model entirely.

Roadwarden is the world's first fully open-source, enterprise-grade compliance automation platform:

- **Open Core (Apache 2.0)**: The entire compliance engine, integration substrate, test runner, evidence collector, policy engine, risk model, trust center, vendor risk module, and auditor workspace are open source.
- **Cloud Edition (managed SaaS)**: Adds managed AI Agent, advanced trust center branding, SSO/SCIM, SLA-backed uptime, and multi-region data residency.
- **Self-Hosted Edition**: Full feature parity with Cloud minus managed AI (BYOK). No phone-home. Air-gapped deployment possible.

The open-source moat is permanent. Vanta cannot go open source without cannibalizing their revenue. Roadwarden wins by making the engine inspectable, auditable, and community-extendable.

---

## Guiding Rules (Locked — R1 through R14)

1. **Day-1 must match or exceed Vanta's feature surface.** 35+ frameworks, 400+ integrations, AI Agent, Trust Center, Vendor Risk, Questionnaire Automation—all ship at launch.
2. **Open source is non-negotiable.** Core engine: Apache 2.0. No feature-gating in the OSS tier that makes compliance automation impossible.
3. **Compliance is organization-scoped.** An Organization (`org_id`) is the tenant boundary. All data scoped by `org_id`.
4. **Test-first architecture.** Every control must have at least one automated test. Manual-only controls are explicitly flagged `test_type='manual'` and never auto-pass.
5. **Event-driven over polling.** Integration sync: push-first (webhook) with pull-fallback (scheduled). No blocking polling loops.
6. **Evidence is immutable once accepted.** Accepted evidence is SHA-256 hash-locked. Tampering is detectable. Audit trail is append-only.
7. **No AI hallucination on compliance.** AI Agent must cite sources for every suggestion. Never fabricate compliance guidance.
8. **GDPR/SOC2-compliant by default.** Roadwarden itself is SOC 2 Type II certified and GDPR-compliant.
9. **Multi-framework control mapping.** A single control implementation maps to requirements across multiple frameworks simultaneously. De-duplicate work, not just data.
10. **Auditor-native.** Auditors get a dedicated read-only workspace with direct evidence access, comment threads, and request management.
11. **Domain suffix is `.roadwarden.io` everywhere.**
12. **No vendor lock-in in the integration layer.** Every connector is an open-source plugin with a published spec. Third parties can author connectors.
13. **Risk is quantified, not vibes.** Every risk has `probability`, `impact`, `inherent_score`, `residual_score`, and `risk_appetite` threshold.
14. **Continuous is not batch.** Automated tests run every 4 hours minimum. Failures alert within 15 minutes.

---

## The Three Editions

| Dimension | Community (OSS) | Cloud | Enterprise Self-Hosted |
|---|---|---|---|
| License | Apache 2.0 | Commercial SaaS | Commercial + Source Access |
| Frameworks | All 35+ | All 35+ | All 35+ |
| Integrations | All 400+ | All 400+ | All 400+ |
| AI Agent | BYOK | Managed (GPT-4o + Claude 3.5) | BYOK |
| Trust Center | Full | Full + custom domain | Full |
| SSO/SCIM | Manual config | Managed | Manual config |
| Price | Free | $249/mo base + $49/user | Custom |

---

## Technology Stack (Locked)

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 LTS |
| Framework | NestJS 11 |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Message bus | Apache Kafka (KRaft) |
| RPC | gRPC + Protocol Buffers |
| Object storage | MinIO (self-hosted) / S3 |
| Search | OpenSearch 2.6 |
| Test runner | BullMQ + Redis |
| Monorepo | pnpm workspaces |
| Container | Docker + Kubernetes |
| CI/CD | GitHub Actions |
| Observability | OpenTelemetry + Prometheus + Grafana |
| Frontend | Next.js 15 + TypeScript |
| UI | shadcn/ui + Tailwind CSS |

---

## Repository Structure (Monorepo)

```
roadwarden/
├── apps/
│   ├── web/                          # Next.js — app.roadwarden.io
│   ├── trust/                        # Next.js — trust.roadwarden.io
│   ├── auditor/                      # Next.js — auditor.roadwarden.io
│   └── docs/                         # Docusaurus — docs.roadwarden.io
├── services/
│   ├── identity/
│   │   ├── auth-service/             # Port 9001 / gRPC 50001
│   │   └── user-service/             # Port 9002 / gRPC 50002
│   ├── organizations/
│   │   └── organization-service/     # Port 9010 / gRPC 50010
│   ├── platform/
│   │   ├── storage-service/          # Port 9031 / gRPC 50031
│   │   ├── notification-service/     # Port 9032 / gRPC 50032
│   │   ├── audit-log-service/        # Port 9033 / gRPC 50033
│   │   └── config-service/           # Port 9034 / gRPC 50034
│   ├── compliance/
│   │   ├── framework-service/        # Port 9100 / gRPC 50100
│   │   ├── control-service/          # Port 9101 / gRPC 50101
│   │   ├── test-runner-service/      # Port 9102 / gRPC 50102
│   │   ├── evidence-service/         # Port 9103 / gRPC 50103
│   │   ├── policy-service/           # Port 9104 / gRPC 50104
│   │   ├── risk-service/             # Port 9105 / gRPC 50105
│   │   ├── assessment-service/       # Port 9106 / gRPC 50106
│   │   └── remediation-service/      # Port 9107 / gRPC 50107
│   ├── integration/
│   │   ├── connector-registry/       # Port 9200 / gRPC 50200
│   │   ├── oauth-service/            # Port 9201 / gRPC 50201
│   │   ├── sync-engine/              # Port 9202 / gRPC 50202
│   │   ├── cloud-connectors/         # Port 9203 / gRPC 50203
│   │   ├── identity-connectors/      # Port 9204 / gRPC 50204
│   │   ├── code-connectors/          # Port 9205 / gRPC 50205
│   │   ├── hr-connectors/            # Port 9206 / gRPC 50206
│   │   ├── mdm-connectors/           # Port 9207 / gRPC 50207
│   │   ├── security-connectors/      # Port 9208 / gRPC 50208
│   │   └── webhook-ingestion/        # Port 9209 / gRPC 50209
│   ├── trust/
│   │   ├── trust-center-service/     # Port 9300 / gRPC 50300
│   │   ├── questionnaire-service/    # Port 9301 / gRPC 50301
│   │   ├── vendor-risk-service/      # Port 9302 / gRPC 50302
│   │   ├── auditor-service/          # Port 9303 / gRPC 50303
│   │   └── report-service/           # Port 9304 / gRPC 50304
│   ├── intelligence/
│   │   ├── ai-agent-service/         # Port 9400 / gRPC 50400
│   │   ├── monitor-service/          # Port 9401 / gRPC 50401
│   │   ├── alert-service/            # Port 9402 / gRPC 50402
│   │   └── analytics-service/        # Port 9403 / gRPC 50403
│   └── platform-ops/
│       ├── billing-service/          # Port 9500 / gRPC 50500
│       ├── admin-service/            # Port 9501 / gRPC 50501
│       ├── search-service/           # Port 9502 / gRPC 50502
│       ├── webhook-delivery-service/ # Port 9503 / gRPC 50503
│       └── api-gateway-service/      # Port 9504 / gRPC 50504
├── packages/
│   ├── proto/
│   ├── shared/
│   ├── ui/
│   ├── auth-client/
│   ├── api-client/
│   ├── types/
│   ├── control-library/
│   ├── test-catalog/
│   ├── framework-registry/
│   ├── connector-sdk/
│   └── policy-templates/
├── connectors/                       # 400+ community connectors
├── helm/                             # Self-hosted Helm charts
├── docker/                           # Docker Compose
└── .github/                          # CI/CD, PR templates
```

---

## The Dependency Graph

```mermaid
graph TD
    L1[Layer 1: Foundation] --> L2[Layer 2: Compliance Engine]
    L2 --> L3[Layer 3: Integration Engine]
    L3 --> L4[Layer 4: Trust and Collaboration]
    L4 --> L5[Layer 5: Intelligence]
    L5 --> L6[Layer 6: Platform Ops]

    subgraph Layer1 [Layer 1: Foundation 7 services]
        auth[identity/auth-service]
        user[identity/user-service]
        org[organizations/organization-service]
        storage[platform/storage-service]
        notif[platform/notification-service]
        auditlog[platform/audit-log-service]
        config[platform/config-service]
    end

    subgraph Layer2 [Layer 2: Compliance Engine 8 services]
        framework[compliance/framework-service]
        control[compliance/control-service]
        testrunner[compliance/test-runner-service]
        evidence[compliance/evidence-service]
        policy[compliance/policy-service]
        risk[compliance/risk-service]
        assessment[compliance/assessment-service]
        remediation[compliance/remediation-service]
    end

    subgraph Layer3 [Layer 3: Integration Engine 10 services]
        registry[integration/connector-registry]
        oauth[integration/oauth-service]
        sync[integration/sync-engine]
        cloud[integration/cloud-connectors]
        identity[integration/identity-connectors]
        code[integration/code-connectors]
        hr[integration/hr-connectors]
        mdm[integration/mdm-connectors]
        security[integration/security-connectors]
        webhookin[integration/webhook-ingestion]
    end

    subgraph Layer4 [Layer 4: Trust and Collaboration 5 services]
        trustcenter[trust/trust-center-service]
        questionnaire[trust/questionnaire-service]
        vendor[trust/vendor-risk-service]
        auditor[trust/auditor-service]
        report[trust/report-service]
    end

    subgraph Layer5 [Layer 5: Intelligence 4 services]
        aiagent[intelligence/ai-agent-service]
        monitor[intelligence/monitor-service]
        alert[intelligence/alert-service]
        analytics[intelligence/analytics-service]
    end

    subgraph Layer6 [Layer 6: Platform Ops 5 services]
        billing[platform-ops/billing-service]
        admin[platform-ops/admin-service]
        search[platform-ops/search-service]
        webhookout[platform-ops/webhook-delivery-service]
        apigw[platform-ops/api-gateway-service]
    end
```

---

## Part II: Framework Registry (38 Frameworks — All Day-1)

### F-01 SOC 2 (AICPA TSC 2017/2022)
**Renewal**: Annual (Type II) | **Controls**: 67 | **Tests**: 340+

Domains: CC1 Control Environment (5), CC2 Communication (3), CC3 Risk Assessment (4), CC4 Monitoring (2), CC5 Control Activities (3), CC6 Logical Access (8), CC7 System Operations (5), CC8 Change Management (1), CC9 Risk Mitigation (2), A1 Availability add-on (3), C1 Confidentiality add-on (2), PI1 Processing Integrity (5), P1-P8 Privacy.

Cross-mappings: CC6.1 <-> ISO 27001 A.8.3 <-> NIST CSF PR.AA-1 <-> CIS v8 Control 6

### F-02 ISO 27001:2022
**Renewal**: 3-year + annual surveillance | **Controls**: 103 | **Tests**: 380+

Mandatory Clauses 4-10. Annex A: Organizational (A.5, 37 controls), People (A.6, 8), Physical (A.7, 14), Technological (A.8, 34) = 93 Annex A controls + 10 clause-level = 103 total.

New 2022 controls all Day-1: A.5.7 Threat intelligence, A.5.23 Cloud security, A.5.30 ICT business continuity, A.8.9 Configuration management, A.8.10 Data deletion, A.8.11 Data masking, A.8.12 DLP, A.8.16 Monitoring, A.8.23 Web filtering, A.8.28 Secure coding.

Auto-generates Statement of Applicability (SoA). Supports BSI, SGS, TUV, Bureau Veritas, DNV.

### F-03 HIPAA
**Type**: Federal regulation | **Controls**: 82 | **Tests**: 120+

Rules: Privacy Rule (45 CFR 164 Subpart E), Security Rule Administrative (164.308), Physical (164.310), Technical (164.312), Breach Notification. 54 Required specs + 28 Addressable specs.

Special: BAA tracker, PHI data-flow mapping, 72-hour breach notification workflow.

### F-04 GDPR
**Penalties**: 20M EUR or 4% global turnover | **Controls**: 95 | **Tests**: 90+

Key areas: Principles (Art 5-11), Data Subject Rights (Art 12-23), Controller/Processor (Art 24-32), DPO (Art 37-39), Transfers (Art 44-50), Breach (Art 33-34, 72h), DPIA (Art 35-36), ROPA (Art 30).

Special: ROPA builder, DPIA templates, DSR workflow (45-day), SCCs library, 72-hour notification to all EU/EEA DPAs.

### F-05 PCI DSS v4.0
**Renewal**: Annual | **Controls**: 250+ | **Tests**: 190+

12 requirements across 6 goals. SAQ auto-selector. New v4.0: client-side script management (6.4.3), payment page tamper detection (11.6.1), expanded MFA.

### F-06 FedRAMP
**Levels**: Low (125), Moderate (325), High (421), DoD IL2-IL5 | **Tests**: 280+

Special: SSP auto-gen, SAR template, POA&M tracker, ConMon monthly reporting, OSCAL export.

### F-07 NIST CSF v2.0
**Released**: February 2024 | **Controls**: 106 subcategories | **Tests**: 160+

6 Functions: Govern GV (NEW, 6 categories), Identify ID (3), Protect PR (5), Detect DE (2), Respond RS (4), Recover RC (2). Profile support: Current/Target/Gap. Tier 1-4.

### F-08 NIST SP 800-53 Rev 5
**Controls**: 347 (High baseline) | **Tests**: 310+

20 families: AC (25), AU (16), CM (14), IA (12), IR (10), RA (10), SC (51), SI (23) and 12 others.

### F-09 NIST SP 800-171 Rev 3
**Controls**: 110 | **Tests**: 90+

14 families. SPRS Score Calculator. DoD Assessment Methodology tracker.

### F-10 CMMC 2.0
**Controls**: 134 (Level 3) | **Tests**: 110+

Level 1 (17, self-assess), Level 2 (110, C3PAO), Level 3 (134, DCSA). SPRS auto-submission.

### F-11 CIS Controls v8.1
**Controls**: 153 safeguards | **Tests**: 410+ (highest automation density)

18 Controls. IG1 (56 safeguards), IG2 (+74), IG3 (+23).

### F-12 SOX ITGC
**Controls**: 62 | **Tests**: 95+

4 domains: Access to Programs and Data, Program Development, Program Changes, Computer Operations. High automation: user access reviews from Okta/Azure, change tickets from GitHub/Jira, SoD detection.

### F-13 CCPA / CPRA
**Controls**: 58 | DSR workflow (45-day response)

8 data subject rights. CPRA adds Sensitive Personal Information category.

### F-14 HITRUST CSF v11
**Controls**: 156 (r2 level) | **Tests**: 140+

19 domains. Assessment types: e1, i1, r2. MyCSF portal integration.

### F-15 DORA
**Effective**: January 17, 2025 | **Controls**: 78 | **Tests**: 65+

5 Pillars: ICT Risk Management, Incident Management, Resilience Testing (TLPT), Third-Party Risk, Information Sharing.

### F-16 NIS2
**Transposition**: October 17, 2024 | **Controls**: 85 | **Tests**: 70+

18 sectors. Essential + Important entities. Article 21: 10 security measures. EU NCA contact directory.

### F-17 UK Cyber Essentials + CE Plus
**Controls**: 35 | **Tests**: 80+ | **Renewal**: Annual

5 controls: Firewalls, Secure config, User access control, Malware protection, Patch management (14-day window).

### F-18 CSA STAR (Level 1-3)
**Controls**: 197 (CCM v4.0) | **Tests**: 130+

17 domains. 80%+ overlap with ISO 27001 = major work de-duplication. STAR Registry auto-publish.

### F-19 through F-38 Summary

| ID | Framework | Controls | Tests | Special Feature |
|---|---|---|---|---|
| F-19 | ISO 27017 Cloud Security | 37 | 60+ | Cloud-specific ISO 27001 additions |
| F-20 | ISO 27018 Cloud Privacy | 25 | 40+ | PII in cloud; maps to GDPR Art. 28 |
| F-21 | ISO 42001 AI Management | 38 | 30+ | First intl AI standard; EU AI Act aligned |
| F-22 | ISO 22301 Business Continuity | 45 | 35+ | BIA wizard, RTO/RPO tracking |
| F-23 | SLSA v1.0 Supply Chain | 22 | 45+ | GitHub Actions SLSA provenance check |
| F-24 | CISA SSDF | 42 | 55+ | SBOM + VEX workflow |
| F-25 | StateRAMP | 325 | 180+ | US state/local gov cloud authorization |
| F-26 | TISAX Automotive | 63 | 50+ | ENX Portal integration |
| F-27 | LGPD Brazil | 68 | 55+ | ANPD 2-business-day breach notification |
| F-28 | PDPA Singapore | 55 | 40+ | DNC registry; PDPC 3-calendar-day notification |
| F-29 | AU Privacy Act | 52 | 35+ | OAIC Notifiable Data Breaches scheme |
| F-30 | PIPEDA / Canada C-27 | 58 | 40+ | OPC complaint workflow |
| F-31 | India DPDPA 2023 | 48 | 30+ | Significant Data Fiduciary obligations |
| F-32 | SOC 1 SSAE 18 | 35 | 20+ | Financial controls attestation |
| F-33 | NIST Privacy Framework | 55 | 30+ | 70%+ GDPR overlap; de-duplicated |
| F-34 | CSA CCM v4.0 standalone | 197 | 130+ | For orgs using CCM without STAR |
| F-35 | Microsoft SSPA | 45 | 35+ | Microsoft DPS portal integration |
| F-36 | Google VSAQ | 200+ | AI-fill | Auto-answer from existing controls |
| F-37 | UK GDPR + DPA 2018 | 72 | 60+ | ICO 72-hour breach notification |
| F-38 | AWS Well-Arch Security | 57 | 80+ | Security Hub + Config auto-import |

**Grand totals: 38 frameworks | 3,858+ controls | 4,100+ tests**
**Unique de-duplicated controls: 2,340+ | Cross-framework mappings: 8,000+**

---

## Part III: Integration Registry (400+ Connectors)

### ConnectorSDK Interface

```typescript
interface ConnectorSDK {
  metadata: {
    id: string;                          // 'aws' | 'github' | 'okta'
    name: string;
    vendor: string;
    category: ConnectorCategory;
    auth_type: 'oauth2' | 'api_key' | 'iam_role' | 'basic' | 'mtls';
    permissions_required: string[];
    tests_provided: string[];
    webhook_events?: string[];
  };
  connect(creds: Credentials): Promise<Connection>;
  verifyConnection(conn: Connection): Promise<HealthCheck>;
  disconnect(conn: Connection): Promise<void>;
  sync(conn: Connection, since?: Date): Promise<SyncResult>;
  handleWebhook?(payload: WebhookPayload): Promise<WebhookResult>;
  runTest(test_id: string, conn: Connection): Promise<TestResult>;
  collectEvidence(type: string, conn: Connection): Promise<Evidence[]>;
}
```

### Category 1: Cloud Infrastructure (38 connectors)

| Connector | Auth | Tests | Key Data Collected |
|---|---|---|---|
| **AWS** | IAM Role cross-account | 180+ | IAM, Security Hub, CloudTrail, Config Rules, GuardDuty, Inspector, S3 ACLs, EC2 SGs, KMS rotation, VPC flow logs |
| **Google Cloud Platform** | Service Account | 140+ | IAM, Security Command Center, Asset Inventory, Audit Logs, Cloud KMS, Cloud Armor, Binary Authorization |
| **Microsoft Azure** | Service Principal | 145+ | Entra ID, Defender for Cloud, Policy compliance, Activity Log, Key Vault, NSGs, Sentinel |
| **Cloudflare** | API Token | 30+ | DNS, WAF, SSL/TLS, DDoS, Workers, Access policies |
| **DigitalOcean** | Personal Access Token | 25+ | Droplets, firewalls, Spaces buckets, team members |
| **Heroku** | API Key | 20+ | App config, SSL, add-ons, collaborator access |
| **Oracle Cloud (OCI)** | API Key + Instance Principal | 45+ | IAM, VCN, Security Lists, Audit logs |
| **IBM Cloud** | API Key | 30+ | IAM, Security Advisor, Activity Tracker |
| **Linode / Akamai** | API Key | 18+ | Compute, firewalls, object storage |
| **Vultr** | API Key | 15+ | Instances, firewall groups |
| **AWS GovCloud** | IAM Role | 180+ | Same as AWS + GovCloud-specific controls |
| **Alibaba Cloud** | AccessKey | 25+ | RAM, ActionTrail, Security Center |
| + 26 more cloud/CDN/edge connectors | | | |

### Category 2: Identity & Access Management (42 connectors)

| Connector | Auth | Tests | Key Data |
|---|---|---|---|
| **Okta** | OAuth2 + API | 95+ | MFA enforcement, user list, group memberships, auth policies, inactive users, admin accounts, sign-on policies |
| **Microsoft Entra ID** | Service Principal | 90+ | MFA, Conditional Access, PIM, privileged roles, guest accounts, SSPR |
| **Google Workspace** | Service Account + Domain Delegation | 80+ | 2FA enforcement, OAuth app access, admin accounts, Drive sharing |
| **Duo Security** | Admin API | 35+ | MFA policies, device health, bypass codes |
| **OneLogin** | API Credentials | 40+ | MFA, user provisioning, SmartFactor |
| **JumpCloud** | API Key | 50+ | Device management, directory users, MFA, RADIUS |
| **Ping Identity** | OAuth2 | 30+ | MFA, identity governance |
| **SailPoint IdentityNow** | OAuth2 | 25+ | Access certifications, role assignments, SoD violations |
| **CyberArk** | REST API | 20+ | Privileged account inventory, vault health |
| **HashiCorp Vault** | Token / AppRole | 15+ | Secret access policies, audit logs, lease TTLs |
| **AWS IAM Identity Center** | IAM Role | 45+ | Permission sets, account assignments, MFA |
| **Auth0** | Management API | 30+ | MFA, user policies, log anomalies |
| + 30 more IdP/PAM/SSO connectors | | | |

### Category 3: Version Control & CI/CD (35 connectors)

| Connector | Auth | Tests | Key Data |
|---|---|---|---|
| **GitHub Cloud + Enterprise** | OAuth2 + GitHub App | 90+ | Branch protection, required reviews, code scanning, secret scanning, dep alerts, CODEOWNERS, SLSA provenance, SBOM |
| **GitLab Cloud + Self-Managed** | OAuth2 + PAT | 75+ | Branch protection, MR approvals, SAST, dep scanning, secret detection |
| **Bitbucket** | OAuth2 | 45+ | Branch restrictions, required builds, 2FA |
| **Azure DevOps** | Service Principal | 55+ | Branch policies, pipeline approvals, artifact signing |
| **Jenkins** | API Token | 20+ | Plugin versions, RBAC, build permissions |
| **CircleCI** | API Token | 15+ | Context restrictions, env variable encryption |
| **ArgoCD** | API Token | 18+ | RBAC, sync policies, app health |
| **Snyk** | API Token | 25+ | Vulnerability findings, license compliance, PR gates |
| **SonarQube / SonarCloud** | API Token | 20+ | Quality gates, security hotspots, code coverage |
| **Veracode** | API Credentials | 15+ | SAST/DAST findings, policy compliance |
| + 25 more VCS/CI/CD connectors | | | |

### Category 4: HR & People (30 connectors)

| Connector | Tests | Key Data |
|---|---|---|
| **Rippling** | 30+ | Employee list, termination dates, background check status, training completion |
| **BambooHR** | 25+ | Employee list, termination records, onboarding checklist |
| **Workday** | 25+ | Employee list, roles, termination |
| **ADP Workforce Now** | 20+ | Employee list, termination records |
| **Gusto** | 18+ | Employee + contractor list, termination |
| **HiBob** | 20+ | HRIS records, termination |
| **Deel** | 15+ | Global contractor records |
| **SAP SuccessFactors** | 20+ | Enterprise HR records |
| + 22 more HR connectors | | |

**Critical cross-reference**: HR (employment status) vs Identity (account active) vs Access Systems (permissions). Any terminated employee with active account = CRITICAL automatic alert + auto-created remediation task.

### Category 5: MDM & Endpoint (28 connectors)

| Connector | Tests | Key Data |
|---|---|---|
| **Jamf Pro** | 45+ | FileVault/iOS encryption, OS version, patch status, antivirus, screen lock, MDM enrollment |
| **Kandji** | 40+ | Blueprint adherence, macOS compliance, auto-update |
| **Microsoft Intune** | 50+ | Windows/macOS/iOS/Android compliance, encryption, patch, antivirus |
| **VMware Workspace ONE** | 35+ | Cross-platform device compliance, conditional access |
| **Mosyle Business** | 30+ | Apple-fleet MDM compliance |
| **FleetDM** | 25+ | Open-source osquery-based device management |
| **CrowdStrike Falcon Device** | 40+ | Endpoint detection, prevention policy, device health |
| **SentinelOne** | 35+ | EDR status, threat prevention |
| **Microsoft Defender** | 20+ | Windows security status via Graph API |
| + 19 more MDM/endpoint connectors | | |

### Category 6: Security Tools (45 connectors)

| Connector | Tests | Key Data |
|---|---|---|
| **Wiz** | 60+ | Cloud misconfigurations, vulnerabilities, exposed secrets, identity risks, attack paths |
| **CrowdStrike Falcon SIEM** | 55+ | Alerts, threat intelligence, incident reports |
| **Orca Security** | 45+ | Cloud security findings, vulnerability context |
| **Prisma Cloud** | 50+ | Cloud security posture, workload protection |
| **Tenable.io / Nessus** | 40+ | Vulnerability scan results, critical/high findings |
| **AWS Security Hub** | 45+ | Aggregated findings across all AWS services |
| **Google Security Command Center** | 40+ | GCP security findings |
| **Microsoft Defender for Cloud** | 45+ | Azure findings, Secure Score |
| **Qualys VMDR** | 35+ | Vulnerability findings, remediation tracking |
| **Rapid7 InsightVM** | 30+ | Vulnerability findings |
| **Splunk** | 25+ | SIEM log ingestion, saved searches |
| **Datadog** | 35+ | APM, logs, infrastructure, security signals |
| **Microsoft Sentinel** | 25+ | SIEM alerts, analytics rules |
| **PagerDuty** | 15+ | Incident management, on-call schedules, MTTR |
| **HackerOne** | 10+ | Bug bounty P1/P2 disclosure SLAs |
| **KnowBe4** | 15+ | Training completion, phishing simulation results |
| **Zscaler** | 25+ | Zero trust network access, DLP |
| + 28 more security connectors | | |

### Categories 7-14 Summary

| Category | Count | Examples |
|---|---|---|
| Task & Project Management | 18 | Jira, Linear, Asana, ServiceNow, GitHub Issues, Azure Boards |
| Communication & Collaboration | 12 | Slack, MS Teams, Zoom, Box, Dropbox, SharePoint |
| Database & Data | 20 | AWS RDS, Snowflake, MongoDB Atlas, BigQuery, Redshift |
| DNS & Certificates | 10 | Cloudflare DNS, DigiCert, Venafi, AWS ACM, Let's Encrypt |
| Secrets & Key Management | 12 | HashiCorp Vault, AWS KMS, Azure Key Vault, GCP KMS, Doppler |
| Background Check | 8 | Checkr, Sterling, HireRight, Onfido, GoodHire |
| Training & Awareness | 12 | KnowBe4, Proofpoint SA, SANS, Ninjio, Curricula |
| Specialty & Emerging | 30 | Kubernetes, Terraform, Stripe, Salesforce, OpenAI, Datadog APM |

**Total: 400+ connectors across 14 categories**

---

## Part IV: Architecture Decisions (Q1-Q30)

| # | Decision | Choice Locked |
|---|---|---|
| Q1 | Tenancy model | Organization is tenant; sub-orgs via parent_org_id; multi-org for MSPs |
| Q2 | RBAC | 6 built-in roles: owner/admin/security_lead/member/auditor/viewer |
| Q3 | Authentication | Magic link + password + SAML/OIDC SSO + SCIM 2.0; MFA: TOTP + WebAuthn + FIDO2 |
| Q4 | Connector architecture | Isolated @roadwarden/connector-{id} npm packages; KMS-encrypted creds; sandboxed |
| Q5 | Evidence immutability | SHA-256 hash locked on acceptance; append-only audit trail; tamper-detectable |
| Q6 | Continuous monitoring | BullMQ: Critical every 4h, Standard daily, Slow weekly, On-change via webhook |
| Q7 | Risk quantification | inherent = probability(1-5) x impact(1-5); residual = inherent x (1 - effectiveness) |
| Q8 | Compliance score | (passing_controls / in_scope_controls) x 100%; sub-scores per domain; daily trend |
| Q9 | Multi-framework de-duplication | Single control implementation satisfies multiple frameworks simultaneously |
| Q10 | AI Agent | 4 modes: Policy Drafter, Questionnaire Auto-Fill, Control Mapper, Risk Advisor |
| Q11 | Trust Center | Public at trust.roadwarden.io/{slug}; NDA-gated deeper access; custom domain |
| Q12 | Auditor workspace | Read-only at auditor.roadwarden.io; time-limited; MFA required; download audit log |
| Q13 | Vendor risk | 2-track: SecurityScorecard auto + questionnaire manual; cadence by risk tier |
| Q14 | Open source governance | Apache 2.0; CLA; TSC 5-7 members; CVE via GitHub Security Advisories; SBOM per release |
| Q15 | Data residency | US/EU/APAC regions; PostgreSQL RLS at DB layer; self-hosted zero-telemetry |
| Q16 | Compliance periods | Evidence is period-scoped; prior periods archived; quarterly/annual/custom types |
| Q17 | Remediation SLAs | Critical 24h, High 7d, Medium 30d, Low 90d; auto-create from failures; Jira/Linear sync |
| Q18 | Questionnaire automation | VSAQ/SIG/CAIQ/CSV/PDF; AI semantic matching; human review gate; export to original format |
| Q19 | Notifications | Channels: Email, Slack, Teams, PagerDuty, Webhook; alert on failures/expiry/SLA |
| Q20 | API-first | All capabilities via api.roadwarden.io/v1; OpenAPI 3.0; SDKs: TS/Python/Go/Ruby |
| Q21 | Evidence TTLs | Automated snapshot 90d, Policy doc 365d, Audit report per cert cycle, Attestation 365d |
| Q22 | Policy library | 80+ templates; versioned; framework-mapped; variable-substituted; AI-customizable |
| Q23 | Scoping module | Per-framework questionnaire drives controls-in-scope, connector recommendations, auditor RFI |
| Q24 | Dual mode | Assessment Mode (point-in-time audit prep) + Continuous Mode (ongoing obligations); simultaneous |
| Q25 | SoA generation | ISO 27001: auto-generated SoA with justification per control; versioned; PDF export |
| Q26 | POA&M | FedRAMP/FISMA: auto-generated; OSCAL-format export; monthly ConMon package generation |
| Q27 | OSCAL support | Import/export SSP, SAP, SAR; OSCAL catalog import for custom frameworks |
| Q28 | Evidence intake | 6 methods: Auto/connector, Drag+drop (50MB), URL+snapshot, Screen capture, API, Email |
| Q29 | Competitor import | One-click migration from Vanta, Drata, Secureframe via CSV/JSON wizard |
| Q30 | Self-hosted deployment | Docker Compose (dev), Kubernetes/Helm (prod), Managed K8s Operators (EKS/GKE/AKS) |

---

## Part V: Layer 1 — Foundation (7 Services)

---

### identity/auth-service | Port 9001 | gRPC 50001

**Canonical ownership**: Global user identity, all authentication methods, session lifecycle, SSO/SCIM, MFA.

#### Schema

```sql
users:
  id UUID PK
  email VARCHAR(255) UNIQUE NOT NULL
  email_verified BOOLEAN NOT NULL DEFAULT false
  password_hash VARCHAR(72)                   -- bcrypt; NULL for magic-link-only users
  mfa_enabled BOOLEAN NOT NULL DEFAULT false
  mfa_totp_secret_enc BYTEA                   -- KMS-encrypted TOTP secret
  mfa_backup_codes_enc BYTEA                  -- KMS-encrypted backup codes array
  mfa_webauthn_credentials JSONB              -- WebAuthn credential descriptors
  last_login_at TIMESTAMP
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  deleted_at TIMESTAMP                        -- soft delete

user_sessions:
  id UUID PK
  user_id UUID FK users(id)
  session_type VARCHAR(20) NOT NULL           -- 'user' | 'audit'
  token_hash VARCHAR(64) UNIQUE NOT NULL      -- SHA-256 of session cookie value
  ip_hash VARCHAR(64)                         -- hashed; never store raw IP
  user_agent_fingerprint VARCHAR(100)
  org_id UUID                                 -- active org context
  expires_at TIMESTAMP NOT NULL
  last_active_at TIMESTAMP NOT NULL DEFAULT NOW()
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (user_id, session_type)
  INDEX (expires_at) WHERE expires_at > NOW()

magic_link_tokens:
  id UUID PK
  user_id UUID FK users(id)
  token_hash VARCHAR(64) UNIQUE NOT NULL
  purpose VARCHAR(50) NOT NULL                -- 'login' | 'invite' | 'password_reset'
  org_id UUID
  expires_at TIMESTAMP NOT NULL               -- 15min for login; 72h for invite
  used_at TIMESTAMP
  created_at TIMESTAMP NOT NULL DEFAULT NOW()

sso_configurations:
  id UUID PK
  org_id UUID UNIQUE NOT NULL
  provider_type VARCHAR(30) NOT NULL          -- 'saml' | 'oidc'
  config JSONB NOT NULL                       -- entity_id, cert, client_id, discovery_url...
  is_active BOOLEAN NOT NULL DEFAULT true
  enforce_sso BOOLEAN NOT NULL DEFAULT false  -- disables password login
  allowed_domains VARCHAR(255)[]
  created_at TIMESTAMP NOT NULL DEFAULT NOW()

scim_tokens:
  id UUID PK
  org_id UUID NOT NULL
  token_hash VARCHAR(64) UNIQUE NOT NULL
  description VARCHAR(255)
  last_used_at TIMESTAMP
  expires_at TIMESTAMP                        -- NULL = non-expiring
  created_at TIMESTAMP NOT NULL DEFAULT NOW()

outbox_events:
  id UUID PK
  event_type VARCHAR(100) NOT NULL
  payload JSONB NOT NULL
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  processed_at TIMESTAMP
```

#### gRPC Surface (24 RPCs)

| RPC | Purpose |
|---|---|
| SendMagicLink | Send login/invite/reset email with tokenized link |
| VerifyMagicLink | Validate token, issue session |
| Login | Email + password authentication |
| LoginSSO | Initiate OIDC/SAML redirect |
| HandleSSOCallback | Process SSO callback, issue session |
| Logout | Invalidate specific session |
| LogoutAll | Invalidate all user sessions (security event) |
| GetCurrentSession | Resolve session token to user + org context |
| RefreshSession | Extend sliding session expiry |
| SetupMFA | Initialize TOTP or WebAuthn registration |
| VerifyMFA | Validate TOTP code or WebAuthn assertion |
| DisableMFA | Remove MFA (requires re-authentication) |
| GetSSOConfig | Return org SSO config for login page rendering |
| UpsertSSOConfig | Configure SAML/OIDC (admin-only) |
| TestSSOConfig | Validate config connectivity before save |
| CreateSCIMToken | Generate SCIM 2.0 bearer token |
| HandleSCIMProvision | Process SCIM user/group create, update, delete |
| ForgotPassword | Send password reset email |
| ResetPassword | Process password reset with token |
| ChangePassword | In-session password change |
| GetUser | User by ID or email |
| CreateUser | Admin-initiated user creation |
| DeleteUser | Soft-delete + revoke all sessions |
| Health | Standard gRPC health check |

#### Events Published
user.created, user.verified_email, user.logged_in, user.login_failed (with ip_hash), user.mfa_enabled, user.mfa_disabled, user.password_changed, user.deleted, user.sso_configured, user.scim_provisioned, user.scim_deprovisioned, session.created, session.expired, session.revoked.

#### Events Consumed
None (Layer 1 — no upstream dependencies).

---

### identity/user-service | Port 9002 | gRPC 50002

**Canonical ownership**: User profiles, preferences, notification settings, API key management.

#### Schema

```sql
user_profiles:
  user_id UUID PK FK users(id)
  display_name VARCHAR(255) NOT NULL
  avatar_storage_id UUID
  job_title VARCHAR(100)
  department VARCHAR(100)
  timezone VARCHAR(50) DEFAULT 'UTC'
  locale VARCHAR(10) DEFAULT 'en-US'
  bio TEXT
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()

user_preferences:
  user_id UUID PK FK users(id)
  theme VARCHAR(20) DEFAULT 'system'
  email_notifications JSONB DEFAULT '{}'      -- per-event-type on/off flags
  slack_notifications JSONB DEFAULT '{}'
  dashboard_layout JSONB DEFAULT '{}'
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()

api_keys:
  id UUID PK
  user_id UUID FK users(id)
  org_id UUID NOT NULL
  name VARCHAR(255) NOT NULL
  key_hash VARCHAR(64) UNIQUE NOT NULL        -- SHA-256 of actual key value
  key_prefix VARCHAR(10) NOT NULL             -- first 10 chars for display: rw_live_xxxx
  scopes VARCHAR(50)[] NOT NULL DEFAULT '{}'  -- ['read:controls', 'write:evidence', ...]
  last_used_at TIMESTAMP
  expires_at TIMESTAMP                        -- NULL = non-expiring
  revoked_at TIMESTAMP
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (org_id, user_id)
```

#### gRPC Surface
GetProfile, UpdateProfile, GetPreferences, UpdatePreferences, CreateAPIKey, ListAPIKeys, RevokeAPIKey, ValidateAPIKey (called by api-gateway to resolve key to user context), GetUserActivity.

#### Events Published
user.profile_updated, api_key.created, api_key.revoked, api_key.used.

---

### organizations/organization-service | Port 9010 | gRPC 50010

**Canonical ownership**: Organization CRUD, membership management, invitations, sub-orgs.

#### Schema

```sql
organizations:
  id UUID PK
  name VARCHAR(255) NOT NULL
  slug VARCHAR(100) UNIQUE NOT NULL
  description TEXT
  website_url VARCHAR(500)
  logo_storage_id UUID
  industry VARCHAR(100)                        -- 'saas' | 'healthcare' | 'fintech' | ...
  employee_count_band VARCHAR(50)              -- '1-10' | '11-50' | '51-200' | '201-1000' | '1000+'
  hq_country VARCHAR(2)                        -- ISO 3166-1 alpha-2
  parent_org_id UUID FK organizations(id)      -- NULL for root orgs
  billing_plan VARCHAR(50) DEFAULT 'community'
  trial_ends_at TIMESTAMP
  is_active BOOLEAN NOT NULL DEFAULT true
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  deleted_at TIMESTAMP

org_members:
  id UUID PK
  org_id UUID FK organizations(id) ON DELETE CASCADE
  user_id UUID NOT NULL
  role VARCHAR(50) NOT NULL                    -- 'owner'|'admin'|'security_lead'|'member'|'viewer'
  department VARCHAR(100)
  is_active BOOLEAN NOT NULL DEFAULT true
  invited_by_user_id UUID
  joined_at TIMESTAMP NOT NULL DEFAULT NOW()
  last_active_at TIMESTAMP
  UNIQUE (org_id, user_id)
  INDEX (user_id)

org_invitations:
  id UUID PK
  org_id UUID FK organizations(id)
  email VARCHAR(255) NOT NULL
  role VARCHAR(50) NOT NULL
  invited_by_user_id UUID NOT NULL
  token_hash VARCHAR(64) UNIQUE NOT NULL
  expires_at TIMESTAMP NOT NULL               -- 72h default
  accepted_at TIMESTAMP
  created_at TIMESTAMP NOT NULL DEFAULT NOW()

org_settings:
  org_id UUID PK FK organizations(id)
  compliance_contact_email VARCHAR(255)
  security_contact_email VARCHAR(255)
  require_mfa BOOLEAN NOT NULL DEFAULT false
  allowed_ip_ranges CIDR[]
  data_residency_region VARCHAR(20)           -- 'us' | 'eu' | 'apac'
  custom_fields JSONB DEFAULT '{}'
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
```

#### gRPC Surface
CreateOrg, GetOrg, UpdateOrg, DeleteOrg, ListUserOrgs, GetOrgMembers, InviteMember, AcceptInvitation, RemoveMember, UpdateMemberRole, GetOrgSettings, UpdateOrgSettings, CreateSubOrg, ListSubOrgs, GetOrgInvitations, RevokeInvitation.

#### Events Published
org.created, org.updated, org.deleted, org.member_added, org.member_removed, org.member_role_changed, org.invitation_sent, org.invitation_accepted.

---

### platform/storage-service | Port 9031 | gRPC 50031

**Canonical ownership**: All file storage. Backend-agnostic: MinIO (self-hosted), AWS S3, GCS, Azure Blob.

#### Schema

```sql
stored_files:
  id UUID PK
  org_id UUID NOT NULL
  bucket VARCHAR(100) NOT NULL
  storage_key VARCHAR(500) UNIQUE NOT NULL
  original_filename VARCHAR(255) NOT NULL
  content_type VARCHAR(100) NOT NULL
  size_bytes BIGINT NOT NULL
  sha256_hash VARCHAR(64) NOT NULL             -- set on upload; used for tamper detection
  purpose VARCHAR(50) NOT NULL                 -- 'evidence'|'policy'|'report'|'logo'|'avatar'|'export'
  uploaded_by_user_id UUID NOT NULL
  metadata JSONB DEFAULT '{}'
  virus_scan_status VARCHAR(20) DEFAULT 'pending'   -- 'pending'|'clean'|'infected'|'failed'
  virus_scan_completed_at TIMESTAMP
  is_public BOOLEAN NOT NULL DEFAULT false
  deleted_at TIMESTAMP
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (org_id, purpose)
  INDEX (sha256_hash)
```

#### gRPC Surface
GetUploadURL (presigned PUT URL), CompleteUpload (mark complete + trigger virus scan), GetDownloadURL (time-limited presigned GET), GetFile, DeleteFile (soft), GetFileByHash, ListFiles, VerifyFileHash (recompute hash and compare — tamper detection).

#### Events Published
file.uploaded, file.virus_scan_completed, file.deleted.

---

### platform/notification-service | Port 9032 | gRPC 50032

**Canonical ownership**: All outbound notifications — email (AWS SES), Slack, MS Teams, PagerDuty, Webhook.

#### Schema

```sql
notification_channels:
  id UUID PK
  org_id UUID NOT NULL
  channel_type VARCHAR(30) NOT NULL           -- 'email'|'slack'|'teams'|'pagerduty'|'webhook'
  name VARCHAR(255) NOT NULL
  config_enc BYTEA NOT NULL                   -- KMS-encrypted channel credentials
  is_active BOOLEAN NOT NULL DEFAULT true
  created_at TIMESTAMP NOT NULL DEFAULT NOW()

notification_subscriptions:
  id UUID PK
  org_id UUID NOT NULL
  channel_id UUID FK notification_channels(id)
  event_type VARCHAR(100)                     -- NULL = subscribe to all events
  severity_filter VARCHAR(20)                 -- NULL = all severities
  framework_filter VARCHAR(50)                -- NULL = all frameworks
  is_active BOOLEAN NOT NULL DEFAULT true

notification_log:
  id UUID PK
  org_id UUID NOT NULL
  channel_id UUID FK notification_channels(id)
  event_type VARCHAR(100) NOT NULL
  subject VARCHAR(500) NOT NULL
  payload JSONB NOT NULL
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
  sent_at TIMESTAMP
  error_message TEXT
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (org_id, created_at DESC)
```

#### gRPC Surface
SendNotification, CreateChannel, UpdateChannel, DeleteChannel, TestChannel, ListChannels, CreateSubscription, DeleteSubscription, ListNotificationLog.

#### Events Consumed
All Kafka topics. Routes based on org subscriptions. Core triggers: test.failed (severity-gated), evidence.expiring, remediation.sla_breached, integration.disconnected, compliance_period.approaching.

---

### platform/audit-log-service | Port 9033 | gRPC 50033

**Canonical ownership**: Immutable append-only audit log. Never updated, never deleted. 7-year retention (Cloud). Monthly partitioned.

#### Schema

```sql
audit_events:
  id UUID PK
  org_id UUID NOT NULL
  actor_type VARCHAR(20) NOT NULL             -- 'user'|'system'|'api_key'|'integration'
  actor_id VARCHAR(255) NOT NULL
  actor_email VARCHAR(255)                    -- denormalized for display
  action VARCHAR(100) NOT NULL                -- 'evidence.accepted'|'user.invited'|...
  resource_type VARCHAR(50)
  resource_id VARCHAR(255)
  resource_name VARCHAR(255)                  -- denormalized for display
  ip_hash VARCHAR(64)                         -- never raw IP
  user_agent VARCHAR(500)
  metadata JSONB
  occurred_at TIMESTAMP NOT NULL DEFAULT NOW()
  -- PARTITIONED monthly by occurred_at
  -- Indexes on (org_id, occurred_at DESC), (org_id, action), (org_id, actor_id), (org_id, resource_type, resource_id)
```

#### gRPC Surface
RecordEvent (called by all services), QueryEvents (paginated + filterable), ExportEvents (CSV/JSON — GDPR portability + auditor export), GetEvent.

---

### platform/config-service | Port 9034 | gRPC 50034

**Canonical ownership**: Feature flags, plan entitlements, system configuration.

#### Schema

```sql
feature_flags:
  id UUID PK
  flag_key VARCHAR(100) UNIQUE NOT NULL
  description TEXT
  default_value BOOLEAN NOT NULL DEFAULT false
  is_active BOOLEAN NOT NULL DEFAULT true

org_feature_overrides:
  org_id UUID NOT NULL
  flag_key VARCHAR(100) NOT NULL
  value BOOLEAN NOT NULL
  reason TEXT
  set_at TIMESTAMP NOT NULL DEFAULT NOW()
  PRIMARY KEY (org_id, flag_key)

plan_entitlements:
  plan_name VARCHAR(50) NOT NULL
  feature_key VARCHAR(100) NOT NULL
  value JSONB NOT NULL                        -- boolean, number, or string
  PRIMARY KEY (plan_name, feature_key)

system_config:
  config_key VARCHAR(100) PK
  config_value JSONB NOT NULL
  description TEXT
  is_secret BOOLEAN NOT NULL DEFAULT false
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
```

#### gRPC Surface
GetFeatureFlag, SetOrgFeatureOverride, ListFeatureFlags, CheckEntitlement, GetSystemConfig, UpdateSystemConfig.

---

## Part VI: Layer 2 — Compliance Engine (8 Services)

---

### compliance/framework-service | Port 9100 | gRPC 50100

**Canonical ownership**: Framework catalog, org activations, scoping questionnaires, compliance period tracking, Statement of Applicability generation.

#### Schema

```sql
-- Global catalog seeded from packages/framework-registry/
frameworks:
  id VARCHAR(50) PK                           -- 'soc2' | 'iso27001' | 'hipaa'...
  name VARCHAR(255) NOT NULL
  short_name VARCHAR(50) NOT NULL
  version VARCHAR(20) NOT NULL
  publisher VARCHAR(100) NOT NULL
  category VARCHAR(50) NOT NULL
  cert_type VARCHAR(30) NOT NULL
  renewal_period_months INTEGER
  description TEXT
  is_active BOOLEAN NOT NULL DEFAULT true
  created_at TIMESTAMP NOT NULL DEFAULT NOW()

framework_domains:
  id UUID PK
  framework_id VARCHAR(50) FK frameworks(id)
  code VARCHAR(50) NOT NULL                   -- 'CC6' | 'A.8' | '164.308'
  name VARCHAR(255) NOT NULL
  description TEXT
  sort_order INTEGER NOT NULL DEFAULT 0
  UNIQUE (framework_id, code)

scoping_questions:
  id UUID PK
  framework_id VARCHAR(50) FK frameworks(id)
  question_key VARCHAR(100) NOT NULL
  question_text TEXT NOT NULL
  help_text TEXT
  question_type VARCHAR(30) NOT NULL          -- 'yes_no'|'multiple_choice'|'number'|'multi_select'
  options JSONB
  affects_controls VARCHAR(255)[]             -- control IDs whose applicability this determines
  sort_order INTEGER NOT NULL DEFAULT 0
  UNIQUE (framework_id, question_key)

org_frameworks:
  id UUID PK
  org_id UUID NOT NULL
  framework_id VARCHAR(50) FK frameworks(id)
  is_active BOOLEAN NOT NULL DEFAULT true
  target_cert_level VARCHAR(50)               -- 'type1'|'type2'|'level2'|'certified'...
  target_cert_date DATE
  activated_at TIMESTAMP NOT NULL DEFAULT NOW()
  deactivated_at TIMESTAMP
  UNIQUE (org_id, framework_id)
  INDEX (org_id)

org_scoping_answers:
  id UUID PK
  org_id UUID NOT NULL
  framework_id VARCHAR(50) FK frameworks(id)
  question_key VARCHAR(100) NOT NULL
  answer JSONB NOT NULL
  answered_by_user_id UUID NOT NULL
  answered_at TIMESTAMP NOT NULL DEFAULT NOW()
  UNIQUE (org_id, framework_id, question_key)

compliance_periods:
  id UUID PK
  org_id UUID NOT NULL
  framework_id VARCHAR(50) FK frameworks(id)
  period_name VARCHAR(100) NOT NULL
  period_type VARCHAR(30) NOT NULL            -- 'quarterly'|'annual'|'custom'
  starts_at TIMESTAMP NOT NULL
  ends_at TIMESTAMP NOT NULL
  target_cert_date DATE
  auditor_org_id UUID
  auditor_name VARCHAR(255)
  status VARCHAR(30) NOT NULL DEFAULT 'planning'
  cert_received_at TIMESTAMP
  cert_expiry_at TIMESTAMP
  cert_document_storage_id UUID
  notes TEXT
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (org_id, framework_id, status)

statement_of_applicability:
  id UUID PK
  org_id UUID NOT NULL
  framework_id VARCHAR(50) NOT NULL
  control_id VARCHAR(100) NOT NULL
  is_applicable BOOLEAN NOT NULL
  justification TEXT NOT NULL
  implementation_status VARCHAR(30)
  version INTEGER NOT NULL DEFAULT 1
  last_reviewed_at TIMESTAMP
  last_reviewed_by UUID
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  UNIQUE (org_id, framework_id, control_id)
```

#### gRPC Surface (19 RPCs)
ListFrameworks, GetFramework, ActivateFramework, DeactivateFramework, ListOrgFrameworks, GetScopingQuestions, SubmitScopingAnswers, GetScopingAnswers, GetControlsInScope, CreateCompliancePeriod, UpdateCompliancePeriod, GetCompliancePeriod, ListCompliancePeriods, GetComplianceScore, GetSoA, UpdateSoAEntry, ExportSoA, GetFrameworkDomains, Health.

#### Events Published
framework.activated, framework.deactivated, compliance_period.created, compliance_period.status_changed, compliance_period.certified, scoping.answers_submitted.

#### Events Consumed
org.created (auto-suggest frameworks based on industry), compliance_period.approaching (trigger notifications).

---

### compliance/control-service | Port 9101 | gRPC 50101

**Canonical ownership**: Control catalog (global), org control implementations, status history, cross-framework mappings, compliance scoring calculations.

#### Schema

```sql
-- Global catalog seeded from packages/control-library/
controls:
  id VARCHAR(100) PK                          -- 'ctrl_access_mfa_enforcement'
  name VARCHAR(255) NOT NULL
  description TEXT NOT NULL
  guidance TEXT
  domain VARCHAR(100) NOT NULL                -- 'access_control'|'change_management'|...
  category VARCHAR(50) NOT NULL               -- 'technical'|'administrative'|'physical'
  automation_level VARCHAR(30) NOT NULL       -- 'fully_automated'|'partially_automated'|'manual'
  risk_if_failed VARCHAR(20) NOT NULL
  typical_owner_role VARCHAR(50)
  typical_remediation_days INTEGER
  test_ids VARCHAR(100)[]
  evidence_types VARCHAR(50)[]
  tags VARCHAR(50)[]
  is_active BOOLEAN NOT NULL DEFAULT true
  created_at TIMESTAMP NOT NULL DEFAULT NOW()

framework_control_mappings:
  control_id VARCHAR(100) FK controls(id)
  framework_id VARCHAR(50) FK frameworks(id)
  clause VARCHAR(100) NOT NULL               -- 'CC6.1'|'A.8.3'|'164.312(a)(1)'
  clause_name VARCHAR(255)
  is_required BOOLEAN NOT NULL DEFAULT true
  PRIMARY KEY (control_id, framework_id, clause)
  INDEX (framework_id, clause)

org_controls:
  id UUID PK
  org_id UUID NOT NULL
  control_id VARCHAR(100) FK controls(id)
  status VARCHAR(30) NOT NULL DEFAULT 'not_started'
  implementation_notes TEXT
  owner_user_id UUID
  last_test_at TIMESTAMP
  last_test_result VARCHAR(20)
  passing_test_count INTEGER NOT NULL DEFAULT 0
  total_test_count INTEGER NOT NULL DEFAULT 0
  passing_evidence_count INTEGER NOT NULL DEFAULT 0
  required_evidence_count INTEGER NOT NULL DEFAULT 0
  risk_score DECIMAL(5,2)
  is_applicable BOOLEAN NOT NULL DEFAULT true
  na_reason TEXT
  excluded_reason TEXT
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  UNIQUE (org_id, control_id)
  INDEX (org_id, status)

control_status_history:
  id UUID PK
  org_id UUID NOT NULL
  control_id VARCHAR(100) NOT NULL
  from_status VARCHAR(30)
  to_status VARCHAR(30) NOT NULL
  changed_by VARCHAR(100)                    -- user_id or 'system'
  change_reason TEXT
  changed_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (org_id, control_id, changed_at DESC)
```

#### gRPC Surface (15 RPCs)
ListControls, GetControl, GetControlsByFramework, GetOrgControl, ListOrgControls, UpdateOrgControlStatus, AssignControlOwner, GetControlHistory, GetControlCrossMapping, BulkGetControlStatus, GetComplianceSummary, ListFailingControls, ListUnownedControls, GetControlGapAnalysis, ExportControlMatrix.

#### Events Published
control.status_changed, control.owner_assigned, control.implemented, control.failing, control.passed.

#### Events Consumed
test.result_recorded (update status + counts), evidence.accepted / evidence.expired (update evidence counts), scoping.answers_submitted (recalculate is_applicable), framework.activated (populate org_controls), org.member_removed (reassign orphaned controls).

---

### compliance/test-runner-service | Port 9102 | gRPC 50102

**Canonical ownership**: Test catalog, scheduling, BullMQ worker execution, result storage, automated evidence snapshot creation.

#### Schema

```sql
tests:
  id VARCHAR(100) PK                          -- 'test_aws_iam_mfa_enforced'
  name VARCHAR(255) NOT NULL
  description TEXT NOT NULL
  control_ids VARCHAR(100)[]
  connector_id VARCHAR(50) NOT NULL
  test_type VARCHAR(30) NOT NULL              -- 'automated'|'manual'|'mixed'
  cadence VARCHAR(30) NOT NULL                -- 'every_4h'|'daily'|'weekly'|'on_change'
  severity VARCHAR(20) NOT NULL
  remediation_steps JSONB NOT NULL
  remediation_link VARCHAR(500)
  estimated_fix_minutes INTEGER
  frameworks VARCHAR(50)[]
  is_active BOOLEAN NOT NULL DEFAULT true
  created_at TIMESTAMP NOT NULL DEFAULT NOW()

org_test_schedules:
  id UUID PK
  org_id UUID NOT NULL
  test_id VARCHAR(100) FK tests(id)
  connector_instance_id UUID NOT NULL
  is_enabled BOOLEAN NOT NULL DEFAULT true
  custom_cadence VARCHAR(30)
  next_run_at TIMESTAMP NOT NULL
  last_run_at TIMESTAMP
  UNIQUE (org_id, test_id, connector_instance_id)
  INDEX (next_run_at, is_enabled)

test_results:
  id UUID PK
  org_id UUID NOT NULL
  test_id VARCHAR(100) FK tests(id)
  connector_instance_id UUID NOT NULL
  result VARCHAR(20) NOT NULL                 -- 'pass'|'fail'|'warn'|'error'|'not_applicable'
  result_detail TEXT
  raw_data JSONB                              -- API response snapshot
  raw_data_hash VARCHAR(64)                  -- SHA-256 of raw_data (immutability)
  duration_ms INTEGER
  run_at TIMESTAMP NOT NULL DEFAULT NOW()
  expires_at TIMESTAMP NOT NULL              -- 90d for automated snapshots
  evidence_id UUID
  INDEX (org_id, test_id, run_at DESC)
  INDEX (org_id, result, run_at DESC)

test_jobs:
  id UUID PK
  org_id UUID NOT NULL
  test_id VARCHAR(100) NOT NULL
  connector_instance_id UUID NOT NULL
  bullmq_job_id VARCHAR(100)
  status VARCHAR(20) NOT NULL DEFAULT 'queued'
  attempts INTEGER NOT NULL DEFAULT 0
  queued_at TIMESTAMP NOT NULL DEFAULT NOW()
  started_at TIMESTAMP
  completed_at TIMESTAMP
  error_message TEXT
```

#### BullMQ Queue Architecture
- **test-critical** (priority 10): MFA, access control, encryption, public exposure — every 4h
- **test-standard** (priority 5): Configuration, logging, network tests — every 24h
- **test-slow** (priority 1): Comprehensive inventory, compliance scans — weekly
- **test-ondemand** (priority 8): User-triggered or webhook-triggered tests

#### gRPC Surface (16 RPCs)
ListTests, GetTest, GetTestsByControl, GetTestsByConnector, EnableTest, DisableTest, TriggerTest, TriggerAllTests, GetTestResult, GetTestResultHistory, ListFailingTests, GetTestCoverage, GetTestSchedule, GetTestJobStatus, ListTestResultsByControl, ExportTestResults.

#### Events Published
test.result_recorded, test.failed (PASS->FAIL transition only), test.passed (FAIL->PASS transition only), test.schedule_missed.

#### Events Consumed
integration.connected (schedule tests for new connector instance), integration.disconnected (disable tests), integration.sync_completed (trigger on-change tests).

---

### compliance/evidence-service | Port 9103 | gRPC 50103

**Canonical ownership**: Evidence lifecycle management, control linking, review workflow, immutability enforcement via SHA-256, expiry tracking.

#### Schema

```sql
evidence:
  id UUID PK
  org_id UUID NOT NULL
  evidence_type VARCHAR(50) NOT NULL
  title VARCHAR(255) NOT NULL
  description TEXT
  storage_id UUID
  external_url VARCHAR(1000)
  sha256_hash VARCHAR(64)                     -- SET ONCE on acceptance; never modified after
  file_size_bytes BIGINT
  content_type VARCHAR(100)
  status VARCHAR(30) NOT NULL DEFAULT 'pending_review'
    -- 'collected'|'pending_review'|'accepted'|'rejected'|'expired'|'archived'
  collection_method VARCHAR(30) NOT NULL
    -- 'automated'|'manual_upload'|'url_link'|'screen_capture'|'api'|'email'
  connector_id VARCHAR(50)
  connector_instance_id UUID
  test_result_id UUID
  uploaded_by_user_id UUID
  reviewed_by_user_id UUID
  review_notes TEXT
  accepted_at TIMESTAMP                       -- SET ONCE; never updated after acceptance
  rejected_at TIMESTAMP
  rejection_reason TEXT
  collected_at TIMESTAMP NOT NULL DEFAULT NOW()
  expires_at TIMESTAMP NOT NULL
  period_id UUID
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (org_id, status, expires_at)
  INDEX (org_id, evidence_type, collected_at DESC)

evidence_control_links:
  id UUID PK
  org_id UUID NOT NULL
  evidence_id UUID FK evidence(id) ON DELETE CASCADE
  control_id VARCHAR(100) NOT NULL
  framework_id VARCHAR(50)
  clause VARCHAR(100)
  linked_by_user_id UUID
  linked_at TIMESTAMP NOT NULL DEFAULT NOW()
  UNIQUE (org_id, evidence_id, control_id)
  INDEX (org_id, control_id)

evidence_requests:
  id UUID PK
  org_id UUID NOT NULL
  control_id VARCHAR(100) NOT NULL
  requested_by VARCHAR(100) NOT NULL          -- user_id or 'auditor:{invitation_id}'
  assigned_to_user_id UUID
  title VARCHAR(255) NOT NULL
  description TEXT NOT NULL
  evidence_type VARCHAR(50)
  due_date DATE
  status VARCHAR(30) NOT NULL DEFAULT 'open'
  fulfilled_evidence_id UUID FK evidence(id)
  notes TEXT
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (org_id, status, due_date)
```

#### gRPC Surface (17 RPCs)
SubmitEvidence, CreateAutomatedEvidence, GetEvidence, ListEvidenceByControl, ListEvidenceByPeriod, AcceptEvidence, RejectEvidence, LinkEvidenceToControl, UnlinkEvidenceFromControl, GetEvidenceCoverage, ListExpiringEvidence, ListPendingReview, CreateEvidenceRequest, FulfillEvidenceRequest, ListEvidenceRequests, VerifyEvidenceHash, ExportEvidencePackage.

#### Events Published
evidence.submitted, evidence.accepted (with SHA-256), evidence.rejected, evidence.expired, evidence.request_created, evidence.request_fulfilled.

#### Events Consumed
test.result_recorded (auto-create automated_snapshot evidence on PASS), storage.file_uploaded (link file to pending evidence), compliance_period.closed (archive all period evidence).

---

### compliance/policy-service | Port 9104 | gRPC 50104

**Canonical ownership**: 80+ policy templates (seeded), org policy instances, version history, approval workflow, acknowledgment tracking, AI-generated policy support.

#### Schema

```sql
policy_templates:
  id VARCHAR(100) PK
  name VARCHAR(255) NOT NULL
  category VARCHAR(100) NOT NULL
  description TEXT
  template_content TEXT NOT NULL              -- Markdown with {{variable}} placeholders
  variables JSONB NOT NULL
  framework_mappings JSONB NOT NULL
  last_reviewed_at DATE
  version VARCHAR(20) NOT NULL
  is_active BOOLEAN NOT NULL DEFAULT true

org_policies:
  id UUID PK
  org_id UUID NOT NULL
  template_id VARCHAR(100)
  name VARCHAR(255) NOT NULL
  category VARCHAR(100) NOT NULL
  content TEXT NOT NULL
  content_variables JSONB DEFAULT '{}'
  status VARCHAR(30) NOT NULL DEFAULT 'draft'
  version INTEGER NOT NULL DEFAULT 1
  effective_date DATE
  review_date DATE
  owner_user_id UUID
  approved_by_user_id UUID
  approved_at TIMESTAMP
  storage_id UUID
  framework_mappings JSONB DEFAULT '{}'
  ai_generated BOOLEAN NOT NULL DEFAULT false
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()

policy_versions:
  id UUID PK
  policy_id UUID FK org_policies(id)
  version INTEGER NOT NULL
  content TEXT NOT NULL
  changed_by_user_id UUID NOT NULL
  change_summary TEXT
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  UNIQUE (policy_id, version)

policy_acknowledgments:
  id UUID PK
  org_id UUID NOT NULL
  policy_id UUID FK org_policies(id)
  user_id UUID NOT NULL
  acknowledged_at TIMESTAMP NOT NULL DEFAULT NOW()
  policy_version INTEGER NOT NULL
  ip_hash VARCHAR(64)
  UNIQUE (policy_id, user_id, policy_version)
```

#### gRPC Surface
ListTemplates, GetTemplate, CreatePolicyFromTemplate, CreateCustomPolicy, GetPolicy, UpdatePolicy, PublishPolicy, ArchivePolicy, ListOrgPolicies, GetPolicyHistory, ExportPolicyPDF, GetPolicyAcknowledgments, RecordAcknowledgment, GeneratePolicyWithAI, ListPoliciesByFramework, GetPolicyCoverage.

#### Events Published
policy.created, policy.updated, policy.approved, policy.archived, policy.acknowledgment_recorded.

---

### compliance/risk-service | Port 9105 | gRPC 50105

**Canonical ownership**: Risk register, quantitative scoring (probability × impact), risk appetite, DPIA management.

#### Schema

```sql
risk_register:
  id UUID PK
  org_id UUID NOT NULL
  risk_category VARCHAR(100) NOT NULL
  title VARCHAR(255) NOT NULL
  description TEXT NOT NULL
  likelihood INTEGER NOT NULL                 -- 1-5
  impact INTEGER NOT NULL                     -- 1-5
  inherent_risk_score INTEGER NOT NULL        -- likelihood × impact = 1-25
  control_ids VARCHAR(100)[]
  control_effectiveness DECIMAL(5,2)          -- 0-1; derived from test pass rate
  residual_risk_score DECIMAL(5,2)            -- inherent × (1 - effectiveness)
  risk_rating VARCHAR(20) NOT NULL
  status VARCHAR(30) NOT NULL DEFAULT 'open'
  treatment VARCHAR(30)                       -- 'mitigate'|'accept'|'transfer'|'avoid'
  owner_user_id UUID
  due_date DATE
  exceeds_appetite BOOLEAN NOT NULL DEFAULT false
  frameworks VARCHAR(50)[]
  notes TEXT
  created_by_user_id UUID NOT NULL
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (org_id, risk_rating, status)

risk_appetite:
  org_id UUID PK
  max_acceptable_inherent_score INTEGER NOT NULL DEFAULT 12
  max_acceptable_residual_score INTEGER NOT NULL DEFAULT 6
  risk_tolerance_notes TEXT
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()

dpia_records:
  id UUID PK
  org_id UUID NOT NULL
  processing_activity VARCHAR(255) NOT NULL
  description TEXT NOT NULL
  legal_basis VARCHAR(100)
  data_categories VARCHAR(100)[]
  data_subjects VARCHAR(100)[]
  recipients VARCHAR(255)[]
  transfers JSONB
  retention_period VARCHAR(100)
  risk_level VARCHAR(20) NOT NULL
  dpia_required BOOLEAN NOT NULL
  dpia_completed BOOLEAN NOT NULL DEFAULT false
  dpa_consulted BOOLEAN NOT NULL DEFAULT false
  measures_taken TEXT
  created_by_user_id UUID NOT NULL
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
```

#### gRPC Surface
CreateRisk, UpdateRisk, GetRisk, ListRisks, AcceptRisk, CloseRisk, GetRiskAppetite, UpdateRiskAppetite, GetRisksExceedingAppetite, GetRiskTrend, CreateDPIA, UpdateDPIA, ListDPIAs, ExportRiskRegister, GetRiskHeatmap.

#### Events Published
risk.created, risk.status_changed, risk.exceeds_appetite, risk.score_updated.

#### Events Consumed
test.failed (recalculate control_effectiveness → residual score), control.status_changed (recalculate residual), scoping.answers_submitted (flag mandatory DPIAs for GDPR/LGPD scope).

---

### compliance/assessment-service | Port 9106 | gRPC 50106

**Canonical ownership**: Assessment checklists, readiness scoring, POA&M generation (FedRAMP/FISMA), OSCAL export.

#### Schema

```sql
assessment_checklists:
  id UUID PK
  org_id UUID NOT NULL
  period_id UUID FK compliance_periods(id)
  framework_id VARCHAR(50) NOT NULL
  name VARCHAR(255) NOT NULL
  total_items INTEGER NOT NULL DEFAULT 0
  completed_items INTEGER NOT NULL DEFAULT 0
  status VARCHAR(30) NOT NULL DEFAULT 'not_started'
  created_at TIMESTAMP NOT NULL DEFAULT NOW()

checklist_items:
  id UUID PK
  checklist_id UUID FK assessment_checklists(id)
  item_type VARCHAR(30) NOT NULL              -- 'control'|'evidence'|'policy'|'custom'
  reference_id VARCHAR(255)
  title VARCHAR(500) NOT NULL
  description TEXT
  status VARCHAR(20) NOT NULL DEFAULT 'not_started'
  assigned_to_user_id UUID
  due_date DATE
  notes TEXT
  sort_order INTEGER NOT NULL DEFAULT 0
  completed_at TIMESTAMP

poam_entries:
  id UUID PK
  org_id UUID NOT NULL
  framework_id VARCHAR(50) NOT NULL
  control_id VARCHAR(100) NOT NULL
  weakness_description TEXT NOT NULL
  responsible_entity VARCHAR(255) NOT NULL
  resources_required TEXT
  milestones JSONB NOT NULL
  scheduled_completion_date DATE NOT NULL
  actual_completion_date DATE
  status VARCHAR(30) NOT NULL DEFAULT 'open'
  risk_rating VARCHAR(20) NOT NULL
  detection_method VARCHAR(100)
  notes TEXT
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()

readiness_scores:
  id UUID PK
  org_id UUID NOT NULL
  framework_id VARCHAR(50) NOT NULL
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW()
  overall_score DECIMAL(5,2) NOT NULL
  controls_score DECIMAL(5,2)
  evidence_score DECIMAL(5,2)
  policy_score DECIMAL(5,2)
  people_score DECIMAL(5,2)
  breakdown JSONB NOT NULL
  INDEX (org_id, framework_id, calculated_at DESC)
```

#### gRPC Surface
CreateChecklist, GetChecklist, UpdateChecklistItem, GetReadinessScore, GeneratePOAM, UpdatePOAMEntry, ExportPOAM, ExportOSCAL_SSP, GetAssessmentTimeline, ListAuditReadinessIssues.

---

### compliance/remediation-service | Port 9107 | gRPC 50107

**Canonical ownership**: Remediation task lifecycle, external ticket sync (Jira/Linear/GitHub/Asana), SLA tracking, auto-close when test passes.

#### Schema

```sql
remediation_tasks:
  id UUID PK
  org_id UUID NOT NULL
  title VARCHAR(500) NOT NULL
  description TEXT NOT NULL
  source_type VARCHAR(30) NOT NULL            -- 'test_failure'|'control_gap'|'risk'|'audit_finding'|'manual'
  source_id VARCHAR(255)
  control_id VARCHAR(100)
  framework_id VARCHAR(50)
  severity VARCHAR(20) NOT NULL
  status VARCHAR(30) NOT NULL DEFAULT 'open'
    -- 'open'|'in_progress'|'blocked'|'resolved'|'accepted_risk'|'wont_fix'
  assigned_to_user_id UUID
  due_at TIMESTAMP                            -- calculated from severity SLA
  sla_breached BOOLEAN NOT NULL DEFAULT false
  resolved_at TIMESTAMP
  external_ticket_id VARCHAR(255)
  external_ticket_url VARCHAR(500)
  external_system VARCHAR(30)                 -- 'jira'|'linear'|'github'|'asana'
  external_sync_at TIMESTAMP
  created_by VARCHAR(100) NOT NULL
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (org_id, status, severity, due_at)
  INDEX (org_id, control_id, status)

remediation_comments:
  id UUID PK
  task_id UUID FK remediation_tasks(id)
  author_user_id UUID NOT NULL
  content TEXT NOT NULL
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
```

#### gRPC Surface
CreateTask, UpdateTask, AssignTask, ResolveTask, MarkAcceptedRisk, ListTasks, GetTask, GetSLAStatus, SyncExternalTicket, CreateExternalTicket, ListBreachedSLAs, GetRemediationTrend, BulkAssignTasks.

#### Events Published
remediation.task_created, remediation.task_assigned, remediation.task_resolved, remediation.sla_breached.

#### Events Consumed
test.failed (auto-create task if no open task exists for this test+org), control.failing (auto-create gap task), risk.exceeds_appetite (auto-create risk task), test.passed (auto-resolve linked open tasks for that test).

---

## Part VII: Layer 3 — Integration Engine (10 Services)

---

### integration/connector-registry | Port 9200 | gRPC 50200

**Canonical ownership**: Connector catalog, org connector instances, health monitoring, KMS-encrypted credential storage.

#### Schema

```sql
connectors:
  id VARCHAR(50) PK                           -- 'aws'|'github'|'okta'
  name VARCHAR(255) NOT NULL
  vendor VARCHAR(255) NOT NULL
  category VARCHAR(50) NOT NULL               -- 'cloud'|'identity'|'code'|'hr'|'mdm'|'security'|...
  auth_type VARCHAR(30) NOT NULL
  description TEXT
  logo_url VARCHAR(500)
  docs_url VARCHAR(500)
  permissions_required JSONB
  test_ids_provided VARCHAR(100)[]
  webhook_events_supported VARCHAR(100)[]
  version VARCHAR(20) NOT NULL DEFAULT '1.0.0'
  is_active BOOLEAN NOT NULL DEFAULT true
  created_at TIMESTAMP NOT NULL DEFAULT NOW()

connector_instances:
  id UUID PK
  org_id UUID NOT NULL
  connector_id VARCHAR(50) FK connectors(id)
  name VARCHAR(255) NOT NULL                  -- 'Production AWS'|'Staging GitHub'
  credentials_enc BYTEA NOT NULL              -- KMS-encrypted; never returned in API
  auth_type VARCHAR(30) NOT NULL
  auth_metadata JSONB DEFAULT '{}'            -- non-secret: region, base_url, account_id
  status VARCHAR(30) NOT NULL DEFAULT 'active'
    -- 'active'|'disconnected'|'auth_error'|'suspended'
  last_sync_at TIMESTAMP
  last_sync_status VARCHAR(20)
  last_sync_error TEXT
  last_health_check_at TIMESTAMP
  next_sync_at TIMESTAMP
  sync_frequency VARCHAR(30) DEFAULT 'daily'
  webhook_secret_enc BYTEA                    -- KMS-encrypted HMAC secret
  created_by_user_id UUID NOT NULL
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (org_id, connector_id)
  INDEX (org_id, status)

connector_sync_logs:
  id UUID PK
  instance_id UUID FK connector_instances(id)
  org_id UUID NOT NULL
  sync_type VARCHAR(30) NOT NULL              -- 'full'|'incremental'|'webhook'|'on_demand'
  started_at TIMESTAMP NOT NULL
  completed_at TIMESTAMP
  status VARCHAR(20) NOT NULL
  records_fetched INTEGER DEFAULT 0
  tests_triggered INTEGER DEFAULT 0
  error_message TEXT
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (instance_id, started_at DESC)
```

#### gRPC Surface (20 RPCs)
ListConnectors, GetConnector, ListOrgConnectors, GetConnectorInstance, CreateConnectorInstance, UpdateConnectorInstance, DeleteConnectorInstance, TestConnectorHealth, RefreshCredentials, TriggerSync, GetSyncStatus, ListSyncLogs, GetConnectorTestIds, UpdateConnectorStatus, ListConnectorsByCategory, GetConnectorOAuthURL, HandleOAuthCallback, RotateWebhookSecret, GetConnectorMetrics, Health.

#### Events Published
integration.connected, integration.disconnected, integration.auth_error, integration.sync_completed, integration.sync_failed.

---

### integration/oauth-service | Port 9201 | gRPC 50201

**Canonical ownership**: OAuth 2.0 flows for all OAuth-based connectors. PKCE, state management, token storage and refresh.

#### Schema

```sql
oauth_states:
  id UUID PK
  org_id UUID NOT NULL
  connector_id VARCHAR(50) NOT NULL
  state_token VARCHAR(100) UNIQUE NOT NULL
  code_verifier VARCHAR(128)                  -- PKCE code verifier
  redirect_uri VARCHAR(500) NOT NULL
  metadata JSONB DEFAULT '{}'
  expires_at TIMESTAMP NOT NULL               -- 10min TTL
  created_at TIMESTAMP NOT NULL DEFAULT NOW()

oauth_tokens:
  id UUID PK
  instance_id UUID FK connector_instances(id) UNIQUE
  org_id UUID NOT NULL
  access_token_enc BYTEA NOT NULL             -- KMS-encrypted
  refresh_token_enc BYTEA                     -- KMS-encrypted
  token_type VARCHAR(50) NOT NULL DEFAULT 'Bearer'
  scopes VARCHAR(100)[]
  expires_at TIMESTAMP
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
```

#### gRPC Surface
InitiateOAuthFlow, HandleOAuthCallback, RefreshAccessToken, RevokeOAuthToken, GetTokenStatus, ListExpiredTokens.

---

### integration/sync-engine | Port 9202 | gRPC 50202

**Canonical ownership**: Orchestrates all data sync across connector instances. Schedules pull-based syncs via BullMQ, routes webhooks, manages incremental sync cursors, deduplicates concurrent sync requests.

#### Schema

```sql
sync_state:
  id UUID PK
  instance_id UUID FK connector_instances(id) UNIQUE
  org_id UUID NOT NULL
  last_full_sync_at TIMESTAMP
  last_incremental_sync_cursor JSONB          -- connector-specific cursor (since timestamp, page token, etc.)
  sync_metadata JSONB DEFAULT '{}'
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()

sync_queue:
  id UUID PK
  instance_id UUID NOT NULL
  org_id UUID NOT NULL
  sync_type VARCHAR(30) NOT NULL
  priority INTEGER NOT NULL DEFAULT 5
  payload JSONB DEFAULT '{}'
  status VARCHAR(20) NOT NULL DEFAULT 'queued'
  scheduled_at TIMESTAMP NOT NULL DEFAULT NOW()
  started_at TIMESTAMP
  completed_at TIMESTAMP
  bullmq_job_id VARCHAR(100)
  INDEX (status, scheduled_at, priority DESC)
```

#### gRPC Surface
ScheduleSync, TriggerImmediateSync, GetSyncState, ResetSyncState, GetSyncQueue, CancelPendingSync.

---

### integration/cloud-connectors | Port 9203 | gRPC 50203

**Canonical ownership**: Stateless test execution and data sync for all cloud infrastructure connectors (AWS, GCP, Azure, Cloudflare, DigitalOcean, OCI, IBM Cloud).

Receives BullMQ jobs from test-runner-service. Makes read-only API calls to cloud providers. Returns structured TestResult. Does not persist data — delegates to test-runner-service and evidence-service.

**Key tests executed**:
- test_aws_iam_mfa_enforced — all IAM console users have MFA
- test_aws_s3_no_public_buckets — no S3 bucket allows public access
- test_aws_cloudtrail_all_regions — CloudTrail enabled in all regions
- test_aws_guardduty_enabled — GuardDuty active in all regions
- test_aws_root_no_access_keys — root account has no active access keys
- test_aws_security_hub_enabled — Security Hub active
- test_aws_vpc_flow_logs — VPC flow logs enabled
- test_gcp_iam_no_default_service_accounts — default service accounts disabled
- test_gcp_cloud_logging_enabled — Cloud Logging active for all projects
- test_azure_mfa_conditional_access — MFA via Conditional Access policy
- test_azure_defender_enabled — Defender for Cloud enabled on all subscriptions
- test_cloudflare_min_tls_1_2 — Minimum TLS 1.2 enforced on all zones
- test_cloudflare_dnssec_enabled — DNSSEC enabled

**gRPC**: RunCloudTest, SyncCloudData, GetCloudInventory, HealthCheck.

---

### integration/identity-connectors | Port 9204 | gRPC 50204

**Canonical ownership**: Tests and syncs for all identity/IAM/directory connectors.

**Key tests executed**:
- test_okta_mfa_enforced_all_users
- test_okta_inactive_accounts (no login in >90 days)
- test_okta_admin_count (flags excessive admin accounts)
- test_entra_pim_enabled (Privileged Identity Management)
- test_entra_conditional_access_requires_mfa
- test_google_workspace_2fa_enforced
- test_google_workspace_oauth_app_restrictions
- test_terminated_user_cross_reference (multi-connector: HR vs IdP)

**gRPC**: RunIdentityTest, SyncIdentityData, GetUserInventory, GetGroupInventory, GetAdminAccounts, CrossReferenceTerminatedUsers, HealthCheck.

---

### integration/code-connectors | Port 9205 | gRPC 50205

**Canonical ownership**: Tests and syncs for version control, CI/CD, and code security connectors.

**Key tests executed**:
- test_github_branch_protection_default_branch
- test_github_required_pr_reviews (≥1 reviewer required)
- test_github_secret_scanning_enabled (all active repos)
- test_github_code_scanning_enabled (all active repos)
- test_github_dependency_alerts_enabled
- test_github_actions_permissions (restrict to approved actions)
- test_gitlab_protected_branch_merge_requests
- test_snyk_no_critical_vulns_open_gt_30d
- test_sonarqube_security_quality_gate

**gRPC**: RunCodeTest, SyncCodeData, GetRepositoryInventory, GetBranchProtectionStatus, GetSecurityScanStatus, HealthCheck.

---

### integration/hr-connectors | Port 9206 | gRPC 50206

**Canonical ownership**: Tests and syncs for HR/people systems. Primary data: employee roster, employment status, training completion, background check status.

**Key tests executed**:
- test_hr_offboarding_timeliness (accounts disabled within N days of termination)
- test_hr_background_checks_all_employees (100% completion)
- test_hr_security_training_annual (≥95% completion within past 365 days)
- test_hr_access_review_completed (periodic access reviews documented)

**gRPC**: RunHRTest, SyncHRData, GetEmployeeRoster, GetTerminatedEmployees, GetTrainingCompletion, CrossReferenceIdentitySystems, HealthCheck.

---

### integration/mdm-connectors | Port 9207 | gRPC 50207

**Canonical ownership**: Tests and syncs for MDM and endpoint security connectors.

**Key tests executed**:
- test_mdm_disk_encryption_all_devices (100% FileVault macOS / BitLocker Windows)
- test_mdm_os_patch_current (no device >30 days behind latest security patch)
- test_mdm_screen_lock_enforced (≤5 min idle timeout)
- test_mdm_antivirus_active (AV/EDR running on all devices)
- test_mdm_enrollment_100pct (all org devices enrolled in MDM)
- test_endpoint_edr_all_devices (CrowdStrike/SentinelOne/Defender on all)
- test_mdm_local_admin_disabled (no unauthorized local admin accounts)

**gRPC**: RunMDMTest, SyncMDMData, GetDeviceInventory, GetEncryptionStatus, GetPatchComplianceStatus, GetEDRCoverage, HealthCheck.

---

### integration/security-connectors | Port 9208 | gRPC 50208

**Canonical ownership**: Tests and syncs for SIEM, CSPM, vulnerability scanners, bug bounty platforms, security training.

**Key tests executed**:
- test_wiz_no_critical_cloud_issues_open
- test_crowdstrike_prevention_policy_active
- test_tenable_no_critical_vulns_unpatched_30d
- test_aws_security_hub_no_critical_findings
- test_knowbe4_training_completion_gte_95pct
- test_knowbe4_phishing_click_rate_lte_5pct
- test_hackerone_p1_response_within_24h
- test_pagerduty_oncall_schedule_exists (24/7 coverage)
- test_siem_logging_enabled (at least one SIEM connected and active)

**gRPC**: RunSecurityTest, SyncSecurityData, GetVulnerabilityFindings, GetSIEMAlertStatus, GetTrainingMetrics, GetBugBountyStatus, HealthCheck.

---

### integration/webhook-ingestion | Port 9209 | gRPC 50209

**Canonical ownership**: Receives inbound webhooks from all integrated systems. Validates HMAC signatures. Routes to appropriate connector service. Triggers immediate tests for event-relevant test cases.

**HTTP endpoint**: POST /webhooks/{connector_id}/{instance_id} (public URL, HMAC-verified)

#### Schema

```sql
webhook_events:
  id UUID PK
  connector_id VARCHAR(50) NOT NULL
  instance_id UUID NOT NULL
  org_id UUID NOT NULL
  event_type VARCHAR(100) NOT NULL            -- 'github.push'|'okta.user.deactivated'
  headers JSONB NOT NULL
  payload JSONB NOT NULL
  signature_verified BOOLEAN NOT NULL
  processing_status VARCHAR(20) NOT NULL DEFAULT 'pending'
  processed_at TIMESTAMP
  triggered_tests VARCHAR(100)[]
  error_message TEXT
  received_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (instance_id, received_at DESC)
  INDEX (org_id, connector_id, received_at DESC)
```

**Webhook routing examples**:
- github.push to main/master → trigger test_github_branch_protection tests
- github.push with secret scanning alert → trigger test_github_secret_scanning + immediate alert
- okta.user.deactivated → trigger terminated user cross-reference tests
- aws.guardduty.finding (severity ≥ HIGH) → trigger test + emit alert immediately
- crowdstrike.detection.new (severity CRITICAL) → trigger test + emit immediate alert
- wiz.issue.new (severity CRITICAL) → trigger test + emit alert

**gRPC**: ProcessWebhook (internal), GetWebhookEvent, ListWebhookEvents, RetryWebhookEvent.

---

## Part VIII: Layer 4 — Trust & Collaboration (5 Services)

---

### trust/trust-center-service | Port 9300 | gRPC 50300

**Canonical ownership**: Public trust center pages, NDA management, gated document access, visitor analytics.

#### Schema

```sql
trust_center_configs:
  org_id UUID PK
  slug VARCHAR(100) UNIQUE NOT NULL           -- trust.roadwarden.io/{slug}
  is_published BOOLEAN NOT NULL DEFAULT false
  custom_domain VARCHAR(255)
  custom_css TEXT
  logo_storage_id UUID
  primary_color VARCHAR(7)
  tagline VARCHAR(255)
  description TEXT
  visible_sections JSONB NOT NULL DEFAULT '{}'
  require_nda_for JSONB DEFAULT '{}'          -- sections that require NDA
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()

trust_center_documents:
  id UUID PK
  org_id UUID NOT NULL
  document_type VARCHAR(50) NOT NULL
    -- 'soc2_report'|'iso_cert'|'pentest_summary'|'subprocessor_list'
    -- |'privacy_policy'|'security_policy'|'dpa'|'data_map'|'custom'
  title VARCHAR(255) NOT NULL
  description TEXT
  storage_id UUID
  external_url VARCHAR(1000)
  requires_nda BOOLEAN NOT NULL DEFAULT false
  is_published BOOLEAN NOT NULL DEFAULT true
  valid_from DATE
  valid_until DATE
  sort_order INTEGER NOT NULL DEFAULT 0
  created_at TIMESTAMP NOT NULL DEFAULT NOW()

trust_center_nda_gates:
  id UUID PK
  org_id UUID NOT NULL
  visitor_email VARCHAR(255) NOT NULL
  visitor_company VARCHAR(255)
  nda_version VARCHAR(20) NOT NULL
  signed_at TIMESTAMP NOT NULL DEFAULT NOW()
  access_expires_at TIMESTAMP NOT NULL        -- 90d default
  ip_hash VARCHAR(64)
  INDEX (org_id, visitor_email)

trust_center_visitors:
  id UUID PK
  org_id UUID NOT NULL
  visitor_email VARCHAR(255)
  nda_id UUID FK trust_center_nda_gates(id)
  page_viewed VARCHAR(255) NOT NULL
  document_downloaded UUID
  ip_hash VARCHAR(64)
  visited_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (org_id, visited_at DESC)
```

#### gRPC Surface
GetTrustCenterConfig, UpdateTrustCenterConfig, PublishTrustCenter, UnpublishTrustCenter, ListTrustDocuments, AddTrustDocument, RemoveTrustDocument, GetPublicTrustPage (unauthenticated), RequestNDAAccess, VerifyNDASignature, GetNDAVisitorAccess, ListVisitors, GetVisitorAnalytics, GetFrameworkBadges.

#### Events Consumed
compliance_period.certified (auto-update framework badge), test.failed (if score drops below threshold, notify trust center subscribers).

---

### trust/questionnaire-service | Port 9301 | gRPC 50301

**Canonical ownership**: Incoming security questionnaire management, question extraction, AI auto-fill coordination, review workflow, export.

#### Schema

```sql
questionnaires:
  id UUID PK
  org_id UUID NOT NULL
  title VARCHAR(255) NOT NULL
  questionnaire_type VARCHAR(50) NOT NULL     -- 'vsaq'|'sig_lite'|'sig_core'|'caiq'|'custom'
  source_company VARCHAR(255)
  status VARCHAR(30) NOT NULL DEFAULT 'draft'
    -- 'draft'|'in_progress'|'ai_processed'|'in_review'|'completed'|'sent'
  due_date DATE
  original_file_storage_id UUID
  completed_file_storage_id UUID
  assigned_to_user_id UUID
  ai_processed BOOLEAN NOT NULL DEFAULT false
  ai_fill_rate DECIMAL(5,2)                  -- % auto-filled by AI
  created_at TIMESTAMP NOT NULL DEFAULT NOW()

questionnaire_questions:
  id UUID PK
  questionnaire_id UUID FK questionnaires(id)
  question_number VARCHAR(20)
  section VARCHAR(255)
  question_text TEXT NOT NULL
  question_type VARCHAR(30) NOT NULL
  options JSONB
  matched_control_id VARCHAR(100)            -- auto-matched from control library
  matched_confidence DECIMAL(5,2)            -- AI confidence 0-1
  draft_answer TEXT
  final_answer TEXT
  answer_evidence_ids UUID[]
  answer_status VARCHAR(20) NOT NULL DEFAULT 'unanswered'
    -- 'unanswered'|'ai_drafted'|'human_reviewed'|'approved'
  answered_by_user_id UUID
  sort_order INTEGER NOT NULL DEFAULT 0
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
```

#### gRPC Surface
CreateQuestionnaire, GetQuestionnaire, ListQuestionnaires, UploadQuestionnaire, ProcessQuestionnaireWithAI, GetQuestions, UpdateAnswer, ApproveAnswer, ApproveAllAnswers, ExportQuestionnaire, GetAIFillStatus, ListUnansweredQuestions, GetQuestionnaireMetrics.

---

### trust/vendor-risk-service | Port 9302 | gRPC 50302

**Canonical ownership**: Vendor registry, risk tiering, 2-track assessment (auto + manual), continuous score monitoring, sub-processor list management.

#### Schema

```sql
vendors:
  id UUID PK
  org_id UUID NOT NULL
  name VARCHAR(255) NOT NULL
  website VARCHAR(500)
  category VARCHAR(100)
  risk_tier VARCHAR(20) NOT NULL DEFAULT 'medium'    -- 'critical'|'high'|'medium'|'low'
  data_access VARCHAR(50)[]                           -- 'personal_data'|'financial_data'|'source_code'
  system_access VARCHAR(50)[]                         -- 'production'|'staging'|'employee_devices'
  sub_processor_for VARCHAR(50)[]                     -- framework IDs (GDPR, UK GDPR, LGPD)
  is_active BOOLEAN NOT NULL DEFAULT true
  created_by_user_id UUID NOT NULL
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (org_id, risk_tier, is_active)

vendor_assessments:
  id UUID PK
  vendor_id UUID FK vendors(id)
  org_id UUID NOT NULL
  assessment_type VARCHAR(30) NOT NULL               -- 'auto_scored'|'questionnaire'|'document_review'
  status VARCHAR(30) NOT NULL DEFAULT 'pending'
  security_score DECIMAL(5,2)                        -- 0-100 from SecurityScorecard
  risk_rating VARCHAR(20)
  questionnaire_id UUID FK questionnaires(id)
  soc2_report_storage_id UUID
  iso_cert_storage_id UUID
  pentest_report_storage_id UUID
  notes TEXT
  due_date DATE
  completed_at TIMESTAMP
  next_assessment_due DATE
  created_at TIMESTAMP NOT NULL DEFAULT NOW()

vendor_score_history:
  id UUID PK
  vendor_id UUID NOT NULL
  org_id UUID NOT NULL
  score DECIMAL(5,2) NOT NULL
  score_source VARCHAR(30) NOT NULL                  -- 'security_scorecard'|'bitsight'|'manual'
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (vendor_id, recorded_at DESC)
```

**Assessment cadence by tier**: Critical = quarterly, High = semi-annually, Medium = annually, Low = annually.

#### gRPC Surface
CreateVendor, UpdateVendor, DeleteVendor, ListVendors, GetVendor, CreateAssessment, UpdateAssessment, CompleteAssessment, GetAssessmentHistory, SendVendorQuestionnaire, GetVendorSecurityScore, GetVendorScoreHistory, ListOverdueAssessments, GetVendorRiskSummary, ExportVendorRegister.

#### Events Published
vendor.created, vendor.risk_tier_changed, vendor.assessment_completed, vendor.score_dropped (>10 points on critical/high vendor), vendor.assessment_overdue.

---

### trust/auditor-service | Port 9303 | gRPC 50303

**Canonical ownership**: Auditor workspace — time-limited invitations, dedicated read-only access, evidence download audit log, bi-directional comment threads.

#### Schema

```sql
auditor_invitations:
  id UUID PK
  org_id UUID NOT NULL
  period_id UUID FK compliance_periods(id)
  auditor_email VARCHAR(255) NOT NULL
  auditor_name VARCHAR(255)
  auditor_company VARCHAR(255)
  access_level VARCHAR(30) NOT NULL DEFAULT 'standard'
  token_hash VARCHAR(64) UNIQUE NOT NULL
  access_duration_days INTEGER NOT NULL DEFAULT 90
  expires_at TIMESTAMP NOT NULL
  accepted_at TIMESTAMP
  revoked_at TIMESTAMP
  invited_by_user_id UUID NOT NULL
  created_at TIMESTAMP NOT NULL DEFAULT NOW()

auditor_sessions:
  id UUID PK
  invitation_id UUID FK auditor_invitations(id)
  session_token_hash VARCHAR(64) UNIQUE NOT NULL
  ip_hash VARCHAR(64)
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  last_active_at TIMESTAMP NOT NULL DEFAULT NOW()
  expires_at TIMESTAMP NOT NULL               -- max 4h; MFA required per session

auditor_downloads:
  id UUID PK
  invitation_id UUID FK auditor_invitations(id)
  evidence_id UUID NOT NULL
  evidence_title VARCHAR(255)
  downloaded_at TIMESTAMP NOT NULL DEFAULT NOW()
  ip_hash VARCHAR(64)
  INDEX (invitation_id, downloaded_at DESC)

auditor_comments:
  id UUID PK
  org_id UUID NOT NULL
  invitation_id UUID NOT NULL
  thread_type VARCHAR(30) NOT NULL            -- 'control'|'evidence'|'period'
  thread_id VARCHAR(255) NOT NULL
  parent_comment_id UUID
  content TEXT NOT NULL
  author_type VARCHAR(20) NOT NULL            -- 'auditor'|'member'
  author_id VARCHAR(255) NOT NULL
  author_name VARCHAR(255) NOT NULL
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (org_id, thread_type, thread_id, created_at)
```

#### gRPC Surface
InviteAuditor, GetAuditorInvitation, RevokeAuditorAccess, ListAuditorInvitations, CreateAuditorSession, ValidateAuditorSession, ListAuditorDownloads, AddAuditorComment, ListAuditorComments, ReplyToAuditorComment, CreateAuditorEvidenceRequest, ListAuditorEvidenceRequests, GetAuditorDashboard.

---

### trust/report-service | Port 9304 | gRPC 50304

**Canonical ownership**: All compliance report generation — board-level summaries, framework status, evidence packages, gap analyses, OSCAL exports.

#### Schema

```sql
report_templates:
  id VARCHAR(50) PK
  name VARCHAR(255) NOT NULL
  report_type VARCHAR(50) NOT NULL
    -- 'board_summary'|'framework_status'|'evidence_package'|'gap_analysis'
    -- |'soc2_prep'|'iso_prep'|'poam'|'risk_register'
  description TEXT
  is_active BOOLEAN NOT NULL DEFAULT true

generated_reports:
  id UUID PK
  org_id UUID NOT NULL
  template_id VARCHAR(50) FK report_templates(id)
  title VARCHAR(255) NOT NULL
  parameters JSONB NOT NULL
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
  storage_id UUID
  generated_at TIMESTAMP
  generated_by_user_id UUID NOT NULL
  expires_at TIMESTAMP NOT NULL               -- 30d
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (org_id, created_at DESC)
```

#### gRPC Surface
ListReportTemplates, GenerateReport, GetReport, ListGeneratedReports, ExportSOC2Prep, ExportISO27001Prep, ExportGapAnalysis, ExportBoardSummary, ExportEvidencePackage, GeneratePOAM, GetReportStatus.

---

## Part IX: Layer 5 — Intelligence (4 Services)

---

### intelligence/ai-agent-service | Port 9400 | gRPC 50400

**Canonical ownership**: All AI-assisted workflows. Policy Drafter, Questionnaire Auto-Fill, Control Mapper, Risk Advisor. Anti-hallucination enforcement. Citation generation. AI interaction logging.

#### Schema

```sql
ai_interactions:
  id UUID PK
  org_id UUID NOT NULL
  user_id UUID
  agent_mode VARCHAR(30) NOT NULL             -- 'policy_drafter'|'questionnaire_filler'|'control_mapper'|'risk_advisor'
  model_used VARCHAR(50) NOT NULL             -- 'gpt-4o'|'claude-3-5-sonnet'
  prompt_tokens INTEGER
  completion_tokens INTEGER
  input_context JSONB NOT NULL
  output JSONB NOT NULL
  citations JSONB NOT NULL                    -- [{framework, clause, text, url}, ...]
  confidence_score DECIMAL(3,2)              -- 0-1
  requires_human_review BOOLEAN NOT NULL
  human_approved BOOLEAN
  human_approved_by UUID
  human_approved_at TIMESTAMP
  processing_ms INTEGER
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (org_id, agent_mode, created_at DESC)

ai_policy_drafts:
  id UUID PK
  interaction_id UUID FK ai_interactions(id)
  org_id UUID NOT NULL
  policy_template_id VARCHAR(100)
  policy_category VARCHAR(100) NOT NULL
  draft_content TEXT NOT NULL
  variables_used JSONB
  framework_mappings JSONB
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
  accepted_policy_id UUID
  created_at TIMESTAMP NOT NULL DEFAULT NOW()

ai_questionnaire_fills:
  id UUID PK
  interaction_id UUID FK ai_interactions(id)
  questionnaire_id UUID NOT NULL
  questions_processed INTEGER NOT NULL
  questions_answered INTEGER NOT NULL
  fill_rate DECIMAL(5,2) NOT NULL
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
```

#### AI Agent Mode Specifications

**Mode 1: Policy Drafter**
- Model: GPT-4o (superior long-form generation)
- Input: policy category, org context (industry, size, tech stack, active frameworks)
- Process: Select template → fill variables → customize to org context → add framework citations
- Anti-hallucination: Every requirement cited to specific framework clause; no invented requirements
- Output: Full Markdown policy + citation array + confidence score
- Human gate: Draft saved to ai_policy_drafts; must be approved by user before creating org_policy

**Mode 2: Questionnaire Auto-Fill**
- Model: GPT-4o (semantic understanding)
- Input: Questionnaire questions (extracted text)
- Process: For each question → semantic similarity against control library → retrieve matching control + latest accepted evidence → draft answer with citations
- Auto-fill threshold: Confidence ≥ 0.7 = auto-draft; < 0.7 = flagged for human
- Anti-hallucination: Answers grounded only in actual evidence; never fabricate compliance status
- Output: Per-question draft answer + control_id citation + evidence_id citation

**Mode 3: Control Mapper**
- Model: Claude 3.5 Sonnet (superior analytical reasoning)
- Input: New framework clause or custom control text
- Process: Parse requirements → match against existing control library → identify coverage gaps → suggest evidence types
- Anti-hallucination: All suggestions reference actual control library text
- Output: Existing controls satisfying the clause + confidence + gap list + recommendations

**Mode 4: Risk Advisor**
- Model: Claude 3.5 Sonnet
- Input: Risk description + control effectiveness data
- Process: Analyze risk → identify relevant controls → assess coverage → suggest treatment options with effort/impact tradeoffs
- Anti-hallucination: All recommendations cite specific control or framework clause
- Output: Treatment recommendations + citations + estimated effort + risk reduction estimate

#### gRPC Surface
DraftPolicy, GetPolicyDraft, ApprovePolicyDraft, ProcessQuestionnaire, GetQuestionnaireFilledAnswers, MapControlToFramework, AnalyzeRisk, GetAIInteraction, ListAIInteractions, GetAIUsageMetrics.

#### Events Published
ai_agent.policy_drafted, ai_agent.questionnaire_processed, ai_agent.control_mapped.

---

### intelligence/monitor-service | Port 9401 | gRPC 50401

**Canonical ownership**: Continuous compliance monitoring — daily snapshots, trend detection, regression alerts, proactive insights surface.

#### Schema

```sql
compliance_snapshots:
  id UUID PK
  org_id UUID NOT NULL
  framework_id VARCHAR(50) NOT NULL
  snapshot_date DATE NOT NULL
  overall_score DECIMAL(5,2) NOT NULL
  controls_total INTEGER NOT NULL
  controls_passing INTEGER NOT NULL
  controls_failing INTEGER NOT NULL
  controls_not_tested INTEGER NOT NULL
  tests_total INTEGER NOT NULL
  tests_passing INTEGER NOT NULL
  tests_failing INTEGER NOT NULL
  domain_breakdown JSONB NOT NULL
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  UNIQUE (org_id, framework_id, snapshot_date)
  INDEX (org_id, framework_id, snapshot_date DESC)

monitoring_insights:
  id UUID PK
  org_id UUID NOT NULL
  insight_type VARCHAR(50) NOT NULL
    -- 'score_regression'|'new_failures'|'trend_declining'|'expiring_evidence'
    -- |'unowned_controls'|'vendor_score_drop'|'sla_breach_risk'
  title VARCHAR(255) NOT NULL
  description TEXT NOT NULL
  severity VARCHAR(20) NOT NULL
  related_resource_type VARCHAR(50)
  related_resource_id VARCHAR(255)
  is_dismissed BOOLEAN NOT NULL DEFAULT false
  dismissed_by UUID
  dismissed_at TIMESTAMP
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (org_id, severity, is_dismissed, created_at DESC)
```

#### gRPC Surface
TakeComplianceSnapshot, GetComplianceTrend, ListInsights, DismissInsight, GetControlCoverage, GetTestCoverageReport, GetComplianceCalendar, GetOrgHealthScore.

#### Events Consumed
test.result_recorded (update daily snapshots), evidence.accepted / evidence.expired, compliance_period.status_changed.

---

### intelligence/alert-service | Port 9402 | gRPC 50402

**Canonical ownership**: Alert routing layer — consumes Kafka events, applies alert rules, deduplicates within time windows, routes to notification-service.

#### Schema

```sql
alert_rules:
  id UUID PK
  org_id UUID NOT NULL
  rule_name VARCHAR(255) NOT NULL
  event_pattern VARCHAR(100) NOT NULL         -- Kafka event type
  condition JSONB NOT NULL                    -- {severity: ['critical', 'high']}
  min_interval_minutes INTEGER DEFAULT 60     -- deduplication window
  is_active BOOLEAN NOT NULL DEFAULT true
  created_at TIMESTAMP NOT NULL DEFAULT NOW()

alert_history:
  id UUID PK
  org_id UUID NOT NULL
  rule_id UUID FK alert_rules(id)
  event_type VARCHAR(100) NOT NULL
  payload JSONB NOT NULL
  severity VARCHAR(20) NOT NULL
  notification_ids UUID[]
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (org_id, severity, created_at DESC)
```

**Default alert rules (pre-seeded for all orgs)**:
- test.failed + severity=critical → immediate alert
- test.failed + severity=high → 15min batch
- test.failed + severity=medium → daily digest
- evidence.expiring + days_remaining=14 → immediate alert
- evidence.expiring + days_remaining=7 → immediate alert
- remediation.sla_breached → immediate alert
- integration.disconnected → immediate alert
- integration.auth_error → immediate alert
- vendor.score_dropped (critical/high vendor, >10 points) → immediate alert
- compliance_period.approaching (30 days to cert date) → weekly reminder

#### gRPC Surface
CreateAlertRule, UpdateAlertRule, DeleteAlertRule, ListAlertRules, GetAlertHistory, TestAlertRule, GetAlertStats.

---

### intelligence/analytics-service | Port 9403 | gRPC 50403

**Canonical ownership**: Per-org compliance metrics, dashboard widget data, reporting aggregations, usage analytics.

#### Schema

```sql
org_metrics:
  id UUID PK
  org_id UUID NOT NULL
  metric_name VARCHAR(100) NOT NULL
  metric_value DECIMAL(10,4) NOT NULL
  metric_metadata JSONB DEFAULT '{}'
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (org_id, metric_name, recorded_at DESC)
```

#### gRPC Surface
GetDashboardMetrics, GetComplianceTimeline, GetControlHeatmap, GetTestTrendChart, GetRemediationMetrics, GetEvidenceMetrics, GetVendorRiskDistribution, GetAIUsageStats, GetAPIUsageStats.

---

## Part X: Layer 6 — Platform Ops (5 Services)

---

### platform-ops/billing-service | Port 9500 | gRPC 50500

**Canonical ownership**: Subscription management, usage metering, Stripe integration (Cloud Edition), self-hosted license validation (Enterprise).

#### Schema

```sql
org_subscriptions:
  id UUID PK
  org_id UUID UNIQUE NOT NULL
  plan VARCHAR(50) NOT NULL DEFAULT 'community'
  stripe_customer_id VARCHAR(100)
  stripe_subscription_id VARCHAR(100)
  status VARCHAR(30) NOT NULL DEFAULT 'active'
    -- 'trialing'|'active'|'past_due'|'canceled'
  current_period_start TIMESTAMP
  current_period_end TIMESTAMP
  trial_end TIMESTAMP
  user_seats INTEGER
  base_price_cents INTEGER
  per_seat_price_cents INTEGER
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()

usage_records:
  id UUID PK
  org_id UUID NOT NULL
  metric VARCHAR(50) NOT NULL                 -- 'active_users'|'frameworks'|'integrations'|'ai_tokens'
  value DECIMAL(12,4) NOT NULL
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
  billing_period_start TIMESTAMP NOT NULL
  billing_period_end TIMESTAMP NOT NULL
  INDEX (org_id, metric, billing_period_start)
```

#### gRPC Surface
GetSubscription, CreateSubscription, UpdateSubscription, CancelSubscription, GetInvoices, GetUsage, ValidateSeatCount, HandleStripeWebhook, GetBillingPortalURL, CheckFeatureAccess.

---

### platform-ops/admin-service | Port 9501 | gRPC 50501

**Canonical ownership**: Roadwarden platform administration (internal Roadwarden staff only). Org management, support tooling, platform-wide feature control.

```sql
admin_actions:
  id UUID PK
  admin_user_id UUID NOT NULL
  action VARCHAR(100) NOT NULL
  target_type VARCHAR(50)
  target_id VARCHAR(255)
  reason TEXT NOT NULL
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
```

#### gRPC Surface
ListOrgs, GetOrgDetail, OverridePlan, SuspendOrg, DeleteOrg, ImpersonateUser (with mandatory audit log), GetPlatformMetrics, BroadcastAnnouncement, ManageFeatureFlags, GetPlatformHealth.

---

### platform-ops/search-service | Port 9502 | gRPC 50502

**Canonical ownership**: Full-text search via OpenSearch 2.6 across controls, evidence, policies, vendors, risks, audit events.

**Indexed document types**: controls, org_controls, evidence, org_policies, vendors, risks, remediation_tasks, audit_events.

#### gRPC Surface
SearchAll (multi-index), SearchControls, SearchEvidence, SearchPolicies, SearchVendors, SearchRisks, SearchAuditLog, IndexDocument, DeleteDocument, Reindex.

---

### platform-ops/webhook-delivery-service | Port 9503 | gRPC 50503

**Canonical ownership**: Outbound webhook delivery to customer-configured endpoints. Retry logic, HMAC signing, delivery logs.

#### Schema

```sql
webhook_endpoints:
  id UUID PK
  org_id UUID NOT NULL
  url VARCHAR(1000) NOT NULL
  secret_enc BYTEA NOT NULL                   -- KMS-encrypted HMAC secret
  event_types VARCHAR(100)[]                  -- NULL = all events
  is_active BOOLEAN NOT NULL DEFAULT true
  created_at TIMESTAMP NOT NULL DEFAULT NOW()

webhook_deliveries:
  id UUID PK
  endpoint_id UUID FK webhook_endpoints(id)
  org_id UUID NOT NULL
  event_type VARCHAR(100) NOT NULL
  payload JSONB NOT NULL
  response_status INTEGER
  response_body TEXT
  attempt_count INTEGER NOT NULL DEFAULT 0
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
  next_retry_at TIMESTAMP
  delivered_at TIMESTAMP
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  INDEX (org_id, status, next_retry_at)
```

**Retry strategy**: Exponential backoff — 1m, 5m, 30m, 2h, 8h, 24h. Max 6 attempts. HMAC-SHA256 signature on every delivery via `X-Roadwarden-Signature` header.

#### gRPC Surface
CreateWebhookEndpoint, UpdateWebhookEndpoint, DeleteWebhookEndpoint, ListWebhookEndpoints, TestWebhookEndpoint, ListDeliveries, RetryDelivery, GetDeliveryLogs.

---

### platform-ops/api-gateway-service | Port 9504 | gRPC 50504

**Canonical ownership**: Public REST API gateway — authentication resolution, rate limiting, request routing to internal gRPC services, OpenAPI spec generation, SDK generation pipeline.

**Authentication middleware (checked in order)**:
1. `Authorization: Bearer rw_live_...` API key → user-service.ValidateAPIKey
2. `rw_session` cookie → auth-service.GetCurrentSession
3. `X-Auditor-Token` header → auditor-service.ValidateAuditorSession
4. Reject with RFC 7807 problem detail (401)

**Rate limiting**: Token bucket per org_id + per api_key_id, stored in Redis.

| Plan | Rate Limit |
|---|---|
| Community | 60 requests/minute |
| Cloud | 600 requests/minute |
| Enterprise | 6,000 requests/minute |

**REST API structure**: `https://api.roadwarden.io/v1/{resource}`. All responses JSON. Pagination via `cursor` + `limit` params. Errors follow RFC 7807 Problem Details format.

**OpenAPI 3.0**: Auto-generated from NestJS decorators. Served at `https://api.roadwarden.io/v1/openapi.json`. Always current — cannot drift from implementation.

**Official SDKs** (generated from OpenAPI spec):
- `@roadwarden/sdk` (TypeScript/JavaScript)
- `roadwarden-python` (Python)
- `roadwarden-go` (Go)
- `roadwarden-ruby` (Ruby)

---

## Part XI: Frontend Architecture

### Applications

| App | URL | Stack | Purpose |
|---|---|---|---|
| apps/web | app.roadwarden.io | Next.js 15 + TypeScript | Primary compliance dashboard |
| apps/trust | trust.roadwarden.io/{slug} | Next.js 15 + TypeScript | Public trust center (SSR for SEO) |
| apps/auditor | auditor.roadwarden.io | Next.js 15 + TypeScript | Dedicated auditor workspace |
| apps/docs | docs.roadwarden.io | Docusaurus | Open-source documentation |

### Primary App Pages (app.roadwarden.io)

| Route | Page Description |
|---|---|
| `/` | Dashboard: compliance score widgets, failing controls, upcoming tasks, recent activity |
| `/frameworks` | Framework catalog: active + available; activate with one click |
| `/frameworks/{id}` | Framework detail: domain breakdown, control list, score per domain |
| `/frameworks/{id}/scoping` | Scoping questionnaire flow |
| `/controls` | All controls: filterable by status/domain/owner/framework |
| `/controls/{id}` | Control detail: tests, evidence, remediation tasks, status history, cross-framework mapping |
| `/tests` | Test catalog: pass/fail status, last run time, schedule, connector |
| `/evidence` | Evidence library: all evidence, expiry tracker, pending requests |
| `/evidence/upload` | Upload: drag-and-drop, URL link, in-browser screen capture |
| `/policies` | Policy library: all policies, acknowledgment completion rate |
| `/policies/{id}` | Policy detail: version history, acknowledgments, framework mappings, PDF export |
| `/policies/new` | Policy wizard: template selection + AI drafting |
| `/risk` | Risk register: heatmap, risk table, appetite settings |
| `/risk/{id}` | Risk detail: treatment, linked controls, score history |
| `/remediation` | Remediation tasks: filterable by severity/owner/SLA status |
| `/integrations` | Connected integrations: health indicators, last sync, test coverage |
| `/integrations/connect` | Connect new: category browse + OAuth/API-key setup flow |
| `/questionnaires` | Incoming security questionnaires |
| `/questionnaires/{id}` | Questionnaire: AI-drafted answers + human review + export |
| `/vendors` | Vendor register: risk tiers, assessment status, sub-processor list |
| `/vendors/{id}` | Vendor detail: security score, assessment history, questionnaires |
| `/trust-center` | Trust center admin: config, documents, NDA management, visitor analytics |
| `/audit` | Audit periods: current + historical, auditor invitations, readiness score |
| `/reports` | Report library: generate + download all report types |
| `/ai-agent` | AI Agent workspace: policy drafting, control mapping, risk advising sessions |
| `/team` | Team management: members, roles, invitations |
| `/settings` | Org settings: MFA enforcement, SSO, notifications, API keys, billing |

### Design System

- **Base**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Colors**: Neutral base; primary green (compliance/trust); danger red (failing/critical); warning amber (expiring/warn)
- **Typography**: Inter for UI text; JetBrains Mono for IDs, control codes, JSON
- **Data viz**: Recharts (score trends, test results timeline, risk heatmap)
- **Icons**: Lucide React
- **Dark mode**: System-default + user-overridable; all components support both modes

### Key UI Patterns

**Compliance Score Widget**: Circular gauge 0-100%. Color: <50% red, 50-75% amber, 75-90% green, ≥90% emerald. Trend arrow (delta from 7 days ago). Click → framework detail.

**Control Status Pill**: `Passing` (green), `Failing` (red), `In Progress` (blue), `Not Started` (gray), `N/A` (gray-400).

**Test Result Badge**: `PASS` (green), `FAIL` (red), `WARN` (amber), `ERROR` (orange), `NOT RUN` (gray).

**Evidence Expiry Timeline**: Scrollable timeline of evidence expiring in next 90 days. Red = <7 days, amber = 7-30 days, green = >30 days.

**Risk Heatmap**: 5×5 grid. X = Impact (1-5), Y = Probability (1-5). Color: green low-left → yellow → orange → red upper-right.

**AI Agent Panel**: Collapsible right side panel. Mode selector at top. Response includes confidence badge. Citations expandable. Human approval button always present for AI outputs.

**Continuous Monitoring Banner**: Top-of-page banner on any page when tests are failing. "X controls failing — N critical." Links to remediation page.

---

## Part XII: Infrastructure & Deployment

### Development Stack (Docker Compose)

```yaml
# docker/docker-compose.dev.yml — minimum viable local env
services:
  postgres:
    image: postgres:16-alpine
    ports: ['5432:5432']
    environment:
      POSTGRES_DB: roadwarden
      POSTGRES_USER: roadwarden
      POSTGRES_PASSWORD: roadwarden_dev_secret

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']

  kafka:
    image: apache/kafka:3.7.0
    ports: ['9092:9092']
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

  minio:
    image: minio/minio:latest
    ports: ['9000:9000', '9001:9001']
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin_dev

  opensearch:
    image: opensearchproject/opensearch:2.6.0
    ports: ['9200:9200']
    environment:
      discovery.type: single-node
      OPENSEARCH_INITIAL_ADMIN_PASSWORD: Roadwarden@Dev123!
```

### Production Self-Hosted (Kubernetes + Helm)

```bash
# Install via Helm
helm repo add roadwarden https://charts.roadwarden.io
helm repo update
helm install roadwarden roadwarden/roadwarden   --namespace roadwarden   --create-namespace   --values values.yaml

# Minimum production values.yaml:
# - external PostgreSQL (RDS, Cloud SQL, Azure Database)
# - external Redis (ElastiCache, Cloud Memorystore)
# - internal Kafka (3-node KRaft) OR external (MSK, Confluent)
# - MinIO OR external S3-compatible storage
# - Ingress controller (nginx recommended)
```

**Minimum production hardware**: 4 CPU cores, 16GB RAM per node, 3 nodes minimum. Scales horizontally — all services stateless (state in PostgreSQL + Redis + Kafka).

### One-Command Community Install

```bash
curl -fsSL https://get.roadwarden.io/install.sh | bash
# 1. Detects Docker + Docker Compose
# 2. Downloads docker/docker-compose.yml
# 3. Generates secrets (DB password, JWT secret, KMS key)
# 4. Pulls all service images
# 5. Runs database migrations + seeds catalogs
# 6. Prints: Roadwarden running at http://localhost:3000
```

### Observability Stack

Each service exports:
- **Traces**: OpenTelemetry → Jaeger (self-hosted) / Datadog / New Relic (Cloud)
- **Metrics**: Prometheus /metrics endpoint → Grafana dashboards
- **Logs**: Structured JSON → Loki (self-hosted) / CloudWatch / Datadog (Cloud)

Pre-built Grafana dashboards:
- Platform Overview (all 39 services health)
- Compliance Test Runner (queue depths, test pass rates, execution times)
- API Gateway (request rates, error rates, latency P50/P95/P99)
- Kafka Consumer Lag (per consumer group)
- BullMQ Queue Health (pending, active, failed job counts)

---

## Part XIII: Open Source Governance

**License**: Apache 2.0 for all code in `roadwarden/` monorepo, `connectors/`, and `packages/`.

**Why Apache 2.0 over MIT**: Patent retaliation clause (Section 3) protects the community. Permissive (not copyleft) — allows commercial use without requiring derivative works to be open-sourced.

**CLA**: Required before first PR merged. Signed via GitHub (CLA bot). Contributors keep copyright; grant Roadwarden perpetual royalty-free license. Allows Roadwarden to relicense for commercial editions.

**Technical Steering Committee (TSC)**: 5–7 members. Initial: 3 Roadwarden core + 2 community. Governance of: major architecture changes, new framework additions, connector SDK changes, release cadence, CVE disclosure.

**Connector contribution process**:
1. Build connector using `@roadwarden/connector-sdk`
2. PR to `connectors/` directory
3. Automated CI: type-check, lint, test coverage ≥80%, no hardcoded creds
4. TSC review: security, test quality, documentation
5. Merge → published as `@roadwarden/connector-{id}` on npm

**CVE disclosure**: security@roadwarden.io (PGP key published). 90-day embargo. GitHub Security Advisories. CVSS score + CWE mapping on every CVE.

**SBOM**: CycloneDX JSON SBOM per release. SLSA provenance attestation via GitHub Actions. Signed container images via cosign on ghcr.io.

**Roadwarden is in Roadwarden**: All Roadwarden infrastructure (Cloud Edition) runs Roadwarden for its own compliance. We publish our own SOC 2 report and ISO 27001 certificate publicly in our trust center.

---

## Part XIV: Pricing Model

### Community Edition (Free — Apache 2.0)
- Unlimited users; all 38 frameworks; all 400+ integrations; BYOK AI; no SLA; community Discord
- Self-hosted only

### Cloud Edition (Managed SaaS)
- $249/month base (includes 5 user seats)
- $49/user/month for additional seats
- All features + managed AI (GPT-4o + Claude 3.5) + 99.9% uptime SLA + US/EU/APAC data residency

### Enterprise Self-Hosted
- Annual contract; starting at $25,000/year
- Unlimited users; BYOK AI; full feature parity; source access
- Dedicated CSM + 8-hour support SLA + on-site deployment assistance

### vs. Vanta (why Roadwarden wins on price)
- Vanta (SOC 2 + ISO 27001, 50 users): ~$3,500/month = $42,000/year
- Roadwarden Cloud (all 38 frameworks, 50 users): $249 + (45 × $49) = $2,454/month = $29,448/year
- Roadwarden Community (self-hosted): $0

---

## Part XV: Implementation Roadmap

### Phase 1: Foundation + Core (Months 1-4)

**Month 1**: Layer 1 complete; Next.js scaffolding; Docker Compose dev env; 5 initial connectors (AWS, GitHub, Okta, Rippling, Jamf); 3 frameworks seeded (SOC 2, ISO 27001, GDPR)

**Month 2**: Layer 2 complete; 100+ automated tests live; 80+ policy templates seeded; 2,340+ controls in library

**Month 3**: Layer 3 complete (all 10 integration services); 50 connectors total; BullMQ continuous monitoring running; webhook ingestion live

**Month 4**: Layer 4 complete (trust center, questionnaire, vendor risk, auditor workspace, reports); trust center public beta

### Phase 2: Intelligence + Scale (Months 5-8)

**Month 5**: Layer 5 complete (AI Agent all 4 modes, monitor, alert, analytics); Slack + email + PagerDuty alerts live

**Month 6**: Layer 6 complete (billing, admin, search, webhook delivery, API gateway); REST API v1 public; OpenAPI 3.0 + TypeScript SDK published

**Month 7**: 200+ connectors; all 38 frameworks seeded; Kubernetes/Helm charts; one-command install

**Month 8**: 400+ connectors; competitor import (Vanta/Drata/Secureframe); OSCAL import/export; SOC 2 Type II audit initiated for Roadwarden itself

### Phase 3: Launch + Growth (Months 9-12)

- Month 9: Private beta (50 orgs)
- Month 10: Public beta (open GitHub + open registration)
- Month 11: Cloud Edition GA ($249/month)
- Month 12: Enterprise Edition GA; first customer SOC 2 certifications completed using Roadwarden

---

## Appendix A: 10 Illustrative Automated Tests

| Test ID | Connector | Severity | Cadence | Pass Condition |
|---|---|---|---|---|
| test_aws_iam_mfa_enforced | aws | Critical | Every 4h | All IAM console users have ≥1 MFA device |
| test_github_branch_protection | github | High | Every 4h | All active repos: default branch requires ≥1 PR review |
| test_okta_mfa_required_all | okta | Critical | Every 4h | MFA enrollment policy covers all users with no exclusions |
| test_hr_terminated_accounts | [hr, idp] | Critical | Daily | Zero terminated employees with active IdP accounts |
| test_aws_s3_no_public | aws | Critical | Every 4h | All S3 buckets have Block Public Access enabled |
| test_mdm_disk_encryption | [jamf, intune, kandji] | High | Daily | ≥95% of enrolled devices have full-disk encryption |
| test_tls_min_1_2 | [aws, cloudflare, gcp] | High | Daily | All load balancers enforce TLS 1.2 minimum |
| test_no_long_lived_creds | [aws, github] | High | Daily | No AWS access keys >90d old; no non-expiring GitHub PATs |
| test_security_training_completion | knowbe4 | Medium | Daily | ≥95% employees completed annual security training |
| test_pentest_within_12mo | manual | High | Annual | Pen test report uploaded and dated within 12 months |

---

## Appendix B: Kafka Event Reference

All events follow: `{event_id, event_type, org_id, occurred_at, actor: {type, id}, payload}`.

**Auth & Identity**: user.created/verified_email/logged_in/login_failed/mfa_enabled/mfa_disabled/password_changed/deleted/sso_configured/scim_provisioned/scim_deprovisioned, session.created/expired/revoked, api_key.created/revoked/used

**Organizations**: org.created/updated/deleted, org.member_added/removed/role_changed, org.invitation_sent/accepted

**Frameworks & Periods**: framework.activated/deactivated, compliance_period.created/status_changed/certified, scoping.answers_submitted

**Controls**: control.status_changed/owner_assigned/implemented/failing/passed

**Tests**: test.result_recorded, test.failed (PASS→FAIL transition), test.passed (FAIL→PASS transition), test.schedule_missed

**Evidence**: evidence.submitted/accepted/rejected/expired, evidence.request_created/fulfilled

**Policies**: policy.created/updated/approved/archived, policy.acknowledgment_recorded

**Risk**: risk.created/status_changed/exceeds_appetite/score_updated

**Remediation**: remediation.task_created/assigned/resolved, remediation.sla_breached

**Integrations**: integration.connected/disconnected/auth_error/sync_completed/sync_failed

**Trust & Vendors**: vendor.created/risk_tier_changed/assessment_completed/score_dropped/assessment_overdue

**AI Agent**: ai_agent.policy_drafted/questionnaire_processed/control_mapped

**Platform**: file.uploaded/virus_scan_completed/file_deleted

---

## Appendix C: Control Domain Summary

| Domain | Controls | Auto Rate | Examples |
|---|---|---|---|
| access_control | 280+ | 85% | MFA, PAM, RBAC, session management, provisioning/deprovisioning |
| asset_management | 120+ | 75% | Hardware, software, cloud resource, data inventory |
| change_management | 95+ | 70% | Code review, release management, SDLC controls |
| data_security | 180+ | 60% | Encryption at rest/transit, DLP, classification, retention, deletion |
| endpoint_security | 140+ | 80% | MDM enrollment, EDR, OS patching, disk encryption |
| incident_response | 90+ | 40% | Detection, response plans, forensics, breach notification |
| logging_monitoring | 130+ | 85% | SIEM, audit trails, log retention, alerting |
| network_security | 150+ | 75% | Firewalls, VPN, segmentation, WAF, DDoS protection |
| organizational_security | 160+ | 30% | Security policies, governance, board oversight, risk management program |
| people_security | 110+ | 60% | Hiring controls, security training, background checks, offboarding |
| physical_security | 70+ | 20% | Data center controls, office security, visitor management |
| privacy | 200+ | 55% | DSRs, consent management, ROPA, DPIA, breach notification to DPAs |
| resilience_bcp | 85+ | 35% | BCP, DR plans, RTO/RPO targets, backup testing |
| risk_management | 95+ | 40% | Risk assessments, risk register, treatment plans |
| secure_development | 130+ | 70% | SAST/DAST, code review requirements, dependency management, SBOM |
| supply_chain | 80+ | 45% | Vendor risk, third-party assessments, SBOMs, connector security |
| vulnerability_management | 100+ | 80% | Scheduled scanning, SLA-based patching, penetration testing |
| compliance_legal | 120+ | 30% | Audit management, legal holds, regulatory filings, NDA management |

**Grand total: 2,340+ unique controls | Average automation rate across all domains: 68%**

---

*Roadwarden — Implementation Strategy v1.0*
*Document Status: LOCKED — Build from Layer 1 upward. All decisions above are final.*
*Any proposed change to a locked decision (Q1-Q30, R1-R14) requires TSC approval.*
*Open source. Built in public. Compliant from day one.*

---

## Part III: Integration Registry (400+ Connectors)

### ConnectorSDK Interface

```typescript
interface ConnectorSDK {
  metadata: {
    id: string;                     // 'aws' | 'github' | 'okta'
    name: string;
    vendor: string;
    category: ConnectorCategory;
    auth_type: 'oauth2' | 'api_key' | 'iam_role' | 'basic' | 'mtls';
    permissions_required: string[];
    tests_provided: string[];
    webhook_events?: string[];
  };
  connect(creds: Credentials): Promise<Connection>;
  verifyConnection(conn: Connection): Promise<HealthCheck>;
  disconnect(conn: Connection): Promise<void>;
  sync(conn: Connection, since?: Date): Promise<SyncResult>;
  handleWebhook?(payload: WebhookPayload): Promise<WebhookResult>;
  runTest(test_id: string, conn: Connection): Promise<TestResult>;
  collectEvidence(type: string, conn: Connection): Promise<Evidence[]>;
}
```

### Category 1: Cloud Infrastructure (38 connectors)

| Connector | Auth | Tests | Key Data Collected |
|---|---|---|---|
| **AWS** | IAM Role (cross-account) | 180+ | IAM, Security Hub, CloudTrail, Config Rules, GuardDuty, Inspector, S3 ACLs, EC2 SGs, KMS rotation, VPC flow logs, CloudWatch alarms, AWS Config |
| **Google Cloud Platform** | Service Account | 140+ | IAM, Security Command Center, Asset Inventory, Audit Logs, VPC firewall rules, Cloud KMS, Cloud Armor, Binary Authorization |
| **Microsoft Azure** | Service Principal | 145+ | Entra ID, Defender for Cloud, Policy compliance, Activity Log, Key Vault, NSGs, Azure Monitor, Sentinel alerts |
| **Cloudflare** | API Token | 30+ | DNS records, WAF rules, SSL/TLS config, DDoS settings, Workers, Access policies, R2 bucket ACLs |
| **DigitalOcean** | Personal Access Token | 25+ | Droplets, firewalls, Spaces buckets, team members, VPCs |
| **Heroku** | API Key | 20+ | App config, SSL certificates, add-ons, collaborator access |
| **Oracle Cloud (OCI)** | API Key + Instance Principal | 45+ | IAM, VCN, Security Lists, Audit logs, Object Storage |
| **IBM Cloud** | API Key | 30+ | IAM, Security Advisor, Activity Tracker, Object Storage |
| **Linode / Akamai Cloud** | API Key | 18+ | Compute instances, firewalls, object storage |
| **Vultr** | API Key | 15+ | Instances, firewall groups, object storage |
| **AWS GovCloud** | IAM Role | 180+ | Same as AWS with GovCloud-specific controls |
| **Alibaba Cloud** | AccessKey | 25+ | RAM policies, ActionTrail, Security Center findings |
| + 26 more cloud/CDN/hybrid connectors | | | |

### Category 2: Identity & Access Management (42 connectors)

| Connector | Auth | Tests | Key Data |
|---|---|---|---|
| **Okta** | OAuth2 + API Token | 95+ | MFA enforcement, user list, group memberships, auth policies, inactive users, admin accounts, sign-on policies, device trust, session policies |
| **Microsoft Entra ID** | Service Principal | 90+ | MFA status, Conditional Access policies, PIM assignments, privileged roles, guest accounts, SSPR config, B2B access |
| **Google Workspace** | Service Account + Domain Delegation | 80+ | 2FA enforcement, OAuth app access, admin accounts, Drive sharing settings, data classification labels |
| **Duo Security** | Admin API | 35+ | MFA policies, device health status, bypass codes, user sync status |
| **OneLogin** | API Credentials | 40+ | MFA enforcement, user provisioning, application access, SmartFactor policies |
| **JumpCloud** | API Key | 50+ | Device management, directory users, MFA status, RADIUS, LDAP |
| **Ping Identity / PingOne** | OAuth2 | 30+ | MFA, identity governance, risk policies |
| **SailPoint IdentityNow** | OAuth2 | 25+ | Access certifications, role assignments, SoD violations |
| **CyberArk** | REST API | 20+ | Privileged account inventory, vault health, session recordings |
| **HashiCorp Vault** | Token / AppRole | 15+ | Secret access policies, audit logs, lease TTLs, unsealing |
| **AWS IAM Identity Center** | IAM Role | 45+ | Permission sets, account assignments, MFA enforcement |
| **Auth0** | Management API | 30+ | MFA policies, user anomalies, OAuth app access, log streams |
| **1Password Business** | API Token | 12+ | Team members, vault access logs, admin activity |
| **Bitwarden Business** | API Key | 10+ | User seats, collection access, admin activity |
| + 28 more IdP/PAM/SSO/secrets connectors | | | |

### Category 3: Version Control & CI/CD (35 connectors)

| Connector | Auth | Tests | Key Data |
|---|---|---|---|
| **GitHub (Cloud + Enterprise Server)** | OAuth2 + GitHub App | 90+ | Branch protection rules, required PR reviews, code scanning alerts, secret scanning alerts, dependency alerts, CODEOWNERS, deploy keys, Actions permissions, SLSA provenance attestations, SBOM |
| **GitLab (Cloud + Self-Managed)** | OAuth2 + PAT | 75+ | Branch protection, MR approvals, SAST findings, dependency scanning, container scanning, secret detection |
| **Bitbucket** | OAuth2 | 45+ | Branch restrictions, required builds, 2FA enforcement, merge checks |
| **Azure DevOps** | Service Principal | 55+ | Branch policies, pipeline approvals, service connections, artifact signing, environment protections |
| **Jenkins** | API Token + CSRF | 20+ | Plugin versions, RBAC configuration, build permissions, node security |
| **CircleCI** | API Token | 15+ | Context restrictions, environment variable encryption, runner trust |
| **ArgoCD** | API Token | 18+ | RBAC policies, sync policies, app health, image policies |
| **Snyk** | API Token | 25+ | Vulnerability findings, license policy compliance, PR check gates |
| **SonarQube / SonarCloud** | API Token | 20+ | Quality gates status, security hotspots, code coverage thresholds |
| **Veracode** | API Credentials | 15+ | SAST/DAST findings, policy scan pass/fail |
| **Flux** | Kubernetes Token | 12+ | GitOps image policies, deployment configs |
| **Dependabot** | GitHub App | 15+ | Auto-update status, open security alerts |
| + 23 more VCS/CI/CD/SAST/SCA connectors | | | |

### Category 4: HR & People (30 connectors)

| Connector | Auth | Tests | Key Cross-Reference Data |
|---|---|---|---|
| **Rippling** | OAuth2 | 30+ | Employee list, termination dates, background check status, training completion |
| **BambooHR** | API Key | 25+ | Employee list, termination records, onboarding checklist completion |
| **Workday** | OAuth2 | 25+ | Employee list, role assignments, termination dates, performance records |
| **ADP Workforce Now** | OAuth2 | 20+ | Employee list, termination records, payroll status |
| **Gusto** | OAuth2 | 18+ | Employee + contractor list, termination dates |
| **HiBob** | API Token | 20+ | HRIS records, termination dates, department structure |
| **Deel** | API Token | 15+ | Global contractor records, contract status |
| **SAP SuccessFactors** | OAuth2 | 20+ | Enterprise HR records, org structure, terminations |
| **Personio** | OAuth2 | 18+ | EU-focused HR records, employee lifecycle |
| **Remote.com** | API Token | 12+ | Global employment records |
| + 20 more HR/PEO/payroll connectors | | | |

**Critical Cross-Reference**: HR System (source of truth for employment status) vs Identity System (account status) vs All Access Systems. Terminated employee with any active account triggers CRITICAL automatic alert + remediation task within 15 minutes.

### Category 5: MDM & Endpoint (28 connectors)

| Connector | Auth | Tests | Key Data |
|---|---|---|---|
| **Jamf Pro** | API Key | 45+ | FileVault encryption rate, iOS encryption, OS version compliance, patch status, antivirus status, screen lock policy, MDM enrollment rate, local admin accounts |
| **Kandji** | API Token | 40+ | Blueprint adherence, macOS compliance policies, auto-update settings, EDR agent status |
| **Microsoft Intune** | Graph API | 50+ | Windows/macOS/iOS/Android compliance, encryption status, patch compliance, antivirus, configuration profiles |
| **VMware Workspace ONE** | API Key | 35+ | Cross-platform device compliance, conditional access policies |
| **Mosyle Business** | API Key | 30+ | Apple-fleet MDM compliance, app management |
| **FleetDM** | API Key | 25+ | Open-source osquery-based device mgmt, custom queries |
| **JumpCloud MDM** | API Key | 30+ | Cross-platform device management, directory integration |
| **CrowdStrike Falcon (Device)** | API Key | 40+ | Endpoint detection, prevention policy status, device health score |
| **SentinelOne** | API Token | 35+ | EDR status, threat prevention policy, device health |
| **Microsoft Defender (via Intune)** | Graph API | 20+ | Windows security status, Defender for Endpoint alerts |
| **Automox** | API Key | 18+ | Cross-platform patch compliance, patch policy enforcement |
| + 17 more MDM/EDR/endpoint connectors | | | |

### Category 6: Security Tools (45 connectors)

| Connector | Tests | Key Data |
|---|---|---|
| **Wiz** | 60+ | Cloud misconfigurations, vulnerability findings, exposed secrets, identity risks, attack paths, container risks |
| **CrowdStrike Falcon (SIEM)** | 55+ | Detection alerts, threat intelligence, incident reports, prevention policy |
| **Orca Security** | 45+ | Cloud security findings, vulnerability context, attack path analysis |
| **Prisma Cloud** | 50+ | Cloud security posture, workload protection, network security findings |
| **Tenable.io / Nessus** | 40+ | Vulnerability scan results, critical/high finding counts, scan coverage |
| **AWS Security Hub** | 45+ | Aggregated findings across all AWS security services |
| **Google Security Command Center** | 40+ | GCP security findings, misconfiguration alerts |
| **Microsoft Defender for Cloud** | 45+ | Azure security findings, Secure Score, regulatory compliance |
| **Qualys VMDR** | 35+ | Vulnerability findings, remediation SLA tracking |
| **Rapid7 InsightVM** | 30+ | Vulnerability findings, risk scoring |
| **Splunk** | 25+ | SIEM ingestion status, alert policies, saved search results |
| **Datadog** | 35+ | APM, infrastructure monitoring, security signals, compliance monitoring |
| **Microsoft Sentinel** | 25+ | SIEM alerts, analytics rule status, playbook executions |
| **PagerDuty** | 15+ | Incident management, on-call schedule coverage, MTTR metrics |
| **HackerOne** | 10+ | Bug bounty program P1/P2 counts, disclosure SLA compliance |
| **KnowBe4** | 15+ | Training completion rates, phishing simulation click rates, user risk scores |
| **Zscaler** | 25+ | Zero trust network access policies, DLP rules, SSL inspection |
| **Lacework** | 35+ | CNAPP findings, anomaly detection, workload security |
| + 27 more security connectors | | | |

### Categories 7-14 Summary

| Category | Count | Notable Connectors |
|---|---|---|
| Task & Project Management | 18 | Jira, Linear, Asana, ServiceNow, GitHub Issues, Azure Boards |
| Communication & Collaboration | 12 | Slack, MS Teams, Zoom, Box, Dropbox Business, SharePoint |
| Database & Data | 20 | AWS RDS, Snowflake, MongoDB Atlas, BigQuery, PostgreSQL, Redis |
| DNS & Certificates | 10 | Cloudflare DNS, DigiCert, Venafi, AWS ACM, Let's Encrypt |
| Secrets & Key Management | 12 | HashiCorp Vault, AWS KMS, Azure Key Vault, GCP KMS, Doppler |
| Background Check | 8 | Checkr, Sterling, HireRight, Onfido, GoodHire |
| Training & Awareness | 12 | KnowBe4, Proofpoint SA, SANS, Ninjio, Cornerstone, Docebo |
| Specialty & Emerging | 30 | Kubernetes, Terraform, Stripe, Salesforce, OpenAI, Anthropic |

**Total: 400+ connectors | 14 categories | All open-source (Apache 2.0)**

---

## Part IV: Locked Architecture Decisions (Q1-Q30)

| # | Decision | Locked Choice |
|---|---|---|
| Q1 | Tenancy model | Organization is the tenant; sub-orgs via parent_org_id; multi-org memberships for MSPs/consultants |
| Q2 | RBAC | 6 built-in roles: owner / admin / security_lead / member / auditor / viewer; custom roles on Cloud+Enterprise |
| Q3 | Authentication | Magic link + email/password + SAML 2.0/OIDC SSO + SCIM 2.0; MFA: TOTP + WebAuthn + FIDO2; SSO-only enforcement |
| Q4 | Connector architecture | Isolated @roadwarden/connector-{id} npm packages; KMS-encrypted credentials; sandboxed NestJS modules |
| Q5 | Evidence immutability | SHA-256 hash locked on acceptance; any modification invalidates; append-only audit trail |
| Q6 | Continuous monitoring | BullMQ: Critical every 4h / Standard daily / Slow weekly / On-change via webhook; 15-min failure detection |
| Q7 | Risk quantification | probability(1-5) x impact(1-5) = inherent; residual = inherent x (1 - control_effectiveness) |
| Q8 | Compliance score | (passing_controls / in_scope_controls) x 100%; sub-scores per domain; daily snapshot + trend |
| Q9 | Multi-framework de-duplication | Single control implementation simultaneously satisfies multiple framework requirements |
| Q10 | AI Agent | 4 modes: Policy Drafter / Questionnaire Auto-Fill / Control Mapper / Risk Advisor; citations mandatory |
| Q11 | Trust Center | Public at trust.roadwarden.io/{slug}; NDA-gated deep access; custom domain; visitor analytics |
| Q12 | Auditor workspace | Read-only at auditor.roadwarden.io; time-limited (30-180 days); MFA required; download audit log |
| Q13 | Vendor risk | 2-track: SecurityScorecard auto-score + questionnaire manual; reassessment cadence by risk tier |
| Q14 | Open source governance | Apache 2.0; CLA required; TSC 5-7 members; CVE via GitHub Security Advisories; SBOM per release |
| Q15 | Data residency | US / EU / APAC regions; PostgreSQL RLS enforced; self-hosted = zero telemetry |
| Q16 | Compliance periods | Evidence period-scoped; prior periods archived; types: quarterly / annual / custom |
| Q17 | Remediation SLAs | Critical 24h / High 7d / Medium 30d / Low 90d; auto-create from test failures; Jira/Linear bi-dir sync |
| Q18 | Questionnaire automation | VSAQ / SIG / CAIQ / CSV / PDF; AI semantic match to controls; human review gate; export to original format |
| Q19 | Notifications | Email / Slack / Teams / PagerDuty / Webhook; alerts: test failures, evidence expiry, SLA breach |
| Q20 | API-first | All features via api.roadwarden.io/v1; OpenAPI 3.0 auto-generated; SDKs: TypeScript / Python / Go / Ruby |
| Q21 | Evidence TTLs | Automated snapshot: 90d / Policy doc: 365d / Audit report: per cert cycle / Attestation: 365d |
| Q22 | Policy library | 80+ templates; versioned; framework-mapped; variable-substituted; AI-customizable |
| Q23 | Scoping module | Per-framework questionnaire drives: controls in scope, integration recommendations, auditor RFI |
| Q24 | Dual compliance mode | Assessment Mode (point-in-time audit prep) + Continuous Mode (always-on); simultaneous per framework |
| Q25 | SoA auto-generation | ISO 27001: all 93 Annex A controls with applicability decision + justification + evidence links; versioned |
| Q26 | POA&M | FedRAMP/FISMA: auto-generated POA&M; milestone tracking; OSCAL-format export; ConMon package |
| Q27 | OSCAL support | Import: SSP / SAP / SAR; Export: OSCAL SSP; Import any OSCAL catalog as custom framework |
| Q28 | Evidence intake methods | 6 methods: Auto/connector / Drag+drop / URL+snapshot / In-browser capture / API upload / Email intake |
| Q29 | Competitor import | One-click migration from Vanta, Drata, Secureframe via CSV/JSON wizard |
| Q30 | Self-hosted deployment | Docker Compose (dev/small) / Kubernetes + Helm (prod) / Managed K8s Operators (EKS/GKE/AKS) |

---

## Part V: Layer 1 — Foundation (7 Services)

---

### identity/auth-service | Port 9001 | gRPC 50001
**Canonical ownership**: All authentication — magic link, password, SSO (SAML/OIDC), SCIM, MFA (TOTP/WebAuthn), session lifecycle.

#### Schema

```sql
users:
  id              UUID         PK
  email           VARCHAR(255) UNIQUE NOT NULL
  email_verified  BOOLEAN      NOT NULL DEFAULT false
  password_hash   VARCHAR(72)                          -- bcrypt; NULL for magic-link-only
  mfa_enabled     BOOLEAN      NOT NULL DEFAULT false
  mfa_totp_secret_enc BYTEA                            -- KMS-encrypted
  mfa_backup_codes_enc BYTEA                           -- KMS-encrypted
  mfa_webauthn_credentials JSONB                       -- WebAuthn credential list
  last_login_at   TIMESTAMP
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
  updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
  deleted_at      TIMESTAMP

user_sessions:
  id                     UUID        PK
  user_id                UUID        FK users(id)
  session_type           VARCHAR(20) NOT NULL   -- 'user' | 'audit'
  token_hash             VARCHAR(64) UNIQUE NOT NULL  -- SHA-256 of session cookie
  ip_hash                VARCHAR(64)                  -- never store raw IP
  user_agent_fingerprint VARCHAR(100)
  org_id                 UUID                         -- active org context
  expires_at             TIMESTAMP   NOT NULL
  last_active_at         TIMESTAMP   NOT NULL DEFAULT NOW()
  created_at             TIMESTAMP   NOT NULL DEFAULT NOW()
  INDEX (user_id, session_type)
  INDEX (expires_at) WHERE expires_at > NOW()

magic_link_tokens:
  id         UUID        PK
  user_id    UUID        FK users(id)
  token_hash VARCHAR(64) UNIQUE NOT NULL
  purpose    VARCHAR(50) NOT NULL   -- 'login' | 'invite' | 'password_reset'
  org_id     UUID
  expires_at TIMESTAMP   NOT NULL   -- 15min for login; 72h for invite
  used_at    TIMESTAMP
  created_at TIMESTAMP   NOT NULL DEFAULT NOW()

sso_configurations:
  id              UUID        PK
  org_id          UUID        UNIQUE NOT NULL
  provider_type   VARCHAR(30) NOT NULL   -- 'saml' | 'oidc'
  config          JSONB       NOT NULL   -- entity_id, cert, client_id, discovery_url...
  is_active       BOOLEAN     NOT NULL DEFAULT true
  enforce_sso     BOOLEAN     NOT NULL DEFAULT false
  allowed_domains VARCHAR(255)[]
  created_at      TIMESTAMP   NOT NULL DEFAULT NOW()
  updated_at      TIMESTAMP   NOT NULL DEFAULT NOW()

scim_tokens:
  id           UUID        PK
  org_id       UUID        NOT NULL
  token_hash   VARCHAR(64) UNIQUE NOT NULL
  description  VARCHAR(255)
  last_used_at TIMESTAMP
  created_at   TIMESTAMP   NOT NULL DEFAULT NOW()
  expires_at   TIMESTAMP

outbox_events:
  id           UUID      PK
  event_type   VARCHAR(100) NOT NULL
  payload      JSONB        NOT NULL
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
  processed_at TIMESTAMP
```

#### gRPC Surface (24 RPCs)

| RPC | Input | Purpose |
|---|---|---|
| SendMagicLink | email, purpose, org_id? | Send login/invite/reset email |
| VerifyMagicLink | token | Validate token → create session |
| Login | email, password | Email+password → session |
| LoginSSO | org_id, redirect_uri | Initiate OIDC/SAML flow, return redirect URL |
| HandleSSOCallback | code, state | Process provider callback → create session |
| Logout | session_token | Invalidate one session |
| LogoutAll | user_id | Invalidate all user sessions |
| GetCurrentSession | session_token | Resolve token → user + org context |
| RefreshSession | session_token | Extend sliding expiry |
| SetupMFA | user_id, mfa_type | Initialize TOTP secret / WebAuthn registration |
| VerifyMFA | user_id, code | Validate TOTP or WebAuthn assertion |
| DisableMFA | user_id | Remove MFA (requires re-authentication) |
| GetSSOConfig | org_id | Return SSO config for login page rendering |
| UpsertSSOConfig | org_id, config | Admin: configure SAML or OIDC |
| TestSSOConfig | config | Validate config before saving |
| CreateSCIMToken | org_id, description | Generate SCIM provisioning bearer token |
| HandleSCIMProvision | org_id, scim_event | Process SCIM user/group create/update/delete |
| ForgotPassword | email | Send password reset magic link |
| ResetPassword | token, new_password | Process password reset from magic link |
| ChangePassword | session_token, old_pw, new_pw | In-session password change |
| GetUser | user_id or email | Retrieve user record |
| CreateUser | email, name | Admin or SCIM user creation |
| DeleteUser | user_id | Soft-delete + invalidate all sessions |
| Health | — | gRPC standard health check |

#### Events Published (via Kafka outbox)
user.created, user.verified_email, user.logged_in, user.login_failed, user.mfa_enabled, user.mfa_disabled, user.password_changed, user.deleted, user.sso_configured, user.scim_provisioned, user.scim_deprovisioned, session.created, session.expired, session.revoked

#### Events Consumed
None — Layer 1 foundation; no upstream Kafka dependencies.

---

### identity/user-service | Port 9002 | gRPC 50002
**Canonical ownership**: User profiles, preferences, notification settings, API key management.

#### Schema

```sql
user_profiles:
  user_id       UUID         PK FK users(id)
  display_name  VARCHAR(255) NOT NULL
  avatar_storage_id UUID
  job_title     VARCHAR(100)
  department    VARCHAR(100)
  timezone      VARCHAR(50)  DEFAULT 'UTC'
  locale        VARCHAR(10)  DEFAULT 'en-US'
  bio           TEXT
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()

user_preferences:
  user_id                UUID  PK FK users(id)
  theme                  VARCHAR(20)  DEFAULT 'system'    -- 'light' | 'dark' | 'system'
  email_notifications    JSONB        DEFAULT '{}'
  slack_notifications    JSONB        DEFAULT '{}'
  dashboard_layout       JSONB        DEFAULT '{}'
  updated_at             TIMESTAMP    NOT NULL DEFAULT NOW()

api_keys:
  id           UUID        PK
  user_id      UUID        FK users(id)
  org_id       UUID        NOT NULL
  name         VARCHAR(255) NOT NULL
  key_hash     VARCHAR(64)  UNIQUE NOT NULL   -- SHA-256 of actual key
  key_prefix   VARCHAR(10)  NOT NULL           -- 'rw_live_xxxx...' first 10 chars for display
  scopes       VARCHAR(50)[] NOT NULL DEFAULT '{}'
  last_used_at TIMESTAMP
  expires_at   TIMESTAMP
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
  revoked_at   TIMESTAMP
  INDEX (org_id, user_id)
```

#### gRPC Surface
GetProfile, UpdateProfile, GetPreferences, UpdatePreferences, CreateAPIKey, ListAPIKeys, RevokeAPIKey, ValidateAPIKey (called by api-gateway to resolve key → user context), GetUserActivity.

#### Events Published
user.profile_updated, api_key.created, api_key.revoked, api_key.used.

---

### organizations/organization-service | Port 9010 | gRPC 50010
**Canonical ownership**: Organization CRUD, membership management, invitations, sub-organizations, org settings.

#### Schema

```sql
organizations:
  id                  UUID         PK
  name                VARCHAR(255) NOT NULL
  slug                VARCHAR(100) UNIQUE NOT NULL
  description         TEXT
  website_url         VARCHAR(500)
  logo_storage_id     UUID
  industry            VARCHAR(100)                   -- 'saas' | 'healthcare' | 'fintech' | ...
  employee_count_band VARCHAR(50)                    -- '1-10' | '11-50' | '51-200' | '201-1000' | '1000+'
  hq_country          VARCHAR(2)                     -- ISO 3166-1 alpha-2
  parent_org_id       UUID         FK organizations(id)
  billing_plan        VARCHAR(50)  DEFAULT 'community'
  trial_ends_at       TIMESTAMP
  is_active           BOOLEAN      NOT NULL DEFAULT true
  created_at          TIMESTAMP    NOT NULL DEFAULT NOW()
  updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
  deleted_at          TIMESTAMP

org_members:
  id                UUID        PK
  org_id            UUID        FK organizations(id) ON DELETE CASCADE
  user_id           UUID        NOT NULL
  role              VARCHAR(50) NOT NULL   -- 'owner'|'admin'|'security_lead'|'member'|'viewer'
  department        VARCHAR(100)
  is_active         BOOLEAN     NOT NULL DEFAULT true
  invited_by_user_id UUID
  joined_at         TIMESTAMP   NOT NULL DEFAULT NOW()
  last_active_at    TIMESTAMP
  UNIQUE (org_id, user_id)
  INDEX (user_id)

org_invitations:
  id                  UUID        PK
  org_id              UUID        FK organizations(id)
  email               VARCHAR(255) NOT NULL
  role                VARCHAR(50)  NOT NULL
  invited_by_user_id  UUID         NOT NULL
  token_hash          VARCHAR(64)  UNIQUE NOT NULL
  expires_at          TIMESTAMP    NOT NULL   -- 72h default
  accepted_at         TIMESTAMP
  created_at          TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (org_id, email)

org_settings:
  org_id                    UUID         PK FK organizations(id)
  compliance_contact_email  VARCHAR(255)
  security_contact_email    VARCHAR(255)
  require_mfa               BOOLEAN      NOT NULL DEFAULT false
  allowed_ip_ranges         CIDR[]
  data_residency_region     VARCHAR(20)  -- 'us' | 'eu' | 'apac'
  custom_fields             JSONB        DEFAULT '{}'
  updated_at                TIMESTAMP    NOT NULL DEFAULT NOW()
```

#### gRPC Surface
CreateOrg, GetOrg, UpdateOrg, DeleteOrg, ListUserOrgs, GetOrgMembers, InviteMember, AcceptInvitation, RemoveMember, UpdateMemberRole, GetOrgSettings, UpdateOrgSettings, CreateSubOrg, ListSubOrgs, GetOrgInvitations, RevokeInvitation.

#### Events Published
org.created, org.updated, org.deleted, org.member_added, org.member_removed, org.member_role_changed, org.invitation_sent, org.invitation_accepted.

---

### platform/storage-service | Port 9031 | gRPC 50031
**Canonical ownership**: All file storage. Backend: MinIO (self-hosted) / AWS S3 / GCS / Azure Blob (pluggable).

#### Schema

```sql
stored_files:
  id              UUID        PK
  org_id          UUID        NOT NULL
  bucket          VARCHAR(100) NOT NULL
  storage_key     VARCHAR(500) UNIQUE NOT NULL
  original_filename VARCHAR(255) NOT NULL
  content_type    VARCHAR(100) NOT NULL
  size_bytes      BIGINT       NOT NULL
  sha256_hash     VARCHAR(64)  NOT NULL   -- Immutability verification
  purpose         VARCHAR(50)  NOT NULL   -- 'evidence'|'policy'|'report'|'logo'|'avatar'|'export'
  uploaded_by_user_id UUID    NOT NULL
  metadata        JSONB        DEFAULT '{}'
  virus_scan_status VARCHAR(20) DEFAULT 'pending'   -- 'pending'|'clean'|'infected'|'failed'
  virus_scan_completed_at TIMESTAMP
  is_public       BOOLEAN      NOT NULL DEFAULT false
  deleted_at      TIMESTAMP
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (org_id, purpose)
  INDEX (sha256_hash)
```

#### gRPC Surface
GetUploadURL (presigned PUT, 15-min TTL), CompleteUpload (triggers virus scan), GetDownloadURL (presigned GET, configurable TTL), GetFile, DeleteFile, GetFileByHash, ListFiles, VerifyFileHash (recomputes hash and compares — tamper detection).

#### Events Published
file.uploaded, file.virus_scan_completed, file.deleted.

---

### platform/notification-service | Port 9032 | gRPC 50032
**Canonical ownership**: All outbound notifications via Email (AWS SES), Slack, MS Teams, PagerDuty, Webhook.

#### Schema

```sql
notification_channels:
  id            UUID        PK
  org_id        UUID        NOT NULL
  channel_type  VARCHAR(30) NOT NULL   -- 'email'|'slack'|'teams'|'pagerduty'|'webhook'
  name          VARCHAR(255) NOT NULL
  config_enc    BYTEA        NOT NULL  -- KMS-encrypted (webhook URL, bot token, routing key...)
  is_active     BOOLEAN      NOT NULL DEFAULT true
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()

notification_subscriptions:
  id               UUID        PK
  org_id           UUID        NOT NULL
  channel_id       UUID        FK notification_channels(id)
  event_type       VARCHAR(100)   -- NULL = all events
  severity_filter  VARCHAR(20)    -- NULL = all; 'critical'|'high'|'medium'|'low'
  framework_filter VARCHAR(50)    -- NULL = all frameworks
  is_active        BOOLEAN     NOT NULL DEFAULT true

notification_log:
  id           UUID        PK
  org_id       UUID        NOT NULL
  channel_id   UUID        FK notification_channels(id)
  event_type   VARCHAR(100) NOT NULL
  subject      VARCHAR(500) NOT NULL
  payload      JSONB        NOT NULL
  status       VARCHAR(20)  NOT NULL DEFAULT 'pending'   -- 'sent'|'failed'|'skipped'
  sent_at      TIMESTAMP
  error_message TEXT
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (org_id, created_at DESC)
```

#### gRPC Surface
SendNotification, CreateChannel, UpdateChannel, DeleteChannel, TestChannel, ListChannels, CreateSubscription, DeleteSubscription, ListNotificationLog.

#### Events Consumed
Subscribes to ALL Kafka topics. Routes based on org subscriptions and event severity. Default alert triggers: test.failed (critical → immediate), evidence.expiring (14d → immediate), remediation.sla_breached (immediate), integration.disconnected (immediate), compliance_period.approaching (30d → weekly).

---

### platform/audit-log-service | Port 9033 | gRPC 50033
**Canonical ownership**: Immutable, append-only audit log of all user actions and system events. Never updated, never deleted. 7-year retention on Cloud.

#### Schema

```sql
audit_events:
  id            UUID         PK
  org_id        UUID         NOT NULL
  actor_type    VARCHAR(20)  NOT NULL   -- 'user'|'system'|'api_key'|'integration'
  actor_id      VARCHAR(255) NOT NULL
  actor_email   VARCHAR(255)            -- denormalized for display
  action        VARCHAR(100) NOT NULL   -- 'evidence.accepted'|'user.invited'|...
  resource_type VARCHAR(50)
  resource_id   VARCHAR(255)
  resource_name VARCHAR(255)            -- denormalized for display
  ip_hash       VARCHAR(64)             -- SHA-256 of IP; never store raw
  user_agent    VARCHAR(500)
  metadata      JSONB
  occurred_at   TIMESTAMP    NOT NULL DEFAULT NOW()

  -- Monthly range partitioning by occurred_at
  -- Retention: 7 years Cloud; configurable self-hosted (min 1 year enforced)

  INDEX (org_id, occurred_at DESC)
  INDEX (org_id, action, occurred_at DESC)
  INDEX (org_id, actor_id, occurred_at DESC)
  INDEX (org_id, resource_type, resource_id, occurred_at DESC)
```

#### gRPC Surface
RecordEvent (called by ALL other services for any user-facing or security-relevant action), QueryEvents (paginated, full-text + field filter), ExportEvents (CSV/JSON for auditor download + GDPR portability), GetEvent.

---

### platform/config-service | Port 9034 | gRPC 50034
**Canonical ownership**: Feature flags, plan entitlements, system-level configuration.

#### Schema

```sql
feature_flags:
  id            UUID         PK
  flag_key      VARCHAR(100) UNIQUE NOT NULL
  description   TEXT
  default_value BOOLEAN      NOT NULL DEFAULT false
  is_active     BOOLEAN      NOT NULL DEFAULT true
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()

org_feature_overrides:
  org_id    UUID        NOT NULL
  flag_key  VARCHAR(100) NOT NULL
  value     BOOLEAN      NOT NULL
  reason    TEXT
  set_at    TIMESTAMP    NOT NULL DEFAULT NOW()
  PRIMARY KEY (org_id, flag_key)

plan_entitlements:
  plan_name    VARCHAR(50)  NOT NULL
  feature_key  VARCHAR(100) NOT NULL
  value        JSONB        NOT NULL   -- boolean, number, or string limit
  PRIMARY KEY (plan_name, feature_key)

system_config:
  config_key   VARCHAR(100) PK
  config_value JSONB        NOT NULL
  description  TEXT
  is_secret    BOOLEAN      NOT NULL DEFAULT false
  updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
```

#### gRPC Surface
GetFeatureFlag, SetOrgFeatureOverride, ListFeatureFlags, CheckEntitlement (plan-based feature gating), GetSystemConfig, UpdateSystemConfig.

---

## Part VI: Layer 2 — Compliance Engine (8 Services)

---

### compliance/framework-service | Port 9100 | gRPC 50100
**Canonical ownership**: Framework catalog (38 frameworks), org activations, scoping questionnaires, compliance period lifecycle, Statement of Applicability (SoA) auto-generation.

#### Schema

```sql
-- Global catalog — seeded from packages/framework-registry/ on deploy
frameworks:
  id                    VARCHAR(50)  PK    -- 'soc2' | 'iso27001' | 'hipaa' ...
  name                  VARCHAR(255) NOT NULL
  short_name            VARCHAR(50)  NOT NULL
  version               VARCHAR(20)  NOT NULL
  publisher             VARCHAR(100) NOT NULL
  category              VARCHAR(50)  NOT NULL
  cert_type             VARCHAR(30)  NOT NULL
  renewal_period_months INTEGER
  description           TEXT
  is_active             BOOLEAN      NOT NULL DEFAULT true
  created_at            TIMESTAMP    NOT NULL DEFAULT NOW()

framework_domains:
  id           UUID        PK
  framework_id VARCHAR(50) FK frameworks(id)
  code         VARCHAR(50) NOT NULL    -- 'CC6' | 'A.8' | '164.308'
  name         VARCHAR(255) NOT NULL
  description  TEXT
  sort_order   INTEGER     NOT NULL DEFAULT 0
  UNIQUE (framework_id, code)

scoping_questions:
  id             UUID        PK
  framework_id   VARCHAR(50) FK frameworks(id)
  question_key   VARCHAR(100) NOT NULL
  question_text  TEXT         NOT NULL
  help_text      TEXT
  question_type  VARCHAR(30)  NOT NULL   -- 'yes_no'|'multiple_choice'|'number'|'multi_select'
  options        JSONB
  affects_controls VARCHAR(255)[]       -- control IDs affected by this answer
  sort_order     INTEGER      NOT NULL DEFAULT 0
  UNIQUE (framework_id, question_key)

org_frameworks:
  id                UUID        PK
  org_id            UUID        NOT NULL
  framework_id      VARCHAR(50) FK frameworks(id)
  is_active         BOOLEAN     NOT NULL DEFAULT true
  target_cert_level VARCHAR(50)          -- 'type1'|'type2'|'level2'|'certified'
  target_cert_date  DATE
  activated_at      TIMESTAMP   NOT NULL DEFAULT NOW()
  deactivated_at    TIMESTAMP
  UNIQUE (org_id, framework_id)
  INDEX (org_id)

org_scoping_answers:
  id                    UUID        PK
  org_id                UUID        NOT NULL
  framework_id          VARCHAR(50) FK frameworks(id)
  question_key          VARCHAR(100) NOT NULL
  answer                JSONB        NOT NULL
  answered_by_user_id   UUID         NOT NULL
  answered_at           TIMESTAMP    NOT NULL DEFAULT NOW()
  UNIQUE (org_id, framework_id, question_key)

compliance_periods:
  id                        UUID        PK
  org_id                    UUID        NOT NULL
  framework_id              VARCHAR(50) FK frameworks(id)
  period_name               VARCHAR(100) NOT NULL   -- 'FY2026 SOC 2 Type II'
  period_type               VARCHAR(30)  NOT NULL   -- 'quarterly'|'annual'|'custom'
  starts_at                 TIMESTAMP    NOT NULL
  ends_at                   TIMESTAMP    NOT NULL
  target_cert_date          DATE
  auditor_org_id            UUID
  auditor_name              VARCHAR(255)
  status                    VARCHAR(30)  NOT NULL DEFAULT 'planning'
    -- 'planning'|'active'|'in_audit'|'certified'|'closed'
  cert_received_at          TIMESTAMP
  cert_expiry_at            TIMESTAMP
  cert_document_storage_id  UUID
  notes                     TEXT
  created_at                TIMESTAMP    NOT NULL DEFAULT NOW()
  updated_at                TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (org_id, framework_id, status)

-- ISO 27001 Statement of Applicability
statement_of_applicability:
  id                    UUID        PK
  org_id                UUID        NOT NULL
  framework_id          VARCHAR(50) NOT NULL
  control_id            VARCHAR(100) NOT NULL
  is_applicable         BOOLEAN      NOT NULL
  justification         TEXT         NOT NULL
  implementation_status VARCHAR(30)  -- 'not_started'|'planned'|'in_progress'|'implemented'
  version               INTEGER      NOT NULL DEFAULT 1
  last_reviewed_at      TIMESTAMP
  last_reviewed_by      UUID
  created_at            TIMESTAMP    NOT NULL DEFAULT NOW()
  UNIQUE (org_id, framework_id, control_id)
```

#### gRPC Surface (19 RPCs)

| RPC | Purpose |
|---|---|
| ListFrameworks | All 38 frameworks in catalog |
| GetFramework | Framework detail + domain breakdown |
| ActivateFramework | Org adds a framework |
| DeactivateFramework | Org removes a framework |
| ListOrgFrameworks | Org's active frameworks + scores |
| GetScopingQuestions | Scoping questionnaire for a framework |
| SubmitScopingAnswers | Record org's scoping answers |
| GetScopingAnswers | Retrieve saved scoping answers |
| GetControlsInScope | Controls applicable after scoping |
| CreateCompliancePeriod | Create assessment period |
| UpdateCompliancePeriod | Update period status/dates/auditor |
| GetCompliancePeriod | Period detail |
| ListCompliancePeriods | Org's periods (all statuses) |
| GetComplianceScore | Current score for org+framework |
| GetSoA | ISO 27001 Statement of Applicability |
| UpdateSoAEntry | Update applicability + justification |
| ExportSoA | Generate auditor-ready SoA PDF |
| GetFrameworkDomains | Domain breakdown for a framework |
| Health | gRPC standard health check |

#### Events Published
framework.activated, framework.deactivated, compliance_period.created, compliance_period.status_changed, compliance_period.certified, scoping.answers_submitted.

#### Events Consumed
org.created (auto-suggest frameworks by industry), compliance_period.approaching (trigger notification for upcoming cert date).

---

### compliance/control-service | Port 9101 | gRPC 50101
**Canonical ownership**: Unified control catalog (2,340+ unique controls), org control implementation status, cross-framework mappings, owner assignments, compliance scoring.

#### Schema

```sql
-- Global catalog — seeded from packages/control-library/ on deploy
controls:
  id                      VARCHAR(100) PK   -- 'ctrl_access_mfa_enforcement'
  name                    VARCHAR(255) NOT NULL
  description             TEXT         NOT NULL
  guidance                TEXT
  domain                  VARCHAR(100) NOT NULL   -- 'access_control'|'change_management'|...
  category                VARCHAR(50)  NOT NULL   -- 'technical'|'administrative'|'physical'
  automation_level        VARCHAR(30)  NOT NULL   -- 'fully_automated'|'partially_automated'|'manual'
  risk_if_failed          VARCHAR(20)  NOT NULL   -- 'critical'|'high'|'medium'|'low'
  typical_owner_role      VARCHAR(50)             -- 'security_lead'|'devops'|'hr'|'legal'
  typical_remediation_days INTEGER
  test_ids                VARCHAR(100)[]
  evidence_types          VARCHAR(50)[]
  tags                    VARCHAR(50)[]
  is_active               BOOLEAN      NOT NULL DEFAULT true
  created_at              TIMESTAMP    NOT NULL DEFAULT NOW()

framework_control_mappings:
  control_id   VARCHAR(100) FK controls(id)
  framework_id VARCHAR(50)  FK frameworks(id)
  clause       VARCHAR(100) NOT NULL   -- 'CC6.1'|'A.8.3'|'164.312(a)(1)'
  clause_name  VARCHAR(255)
  is_required  BOOLEAN      NOT NULL DEFAULT true
  notes        TEXT
  PRIMARY KEY (control_id, framework_id, clause)
  INDEX (framework_id, clause)
  INDEX (control_id)

-- Per-org implementation status
org_controls:
  id                     UUID         PK
  org_id                 UUID         NOT NULL
  control_id             VARCHAR(100) FK controls(id)
  status                 VARCHAR(30)  NOT NULL DEFAULT 'not_started'
    -- 'not_started'|'in_progress'|'implemented'|'failing'|'not_applicable'|'excluded'
  implementation_notes   TEXT
  owner_user_id          UUID
  last_test_at           TIMESTAMP
  last_test_result       VARCHAR(20)   -- 'pass'|'fail'|'warn'|'error'|'not_run'
  passing_test_count     INTEGER       NOT NULL DEFAULT 0
  total_test_count       INTEGER       NOT NULL DEFAULT 0
  passing_evidence_count INTEGER       NOT NULL DEFAULT 0
  required_evidence_count INTEGER      NOT NULL DEFAULT 0
  risk_score             DECIMAL(5,2)
  is_applicable          BOOLEAN       NOT NULL DEFAULT true
  na_reason              TEXT
  excluded_reason        TEXT
  created_at             TIMESTAMP     NOT NULL DEFAULT NOW()
  updated_at             TIMESTAMP     NOT NULL DEFAULT NOW()
  UNIQUE (org_id, control_id)
  INDEX (org_id, status)
  INDEX (org_id, owner_user_id)

control_status_history:
  id            UUID        PK
  org_id        UUID        NOT NULL
  control_id    VARCHAR(100) NOT NULL
  from_status   VARCHAR(30)
  to_status     VARCHAR(30) NOT NULL
  changed_by    VARCHAR(100)    -- user_id or 'system'
  change_reason TEXT
  changed_at    TIMESTAMP   NOT NULL DEFAULT NOW()
  INDEX (org_id, control_id, changed_at DESC)
```

#### gRPC Surface (15 RPCs)

| RPC | Purpose |
|---|---|
| ListControls | Global catalog (filter by domain/framework/category) |
| GetControl | Control detail + all framework mappings |
| GetControlsByFramework | All controls for a given framework |
| GetOrgControl | Org's implementation of a specific control |
| ListOrgControls | Org controls (filter by status/domain/owner/framework) |
| UpdateOrgControlStatus | Set status + implementation notes |
| AssignControlOwner | Set responsible owner |
| GetControlHistory | Status change audit trail |
| GetControlCrossMapping | "This control maps to N clauses across M frameworks" |
| BulkGetControlStatus | Batch fetch for dashboard performance |
| GetComplianceSummary | Per-framework score + domain breakdown |
| ListFailingControls | All controls currently in failing state |
| ListUnownedControls | Controls without assigned owner |
| GetControlGapAnalysis | Controls not yet started per framework |
| ExportControlMatrix | Excel/CSV of all controls + framework mappings |

#### Events Published
control.status_changed, control.owner_assigned, control.implemented, control.failing, control.passed.

#### Events Consumed
test.result_recorded (update passing_test_count + last_test_result → recalculate status), evidence.accepted / evidence.expired (update evidence counts), scoping.answers_submitted (recalculate is_applicable for affected controls), framework.activated (populate org_controls for new framework), org.member_removed (reassign controls owned by departed member).

---

### compliance/test-runner-service | Port 9102 | gRPC 50102
**Canonical ownership**: Test catalog (4,100+ tests), per-org scheduling, BullMQ execution, result storage with SHA-256 immutability, automated evidence snapshot creation.

#### Schema

```sql
-- Global test catalog — seeded from packages/test-catalog/ on deploy
tests:
  id                   VARCHAR(100) PK   -- 'test_aws_iam_mfa_enforced'
  name                 VARCHAR(255) NOT NULL
  description          TEXT         NOT NULL
  control_ids          VARCHAR(100)[]
  connector_id         VARCHAR(50)  NOT NULL
  test_type            VARCHAR(30)  NOT NULL   -- 'automated'|'manual'|'mixed'
  cadence              VARCHAR(30)  NOT NULL   -- 'every_4h'|'daily'|'weekly'|'on_change'
  severity             VARCHAR(20)  NOT NULL   -- 'critical'|'high'|'medium'|'low'
  remediation_steps    JSONB        NOT NULL
  remediation_link     VARCHAR(500)
  estimated_fix_minutes INTEGER
  frameworks           VARCHAR(50)[]
  is_active            BOOLEAN      NOT NULL DEFAULT true
  created_at           TIMESTAMP    NOT NULL DEFAULT NOW()

org_test_schedules:
  id                    UUID        PK
  org_id                UUID        NOT NULL
  test_id               VARCHAR(100) FK tests(id)
  connector_instance_id UUID         NOT NULL
  is_enabled            BOOLEAN      NOT NULL DEFAULT true
  custom_cadence        VARCHAR(30)
  next_run_at           TIMESTAMP    NOT NULL
  last_run_at           TIMESTAMP
  UNIQUE (org_id, test_id, connector_instance_id)
  INDEX (next_run_at, is_enabled)

test_results:
  id                    UUID        PK
  org_id                UUID        NOT NULL
  test_id               VARCHAR(100) FK tests(id)
  connector_instance_id UUID         NOT NULL
  result                VARCHAR(20)  NOT NULL   -- 'pass'|'fail'|'warn'|'error'|'not_applicable'
  result_detail         TEXT
  raw_data              JSONB                   -- API response snapshot
  raw_data_hash         VARCHAR(64)            -- SHA-256 of raw_data; immutability
  duration_ms           INTEGER
  run_at                TIMESTAMP    NOT NULL DEFAULT NOW()
  expires_at            TIMESTAMP    NOT NULL   -- 90 days TTL for automated_snapshot
  evidence_id           UUID                   -- FK evidence-service
  INDEX (org_id, test_id, run_at DESC)
  INDEX (org_id, result, run_at DESC)

test_jobs:
  id                    UUID        PK
  org_id                UUID        NOT NULL
  test_id               VARCHAR(100) NOT NULL
  connector_instance_id UUID         NOT NULL
  bullmq_job_id         VARCHAR(100)
  queue_name            VARCHAR(50)  NOT NULL
  status                VARCHAR(20)  NOT NULL DEFAULT 'queued'
  attempts              INTEGER      NOT NULL DEFAULT 0
  queued_at             TIMESTAMP    NOT NULL DEFAULT NOW()
  started_at            TIMESTAMP
  completed_at          TIMESTAMP
  error_message         TEXT
```

#### BullMQ Queue Architecture

| Queue | Priority | Cadence | Test Types |
|---|---|---|---|
| test-critical | 10 | Every 4 hours | MFA, encryption, public exposure, privileged access |
| test-standard | 5 | Every 24 hours | Config, logging, network, training |
| test-slow | 1 | Weekly | Full inventory scans, comprehensive checks |
| test-ondemand | 8 | User/webhook-triggered | Any test triggered manually or by event |

Workers: Horizontally scalable; 1 worker per connector category per pod. Retry: 3 attempts with exponential backoff (1m, 5m, 15m). Dead letter queue for failed jobs after 3 attempts.

#### gRPC Surface (16 RPCs)

| RPC | Purpose |
|---|---|
| ListTests | Global test catalog (filter by connector/control/framework) |
| GetTest | Test detail + remediation steps |
| GetTestsByControl | All tests that verify a specific control |
| GetTestsByConnector | All tests a connector provides |
| EnableTest | Enable a specific test for org |
| DisableTest | Disable a specific test for org |
| TriggerTest | On-demand single test execution |
| TriggerAllTests | On-demand full org re-scan |
| GetTestResult | Latest result for a test+connector instance |
| GetTestResultHistory | Historical results (trend data) |
| ListFailingTests | All currently-failing tests for org |
| GetTestCoverage | % of controls with ≥1 automated test |
| GetTestSchedule | Upcoming test runs with next_run_at |
| GetTestJobStatus | BullMQ job status by job ID |
| ListTestResultsByControl | All test results for a specific control |
| ExportTestResults | CSV/JSON export of test results |

#### Events Published
test.result_recorded (every execution), test.failed (PASS→FAIL transition only), test.passed (FAIL→PASS transition only), test.schedule_missed (test overdue by 2× its cadence).

#### Events Consumed
integration.connected (schedule tests for new connector instance), integration.disconnected (disable all tests for that instance), integration.sync_completed (trigger relevant on_change tests).

---

### compliance/evidence-service | Port 9103 | gRPC 50103
**Canonical ownership**: Evidence lifecycle from collection through acceptance through expiry. SHA-256 immutability enforcement. Control linking. Evidence requests.

#### Schema

```sql
evidence:
  id                    UUID        PK
  org_id                UUID        NOT NULL
  evidence_type         VARCHAR(50) NOT NULL
    -- 'screenshot'|'document'|'json_export'|'csv_export'|'log_excerpt'
    -- |'report'|'ticket'|'attestation'|'automated_snapshot'
  title                 VARCHAR(255) NOT NULL
  description           TEXT
  storage_id            UUID                       -- FK storage-service
  external_url          VARCHAR(1000)
  sha256_hash           VARCHAR(64)               -- SET ONCE on acceptance; never changed
  file_size_bytes       BIGINT
  content_type          VARCHAR(100)
  status                VARCHAR(30) NOT NULL DEFAULT 'pending_review'
    -- 'collected'|'pending_review'|'accepted'|'rejected'|'expired'|'archived'
  collection_method     VARCHAR(30) NOT NULL
    -- 'automated'|'manual_upload'|'url_link'|'screen_capture'|'api'|'email'
  connector_id          VARCHAR(50)                -- which connector collected it
  connector_instance_id UUID
  test_result_id        UUID                       -- FK test-runner result
  uploaded_by_user_id   UUID
  reviewed_by_user_id   UUID
  review_notes          TEXT
  accepted_at           TIMESTAMP                  -- SET ONCE; immutability marker
  rejected_at           TIMESTAMP
  rejection_reason      TEXT
  collected_at          TIMESTAMP   NOT NULL DEFAULT NOW()
  expires_at            TIMESTAMP   NOT NULL        -- per evidence_type TTL rules (Q21)
  period_id             UUID                        -- FK compliance period
  created_at            TIMESTAMP   NOT NULL DEFAULT NOW()
  INDEX (org_id, status, expires_at)
  INDEX (org_id, evidence_type, collected_at DESC)

evidence_control_links:
  id                UUID        PK
  org_id            UUID        NOT NULL
  evidence_id       UUID        FK evidence(id) ON DELETE CASCADE
  control_id        VARCHAR(100) NOT NULL
  framework_id      VARCHAR(50)
  clause            VARCHAR(100)
  linked_by_user_id UUID
  linked_at         TIMESTAMP   NOT NULL DEFAULT NOW()
  UNIQUE (org_id, evidence_id, control_id)
  INDEX (org_id, control_id)

evidence_requests:
  id                    UUID        PK
  org_id                UUID        NOT NULL
  control_id            VARCHAR(100) NOT NULL
  requested_by          VARCHAR(100) NOT NULL   -- user_id or 'auditor:{invitation_id}'
  assigned_to_user_id   UUID
  title                 VARCHAR(255) NOT NULL
  description           TEXT         NOT NULL
  evidence_type         VARCHAR(50)
  due_date              DATE
  status                VARCHAR(30)  NOT NULL DEFAULT 'open'
    -- 'open'|'in_progress'|'fulfilled'|'waived'
  fulfilled_evidence_id UUID         FK evidence(id)
  notes                 TEXT
  created_at            TIMESTAMP    NOT NULL DEFAULT NOW()
  updated_at            TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (org_id, status, due_date)
  INDEX (assigned_to_user_id, status)
```

#### gRPC Surface (17 RPCs)

| RPC | Purpose |
|---|---|
| SubmitEvidence | Submit new evidence (manual upload, URL, screen capture) |
| CreateAutomatedEvidence | System creates snapshot from test result |
| GetEvidence | Evidence detail |
| ListEvidenceByControl | All evidence linked to a control |
| ListEvidenceByPeriod | All evidence in a compliance period |
| AcceptEvidence | Reviewer accepts evidence (locks SHA-256 hash) |
| RejectEvidence | Reviewer rejects with reason |
| LinkEvidenceToControl | Associate evidence with a control + optional clause |
| UnlinkEvidenceFromControl | Remove association |
| GetEvidenceCoverage | Which controls have accepted evidence in scope |
| ListExpiringEvidence | Evidence expiring within N days |
| ListPendingReview | Evidence awaiting human review |
| CreateEvidenceRequest | Admin or auditor requests specific evidence |
| FulfillEvidenceRequest | Submitter links evidence to request |
| ListEvidenceRequests | All open requests for org |
| VerifyEvidenceHash | Re-compute and compare SHA-256 (tamper check) |
| ExportEvidencePackage | ZIP of all accepted evidence for a period |

#### Events Published
evidence.submitted, evidence.accepted (payload includes sha256_hash), evidence.rejected, evidence.expired, evidence.request_created, evidence.request_fulfilled.

#### Events Consumed
test.result_recorded (auto-create automated_snapshot evidence on PASS result), storage.file_uploaded (link uploaded file to pending evidence record), compliance_period.closed (archive all period evidence).

---

### compliance/policy-service | Port 9104 | gRPC 50104
**Canonical ownership**: 80+ policy templates, org policy instances, version history, approval workflow, acknowledgment tracking, AI-assisted policy generation.

#### Schema

```sql
-- Global template library — seeded from packages/policy-templates/
policy_templates:
  id               VARCHAR(100) PK   -- 'tmpl_access_control_policy'
  name             VARCHAR(255) NOT NULL
  category         VARCHAR(100) NOT NULL
  description      TEXT
  template_content TEXT         NOT NULL   -- Markdown with {{variable}} placeholders
  variables        JSONB        NOT NULL   -- variable definitions + defaults
  framework_mappings JSONB      NOT NULL   -- {soc2: ['CC1.2','CC6.1'], iso27001: ['A.5.1']}
  last_reviewed_at DATE
  version          VARCHAR(20)  NOT NULL
  is_active        BOOLEAN      NOT NULL DEFAULT true

org_policies:
  id                  UUID        PK
  org_id              UUID        NOT NULL
  template_id         VARCHAR(100)             -- NULL for fully custom policies
  name                VARCHAR(255) NOT NULL
  category            VARCHAR(100) NOT NULL
  content             TEXT         NOT NULL    -- Rendered + customized Markdown
  content_variables   JSONB        DEFAULT '{}'
  status              VARCHAR(30)  NOT NULL DEFAULT 'draft'
    -- 'draft'|'in_review'|'approved'|'archived'
  version             INTEGER      NOT NULL DEFAULT 1
  effective_date      DATE
  review_date         DATE
  owner_user_id       UUID
  approved_by_user_id UUID
  approved_at         TIMESTAMP
  storage_id          UUID                     -- FK storage-service (PDF version)
  framework_mappings  JSONB        DEFAULT '{}'
  ai_generated        BOOLEAN      NOT NULL DEFAULT false
  created_at          TIMESTAMP    NOT NULL DEFAULT NOW()
  updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (org_id, category, status)

policy_versions:
  id                  UUID     PK
  policy_id           UUID     FK org_policies(id)
  version             INTEGER  NOT NULL
  content             TEXT     NOT NULL
  changed_by_user_id  UUID     NOT NULL
  change_summary      TEXT
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
  UNIQUE (policy_id, version)

policy_acknowledgments:
  id             UUID      PK
  org_id         UUID      NOT NULL
  policy_id      UUID      FK org_policies(id)
  user_id        UUID      NOT NULL
  acknowledged_at TIMESTAMP NOT NULL DEFAULT NOW()
  policy_version INTEGER   NOT NULL
  ip_hash        VARCHAR(64)
  UNIQUE (policy_id, user_id, policy_version)
  INDEX (org_id, policy_id)
```

#### gRPC Surface
ListTemplates, GetTemplate, CreatePolicyFromTemplate, CreateCustomPolicy, GetPolicy, UpdatePolicy, PublishPolicy, ArchivePolicy, ListOrgPolicies, GetPolicyHistory, ExportPolicyPDF, GetPolicyAcknowledgments, RecordAcknowledgment, GeneratePolicyWithAI, ListPoliciesByFramework, GetPolicyCoverage.

#### Events Published
policy.created, policy.updated, policy.approved, policy.archived, policy.acknowledgment_recorded.

#### Events Consumed
org.created (seed recommended starter policies), compliance_period.created (flag policies due for review before audit).

---

### compliance/risk-service | Port 9105 | gRPC 50105
**Canonical ownership**: Quantitative risk register, risk appetite configuration, DPIA management, ROPA records.

#### Schema

```sql
risk_register:
  id                    UUID        PK
  org_id                UUID        NOT NULL
  risk_category         VARCHAR(100) NOT NULL
  title                 VARCHAR(255) NOT NULL
  description           TEXT         NOT NULL
  likelihood            INTEGER      NOT NULL   -- 1-5
  impact                INTEGER      NOT NULL   -- 1-5
  inherent_risk_score   INTEGER      NOT NULL   -- likelihood × impact = 1-25
  control_ids           VARCHAR(100)[]
  control_effectiveness DECIMAL(5,2)            -- 0-1; derived from test pass rate
  residual_risk_score   DECIMAL(5,2)            -- inherent × (1 - effectiveness)
  risk_rating           VARCHAR(20)  NOT NULL   -- 'critical'|'high'|'medium'|'low'|'informational'
  status                VARCHAR(30)  NOT NULL DEFAULT 'open'
    -- 'open'|'accepted'|'mitigated'|'transferred'|'closed'
  treatment             VARCHAR(30)             -- 'mitigate'|'accept'|'transfer'|'avoid'
  owner_user_id         UUID
  due_date              DATE
  exceeds_appetite      BOOLEAN      NOT NULL DEFAULT false
  frameworks            VARCHAR(50)[]
  notes                 TEXT
  created_by_user_id    UUID         NOT NULL
  created_at            TIMESTAMP    NOT NULL DEFAULT NOW()
  updated_at            TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (org_id, risk_rating, status)

risk_appetite:
  org_id                         UUID     PK
  max_acceptable_inherent_score  INTEGER  NOT NULL DEFAULT 12
  max_acceptable_residual_score  INTEGER  NOT NULL DEFAULT 6
  risk_tolerance_notes           TEXT
  updated_at                     TIMESTAMP NOT NULL DEFAULT NOW()

dpia_records:
  id                  UUID        PK
  org_id              UUID        NOT NULL
  processing_activity VARCHAR(255) NOT NULL
  description         TEXT         NOT NULL
  legal_basis         VARCHAR(100)
  data_categories     VARCHAR(100)[]
  data_subjects       VARCHAR(100)[]
  recipients          VARCHAR(255)[]
  transfers           JSONB
  retention_period    VARCHAR(100)
  risk_level          VARCHAR(20)  NOT NULL
  dpia_required       BOOLEAN      NOT NULL
  dpia_completed      BOOLEAN      NOT NULL DEFAULT false
  dpa_consulted       BOOLEAN      NOT NULL DEFAULT false
  measures_taken      TEXT
  created_by_user_id  UUID         NOT NULL
  created_at          TIMESTAMP    NOT NULL DEFAULT NOW()
  updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (org_id, dpia_required, dpia_completed)
```

#### gRPC Surface
CreateRisk, UpdateRisk, GetRisk, ListRisks, AcceptRisk, CloseRisk, GetRiskAppetite, UpdateRiskAppetite, GetRisksExceedingAppetite, GetRiskTrend, CreateDPIA, UpdateDPIA, ListDPIAs, ExportRiskRegister, GetRiskHeatmap.

#### Events Published
risk.created, risk.status_changed, risk.exceeds_appetite, risk.score_updated.

#### Events Consumed
test.failed (recalculate control_effectiveness → residual score for linked risks), control.status_changed (same), scoping.answers_submitted (identify mandatory DPIAs from GDPR scoping answers).

---

### compliance/assessment-service | Port 9106 | gRPC 50106
**Canonical ownership**: Assessment checklists, audit readiness scoring, POA&M tracking, OSCAL SSP export.

#### Schema

```sql
assessment_checklists:
  id               UUID        PK
  org_id           UUID        NOT NULL
  period_id        UUID        FK compliance_periods(id)
  framework_id     VARCHAR(50) NOT NULL
  name             VARCHAR(255) NOT NULL
  total_items      INTEGER      NOT NULL DEFAULT 0
  completed_items  INTEGER      NOT NULL DEFAULT 0
  status           VARCHAR(30)  NOT NULL DEFAULT 'not_started'
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW()

checklist_items:
  id                   UUID        PK
  checklist_id         UUID        FK assessment_checklists(id)
  item_type            VARCHAR(30) NOT NULL   -- 'control'|'evidence'|'policy'|'custom'
  reference_id         VARCHAR(255)
  title                VARCHAR(500) NOT NULL
  description          TEXT
  status               VARCHAR(20)  NOT NULL DEFAULT 'not_started'
    -- 'not_started'|'in_progress'|'complete'|'na'
  assigned_to_user_id  UUID
  due_date             DATE
  notes                TEXT
  sort_order           INTEGER      NOT NULL DEFAULT 0
  completed_at         TIMESTAMP
  INDEX (checklist_id, status)

poam_entries:
  id                          UUID        PK
  org_id                      UUID        NOT NULL
  framework_id                VARCHAR(50) NOT NULL
  control_id                  VARCHAR(100) NOT NULL
  weakness_description        TEXT         NOT NULL
  responsible_entity          VARCHAR(255) NOT NULL
  resources_required          TEXT
  milestones                  JSONB        NOT NULL   -- [{name, due_date, status}]
  scheduled_completion_date   DATE         NOT NULL
  estimated_completion_date   DATE
  actual_completion_date      DATE
  status                      VARCHAR(30)  NOT NULL DEFAULT 'open'
    -- 'open'|'in_progress'|'completed'|'delayed'
  risk_rating                 VARCHAR(20)  NOT NULL
  detection_method            VARCHAR(100) -- 'automated_test'|'manual_review'|'audit_finding'
  notes                       TEXT
  created_at                  TIMESTAMP    NOT NULL DEFAULT NOW()
  updated_at                  TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (org_id, framework_id, status)

readiness_scores:
  id               UUID         PK
  org_id           UUID         NOT NULL
  framework_id     VARCHAR(50)  NOT NULL
  calculated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
  overall_score    DECIMAL(5,2) NOT NULL
  controls_score   DECIMAL(5,2)
  evidence_score   DECIMAL(5,2)
  policy_score     DECIMAL(5,2)
  people_score     DECIMAL(5,2)
  breakdown        JSONB        NOT NULL   -- per-domain breakdown
  INDEX (org_id, framework_id, calculated_at DESC)
```

#### gRPC Surface
CreateChecklist, GetChecklist, UpdateChecklistItem, GetReadinessScore, GeneratePOAM, UpdatePOAMEntry, ExportPOAM, ExportOSCAL_SSP, GetAssessmentTimeline, ListAuditReadinessIssues.

---

### compliance/remediation-service | Port 9107 | gRPC 50107
**Canonical ownership**: Remediation task lifecycle, external ticket sync (Jira/Linear/GitHub/Asana), SLA enforcement, auto-closure on test pass.

#### Schema

```sql
remediation_tasks:
  id                  UUID        PK
  org_id              UUID        NOT NULL
  title               VARCHAR(500) NOT NULL
  description         TEXT         NOT NULL
  source_type         VARCHAR(30)  NOT NULL
    -- 'test_failure'|'control_gap'|'risk'|'audit_finding'|'manual'
  source_id           VARCHAR(255)
  control_id          VARCHAR(100)
  framework_id        VARCHAR(50)
  severity            VARCHAR(20)  NOT NULL
  status              VARCHAR(30)  NOT NULL DEFAULT 'open'
    -- 'open'|'in_progress'|'blocked'|'resolved'|'accepted_risk'|'wont_fix'
  assigned_to_user_id UUID
  due_at              TIMESTAMP                -- calculated from creation + SLA
  sla_breached        BOOLEAN      NOT NULL DEFAULT false
  resolved_at         TIMESTAMP
  external_ticket_id  VARCHAR(255)             -- Jira key, Linear ID, GitHub issue number
  external_ticket_url VARCHAR(500)
  external_system     VARCHAR(30)              -- 'jira'|'linear'|'github'|'asana'
  external_sync_at    TIMESTAMP
  created_by          VARCHAR(100) NOT NULL    -- user_id or 'system'
  created_at          TIMESTAMP    NOT NULL DEFAULT NOW()
  updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (org_id, status, severity, due_at)
  INDEX (org_id, control_id, status)
  INDEX (org_id, assigned_to_user_id, status)

remediation_comments:
  id              UUID      PK
  task_id         UUID      FK remediation_tasks(id)
  author_user_id  UUID      NOT NULL
  content         TEXT      NOT NULL
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
```

#### gRPC Surface
CreateTask, UpdateTask, AssignTask, ResolveTask, MarkAcceptedRisk, ListTasks, GetTask, GetSLAStatus, SyncExternalTicket, CreateExternalTicket, ListBreachedSLAs, GetRemediationTrend, BulkAssignTasks.

#### Events Published
remediation.task_created, remediation.task_assigned, remediation.task_resolved, remediation.sla_breached.

#### Events Consumed
test.failed (auto-create remediation task; de-dupe: only if no open task already exists for this test+org), control.failing (auto-create task), risk.exceeds_appetite (auto-create task), test.passed (auto-resolve all open tasks linked to this test).

---

## Part VII: Layer 3 — Integration Engine (10 Services)

---

### integration/connector-registry | Port 9200 | gRPC 50200
**Canonical ownership**: Connector catalog (400+ connectors), connector instance management, health tracking, credential vault.

#### Schema

```sql
-- Global connector catalog — one row per connector type
connectors:
  id                        VARCHAR(50)  PK   -- 'aws' | 'github' | 'okta'
  name                      VARCHAR(255) NOT NULL
  vendor                    VARCHAR(255) NOT NULL
  category                  VARCHAR(50)  NOT NULL
  auth_type                 VARCHAR(30)  NOT NULL
    -- 'oauth2'|'api_key'|'iam_role'|'basic'|'mtls'
  description               TEXT
  logo_url                  VARCHAR(500)
  docs_url                  VARCHAR(500)
  permissions_required      JSONB
  test_ids_provided         VARCHAR(100)[]
  webhook_events_supported  VARCHAR(100)[]
  version                   VARCHAR(20)  NOT NULL DEFAULT '1.0.0'
  is_active                 BOOLEAN      NOT NULL DEFAULT true
  created_at                TIMESTAMP    NOT NULL DEFAULT NOW()

-- Per-org connected instances (one org may connect same connector multiple times)
connector_instances:
  id                   UUID        PK
  org_id               UUID        NOT NULL
  connector_id         VARCHAR(50) FK connectors(id)
  name                 VARCHAR(255) NOT NULL   -- 'Production AWS' | 'Staging AWS'
  credentials_enc      BYTEA        NOT NULL   -- KMS-encrypted credentials blob
  auth_type            VARCHAR(30)  NOT NULL
  auth_metadata        JSONB        DEFAULT '{}' -- non-secret: region, base_url, account_id
  status               VARCHAR(30)  NOT NULL DEFAULT 'active'
    -- 'active'|'disconnected'|'auth_error'|'suspended'
  last_sync_at         TIMESTAMP
  last_sync_status     VARCHAR(20)   -- 'success'|'partial'|'failed'
  last_sync_error      TEXT
  last_health_check_at TIMESTAMP
  next_sync_at         TIMESTAMP
  sync_frequency       VARCHAR(30)  DEFAULT 'daily'
  webhook_secret_enc   BYTEA                   -- KMS-encrypted webhook HMAC secret
  created_by_user_id   UUID         NOT NULL
  created_at           TIMESTAMP    NOT NULL DEFAULT NOW()
  updated_at           TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (org_id, connector_id)
  INDEX (org_id, status)

connector_sync_logs:
  id               UUID        PK
  instance_id      UUID        FK connector_instances(id)
  org_id           UUID        NOT NULL
  sync_type        VARCHAR(30) NOT NULL   -- 'full'|'incremental'|'webhook'|'on_demand'
  started_at       TIMESTAMP   NOT NULL
  completed_at     TIMESTAMP
  status           VARCHAR(20) NOT NULL   -- 'running'|'success'|'partial'|'failed'
  records_fetched  INTEGER     DEFAULT 0
  tests_triggered  INTEGER     DEFAULT 0
  error_message    TEXT
  created_at       TIMESTAMP   NOT NULL DEFAULT NOW()
  INDEX (instance_id, started_at DESC)
```

#### gRPC Surface (20 RPCs)
ListConnectors, GetConnector, ListOrgConnectors, GetConnectorInstance, CreateConnectorInstance, UpdateConnectorInstance, DeleteConnectorInstance, TestConnectorHealth, RefreshCredentials, TriggerSync, GetSyncStatus, ListSyncLogs, GetConnectorTestIds, UpdateConnectorStatus, ListConnectorsByCategory, GetConnectorOAuthURL, HandleOAuthCallback, RotateWebhookSecret, GetConnectorMetrics, Health.

#### Events Published
integration.connected, integration.disconnected, integration.auth_error, integration.sync_completed, integration.sync_failed.

---

### integration/oauth-service | Port 9201 | gRPC 50201
**Canonical ownership**: OAuth 2.0 flows for all OAuth-based connectors. PKCE state management, token storage, auto-refresh.

#### Schema

```sql
oauth_states:
  id              UUID        PK
  org_id          UUID        NOT NULL
  connector_id    VARCHAR(50) NOT NULL
  state_token     VARCHAR(100) UNIQUE NOT NULL
  code_verifier   VARCHAR(128)              -- PKCE S256
  redirect_uri    VARCHAR(500) NOT NULL
  metadata        JSONB        DEFAULT '{}'
  expires_at      TIMESTAMP    NOT NULL     -- 10 minute TTL
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW()

oauth_tokens:
  id                UUID        PK
  instance_id       UUID        FK connector_instances(id) UNIQUE
  org_id            UUID        NOT NULL
  access_token_enc  BYTEA       NOT NULL    -- KMS-encrypted
  refresh_token_enc BYTEA                   -- KMS-encrypted
  token_type        VARCHAR(50) NOT NULL DEFAULT 'Bearer'
  scopes            VARCHAR(100)[]
  expires_at        TIMESTAMP
  created_at        TIMESTAMP   NOT NULL DEFAULT NOW()
  updated_at        TIMESTAMP   NOT NULL DEFAULT NOW()
```

#### gRPC Surface
InitiateOAuthFlow, HandleOAuthCallback, RefreshAccessToken, RevokeOAuthToken, GetTokenStatus, ListExpiredTokens.

---

### integration/sync-engine | Port 9202 | gRPC 50202
**Canonical ownership**: Orchestrates all data sync — schedules pull-based syncs, routes webhook payloads to connectors, manages sync cursors for incremental sync.

#### Schema

```sql
sync_state:
  id                           UUID  PK
  instance_id                  UUID  FK connector_instances(id) UNIQUE
  org_id                       UUID  NOT NULL
  last_full_sync_at            TIMESTAMP
  last_incremental_sync_cursor JSONB   -- connector-specific pagination cursor
  sync_metadata                JSONB   DEFAULT '{}'
  updated_at                   TIMESTAMP NOT NULL DEFAULT NOW()

sync_queue:
  id            UUID        PK
  instance_id   UUID        NOT NULL
  org_id        UUID        NOT NULL
  sync_type     VARCHAR(30) NOT NULL   -- 'full'|'incremental'|'webhook'
  priority      INTEGER     NOT NULL DEFAULT 5
  payload       JSONB        DEFAULT '{}'
  status        VARCHAR(20) NOT NULL DEFAULT 'queued'
  scheduled_at  TIMESTAMP   NOT NULL DEFAULT NOW()
  started_at    TIMESTAMP
  completed_at  TIMESTAMP
  bullmq_job_id VARCHAR(100)
  INDEX (status, scheduled_at, priority DESC)
```

#### gRPC Surface
ScheduleSync, TriggerImmediateSync, GetSyncState, ResetSyncState, GetSyncQueue, CancelPendingSync.

---

### integration/cloud-connectors | Port 9203 | gRPC 50203
**Canonical ownership**: Stateless worker executing tests and syncs for cloud infra connectors (AWS, GCP, Azure, Cloudflare, DigitalOcean, OCI, IBM, Alibaba, etc.).

Receives test execution jobs from test-runner via BullMQ. Makes read-only API calls to cloud providers using decrypted credentials from connector-registry. Returns structured TestResult. Never stores data — delegates to test-runner and evidence-service.

Sample tests executed:
- test_aws_iam_mfa_enforced — all console IAM users have MFA
- test_aws_s3_no_public_buckets — no S3 bucket allows public access
- test_aws_cloudtrail_all_regions — CloudTrail enabled in every region
- test_aws_root_no_access_keys — root account has no active access keys
- test_aws_guardduty_enabled — GuardDuty active in all regions
- test_aws_security_hub_enabled — Security Hub aggregating findings
- test_gcp_no_default_service_accounts — default SAs not used in projects
- test_azure_mfa_conditional_access — Conditional Access policy enforces MFA
- test_cloudflare_tls_minimum_1_2 — minimum TLS version is 1.2+
- test_cloudflare_dnssec_enabled — DNSSEC on all zones

**gRPC**: RunCloudTest, SyncCloudData, GetCloudInventory, HealthCheck.

---

### integration/identity-connectors | Port 9204 | gRPC 50204
**Canonical ownership**: Tests and syncs for all IdP/IAM connectors. Primary cross-reference: HR-terminated employees vs active identity accounts.

Sample tests:
- test_okta_mfa_all_users
- test_okta_inactive_accounts_90d
- test_okta_admin_count_reasonable
- test_entra_pim_enabled
- test_entra_ca_requires_mfa
- test_google_workspace_2sv_enforced
- test_terminated_employee_account_disabled (multi-connector: HR + IdP)

**gRPC**: RunIdentityTest, SyncIdentityData, GetUserInventory, GetGroupInventory, GetAdminAccounts, CrossReferenceTerminatedUsers, HealthCheck.

---

### integration/code-connectors | Port 9205 | gRPC 50205
**Canonical ownership**: Tests and syncs for version control, CI/CD, SAST, SCA connectors.

Sample tests:
- test_github_branch_protection_default
- test_github_required_pr_reviews
- test_github_secret_scanning_enabled
- test_github_code_scanning_enabled
- test_github_no_exposed_secrets
- test_gitlab_protected_branches
- test_snyk_no_unresolved_critical_vulns

**gRPC**: RunCodeTest, SyncCodeData, GetRepositoryInventory, GetBranchProtectionStatus, GetSecurityScanStatus, HealthCheck.

---

### integration/hr-connectors | Port 9206 | gRPC 50206
**Canonical ownership**: Employee roster, employment status, training completion. Primary source of truth for "who works here."

Sample tests:
- test_hr_offboarding_completeness (cross-ref with identity)
- test_hr_background_checks_complete
- test_hr_security_training_completion_rate (≥95% threshold)
- test_hr_nda_signed_all_employees

**gRPC**: RunHRTest, SyncHRData, GetEmployeeRoster, GetTerminatedEmployees, GetTrainingCompletionStatus, CrossReferenceIdentitySystems, HealthCheck.

---

### integration/mdm-connectors | Port 9207 | gRPC 50207
**Canonical ownership**: Device compliance, encryption, patch status, EDR coverage.

Sample tests:
- test_mdm_disk_encryption_all_devices (100% FileVault + BitLocker)
- test_mdm_os_patching_current (no device >30d behind)
- test_mdm_screen_lock_enforced (≤5 min inactivity)
- test_mdm_edr_coverage_all_devices
- test_mdm_enrollment_rate (≥95% of org devices)

**gRPC**: RunMDMTest, SyncMDMData, GetDeviceInventory, GetEncryptionStatus, GetPatchComplianceStatus, GetEDRCoverage, HealthCheck.

---

### integration/security-connectors | Port 9208 | gRPC 50208
**Canonical ownership**: CSPM, SIEM, vulnerability scanner, bug bounty, security training connectors.

Sample tests:
- test_wiz_no_critical_open_issues
- test_crowdstrike_prevention_policy_active
- test_tenable_no_unresolved_critical_vulns
- test_knowbe4_phishing_click_rate (≤5%)
- test_knowbe4_training_completion (≥95%)
- test_hackerone_p1_response_sla
- test_pagerduty_24x7_on_call_coverage

**gRPC**: RunSecurityTest, SyncSecurityData, GetVulnerabilityFindings, GetSIEMAlertStatus, GetTrainingMetrics, GetBugBountyStatus, HealthCheck.

---

### integration/webhook-ingestion | Port 9209 | gRPC 50209
**Canonical ownership**: Inbound webhook receiver from all integrated systems. HMAC signature validation. Event routing. On-change test triggering.

#### Schema

```sql
webhook_events:
  id                UUID        PK
  connector_id      VARCHAR(50) NOT NULL
  instance_id       UUID        NOT NULL
  org_id            UUID        NOT NULL
  event_type        VARCHAR(100) NOT NULL   -- 'github.push' | 'okta.user.deactivated'
  headers           JSONB        NOT NULL
  payload           JSONB        NOT NULL
  signature_verified BOOLEAN    NOT NULL
  processing_status VARCHAR(20)  NOT NULL DEFAULT 'pending'
  processed_at      TIMESTAMP
  triggered_tests   VARCHAR(100)[]
  error_message     TEXT
  received_at       TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (instance_id, received_at DESC)
```

HTTP public endpoint: `POST /webhooks/{connector_id}/{instance_id}`
Validates `X-{Connector}-Signature` HMAC-SHA256 against stored webhook_secret.

Routing examples:
- `github.push` to default branch → trigger test_github_branch_protection_default
- `okta.user.deactivated` → trigger HR/IdP cross-reference test
- `aws.securityhub.finding` (Critical) → immediate alert + test trigger
- `crowdstrike.detection.new` (Critical severity) → immediate alert

**gRPC**: ProcessWebhook, GetWebhookEvent, ListWebhookEvents, RetryWebhookEvent.

---

## Part VIII: Layer 4 — Trust & Collaboration (5 Services)

---

### trust/trust-center-service | Port 9300 | gRPC 50300
**Canonical ownership**: Public trust center configuration, NDA gate management, visitor tracking, document publishing.

#### Schema

```sql
trust_center_configs:
  org_id             UUID         PK
  slug               VARCHAR(100) UNIQUE NOT NULL   -- trust.roadwarden.io/{slug}
  is_published       BOOLEAN      NOT NULL DEFAULT false
  custom_domain      VARCHAR(255)                   -- trust.acmecorp.com
  custom_css         TEXT
  logo_storage_id    UUID
  primary_color      VARCHAR(7)                     -- hex color
  tagline            VARCHAR(255)
  description        TEXT
  visible_sections   JSONB        NOT NULL DEFAULT '{}'
  require_nda_for    JSONB        DEFAULT '{}'       -- which sections require NDA
  created_at         TIMESTAMP    NOT NULL DEFAULT NOW()
  updated_at         TIMESTAMP    NOT NULL DEFAULT NOW()

trust_center_documents:
  id             UUID        PK
  org_id         UUID        NOT NULL
  document_type  VARCHAR(50) NOT NULL
    -- 'soc2_report'|'iso_cert'|'pentest_summary'|'subprocessor_list'
    -- |'privacy_policy'|'security_policy'|'dpa'|'data_map'|'custom'
  title          VARCHAR(255) NOT NULL
  description    TEXT
  storage_id     UUID
  external_url   VARCHAR(1000)
  requires_nda   BOOLEAN      NOT NULL DEFAULT false
  is_published   BOOLEAN      NOT NULL DEFAULT true
  valid_from     DATE
  valid_until    DATE
  sort_order     INTEGER      NOT NULL DEFAULT 0
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW()

trust_center_nda_gates:
  id               UUID        PK
  org_id           UUID        NOT NULL
  visitor_email    VARCHAR(255) NOT NULL
  visitor_company  VARCHAR(255)
  nda_version      VARCHAR(20)  NOT NULL
  signed_at        TIMESTAMP    NOT NULL DEFAULT NOW()
  access_expires_at TIMESTAMP   NOT NULL   -- 90 days default
  ip_hash          VARCHAR(64)
  INDEX (org_id, visitor_email)

trust_center_visitors:
  id                   UUID        PK
  org_id               UUID        NOT NULL
  visitor_email        VARCHAR(255)
  visitor_company      VARCHAR(255)
  nda_id               UUID        FK trust_center_nda_gates(id)
  page_viewed          VARCHAR(255) NOT NULL
  document_downloaded  UUID
  ip_hash              VARCHAR(64)
  visited_at           TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (org_id, visited_at DESC)
```

#### gRPC Surface
GetTrustCenterConfig, UpdateTrustCenterConfig, PublishTrustCenter, UnpublishTrustCenter, ListTrustDocuments, AddTrustDocument, RemoveTrustDocument, GetPublicTrustPage, RequestNDAAccess, VerifyNDASignature, GetNDAVisitorAccess, ListVisitors, GetVisitorAnalytics, GetFrameworkBadges.

---

### trust/questionnaire-service | Port 9301 | gRPC 50301
**Canonical ownership**: Incoming security questionnaire management, AI auto-fill pipeline, response tracking, export back to original format.

#### Schema

```sql
questionnaires:
  id                      UUID        PK
  org_id                  UUID        NOT NULL
  title                   VARCHAR(255) NOT NULL
  questionnaire_type      VARCHAR(50)  NOT NULL   -- 'vsaq'|'sig_lite'|'sig_core'|'caiq'|'custom'
  source_company          VARCHAR(255)
  status                  VARCHAR(30)  NOT NULL DEFAULT 'draft'
    -- 'draft'|'in_progress'|'ai_processed'|'in_review'|'completed'|'sent'
  due_date                DATE
  original_file_storage_id UUID
  completed_file_storage_id UUID
  assigned_to_user_id     UUID
  ai_processed            BOOLEAN      NOT NULL DEFAULT false
  ai_fill_rate            DECIMAL(5,2)             -- % questions auto-filled
  created_at              TIMESTAMP    NOT NULL DEFAULT NOW()
  updated_at              TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (org_id, status, due_date)

questionnaire_questions:
  id                  UUID        PK
  questionnaire_id    UUID        FK questionnaires(id)
  question_number     VARCHAR(20)              -- '1.2.3'
  section             VARCHAR(255)
  question_text       TEXT         NOT NULL
  question_type       VARCHAR(30)  NOT NULL    -- 'yes_no'|'multiple_choice'|'text'|'file'
  options             JSONB
  matched_control_id  VARCHAR(100)             -- AI-matched control
  matched_confidence  DECIMAL(5,2)             -- 0-1 confidence score
  draft_answer        TEXT                     -- AI-generated draft
  final_answer        TEXT                     -- human-approved final
  answer_evidence_ids UUID[]                   -- linked evidence
  answer_status       VARCHAR(20)  NOT NULL DEFAULT 'unanswered'
    -- 'unanswered'|'ai_drafted'|'human_reviewed'|'approved'
  answered_by_user_id UUID
  sort_order          INTEGER      NOT NULL DEFAULT 0
  created_at          TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (questionnaire_id, answer_status)
```

#### gRPC Surface
CreateQuestionnaire, GetQuestionnaire, ListQuestionnaires, UploadQuestionnaire, ProcessQuestionnaireWithAI, GetQuestions, UpdateAnswer, ApproveAnswer, ApproveAllAnswers, ExportQuestionnaire, GetAIFillStatus, ListUnansweredQuestions, GetQuestionnaireMetrics.

---

### trust/vendor-risk-service | Port 9302 | gRPC 50302
**Canonical ownership**: Vendor registry, risk classification, 2-track assessment (auto-scored + questionnaire), continuous score monitoring, GDPR sub-processor tracking.

#### Schema

```sql
vendors:
  id                  UUID        PK
  org_id              UUID        NOT NULL
  name                VARCHAR(255) NOT NULL
  website             VARCHAR(500)
  category            VARCHAR(100)             -- 'cloud_infra'|'saas'|'payment_processor'|...
  risk_tier           VARCHAR(20)  NOT NULL DEFAULT 'medium'   -- 'critical'|'high'|'medium'|'low'
  data_access         VARCHAR(50)[]            -- 'personal_data'|'financial_data'|'source_code'
  system_access       VARCHAR(50)[]            -- 'production'|'staging'|'employee_devices'
  sub_processor_for   VARCHAR(50)[]            -- framework IDs (GDPR sub-processor designation)
  is_active           BOOLEAN      NOT NULL DEFAULT true
  created_by_user_id  UUID         NOT NULL
  created_at          TIMESTAMP    NOT NULL DEFAULT NOW()
  updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (org_id, risk_tier, is_active)

vendor_assessments:
  id                       UUID        PK
  vendor_id                UUID        FK vendors(id)
  org_id                   UUID        NOT NULL
  assessment_type          VARCHAR(30) NOT NULL   -- 'auto_scored'|'questionnaire'|'document_review'
  status                   VARCHAR(30) NOT NULL DEFAULT 'pending'
  security_score           DECIMAL(5,2)            -- 0-100 from SecurityScorecard/Bitsight
  risk_rating              VARCHAR(20)
  questionnaire_id         UUID        FK questionnaires(id)
  soc2_report_storage_id   UUID
  iso_cert_storage_id      UUID
  pentest_report_storage_id UUID
  notes                    TEXT
  due_date                 DATE
  completed_at             TIMESTAMP
  next_assessment_due      DATE
  created_at               TIMESTAMP   NOT NULL DEFAULT NOW()
  INDEX (org_id, status, due_date)

vendor_score_history:
  id           UUID         PK
  vendor_id    UUID         NOT NULL
  org_id       UUID         NOT NULL
  score        DECIMAL(5,2) NOT NULL
  score_source VARCHAR(30)  NOT NULL   -- 'security_scorecard'|'bitsight'|'manual'
  recorded_at  TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (vendor_id, recorded_at DESC)
```

#### gRPC Surface
CreateVendor, UpdateVendor, DeleteVendor, ListVendors, GetVendor, CreateAssessment, UpdateAssessment, CompleteAssessment, GetAssessmentHistory, SendVendorQuestionnaire, GetVendorSecurityScore, GetVendorScoreHistory, ListOverdueAssessments, GetVendorRiskSummary, ExportVendorRegister.

#### Events Published
vendor.created, vendor.risk_tier_changed, vendor.assessment_completed, vendor.score_dropped, vendor.assessment_overdue.

---

### trust/auditor-service | Port 9303 | gRPC 50303
**Canonical ownership**: Auditor workspace — time-limited invitations, dedicated sessions, read-only evidence access, download audit trail, comment threads with org team.

#### Schema

```sql
auditor_invitations:
  id                 UUID        PK
  org_id             UUID        NOT NULL
  period_id          UUID        FK compliance_periods(id)
  auditor_email      VARCHAR(255) NOT NULL
  auditor_name       VARCHAR(255)
  auditor_company    VARCHAR(255)
  access_level       VARCHAR(30)  NOT NULL DEFAULT 'standard'
  token_hash         VARCHAR(64)  UNIQUE NOT NULL
  access_duration_days INTEGER    NOT NULL DEFAULT 90
  expires_at         TIMESTAMP    NOT NULL
  accepted_at        TIMESTAMP
  revoked_at         TIMESTAMP
  invited_by_user_id UUID         NOT NULL
  created_at         TIMESTAMP    NOT NULL DEFAULT NOW()

auditor_sessions:
  id                 UUID        PK
  invitation_id      UUID        FK auditor_invitations(id)
  session_token_hash VARCHAR(64) UNIQUE NOT NULL
  ip_hash            VARCHAR(64)
  created_at         TIMESTAMP   NOT NULL DEFAULT NOW()
  last_active_at     TIMESTAMP   NOT NULL DEFAULT NOW()
  expires_at         TIMESTAMP   NOT NULL   -- max 4h; must re-auth with MFA

auditor_downloads:
  id              UUID      PK
  invitation_id   UUID      FK auditor_invitations(id)
  evidence_id     UUID      NOT NULL
  evidence_title  VARCHAR(255)
  downloaded_at   TIMESTAMP NOT NULL DEFAULT NOW()
  ip_hash         VARCHAR(64)
  INDEX (invitation_id, downloaded_at DESC)

auditor_comments:
  id               UUID        PK
  org_id           UUID        NOT NULL
  invitation_id    UUID        NOT NULL
  thread_type      VARCHAR(30) NOT NULL   -- 'control'|'evidence'|'period'
  thread_id        VARCHAR(255) NOT NULL
  parent_comment_id UUID
  content          TEXT        NOT NULL
  author_type      VARCHAR(20) NOT NULL   -- 'auditor'|'member'
  author_id        VARCHAR(255) NOT NULL
  author_name      VARCHAR(255) NOT NULL
  created_at       TIMESTAMP   NOT NULL DEFAULT NOW()
  INDEX (org_id, thread_type, thread_id, created_at)
```

#### gRPC Surface
InviteAuditor, GetAuditorInvitation, RevokeAuditorAccess, ListAuditorInvitations, CreateAuditorSession, ValidateAuditorSession, ListAuditorDownloads, AddAuditorComment, ListAuditorComments, ReplyToAuditorComment, CreateAuditorEvidenceRequest, ListAuditorEvidenceRequests, GetAuditorDashboard.

---

### trust/report-service | Port 9304 | gRPC 50304
**Canonical ownership**: All compliance report generation — board summaries, framework status reports, evidence packages, gap analyses, audit readiness packages.

#### Schema

```sql
report_templates:
  id           VARCHAR(50)  PK
  name         VARCHAR(255) NOT NULL
  report_type  VARCHAR(50)  NOT NULL
    -- 'board_summary'|'framework_status'|'evidence_package'|'gap_analysis'
    -- |'soc2_prep'|'iso_prep'|'vendor_risk_summary'
  description  TEXT
  is_active    BOOLEAN      NOT NULL DEFAULT true

generated_reports:
  id                    UUID        PK
  org_id                UUID        NOT NULL
  template_id           VARCHAR(50) FK report_templates(id)
  title                 VARCHAR(255) NOT NULL
  parameters            JSONB        NOT NULL
  status                VARCHAR(20)  NOT NULL DEFAULT 'pending'
    -- 'pending'|'generating'|'complete'|'failed'
  storage_id            UUID
  generated_at          TIMESTAMP
  generated_by_user_id  UUID         NOT NULL
  expires_at            TIMESTAMP    NOT NULL   -- 30 day download TTL
  created_at            TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (org_id, created_at DESC)
```

#### gRPC Surface
ListReportTemplates, GenerateReport, GetReport, ListGeneratedReports, ExportSOC2Prep, ExportISO27001Prep, ExportGapAnalysis, ExportBoardSummary, ExportEvidencePackage, GeneratePOAM, GetReportStatus.

---

## Part IX: Layer 5 — Intelligence (4 Services)

---

### intelligence/ai-agent-service | Port 9400 | gRPC 50400
**Canonical ownership**: All AI-powered workflows. Anti-hallucination enforcement. Citation generation. AI interaction logging.

#### Schema

```sql
ai_interactions:
  id                   UUID        PK
  org_id               UUID        NOT NULL
  user_id              UUID
  agent_mode           VARCHAR(30) NOT NULL
    -- 'policy_drafter'|'questionnaire_filler'|'control_mapper'|'risk_advisor'
  model_used           VARCHAR(50) NOT NULL   -- 'gpt-4o'|'claude-3-5-sonnet'
  prompt_tokens        INTEGER
  completion_tokens    INTEGER
  input_context        JSONB       NOT NULL
  output               JSONB       NOT NULL
  citations            JSONB       NOT NULL   -- [{framework, clause, text}, ...]
  confidence_score     DECIMAL(3,2)           -- 0-1
  requires_human_review BOOLEAN    NOT NULL
  human_approved       BOOLEAN
  human_approved_by    UUID
  human_approved_at    TIMESTAMP
  processing_ms        INTEGER
  created_at           TIMESTAMP   NOT NULL DEFAULT NOW()
  INDEX (org_id, agent_mode, created_at DESC)

ai_policy_drafts:
  id               UUID        PK
  interaction_id   UUID        FK ai_interactions(id)
  org_id           UUID        NOT NULL
  template_id      VARCHAR(100)
  category         VARCHAR(100) NOT NULL
  draft_content    TEXT         NOT NULL
  variables_used   JSONB
  framework_mappings JSONB
  status           VARCHAR(20)  NOT NULL DEFAULT 'draft'
  accepted_policy_id UUID
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW()

ai_questionnaire_fills:
  id                   UUID      PK
  interaction_id       UUID      FK ai_interactions(id)
  questionnaire_id     UUID      NOT NULL
  questions_processed  INTEGER   NOT NULL
  questions_answered   INTEGER   NOT NULL
  fill_rate            DECIMAL(5,2) NOT NULL
  created_at           TIMESTAMP NOT NULL DEFAULT NOW()
```

#### The Four AI Agent Modes

**Mode 1 — Policy Drafter (GPT-4o)**
- Input: policy_category + org_context (industry, size, active frameworks, tech stack)
- Process: Select best-fit template → fill variables with org context → customize to tech stack → map to framework clauses → add citations
- Output: Full Markdown policy + citation list + confidence score
- Anti-hallucination: Every stated requirement cites specific framework clause. No invented requirements.
- Human gate: Saved as ai_policy_draft (status=draft). User reviews → approves → creates org_policy.

**Mode 2 — Questionnaire Auto-Fill (GPT-4o)**
- Input: Extracted questionnaire questions (text)
- Process: Per question → embed question text → semantic similarity match to control library → retrieve matching control + latest accepted evidence → draft answer with citations
- Output: Draft answer per question + control_id citation + evidence_id citation + confidence_score
- Auto-fill threshold: confidence < 0.7 → flagged for human review, NOT auto-submitted
- Anti-hallucination: All answers grounded in actual evidence. Low-confidence questions always flagged.

**Mode 3 — Control Mapper (Claude 3.5 Sonnet)**
- Input: New framework clause text or custom control description
- Process: Parse requirements → semantic match against 2,340+ control library → identify coverage gaps → suggest evidence types needed
- Output: Existing controls that satisfy clause (with confidence) + gaps + specific recommendations
- Anti-hallucination: All suggestions reference actual control library IDs and descriptions.

**Mode 4 — Risk Advisor (Claude 3.5 Sonnet)**
- Input: Risk description + current control effectiveness data
- Process: Analyze risk context → identify relevant existing controls → assess coverage gaps → evaluate treatment options
- Output: Prioritized treatment recommendations + framework citations + effort/risk-reduction estimates
- Anti-hallucination: All recommendations cite specific controls and framework clauses.

#### gRPC Surface
DraftPolicy, GetPolicyDraft, ApprovePolicyDraft, ProcessQuestionnaire, GetQuestionnaireFilledAnswers, MapControlToFramework, AnalyzeRisk, GetAIInteraction, ListAIInteractions, GetAIUsageMetrics, Health.

#### Events Published
ai_agent.policy_drafted, ai_agent.questionnaire_processed, ai_agent.control_mapped.

---

### intelligence/monitor-service | Port 9401 | gRPC 50401
**Canonical ownership**: Continuous compliance snapshots, regression detection, trend analytics, proactive insight generation.

#### Schema

```sql
compliance_snapshots:
  id                   UUID         PK
  org_id               UUID         NOT NULL
  framework_id         VARCHAR(50)  NOT NULL
  snapshot_date        DATE         NOT NULL
  overall_score        DECIMAL(5,2) NOT NULL
  controls_total       INTEGER      NOT NULL
  controls_passing     INTEGER      NOT NULL
  controls_failing     INTEGER      NOT NULL
  controls_not_tested  INTEGER      NOT NULL
  tests_total          INTEGER      NOT NULL
  tests_passing        INTEGER      NOT NULL
  tests_failing        INTEGER      NOT NULL
  domain_breakdown     JSONB        NOT NULL
  created_at           TIMESTAMP    NOT NULL DEFAULT NOW()
  UNIQUE (org_id, framework_id, snapshot_date)
  INDEX (org_id, framework_id, snapshot_date DESC)

monitoring_insights:
  id                    UUID        PK
  org_id                UUID        NOT NULL
  insight_type          VARCHAR(50) NOT NULL
    -- 'score_regression'|'new_failures'|'trend_declining'|'expiring_evidence'
    -- |'unowned_controls'|'vendor_score_drop'|'sla_breach_risk'|'training_gap'
  title                 VARCHAR(255) NOT NULL
  description           TEXT         NOT NULL
  severity              VARCHAR(20)  NOT NULL
  related_resource_type VARCHAR(50)
  related_resource_id   VARCHAR(255)
  is_dismissed          BOOLEAN      NOT NULL DEFAULT false
  dismissed_by          UUID
  dismissed_at          TIMESTAMP
  created_at            TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (org_id, severity, is_dismissed, created_at DESC)
```

#### gRPC Surface
TakeComplianceSnapshot, GetComplianceTrend, ListInsights, DismissInsight, GetControlCoverage, GetTestCoverageReport, GetComplianceCalendar, GetOrgHealthScore.

#### Events Consumed
test.result_recorded (update daily snapshots), evidence.accepted / evidence.expired (update evidence metrics), compliance_period.status_changed (track milestone progress).

---

### intelligence/alert-service | Port 9402 | gRPC 50402
**Canonical ownership**: Alert rule evaluation, deduplication, severity-based routing to notification-service.

#### Schema

```sql
alert_rules:
  id                    UUID        PK
  org_id                UUID        NOT NULL
  rule_name             VARCHAR(255) NOT NULL
  event_pattern         VARCHAR(100) NOT NULL
  condition             JSONB        NOT NULL
  min_interval_minutes  INTEGER      DEFAULT 60   -- deduplication window
  is_active             BOOLEAN      NOT NULL DEFAULT true
  created_at            TIMESTAMP    NOT NULL DEFAULT NOW()

alert_history:
  id               UUID        PK
  org_id           UUID        NOT NULL
  rule_id          UUID        FK alert_rules(id)
  event_type       VARCHAR(100) NOT NULL
  payload          JSONB        NOT NULL
  severity         VARCHAR(20)  NOT NULL
  notification_ids UUID[]
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (org_id, severity, created_at DESC)
```

Default rules seeded for all orgs:

| Event | Condition | Alert Timing |
|---|---|---|
| test.failed | severity=critical | Immediate |
| test.failed | severity=high | 15-minute batch |
| test.failed | severity=medium | Daily digest |
| evidence.expiring | days_until_expiry=14 | Immediate |
| evidence.expiring | days_until_expiry=7 | Immediate |
| remediation.sla_breached | any | Immediate |
| integration.disconnected | any | Immediate |
| integration.auth_error | any | Immediate |
| vendor.score_dropped | risk_tier=critical, drop>10pts | Immediate |
| compliance_period.approaching | days_to_cert=30 | Weekly |

**gRPC**: CreateAlertRule, UpdateAlertRule, DeleteAlertRule, ListAlertRules, GetAlertHistory, TestAlertRule, GetAlertStats.

---

### intelligence/analytics-service | Port 9403 | gRPC 50403
**Canonical ownership**: Compliance metrics, dashboard widget data, reporting aggregations, API usage statistics.

#### Schema

```sql
org_metrics:
  id            UUID         PK
  org_id        UUID         NOT NULL
  metric_name   VARCHAR(100) NOT NULL
  metric_value  DECIMAL(10,4) NOT NULL
  metric_metadata JSONB      DEFAULT '{}'
  recorded_at   TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (org_id, metric_name, recorded_at DESC)
```

#### gRPC Surface
GetDashboardMetrics, GetComplianceTimeline, GetControlHeatmap, GetTestTrendChart, GetRemediationMetrics, GetEvidenceMetrics, GetVendorRiskDistribution, GetAIUsageStats, GetAPIUsageStats.

---

## Part X: Layer 6 — Platform Ops (5 Services)

---

### platform-ops/billing-service | Port 9500 | gRPC 50500
**Canonical ownership**: Subscription management, Stripe integration, usage metering, plan enforcement.

#### Schema

```sql
org_subscriptions:
  id                       UUID        PK
  org_id                   UUID        UNIQUE NOT NULL
  plan                     VARCHAR(50) NOT NULL DEFAULT 'community'
  stripe_customer_id       VARCHAR(100)
  stripe_subscription_id   VARCHAR(100)
  status                   VARCHAR(30) NOT NULL DEFAULT 'active'
    -- 'trialing'|'active'|'past_due'|'canceled'
  current_period_start     TIMESTAMP
  current_period_end       TIMESTAMP
  trial_end                TIMESTAMP
  user_seats               INTEGER
  base_price_cents         INTEGER
  per_seat_price_cents     INTEGER
  created_at               TIMESTAMP   NOT NULL DEFAULT NOW()
  updated_at               TIMESTAMP   NOT NULL DEFAULT NOW()

usage_records:
  id                   UUID         PK
  org_id               UUID         NOT NULL
  metric               VARCHAR(50)  NOT NULL   -- 'active_users'|'frameworks'|'integrations'|'ai_tokens'
  value                DECIMAL(12,4) NOT NULL
  recorded_at          TIMESTAMP    NOT NULL DEFAULT NOW()
  billing_period_start TIMESTAMP    NOT NULL
  billing_period_end   TIMESTAMP    NOT NULL
  INDEX (org_id, metric, billing_period_start)
```

#### gRPC Surface
GetSubscription, CreateSubscription, UpdateSubscription, CancelSubscription, GetInvoices, GetUsage, ValidateSeatCount, HandleStripeWebhook, GetBillingPortalURL, CheckFeatureAccess.

---

### platform-ops/admin-service | Port 9501 | gRPC 50501
**Canonical ownership**: Roadwarden platform administration (internal staff only). All admin actions logged to audit-log-service.

```sql
admin_actions:
  id              UUID        PK
  admin_user_id   UUID        NOT NULL
  action          VARCHAR(100) NOT NULL
  target_type     VARCHAR(50)
  target_id       VARCHAR(255)
  reason          TEXT         NOT NULL
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
```

#### gRPC Surface
ListOrgs, GetOrgDetail, OverridePlan, SuspendOrg, DeleteOrg, ImpersonateUser (full audit log required), GetPlatformMetrics, BroadcastAnnouncement, ManageFeatureFlags, GetPlatformHealth.

---

### platform-ops/search-service | Port 9502 | gRPC 50502
**Canonical ownership**: Full-text search across all compliance entities using OpenSearch 2.6.

Indexed entities: controls, org_controls, evidence, org_policies, vendors, risks, remediation_tasks, audit_events.

Each document indexed with org_id for strict tenant isolation. All queries require org_id filter (enforced at service layer, not just UI).

#### gRPC Surface
SearchAll (global multi-index), SearchControls, SearchEvidence, SearchPolicies, SearchVendors, SearchRisks, SearchAuditLog, IndexDocument, DeleteDocument, Reindex.

---

### platform-ops/webhook-delivery-service | Port 9503 | gRPC 50503
**Canonical ownership**: Outbound webhook delivery to customer-configured endpoints. HMAC-SHA256 signing. Exponential backoff retry.

#### Schema

```sql
webhook_endpoints:
  id             UUID        PK
  org_id         UUID        NOT NULL
  url            VARCHAR(1000) NOT NULL
  secret_enc     BYTEA        NOT NULL   -- KMS-encrypted HMAC secret
  event_types    VARCHAR(100)[]          -- NULL = all events
  is_active      BOOLEAN      NOT NULL DEFAULT true
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW()

webhook_deliveries:
  id              UUID        PK
  endpoint_id     UUID        FK webhook_endpoints(id)
  org_id          UUID        NOT NULL
  event_type      VARCHAR(100) NOT NULL
  payload         JSONB        NOT NULL
  response_status INTEGER
  response_body   TEXT
  attempt_count   INTEGER      NOT NULL DEFAULT 0
  status          VARCHAR(20)  NOT NULL DEFAULT 'pending'
    -- 'pending'|'delivered'|'failed'
  next_retry_at   TIMESTAMP
  delivered_at    TIMESTAMP
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
  INDEX (org_id, status, next_retry_at)
```

Retry: exponential backoff at 1m, 5m, 30m, 2h, 8h, 24h. Max 6 attempts. HMAC-SHA256 on all deliveries via `X-Roadwarden-Signature` header.

#### gRPC Surface
CreateWebhookEndpoint, UpdateWebhookEndpoint, DeleteWebhookEndpoint, ListWebhookEndpoints, TestWebhookEndpoint, ListDeliveries, RetryDelivery, GetDeliveryLogs.

---

### platform-ops/api-gateway-service | Port 9504 | gRPC 50504
**Canonical ownership**: Public REST API gateway — authentication, rate limiting, routing to internal gRPC services, OpenAPI spec generation.

Auth middleware order:
1. `Authorization: Bearer rw_live_...` API key → user-service.ValidateAPIKey
2. `rw_session` cookie → auth-service.GetCurrentSession
3. `X-Auditor-Token` → auditor-service.ValidateAuditorSession
4. Reject 401

Rate limits (Redis token bucket per org_id):
- Community Edition: 60 req/min
- Cloud Edition: 600 req/min
- Enterprise: 6,000 req/min

REST API: `api.roadwarden.io/v1/{resource}` — all operations. JSON responses. RFC 7807 error format. Cursor pagination. OpenAPI 3.0 spec auto-generated from NestJS decorators at `api.roadwarden.io/v1/openapi.json`.

Official SDKs published: TypeScript (`@roadwarden/sdk`), Python (`roadwarden`), Go (`github.com/roadwarden/roadwarden-go`), Ruby (`roadwarden`).

---

## Part XI: Frontend Architecture

### Applications

| App | URL | Tech | Purpose |
|---|---|---|---|
| `apps/web` | app.roadwarden.io | Next.js 15 + RSC | Primary compliance dashboard |
| `apps/trust` | trust.roadwarden.io/{slug} | Next.js 15 + SSR | Public trust center (SEO-optimized) |
| `apps/auditor` | auditor.roadwarden.io | Next.js 15 | Dedicated auditor workspace |
| `apps/docs` | docs.roadwarden.io | Docusaurus | Open-source documentation |

### Primary Dashboard Pages (apps/web)

| Route | Purpose |
|---|---|
| `/` | Dashboard: scores, failing controls, upcoming tasks, recent activity |
| `/frameworks` | All 38 frameworks — active + available to activate |
| `/frameworks/[id]` | Framework: domain breakdown, control list, score |
| `/frameworks/[id]/scoping` | Scoping questionnaire |
| `/controls` | Control library: filter by status/domain/owner/framework |
| `/controls/[id]` | Control: tests, evidence, remediation, history |
| `/tests` | Test catalog: pass/fail, last run, schedule |
| `/evidence` | Evidence library: expiry tracker, pending review, requests |
| `/evidence/upload` | Upload: drag+drop, URL link, screen capture, email |
| `/policies` | Policy library: status, acknowledgment rates |
| `/policies/new` | Policy wizard: template + AI drafting |
| `/risk` | Risk register: heatmap, table, appetite settings |
| `/remediation` | Task list: filter by severity/owner/SLA/framework |
| `/integrations` | Connected integrations: health, sync status, test coverage |
| `/integrations/connect` | Connect new: category browse + auth flow |
| `/questionnaires` | Incoming security questionnaires |
| `/questionnaires/[id]` | Questionnaire: AI fill + human review + export |
| `/vendors` | Vendor register: risk tier, assessment status |
| `/vendors/[id]` | Vendor: score, assessments, questionnaires, documents |
| `/trust-center` | Trust center admin: config, documents, analytics |
| `/audit` | Audit periods: status, auditor invitations |
| `/reports` | Report generation + download |
| `/ai-agent` | AI Agent: all 4 modes, interaction history |
| `/team` | Team: members, roles, invitations |
| `/settings` | Org: MFA, SSO, notifications, API keys, billing |

### Design System

- **Base**: shadcn/ui (Radix UI primitives) + Tailwind CSS
- **Colors**: Neutral base. Primary: emerald (trust, passing). Danger: red (failing). Warning: amber (expiring, warning). Info: blue (in progress).
- **Typography**: Inter (UI). JetBrains Mono (code, IDs, hashes).
- **Charts**: Recharts (score trends, test results over time, risk heatmap, vendor score history)
- **Icons**: Lucide React
- **Dark mode**: Supported everywhere; system-default + user override

### Key UI Patterns

**Compliance Score Gauge**: Circular, 0–100%. Color thresholds: <50% red, 50–75% amber, 75–90% green, >90% emerald. Trend arrow (up/down/flat since last week). Click → framework detail page.

**Control Status**: Pill badges — `Passing` (emerald), `Failing` (red), `In Progress` (blue), `Not Started` (gray), `N/A` (gray-400).

**Test Result Badge**: `PASS` (emerald), `FAIL` (red), `WARN` (amber), `ERROR` (orange), `PENDING` (gray), `N/A` (gray-400).

**Evidence Expiry Timeline**: Horizontal timeline of evidence expiring next 90 days. Red (<7d), Amber (7–30d), Green (>30d). Click any item → evidence detail.

**Risk Heatmap**: 5×5 grid. X-axis: Impact 1–5. Y-axis: Probability 1–5. Color: green (bottom-left, low) → red (top-right, critical). Each cell shows risk count. Click → risk list filtered to that cell.

**AI Agent Panel**: Collapsible right panel (380px). Mode selector tabs. Confidence score meter (0–100%). Citations accordion. "Approve and apply" button. Full interaction history below.

---

## Part XII: Infrastructure & Deployment

### Development (Docker Compose)

```yaml
# docker/docker-compose.dev.yml — all services + dependencies
services:
  postgres:
    image: postgres:16-alpine
    ports: ['5432:5432']
    environment: {POSTGRES_DB: roadwarden, POSTGRES_USER: rw, POSTGRES_PASSWORD: dev}

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']

  kafka:
    image: apache/kafka:3.7.0
    ports: ['9092:9092']
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

  minio:
    image: minio/minio:latest
    ports: ['9000:9000', '9001:9001']
    command: server /data --console-address ":9001"
    environment: {MINIO_ROOT_USER: minioadmin, MINIO_ROOT_PASSWORD: minioadmin}

  opensearch:
    image: opensearchproject/opensearch:2.6.0
    ports: ['9200:9200']
    environment: {discovery.type: single-node}
```

### Production (Kubernetes + Helm)

```bash
helm repo add roadwarden https://charts.roadwarden.io
helm install roadwarden roadwarden/roadwarden \
  --set postgresql.external.host=db.prod.internal \
  --set redis.external.host=cache.prod.internal \
  --set minio.persistence.size=500Gi \
  --set global.ingress.enabled=true
```

### One-Command Community Install

```bash
curl -fsSL https://get.roadwarden.io/install.sh | bash
# Detects Docker → downloads docker-compose.yml → generates secrets
# → pulls images → runs migrations → seeds catalogs
# → "Roadwarden is running at http://localhost:3000"
```

### Database Migration Strategy

Each service owns its own logical database in PostgreSQL. Drizzle Kit for migrations.

```bash
# Migrate all services (CI/CD + first install)
pnpm run db:migrate:all

# Migrate specific service
pnpm --filter @roadwarden/auth-service db:migrate

# Generate migration from schema changes
pnpm --filter @roadwarden/control-service db:generate
```

### Observability

- **Traces**: OpenTelemetry → Jaeger (self-hosted) or Datadog/New Relic (Cloud)
- **Metrics**: Prometheus /metrics endpoint on every service → Grafana dashboards
- **Logs**: Structured JSON to stdout → Loki (self-hosted) or CloudWatch/Datadog (Cloud)
- **Pre-built Grafana dashboards**: Platform overview, test runner performance, API gateway metrics, Kafka consumer lag, BullMQ queue health

---

## Part XIII: Open Source Governance

**License**: Apache 2.0 — all services, all packages, all connectors.

**CLA**: Required before first PR merge. CLA bot on GitHub. Contributors keep copyright; grant Roadwarden perpetual license.

**TSC (Technical Steering Committee)**: 5–7 members. Initial: 3 Roadwarden core team + 2 elected community members. Responsibilities: major architectural decisions, framework additions, connector SDK changes, release cadence, CVE governance.

**Connector contributions**: Build with @roadwarden/connector-sdk → PR to connectors/ directory → CI: type-check + lint + ≥80% test coverage + no hardcoded credentials → TSC security review → merge → publish to npm.

**CVE disclosure**: security@roadwarden.io (PGP key published). 90-day coordinated disclosure. Fix released before public disclosure. GitHub Security Advisories with CVSS + CWE.

**SBOM**: CycloneDX JSON SBOM published per release. SLSA provenance attestation. Cosign-signed container images on ghcr.io.

**Roadwarden monitors itself with Roadwarden**: Roadwarden Cloud is in scope for Roadwarden's own compliance program. SOC 2 Type II target: Month 12.

---

## Part XIV: Pricing & Revenue Model

### Community Edition (Free — OSS)
Apache 2.0. Unlimited users. All 38 frameworks. All 400+ connectors. BYOK AI (bring your own OpenAI/Anthropic API key). No SLA. Community Discord support. Self-hosted only.

### Cloud Edition (Managed SaaS)
- $249/month base (includes 5 user seats)
- $49/user/month additional seats
- Managed AI (GPT-4o + Claude 3.5 Sonnet — no separate API key needed)
- 99.9% uptime SLA
- All features: Trust Center, Auditor Workspace, AI Agent, all frameworks
- Multi-region data residency (US/EU/APAC)
- Email + Slack support

Add-ons: Advanced analytics + board reports ($149/mo), Priority support ($299/mo)

### Enterprise Self-Hosted (Commercial)
- Annual contract starting at $25,000/year
- Unlimited users. All features. BYOK AI. Source code access.
- Dedicated CSM. 8-hour SLA support. On-site deployment assistance.
- Air-gap deployment supported (no internet connectivity required).

### Competitive Positioning vs Vanta

| Scenario | Vanta | Roadwarden Cloud | Roadwarden Community |
|---|---|---|---|
| 50 users, SOC 2 only | ~$2,500/mo | $249 + (50 × $49) = $2,699/mo | $0 |
| 50 users, SOC 2 + ISO 27001 | ~$3,500/mo | $2,699/mo (same — all frameworks included) | $0 |
| 50 users, all frameworks | ~$5,000+/mo | $2,699/mo | $0 |
| Self-hosted option | Not available | N/A | $0 |
| Open source | Not available | N/A | Apache 2.0 |

The price premium Vanta charges for multi-framework is Roadwarden's primary go-to-market lever. All 38 frameworks are included in every plan.

---

## Part XV: Implementation Roadmap

### Phase 1: Foundation (Months 1–3)
- Layer 1 (7 services) complete
- Layer 2 (8 services) complete
- 5 starter connectors: AWS, GitHub, Okta, Rippling, Jamf
- 3 starter frameworks seeded: SOC 2, ISO 27001, GDPR
- Docker Compose dev environment
- 80+ policy templates seeded
- 2,340+ control library seeded
- 4,100+ test catalog seeded

### Phase 2: Integration Engine (Months 4–6)
- Layer 3 (10 services) complete
- 50 connectors total
- 400+ automated tests running on schedule
- Webhook ingestion for top 10 connectors
- Layer 4 (5 services) complete
- Trust center public beta

### Phase 3: Intelligence + Polish (Months 7–9)
- Layer 5 (4 services) complete
- All 4 AI Agent modes live
- Layer 6 (5 services) complete
- Public REST API v1 released
- OpenAPI spec + 4 SDKs published
- 200+ connectors
- All 38 frameworks seeded

### Phase 4: Scale + Launch (Months 10–12)
- 400+ connectors
- Kubernetes/Helm self-hosted deployment
- One-command install script
- Competitor import (Vanta, Drata, Secureframe)
- Community Edition public GitHub release
- Cloud Edition GA ($249/month)
- Roadwarden SOC 2 Type II audit initiated

---

## Appendix A: Kafka Event Reference

All events follow envelope schema:
```json
{
  "event_id": "uuid",
  "event_type": "namespace.action",
  "org_id": "uuid",
  "occurred_at": "ISO8601",
  "actor": {"type": "user|system|api_key", "id": "string"},
  "payload": {}
}
```

**Full event list (63 events)**:

Identity: user.created, user.verified_email, user.logged_in, user.login_failed, user.mfa_enabled, user.mfa_disabled, user.password_changed, user.deleted, user.sso_configured, user.scim_provisioned, user.scim_deprovisioned, session.created, session.expired, session.revoked, api_key.created, api_key.revoked, api_key.used

Organizations: org.created, org.updated, org.deleted, org.member_added, org.member_removed, org.member_role_changed, org.invitation_sent, org.invitation_accepted

Frameworks: framework.activated, framework.deactivated, compliance_period.created, compliance_period.status_changed, compliance_period.certified, scoping.answers_submitted

Controls: control.status_changed, control.owner_assigned, control.implemented, control.failing, control.passed

Tests: test.result_recorded, test.failed, test.passed, test.schedule_missed

Evidence: evidence.submitted, evidence.accepted, evidence.rejected, evidence.expired, evidence.request_created, evidence.request_fulfilled

Policies: policy.created, policy.updated, policy.approved, policy.archived, policy.acknowledgment_recorded

Risk: risk.created, risk.status_changed, risk.exceeds_appetite, risk.score_updated

Remediation: remediation.task_created, remediation.task_assigned, remediation.task_resolved, remediation.sla_breached

Integration: integration.connected, integration.disconnected, integration.auth_error, integration.sync_completed, integration.sync_failed

Trust & Vendor: vendor.created, vendor.risk_tier_changed, vendor.assessment_completed, vendor.score_dropped, vendor.assessment_overdue

AI Agent: ai_agent.policy_drafted, ai_agent.questionnaire_processed, ai_agent.control_mapped

Platform: file.uploaded, file.virus_scan_completed, file.deleted

---

## Appendix B: Control Domain Reference

| Domain | Unique Controls | Avg Automation % | Primary Connectors |
|---|---|---|---|
| access_control | 280+ | 85% | Okta, Entra ID, Google Workspace, AWS IAM |
| asset_management | 120+ | 75% | AWS, GCP, Azure, Jamf, Intune |
| change_management | 95+ | 70% | GitHub, GitLab, Jira, Linear |
| data_security | 180+ | 60% | AWS S3/KMS, Azure Key Vault, Wiz |
| endpoint_security | 140+ | 80% | Jamf, Kandji, Intune, CrowdStrike, SentinelOne |
| incident_response | 90+ | 40% | PagerDuty, Splunk, Datadog, Sentinel |
| logging_monitoring | 130+ | 85% | CloudTrail, Audit Log, Datadog, Splunk |
| network_security | 150+ | 75% | AWS VPC, Cloudflare WAF, Zscaler, Palo Alto |
| organizational_security | 160+ | 30% | Policies, risk register, board reporting |
| people_security | 110+ | 60% | Rippling, BambooHR, KnowBe4, Checkr |
| physical_security | 70+ | 20% | Manual evidence (photos, datacenter reports) |
| privacy | 200+ | 55% | Osano, ROPA records, DSR workflow |
| resilience_bcp | 85+ | 35% | DR test records, backup verification |
| risk_management | 95+ | 40% | Risk register, automated risk scoring |
| secure_development | 130+ | 70% | GitHub, Snyk, SonarQube, Veracode |
| supply_chain | 80+ | 45% | Vendor assessments, SecurityScorecard |
| vulnerability_management | 100+ | 80% | Tenable, Qualys, Wiz, Rapid7 |
| compliance_legal | 120+ | 30% | Policy acknowledgments, legal holds |

**Total: 2,340+ unique controls | Weighted avg automation: 68%**

---

*Roadwarden Implementation Strategy — Complete Document*
*Version 1.0 | All 30 architecture decisions locked | Build Layer 1 → Layer 6 in order.*
*Open source (Apache 2.0) | roadwarden.io | github.com/roadwarden/roadwarden*

---

## Appendix C: Sample Test Specifications (10 Tests)

### TEST-001: AWS IAM — MFA Enforced for All Console Users
```
id: test_aws_iam_mfa_enforced
connector: aws
severity: critical
cadence: every_4h
control_ids: [ctrl_access_mfa_enforcement]
frameworks: [soc2/CC6.1, iso27001/A.8.5, nist_csf/PR.AA-02, cis_controls/v8-6.3, hipaa/164.312.d]

pass_condition:
  - List all IAM users: aws iam list-users
  - For each user with console access (PasswordLastUsed != null):
      aws iam list-mfa-devices --user-name {user}
  - PASS: every console user has >= 1 MFA device registered
  - FAIL: any console user with 0 MFA devices

evidence_on_pass: IAM user list with MFA device count per user + account summary
remediation: "Enable MFA: IAM → Users → [username] → Security credentials → Assign MFA device"
estimated_fix_minutes: 10
```

### TEST-002: GitHub — Branch Protection Requires PR Reviews
```
id: test_github_branch_protection_pr_reviews
connector: github
severity: high
cadence: every_4h
control_ids: [ctrl_change_mgmt_code_review]
frameworks: [soc2/CC8.1, iso27001/A.8.32, nist_csf/PR.IP-03, cis_controls/v8-16.7]

pass_condition:
  - List all active repos: GET /orgs/{org}/repos
  - For each repo, check default branch protection:
      GET /repos/{org}/{repo}/branches/{default_branch}/protection
  - PASS: required_pull_request_reviews.required_approving_review_count >= 1
  - FAIL: branch protection missing OR required reviewers = 0

evidence_on_pass: Branch protection config snapshot for all active repositories
remediation: "GitHub → Repo → Settings → Branches → Add rule → Require PR reviews"
estimated_fix_minutes: 5
```

### TEST-003: Okta — MFA Required for All Users (No Exclusions)
```
id: test_okta_mfa_all_users_no_exclusions
connector: okta
severity: critical
cadence: every_4h
control_ids: [ctrl_access_mfa_enforcement]
frameworks: [soc2/CC6.1, hipaa/164.312.d, pci_dss/req8.4, iso27001/A.8.5]

pass_condition:
  - GET /api/v1/policies?type=MFA_ENROLL
  - PASS: active policy with priority = highest covers group = EVERYONE, MFA required
  - FAIL: any group excluded from MFA, or MFA set to OPTIONAL or DISABLED

evidence_on_pass: MFA enrollment policy configuration + group assignments JSON
remediation: "Okta → Security → Multifactor → Enrollment → Edit policy → require MFA for all users"
estimated_fix_minutes: 15
```

### TEST-004: HR ↔ Identity Cross-Reference — Terminated Employees
```
id: test_terminated_employee_active_account
connector: [hr_connector, identity_connector]  # multi-connector
severity: critical
cadence: daily
control_ids: [ctrl_access_offboarding, ctrl_access_user_lifecycle]
frameworks: [soc2/CC6.2, iso27001/A.6.5, nist_csf/PR.AA-01, hipaa/164.308.a.3.ii.c, sox_itgc/access]

pass_condition:
  - Pull terminated employees from HR (terminated in past 90 days)
  - Pull active accounts from all connected IdP systems
  - Cross-reference by email address
  - PASS: 0 terminated employees have any active IdP account
  - FAIL: >= 1 HR-terminated employee with status=ACTIVE in any IdP

evidence_on_pass: Cross-reference report showing HR termination dates vs IdP account status
evidence_on_fail: List of terminated users with active accounts (email, termination date, IdP)
remediation: "Immediately disable or delete IdP accounts for all terminated employees listed"
estimated_fix_minutes: 30
```

### TEST-005: AWS S3 — No Publicly Accessible Buckets
```
id: test_aws_s3_no_public_buckets
connector: aws
severity: critical
cadence: every_4h
control_ids: [ctrl_data_public_exposure, ctrl_data_classification_enforcement]
frameworks: [soc2/CC6.6, iso27001/A.8.23, pci_dss/req7.2, cis_controls/v8-3.3, nist_800_53/AC-3]

pass_condition:
  - aws s3api list-buckets
  - For each bucket:
      aws s3api get-public-access-block --bucket {name}
      aws s3api get-bucket-acl --bucket {name}
      aws s3api get-bucket-policy --bucket {name} (if exists)
  - PASS: ALL buckets have BlockPublicAcls=true AND BlockPublicPolicy=true
           AND no bucket ACL grants public read/write
           AND no bucket policy allows Principal: "*"
  - FAIL: any bucket accessible publicly via any of the three mechanisms

evidence_on_pass: S3 bucket inventory with public-access-block status per bucket
remediation: "S3 → [bucket] → Permissions → Block public access → Edit → Enable all settings"
estimated_fix_minutes: 5
```

### TEST-006: All Managed Devices — Full-Disk Encryption
```
id: test_mdm_disk_encryption_all_devices
connector: [jamf, kandji, intune]  # any connected MDM
severity: high
cadence: daily
control_ids: [ctrl_endpoint_encryption]
frameworks: [soc2/CC6.7, iso27001/A.8.1, hipaa/164.312.a.2.iv, pci_dss/req3.5.1, cmmc/SC.L2-3.13.10]

pass_condition:
  - Pull all enrolled devices from connected MDM(s)
  - For macOS: check FileVault status = ENABLED
  - For Windows: check BitLocker status = EncryptionMethod != None
  - For iOS/iPadOS: check Data Protection = ENABLED (hardware-enforced)
  - PASS: >= 100% encryption (warn at 95–99% for grace period)
  - WARN: 95–99% encrypted (new devices in enrollment grace period)
  - FAIL: < 95% encryption rate

evidence_on_pass: Device inventory CSV with encryption status by OS + serial number
remediation: "Enable FileVault via MDM configuration profile → push to non-compliant devices"
estimated_fix_minutes: 60
```

### TEST-007: TLS 1.2+ Enforced Across All Load Balancers
```
id: test_tls_minimum_version_enforced
connector: [aws, cloudflare, gcp, azure]
severity: high
cadence: daily
control_ids: [ctrl_data_transit_encryption]
frameworks: [soc2/CC6.7, pci_dss/req4.2.1, hipaa/164.312.e.2.ii, nist_800_53/SC-8]

pass_condition:
  AWS:
    - Describe all ALB/NLB listener policies
    - FAIL if any SSL policy allows TLSv1 or TLSv1.1
  Cloudflare:
    - GET /zones/{zone_id}/settings/min_tls_version
    - FAIL if value = "1.0" or "1.1"
  GCP:
    - List all SSL policies attached to HTTPS load balancers
    - FAIL if minTlsVersion = TLS_1_0 or TLS_1_1
  Azure:
    - Check App Gateway / Front Door minimum TLS version
    - FAIL if < TLS1_2

  PASS: all endpoints enforce TLS 1.2 minimum (TLS 1.3 preferred)
  FAIL: any endpoint permitting TLS 1.0 or 1.1

evidence_on_pass: TLS policy configuration per load balancer per cloud provider
remediation: "Update SSL/TLS policy to enforce minimum TLS 1.2. Deprecate TLS 1.0/1.1 listeners."
estimated_fix_minutes: 20
```

### TEST-008: No Long-Lived Credentials (IAM Keys > 90 Days)
```
id: test_no_long_lived_credentials
connector: [aws, github, gcp]
severity: high
cadence: daily
control_ids: [ctrl_access_secrets_rotation, ctrl_access_credential_hygiene]
frameworks: [soc2/CC6.1, iso27001/A.8.13, pci_dss/req8.3.9, cis_controls/v8-5.4]

pass_condition:
  AWS IAM:
    - aws iam get-credential-report
    - FAIL: any access key with age > 90 days (active)
    - WARN: any access key with age 80–90 days
  GitHub:
    - GET /orgs/{org}/personal-access-tokens (classic PATs)
    - FAIL: any PAT with no expiry set OR expiry > 1 year from creation
    - FAIL: any fine-grained PAT expiring in > 1 year
  GCP:
    - List service account keys per project
    - FAIL: any user-managed key with age > 90 days

  PASS: zero credentials beyond defined age thresholds

evidence_on_pass: Credential age report across all connected systems
remediation: "Rotate stale credentials immediately. Enforce max-age policies in IAM."
estimated_fix_minutes: 45
```

### TEST-009: Security Awareness Training Completion >= 95%
```
id: test_security_training_completion_rate
connector: knowbe4  # or proofpoint_sa, ninjio, sans
severity: medium
cadence: daily
control_ids: [ctrl_people_security_training]
frameworks: [soc2/CC1.4, iso27001/A.6.3, hipaa/164.308.a.5.ii.a, cis_controls/v8-14.1, pci_dss/req12.6]

pass_condition:
  - Pull training campaign completion report from KnowBe4
  - Pull employee count from connected HR system
  - completion_rate = completed_employees / total_active_employees
  - PASS: completion_rate >= 95% AND no employee > 365 days since last training
  - WARN: completion_rate >= 85% AND < 95%
  - FAIL: completion_rate < 85% OR any employee overdue > 30 days past deadline

evidence_on_pass: Training completion report with percentage + per-user completion dates
remediation: "Send training reminders to non-compliant employees. Escalate to managers."
estimated_fix_minutes: 0  # process issue; remediation is chasing people
```

### TEST-010: Annual Penetration Test Completed (Manual)
```
id: test_annual_penetration_test_complete
connector: manual
test_type: manual
severity: high
cadence: annual  # checked on-change when evidence submitted
control_ids: [ctrl_vuln_pentest_external, ctrl_vuln_pentest_internal]
frameworks: [soc2/CC7.1, iso27001/A.8.8, pci_dss/req11.4.3, cmmc/CA.L2-3.12.1, nist_csf/ID.RA-05]

pass_condition:
  - Evidence required: pen test report (PDF) dated within 365 days
  - Report must contain: scope, methodology, findings list, CVSS scores
  - PASS: report uploaded within 365 days AND all Critical/High findings resolved
           (tracked via linked remediation tasks)
  - WARN: report uploaded within 365 days AND Critical/High findings still open (with remediation plan)
  - FAIL: no report uploaded OR report > 365 days old

evidence_required:
  - Penetration test final report (PDF)
  - Executive summary or attestation letter from pen test firm
  - Remediation tracking evidence for all Critical and High findings

remediation: "Engage a qualified penetration testing firm. Schedule annual assessment."
estimated_fix_minutes: 10080  # 1 week minimum to schedule + conduct + report
```

---

## Appendix D: Cross-Framework Control Mapping Reference (Top 20 Controls)

The most commonly-shared controls — implementing these once satisfies the highest number of framework requirements:

| Control | Unique Requirements Satisfied | Frameworks |
|---|---|---|
| ctrl_access_mfa_enforcement | 47 | SOC2, ISO27001, HIPAA, PCI DSS, NIST CSF, NIST 800-53, NIST 800-171, CMMC, CIS, SOX, FedRAMP, HITRUST, NIS2, Cyber Essentials, DORA, StateRAMP |
| ctrl_access_user_provisioning_deprovisioning | 41 | SOC2, ISO27001, HIPAA, PCI DSS, NIST 800-53, CMMC, CIS, SOX, FedRAMP, HITRUST, DORA |
| ctrl_logging_audit_trail | 38 | SOC2, ISO27001, HIPAA, PCI DSS, NIST 800-53, NIST CSF, CIS, SOX, FedRAMP, HITRUST, GDPR, SOX |
| ctrl_data_encryption_at_rest | 36 | SOC2, ISO27001, HIPAA, PCI DSS, NIST 800-53, CMMC, FedRAMP, GDPR, CCPA, HITRUST |
| ctrl_data_encryption_in_transit | 35 | SOC2, ISO27001, HIPAA, PCI DSS, NIST 800-53, CMMC, FedRAMP, GDPR, CIS |
| ctrl_vuln_management_scanning | 34 | SOC2, ISO27001, PCI DSS, NIST CSF, NIST 800-53, CIS, FedRAMP, CMMC, HITRUST, NIS2 |
| ctrl_incident_response_plan | 33 | SOC2, ISO27001, HIPAA, PCI DSS, NIST CSF, NIST 800-53, CMMC, DORA, NIS2, FedRAMP |
| ctrl_access_least_privilege | 32 | SOC2, ISO27001, HIPAA, PCI DSS, NIST 800-53, CMMC, CIS, SOX, FedRAMP |
| ctrl_change_mgmt_code_review | 31 | SOC2, ISO27001, PCI DSS, NIST 800-53, CIS, SOX, CMMC, FedRAMP, SSDF |
| ctrl_endpoint_encryption | 30 | SOC2, ISO27001, HIPAA, PCI DSS, NIST 800-53, CMMC, CIS, FedRAMP, HITRUST |
| ctrl_people_security_training | 29 | SOC2, ISO27001, HIPAA, PCI DSS, NIST CSF, CMMC, CIS, FedRAMP, HITRUST |
| ctrl_people_background_checks | 27 | SOC2, ISO27001, HIPAA, NIST 800-53, CMMC, FedRAMP, HITRUST, SOX |
| ctrl_access_privileged_access_mgmt | 26 | SOC2, ISO27001, PCI DSS, NIST 800-53, CMMC, CIS, SOX, FedRAMP, DORA |
| ctrl_network_firewall_configuration | 25 | SOC2, ISO27001, PCI DSS, NIST 800-53, CIS, FedRAMP, CMMC, Cyber Essentials |
| ctrl_data_backup_and_recovery | 24 | SOC2, ISO27001, HIPAA, PCI DSS, NIST CSF, NIST 800-53, DORA, ISO22301 |
| ctrl_risk_assessment_annual | 23 | SOC2, ISO27001, HIPAA, PCI DSS, NIST CSF, NIST 800-53, FedRAMP, GDPR |
| ctrl_vendor_security_review | 22 | SOC2, ISO27001, PCI DSS, NIST 800-53, DORA, NIS2, GDPR, CCPA |
| ctrl_policy_acceptable_use | 21 | SOC2, ISO27001, HIPAA, PCI DSS, NIST 800-53, CIS, FedRAMP, HITRUST |
| ctrl_patch_management | 20 | SOC2, ISO27001, PCI DSS, NIST CSF, NIST 800-53, CIS, FedRAMP, Cyber Essentials, CMMC |
| ctrl_sdlc_secure_coding | 19 | SOC2, ISO27001, PCI DSS, NIST 800-53, CIS, FedRAMP, CMMC, SSDF, SLSA |

**Key insight**: Implementing these top 20 controls with full evidence satisfies 580+ framework requirements across 38 frameworks. That is the compliance efficiency that Roadwarden's multi-framework de-duplication delivers.

---

## Appendix E: Self-Hosted Environment Variables Reference

Every service reads from environment; no secrets in code or config files:

```bash
# Database (per-service logical DB)
DATABASE_URL=postgresql://rw_auth:secret@postgres:5432/rw_auth

# Redis
REDIS_URL=redis://:secret@redis:6379

# Kafka
KAFKA_BROKERS=kafka:9092
KAFKA_CLIENT_ID=rw-auth-service
KAFKA_GROUP_ID=rw-auth-service-group

# KMS (pick one)
KMS_PROVIDER=aws               # aws | vault | gcp | local
AWS_KMS_KEY_ID=arn:aws:kms:...
VAULT_ADDR=http://vault:8200
VAULT_TOKEN=...

# Object storage
STORAGE_PROVIDER=minio         # minio | s3 | gcs | azure
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
STORAGE_BUCKET_EVIDENCE=rw-evidence
STORAGE_BUCKET_POLICIES=rw-policies

# Email
EMAIL_PROVIDER=ses             # ses | smtp | sendgrid | resend
AWS_SES_REGION=eu-west-1
EMAIL_FROM=noreply@roadwarden.io

# AI (optional — Community Edition only)
OPENAI_API_KEY=sk-...          # for Policy Drafter + Questionnaire Fill
ANTHROPIC_API_KEY=sk-ant-...   # for Control Mapper + Risk Advisor

# Auth
JWT_SECRET=<64-byte-hex>
SESSION_COOKIE_DOMAIN=.roadwarden.io
MAGIC_LINK_BASE_URL=https://app.roadwarden.io

# Service-to-service (gRPC)
AUTH_SERVICE_HOST=auth-service:50001
USER_SERVICE_HOST=user-service:50002
ORG_SERVICE_HOST=org-service:50010
# ... (all 39 services)

# Observability
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4317
PROMETHEUS_PORT=9090
LOG_LEVEL=info                 # debug | info | warn | error
```

---

*Roadwarden Implementation Strategy v1.0 — END OF DOCUMENT*
*Total: 39 services | 38 frameworks | 400+ connectors | 2,340+ controls | 4,100+ tests | 80+ policy templates*
*License: Apache 2.0 | Domain: roadwarden.io | Stack: NestJS 11 + Drizzle + PostgreSQL 16 + Redis 7 + Kafka + gRPC + Next.js 15*
