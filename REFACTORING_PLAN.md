# Folder Structure Refactoring Plan

## Current Structure
```
gradeloop-core/
├── apps/
│   ├── web/          # Next.js frontend
│   └── auth/         # Empty auth folder
├── api-gateway/      # Traefik configuration
├── web/              # Duplicate web folder (needs investigation)
├── services/
│   └── auth/
├── libs/
├── infra/
├── scripts/
├── docs/
└── compose.yaml
```

## Target Structure
```
gradeloop-core/
├── web/                       # Frontend (Next.js)
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── api-gateway/               # API Gateway (Traefik)
│   ├── traefik.yml
│   ├── dynamic/
│   ├── certs/
│   ├── logs/
│   └── README.md
│
├── services/                  # Backend microservices
│   ├── go/                    # Go services
│   │   └── auth-service/
│   └── python/                # Python services
│       ├── assignment-service/
│       └── submission-service/
│
├── libs/                      # Shared code
│   ├── proto/
│   ├── openapi/
│   ├── utils/
│   └── observability/
│
├── infra/                     # Infrastructure
│   ├── docker/
│   │   └── docker-compose.yml
│   ├── kubernetes/
│   └── terraform/
│
├── scripts/                   # Dev & CI/CD scripts
│
├── docs/                      # Documentation
│
├── .github/                   # CI/CD workflows
│
└── README.md
```

## Migration Steps

### Step 1: Consolidate Web Frontend
- Move `apps/web/*` to `web/` (if web/ is empty or merge if needed)
- Remove `apps/web/` directory
- Update docker-compose references

### Step 2: Reorganize Services
- Move `apps/auth-service/` to `services/go/auth-service/`
- Create `services/python/` for future Python services
- Remove `apps/` directory

### Step 3: Update api-gateway
- Keep existing structure (already correct)
- Move documentation files to docs/

### Step 4: Update Configuration Files
- Update compose.yaml build contexts
- Update .gitignore if needed
- Update any scripts referencing old paths

### Step 5: Update Documentation
- Update README.md with new structure
- Move api-gateway docs to docs/
- Create architecture documentation

## Files to Update
1. compose.yaml - build contexts
2. .gitignore - path references
3. README.md - documentation
4. Any scripts in scripts/
5. CI/CD workflows in .github/
