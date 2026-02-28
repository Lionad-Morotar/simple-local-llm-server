# Search Strategies Reference

Advanced techniques for building effective search queries.

## Query Building Framework

### 1. Core Concept Decomposition

Break your research goal into components:

```
Goal: "Compare LLM agent performance on PowerShell vs Bash"

Components:
- Subject: LLM coding agent
- Aspect A: PowerShell
- Aspect B: Bash
- Metric: performance/accuracy/benchmark
```

Generate queries by combining components with different connectors:
- `A vs B`
- `A compared to B`
- `difference between A and B`
- `A B benchmark`

### 2. Keyword Clusters

For each component, list synonyms and related terms:

**LLM coding agent:**
- AI coding assistant, code generation model, programming LLM
- GitHub Copilot, Claude Code, Cursor, CodeWhisperer
- SWE-agent, OpenDevin, AutoGPT

**PowerShell:**
- pwsh, Windows PowerShell, Windows shell
- Windows command line, Win32, Windows Terminal

**Bash:**
- zsh, sh, Unix shell, Linux shell
- WSL, macOS terminal, *nix

**Metrics:**
- accuracy, success rate, pass@k, benchmark score
- error rate, hallucination rate, failure case

### 3. Search Operators

| Operator | Purpose | Example |
|----------|---------|---------|
| `"exact phrase"` | Match exact words | `"PowerShell" "benchmark"` |
| `site:domain` | Limit to site | `site:github.com PowerShell` |
| `filetype:ext` | Specific format | `filetype:pdf LLM benchmark` |
| `-term` | Exclude | `PowerShell -WSL -Ubuntu` |
| `intitle:` | Title contains | `intitle:benchmark "coding agent"` |
| `A OR B` | Either term | `PowerShell OR "Windows shell"` |

### 4. Site-Specific Strategies

**GitHub:**
- Search issues: `is:issue "PowerShell" "error"`
- Search code: `language:PowerShell "Invoke-RestMethod"`
- README mentions: `in:readme benchmark`

**Hacker News (site:news.ycombinator.com):**
- `site:news.ycombinator.com "PowerShell" "LLM"`
- Look for "Ask HN" and "Show HN" posts

**Stack Overflow:**
- `site:stackoverflow.com "PowerShell" "GPT"`
- `site:stackoverflow.com "Copilot" "wrong"`

**arXiv:**
- `site:arxiv.org "shell" "code generation"`
- `site:arxiv.org "command line" "LLM"`

**Reddit:**
- `site:reddit.com "coding agent" "Windows"`
- `site:reddit.com/r/MachineLearning "agent"`

### 5. Negative/Error Search

Find problems and limitations:

**Error patterns:**
- `"CommandNotFoundException" LLM`
- `"is not recognized" "AI agent"`
- `"hallucinates" "PowerShell"`

**Complaint patterns:**
- `"doesn't work" "PowerShell" "Copilot"`
- `"terrible at" "PowerShell"`
- `"struggles with" "Windows" "coding agent"`

### 6. Temporal Filtering

**Recent developments:**
- Add year: `2024`, `2025`
- Use "past year" filter in search engines

**Historical context:**
- `2022 "PowerShell" "LLM"`
- `2023 "coding agent" "Windows"`

### 7. Academic/Technical Search

**Paper-focused:**
- `"benchmark" "dataset" "shell"`
- `"evaluation" "metric" "code generation"`
- `"pass@k" "shell commands"`

**Tool-specific:**
- `SWE-bench PowerShell`
- `HumanEval shell`
- `OSWorld Windows`

## Query Generation Templates

### Template 1: Comparison Study

```
"{subject}" "{aspect A}" vs "{aspect B}" {metric}
"{subject}" "{aspect A}" "{aspect B}" comparison
"{subject}" performance "{aspect A}" "{aspect B}"
```

### Template 2: Limitation Discovery

```
"{subject}" "{aspect}" limitation
"{subject}" "{aspect}" issue problem bug
"{subject}" "{aspect}" doesn't work
```

### Template 3: Benchmark/Evaluation

```
"{subject}" "{aspect}" benchmark
"{subject}" "{aspect}" evaluation dataset
"{subject}" "{aspect}" accuracy metric
```

### Template 4: Training Data Analysis

```
"{subject}" training data "{aspect}"
"{subject}" training corpus "{aspect}"
"LLM" "{aspect}" representation data
```

## Quality Indicators

Good search results typically have:
- Specific numbers or percentages
- Named tools/frameworks
- Dates (recent preferred)
- Author credentials
- Citations or references

Red flags:
- Vague claims without evidence
- Marketing language
- Outdated information (check date)
- Single anecdote as generalization
