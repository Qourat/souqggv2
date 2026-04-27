# SOUQ.V3 Git Configuration for AI Agents

## Repository Details

| Property | Value |
|----------|-------|
| **Remote URL** | `git@github.com:Qourat/souq.v3.git` |
| **Branch** | `main` |
| **Local Path** | `/var/www/souq_v3` |
| **SSH Key** | `/root/.ssh/id_ed25519` |
| **Key Fingerprint** | `hermes@souqgg` |
| **Git User** | `Qourat <Qourat@users.noreply.github.com>` |

## Pre-Configured Setup (Ready to Use)

Git is already configured. Any agent can immediately run:

```bash
cd /var/www/souq_v3

# Check status
git status

# Stage, commit, push
git add -A
git commit -m "feat: your change description"
git push origin main
```

## SSH Authentication

The deploy key is already set up and tested:

```bash
# Verify SSH key exists
ls -la /root/.ssh/id_ed25519
# Permissions should be: -rw------- (600)

# Test GitHub connection
ssh -T -i /root/.ssh/id_ed25519 git@github.com
# Expected: "Hi Qourat/souq.v3! You've successfully authenticated..."
```

**Key Details:**
- Path: `/root/.ssh/id_ed25519`
- Public key: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIO9zcy2cCQp5Kt9aaNLSyOZ9KfdUSzC/qeRRYgmUXiQL hermes@souqgg`
- Permissions: 600 (owner read/write only)
- Added to GitHub: Qourat/souq.v3 repository deploy keys

## Git Configuration (Already Set)

```bash
# Current git config in /var/www/souq_v3
git config user.name      # Returns: Qourat
git config user.email     # Returns: Qourat@users.noreply.github.com
git config remote.origin.url  # Returns: git@github.com:Qourat/souq.v3.git
```

## Commit Message Convention

Use conventional commits:

```
feat: add new feature
fix: fix a bug
docs: update documentation
style: code style changes (formatting, semicolons, etc.)
refactor: code refactoring
test: add or update tests
chore: maintenance tasks, deps, config
```

**Examples:**
- `feat: add AI compliance agent for product listings`
- `fix: resolve UTF-8 encoding in translation files`
- `refactor: extract admin banner to shared component`
- `docs: update AGENTS.md deployment section`

## Standard Agent Workflow

### 1. Before Making Changes

```bash
cd /var/www/souq_v3
git pull origin main  # Ensure you're on latest
```

### 2. Make Your Changes

Edit files as needed following AGENTS.md guidelines.

### 3. Pre-Commit Checklist

Run the Definition of Done from AGENTS.md:

```bash
npm run typecheck
npm run lint
npm run build
```

All three must pass before committing.

### 4. Review Changes

```bash
git status           # See what changed
git diff             # Review line-by-line changes
```

**Do NOT commit:**
- `.env.local` or any `.env*` files (except `.env.example`)
- `node_modules/`
- `.next/`
- `tsconfig.tsbuildinfo`
- `.bak` files (like `src/messages/en.json.bak`)
- Any files with real secrets/passwords

### 5. Commit and Push

```bash
# Stage specific files (recommended)
git add src/modules/compliance/compliance.service.ts
git add src/messages/en.json
git add src/messages/ar.json

# OR stage all (review first!)
git add -A

# Commit
git commit -m "feat: add AI compliance agent"

# Push
git push origin main
```

## Troubleshooting

### SSH Permission Denied

```bash
# Check key permissions
chmod 600 /root/.ssh/id_ed25519

# Verify key is loaded
ssh-add -l  # Should show the key fingerprint

# Test connection
ssh -T -i /root/.ssh/id_ed25519 git@github.com
```

### Push Rejected - Conflicts

```bash
# Fetch latest
git fetch origin main

# Rebase your changes
git pull --rebase origin main

# Resolve conflicts, then:
git add <resolved-files>
git rebase --continue

# Push again
git push origin main
```

### Accidental Secret Commit

If you accidentally committed a secret:

```bash
# Remove from last commit (if not pushed yet)
git reset HEAD~1

# Remove from history entirely (if already pushed)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/secret" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (only if absolutely necessary)
git push origin main --force
```

**Then:** Rotate the exposed secret immediately.

## Branch Protection

The `main` branch currently allows direct pushes (no PR required). This is intentional for autonomous agent workflows.

## Related Files

- **AGENTS.md**: `/var/www/souq_v3/AGENTS.md` - Full operational playbook
- **README.md**: `/var/www/souq_v3/README.md` - Architecture and sprint history
- **Deploy Skill**: `~/.hermes/skills/devops/souq-gg-deploy` - Deployment pipeline docs
