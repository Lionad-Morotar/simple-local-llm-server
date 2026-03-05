---
name: create-project
description: Fork and set up open source projects under Lionad's GitHub account. Use when user wants to create a new project based on an existing repository that is not owned by Lionad. Triggers when git remote origin is not a Lionad repository and user wants to create their own version.
---

# Create Project

## Overview

This skill handles the workflow of forking or creating new GitHub projects under Lionad's account when working with third-party repositories. It manages repository setup, remote configuration, and documentation updates.

## Workflow

### Step 1: Check Current Repository Ownership

Run the following command to check if the current project belongs to Lionad:

```bash
git remote get-url origin
```

**Decision:**
- If URL contains `github.com/Lionad-Morotar/` or `github.com/lionad/` → **Stop**, this is already Lionad's project
- If URL contains other usernames → **Continue to Step 2**

### Step 2: Determine Project Name

**Must consult user for the new project name.**

Ask the user:
> "This project is owned by [original-owner]. What would you like to name your fork under Lionad's account?"

**Naming conventions:**
- Keep it descriptive and related to the original project
- Consider prefixing with `my-` or domain-specific prefix if it's a personal variant
- Use kebab-case (lowercase with hyphens)

### Step 3: Create GitHub Repository

Use GitHub CLI to create the new repository:

```bash
gh repo create Lionad-Morotar/<new-name> --public --description "Fork of [original-repo]: [original-description]"
```

**Flags:**
- `--public` or `--private` based on user preference (default to public for open source)
- `--description` should reference the original project

### Step 4: Update Project Configuration

Before pushing to the new repository, update the following files:

#### package.json
- Update `name` field to the new package name
- Update `author` field to Lionad
- Update `repository.url` to the new GitHub URL
- Update `homepage` if applicable

#### Other configuration files to check:
- `README.md` - Add fork attribution section
- `LICENSE` - Update copyright holder if changing license
- Any CI/CD configs (`.github/workflows/`, etc.)

### Step 5: Commit Changes

Commit all configuration updates:

```bash
git add -A
git commit -m "chore: update package metadata for fork"
```

### Step 6: Configure Remotes

Update Git remotes to point to the new repository:

```bash
# Rename current origin to upstream
git remote rename origin upstream

# Add new origin (Lionad's repo)
git remote add origin https://github.com/Lionad-Morotar/<new-name>.git

# Push to new origin
git push -u origin main
```

### Step 7: Update README.md

Add a section at the top of README.md documenting the fork relationship:

```markdown
## About This Fork

This is a fork of [<original-repo-name>](<original-repo-url>) by [<original-author>](<original-author-url>).

**Original Repository:** <original-repo-url>
**Upstream:** `git remote add upstream <original-repo-url>.git`

### Changes from Original

- [List any modifications made]
```

Commit this change:
```bash
git add README.md
git commit -m "docs: add fork attribution to README"
git push origin main
```

## Resources

### scripts/

- `check-ownership.sh` - Check if current repo belongs to Lionad
- `setup-remotes.sh` - Configure origin and upstream remotes

## Example Usage

**Scenario:** User is working on `https://github.com/SomeAuthor/cool-lib.git`

1. Check ownership → Not Lionad's project
2. Ask user for name → User chooses "my-cool-lib"
3. Create repo → `gh repo create Lionad-Morotar/my-cool-lib`
4. Update package.json → Change name, author, repository URL
5. Commit changes
6. Configure remotes → origin=Lionad's repo, upstream=original
7. Update README → Add fork attribution
