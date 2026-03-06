# Authentication (gh auth)
## Authentication (gh auth)

### Login

```bash
# Interactive login
gh auth login

# Web-based authentication
gh auth login --web

# With clipboard for OAuth code
gh auth login --web --clipboard

# With specific git protocol
gh auth login --git-protocol ssh

# With custom hostname (GitHub Enterprise)
gh auth login --hostname enterprise.internal

# Login with token from stdin
gh auth login --with-token < token.txt

# Insecure storage (plain text)
gh auth login --insecure-storage
```

### Status

```bash
# Show all authentication status
gh auth status

# Show active account only
gh auth status --active

# Show specific hostname
gh auth status --hostname github.com

# Show token in output
gh auth status --show-token

# JSON output
gh auth status --json hosts

# Filter with jq
gh auth status --json hosts --jq '.hosts | add'
```

### Switch Accounts

```bash
# Interactive switch
gh auth switch

# Switch to specific user/host
gh auth switch --hostname github.com --user monalisa
```

### Token

```bash
# Print authentication token
gh auth token

# Token for specific host/user
gh auth token --hostname github.com --user monalisa
```

### Refresh

```bash
# Refresh credentials
gh auth refresh

# Add scopes
gh auth refresh --scopes write:org,read:public_key

# Remove scopes
gh auth refresh --remove-scopes delete_repo

# Reset to default scopes
gh auth refresh --reset-scopes

# With clipboard
gh auth refresh --clipboard
```

### Setup Git

```bash
# Setup git credential helper
gh auth setup-git

# Setup for specific host
gh auth setup-git --hostname enterprise.internal

# Force setup even if host not known
gh auth setup-git --hostname enterprise.internal --force
```


# Browse (gh browse)
## Browse (gh browse)

```bash
# Open repository in browser
gh browse

# Open specific path
gh browse script/
gh browse main.go:312

# Open issue or PR
gh browse 123

# Open commit
gh browse 77507cd94ccafcf568f8560cfecde965fcfa63

# Open with specific branch
gh browse main.go --branch bug-fix

# Open different repository
gh browse --repo owner/repo

# Open specific pages
gh browse --actions       # Actions tab
gh browse --projects      # Projects tab
gh browse --releases      # Releases tab
gh browse --settings      # Settings page
gh browse --wiki          # Wiki page

# Print URL instead of opening
gh browse --no-browser
```

