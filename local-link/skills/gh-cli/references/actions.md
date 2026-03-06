# GitHub Actions
## GitHub Actions

### Workflow Runs (gh run)

```bash
# List workflow runs
gh run list

# List for specific workflow
gh run list --workflow "ci.yml"

# List for specific branch
gh run list --branch main

# Limit results
gh run list --limit 20

# JSON output
gh run list --json databaseId,status,conclusion,headBranch

# View run details
gh run view 123456789

# View run with verbose logs
gh run view 123456789 --log

# View specific job
gh run view 123456789 --job 987654321

# View in browser
gh run view 123456789 --web

# Watch run in real-time
gh run watch 123456789

# Watch with interval
gh run watch 123456789 --interval 5

# Rerun failed run
gh run rerun 123456789

# Rerun specific job
gh run rerun 123456789 --job 987654321

# Cancel run
gh run cancel 123456789

# Delete run
gh run delete 123456789

# Download run artifacts
gh run download 123456789

# Download specific artifact
gh run download 123456789 --name build

# Download to directory
gh run download 123456789 --dir ./artifacts
```

### Workflows (gh workflow)

```bash
# List workflows
gh workflow list

# View workflow details
gh workflow view ci.yml

# View workflow YAML
gh workflow view ci.yml --yaml

# View in browser
gh workflow view ci.yml --web

# Enable workflow
gh workflow enable ci.yml

# Disable workflow
gh workflow disable ci.yml

# Run workflow manually
gh workflow run ci.yml

# Run with inputs
gh workflow run ci.yml \
  --raw-field \
  version="1.0.0" \
  environment="production"

# Run from specific branch
gh workflow run ci.yml --ref develop
```

### Action Caches (gh cache)

```bash
# List caches
gh cache list

# List for specific branch
gh cache list --branch main

# List with limit
gh cache list --limit 50

# Delete cache
gh cache delete 123456789

# Delete all caches
gh cache delete --all
```

### Action Secrets (gh secret)

```bash
# List secrets
gh secret list

# Set secret (prompts for value)
gh secret set MY_SECRET

# Set secret from environment
echo "$MY_SECRET" | gh secret set MY_SECRET

# Set secret for specific environment
gh secret set MY_SECRET --env production

# Set secret for organization
gh secret set MY_SECRET --org orgname

# Delete secret
gh secret delete MY_SECRET

# Delete from environment
gh secret delete MY_SECRET --env production
```

### Action Variables (gh variable)

```bash
# List variables
gh variable list

# Set variable
gh variable set MY_VAR "some-value"

# Set variable for environment
gh variable set MY_VAR "value" --env production

# Set variable for organization
gh variable set MY_VAR "value" --org orgname

# Get variable value
gh variable get MY_VAR

# Delete variable
gh variable delete MY_VAR

# Delete from environment
gh variable delete MY_VAR --env production
```

