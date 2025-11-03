# CI/CD Pipeline Guide

Complete GitHub Actions workflow for emoji-driven deployments.

## Workflow File

Create `.github/workflows/ci-cd.yml`:

```yaml
# /// Law: Emoji-driven CI/CD pipeline for MCP Control Tower
name: 🌸💎 MCP Control Tower CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20.x'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ═══════════════════════════════════════════════════════════════
  # 🔍 Analyze commit message for workflow control
  # ═══════════════════════════════════════════════════════════════
  analyze-commit:
    runs-on: ubuntu-latest
    outputs:
      commit-type: ${{ steps.parse.outputs.type }}
      should-deploy: ${{ steps.parse.outputs.deploy }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Parse emoji commit
        id: parse
        run: |
          COMMIT_MSG=$(git log -1 --pretty=%B)
          echo "Commit: $COMMIT_MSG"
          
          # Extract emoji and determine type
          if [[ $COMMIT_MSG =~ ^🌸 ]]; then
            echo "type=package" >> $GITHUB_OUTPUT
          elif [[ $COMMIT_MSG =~ ^💎 ]]; then
            echo "type=test" >> $GITHUB_OUTPUT
          elif [[ $COMMIT_MSG =~ ^✨ ]]; then
            echo "type=mcp" >> $GITHUB_OUTPUT
            echo "deploy=true" >> $GITHUB_OUTPUT
          elif [[ $COMMIT_MSG =~ ^🛡️ ]]; then
            echo "type=security" >> $GITHUB_OUTPUT
            echo "deploy=true" >> $GITHUB_OUTPUT
          elif [[ $COMMIT_MSG =~ ^🎭 ]]; then
            echo "type=cicd" >> $GITHUB_OUTPUT
          else
            echo "type=other" >> $GITHUB_OUTPUT
          fi

  # ═══════════════════════════════════════════════════════════════
  # 🧪 Test & Quality Checks
  # ═══════════════════════════════════════════════════════════════
  test:
    runs-on: ubuntu-latest
    needs: analyze-commit
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Run tests with coverage
        run: npm test -- --coverage --coverageReporters=json-summary
      
      - name: Check coverage thresholds
        run: |
          COVERAGE=$(node -p "require('./coverage/coverage-summary.json').total.statements.pct")
          echo "Coverage: $COVERAGE%"
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "❌ Coverage below 80% threshold"
            exit 1
          fi
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests

  # ═══════════════════════════════════════════════════════════════
  # 🔒 Security Scanning
  # ═══════════════════════════════════════════════════════════════
  security:
    runs-on: ubuntu-latest
    needs: analyze-commit
    if: needs.analyze-commit.outputs.commit-type == 'security' || github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Run npm audit
        run: npm audit --audit-level=high
      
      - name: Scan for secrets with TruffleHog
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  # ═══════════════════════════════════════════════════════════════
  # 🐳 Build Docker Image
  # ═══════════════════════════════════════════════════════════════
  build:
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.ref == 'refs/heads/main' || github.event_name == 'pull_request'
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Scan image with Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'

  # ═══════════════════════════════════════════════════════════════
  # 🚀 Deploy to Production
  # ═══════════════════════════════════════════════════════════════
  deploy:
    runs-on: ubuntu-latest
    needs: [build, analyze-commit]
    if: github.ref == 'refs/heads/main' && needs.analyze-commit.outputs.should-deploy == 'true'
    environment:
      name: production
      url: https://mcp-control-tower.bambisleep.dev
    steps:
      - name: Deploy to Azure Container Instances
        uses: azure/aci-deploy@v1
        with:
          resource-group: bambisleep-rg
          dns-name-label: mcp-control-tower
          image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          registry-login-server: ${{ env.REGISTRY }}
          registry-username: ${{ github.actor }}
          registry-password: ${{ secrets.GITHUB_TOKEN }}
          name: mcp-control-tower
          location: 'eastus'
          cpu: 1
          memory: 1.5
          environment-variables: NODE_ENV=production
          secure-environment-variables: |
            GITHUB_TOKEN=${{ secrets.PROD_GITHUB_TOKEN }}
            BRAVE_API_KEY=${{ secrets.PROD_BRAVE_API_KEY }}
            POSTGRES_CONNECTION_STRING=${{ secrets.PROD_POSTGRES_URL }}
      
      - name: Send deployment notification
        if: success()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"✅ MCP Control Tower deployed successfully to production"}'

  # ═══════════════════════════════════════════════════════════════
  # 📊 Performance & Telemetry
  # ═══════════════════════════════════════════════════════════════
  telemetry:
    runs-on: ubuntu-latest
    needs: [deploy]
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Record deployment metrics
        run: |
          # Send custom event to Azure Application Insights
          curl -X POST https://dc.services.visualstudio.com/v2/track \
            -H "Content-Type: application/json" \
            -d "{
              \"name\": \"Microsoft.ApplicationInsights.Event\",
              \"time\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\",
              \"iKey\": \"${{ secrets.APPINSIGHTS_KEY }}\",
              \"data\": {
                \"baseType\": \"EventData\",
                \"baseData\": {
                  \"name\": \"Deployment\",
                  \"properties\": {
                    \"commit\": \"${{ github.sha }}\",
                    \"branch\": \"${{ github.ref_name }}\",
                    \"commitType\": \"${{ needs.analyze-commit.outputs.commit-type }}\"
                  }
                }
              }
            }"
```

## Required GitHub Secrets

Configure in: Settings → Secrets and variables → Actions

```bash
PROD_GITHUB_TOKEN              # Production GitHub token
PROD_BRAVE_API_KEY            # Production Brave Search API key
PROD_POSTGRES_URL             # Production PostgreSQL connection string
SNYK_TOKEN                    # Snyk security scanning token
SLACK_WEBHOOK_URL             # Slack notifications webhook
APPINSIGHTS_KEY              # Azure Application Insights instrumentation key
```

## Branch Protection Rules

Configure in: Settings → Branches → Branch protection rules

- Require status checks: `test`, `security`, `build`
- Require review: 1 approval
- Restrict pushes: Maintainers only for `main`
