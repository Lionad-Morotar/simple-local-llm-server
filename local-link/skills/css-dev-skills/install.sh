#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_SRC="$SCRIPT_DIR/skills"

if [ ! -d "$SKILLS_SRC" ]; then
  echo "Error: skills/ directory not found at $SKILLS_SRC" >&2
  exit 1
fi

usage() {
  cat <<'EOF'
css.dev installer — copies skills to the correct directory for your AI tool.

Usage: ./install.sh <target> [--global]

Targets:
  cursor      .agents/skills/     (project) or ~/.cursor/skills/ (global)
  claude      .claude/skills/     (project) or ~/.claude/skills/ (global)
  codex       .agents/skills/     (project) or ~/.agents/skills/ (global)
  gemini      .gemini/skills/     (project) or ~/.gemini/skills/ (global)
  copilot     .agents/skills/     (project) or ~/.agents/skills/ (global)
  all         installs to both .agents/skills/ and .claude/skills/ (project)

Options:
  --global    Install to user-level directory (available in all projects)

Examples:
  ./install.sh cursor              # project-level for Cursor
  ./install.sh claude --global     # global for Claude Code
  ./install.sh all                 # project-level for all providers
EOF
  exit 0
}

install_skills() {
  local dest="$1"
  local label="$2"

  mkdir -p "$dest"

  for skill_dir in "$SKILLS_SRC"/*/; do
    [ -f "$skill_dir/SKILL.md" ] || continue
    skill_name="$(basename "$skill_dir")"
    target="$dest/$skill_name"

    if [ -d "$target" ]; then
      rm -rf "$target"
    fi

    cp -r "$skill_dir" "$target"
  done

  local count
  count=$(find "$SKILLS_SRC" -maxdepth 1 -mindepth 1 -type d | wc -l | tr -d ' ')
  echo "  Installed $count skills to $dest ($label)"
}

TARGET="${1:-}"
GLOBAL=false

if [ "$2" = "--global" ] || [ "$1" = "--global" ]; then
  GLOBAL=true
  [ "$1" = "--global" ] && TARGET="${2:-}"
fi

[ -z "$TARGET" ] && usage

case "$TARGET" in
  cursor)
    if $GLOBAL; then
      install_skills "$HOME/.cursor/skills" "Cursor global"
    else
      install_skills ".cursor/skills" "Cursor project"
    fi
    ;;
  claude)
    if $GLOBAL; then
      install_skills "$HOME/.claude/skills" "Claude Code global"
    else
      install_skills ".claude/skills" "Claude Code project"
    fi
    ;;
  codex)
    if $GLOBAL; then
      install_skills "$HOME/.agents/skills" "Codex global"
    else
      install_skills ".agents/skills" "Codex project"
    fi
    ;;
  gemini)
    if $GLOBAL; then
      install_skills "$HOME/.gemini/skills" "Gemini CLI global"
    else
      install_skills ".gemini/skills" "Gemini CLI project"
    fi
    ;;
  copilot)
    if $GLOBAL; then
      install_skills "$HOME/.agents/skills" "Copilot global"
    else
      install_skills ".agents/skills" "Copilot project"
    fi
    ;;
  all)
    if $GLOBAL; then
      install_skills "$HOME/.agents/skills" "Cursor/Codex/Gemini/Copilot global"
      install_skills "$HOME/.claude/skills" "Claude Code global"
    else
      install_skills ".agents/skills" "Cursor/Codex/Gemini/Copilot project"
      install_skills ".claude/skills" "Claude Code project"
    fi
    ;;
  help|--help|-h)
    usage
    ;;
  *)
    echo "Unknown target: $TARGET" >&2
    echo "Run ./install.sh --help for usage." >&2
    exit 1
    ;;
esac

echo ""
echo "css.dev skills installed. Available commands:"
echo "  /css-audit       Comprehensive CSS quality audit"
echo "  /css-layout      Modern layout solutions"
echo "  /css-animate     Performant animations"
echo "  /css-responsive  Responsive design"
echo "  /css-refactor    Upgrade legacy CSS"
echo "  /css-theme       Theming systems"
echo "  /css-a11y        CSS accessibility"
echo "  /css-debug       CSS debugging"
echo ""
echo "The css-expert skill activates automatically for CSS-related tasks."
