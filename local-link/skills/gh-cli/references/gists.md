# Gists (gh gist)
## Gists (gh gist)

```bash
# List gists
gh gist list

# List all gists (including private)
gh gist list --public

# Limit results
gh gist list --limit 20

# View gist
gh gist view abc123

# View gist files
gh gist view abc123 --files

# Create gist
gh gist create script.py

# Create gist with description
gh gist create script.py --desc "My script"

# Create public gist
gh gist create script.py --public

# Create multi-file gist
gh gist create file1.py file2.py

# Create from stdin
echo "print('hello')" | gh gist create

# Edit gist
gh gist edit abc123

# Delete gist
gh gist delete abc123

# Rename gist file
gh gist rename abc123 --filename old.py new.py

# Clone gist
gh gist clone abc123

# Clone to directory
gh gist clone abc123 my-directory
```


# Codespaces (gh codespace)
## Codespaces (gh codespace)

```bash
# List codespaces
gh codespace list

# Create codespace
gh codespace create

# Create with specific repository
gh codespace create --repo owner/repo

# Create with branch
gh codespace create --branch develop

# Create with specific machine
gh codespace create --machine premiumLinux

# View codespace details
gh codespace view

# SSH into codespace
gh codespace ssh

# SSH with specific command
gh codespace ssh --command "cd /workspaces && ls"

# Open codespace in browser
gh codespace code

# Open in VS Code
gh codespace code --codec

# Open with specific path
gh codespace code --path /workspaces/repo

# Stop codespace
gh codespace stop

# Delete codespace
gh codespace delete

# View logs
gh codespace logs

--tail 100

# View ports
gh codespace ports

# Forward port
gh codespace cp 8080:8080

# Rebuild codespace
gh codespace rebuild

# Edit codespace
gh codespace edit --machine standardLinux

# Jupyter support
gh codespace jupyter

# Copy files to/from codespace
gh codespace cp file.txt :/workspaces/file.txt
gh codespace cp :/workspaces/file.txt ./file.txt
```

