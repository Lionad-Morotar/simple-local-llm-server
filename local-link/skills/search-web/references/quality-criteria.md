# Quality Criteria Reference

Detailed scoring rubrics for the Evaluator-optimizer pattern in search-web skill.

## Coverage (1-5)

### Score 5: Comprehensive
- All critical angles of the research question are addressed
- Multiple perspectives represented (pro/con, different methodologies)
- Sufficient depth in each area to draw conclusions

**Example**: Researching "LLM PowerShell vs Bash performance" includes:
- Benchmark studies with metrics
- User reports from different contexts
- Technical analysis of why differences exist
- Tool-specific evaluations (Copilot, Claude, etc.)

### Score 4: Good
- Most critical angles covered
- Minor gaps in secondary aspects
- Enough information to answer core question with caveats

### Score 3: Adequate
- Core question addressed but narrowly
- Some important angles missing
- May need supplementation for complete answer

### Score 2: Limited
- Only one or two angles covered
- Significant gaps in understanding
- Cannot confidently answer core question

### Score 1: Insufficient
- Major gaps across all dimensions
- Core question essentially unanswered
- Requires substantial additional search

## Source Quality (1-5)

### Score 5: Excellent
- Primary sources (official docs, original research)
- Authoritative secondary sources (respected publications, recognized experts)
- Multiple high-quality sources confirming key claims

**Tier 1 Sources**:
- Official documentation (Microsoft, Google, etc.)
- Peer-reviewed papers (arXiv with citations, conferences)
- Official GitHub repositories and issues
- Recognized expert blogs (researchers, core contributors)

### Score 4: Good
- Mix of Tier 1 and Tier 2 sources
- Generally trustworthy
- Minor reliance on less authoritative sources

**Tier 2 Sources**:
- Established tech publications (IEEE, ACM, reputable tech blogs)
- Well-maintained documentation sites
- Active community forums with expert participation

### Score 3: Mixed
- Significant reliance on Tier 2 and Tier 3 sources
- Some questionable sources but not for critical claims

**Tier 3 Sources**:
- General tech blogs
- Stack Overflow answers
- Reddit discussions with verification

### Score 2: Poor
- Heavy reliance on Tier 3 sources
- Some unverified claims
- Limited authoritative backing

### Score 1: Unreliable
- Mostly unverified sources
- Content farms, marketing materials presented as fact
- Cannot trust key claims

## Consistency (1-5)

### Score 5: Strong Consensus
- Independent sources agree on key facts
- Minor variations in interpretation but core claims consistent
- Contradictions noted and explained (e.g., different contexts, time periods)

### Score 4: Generally Consistent
- Most sources agree
- Minor contradictions that don't affect core conclusions
- Some uncertainty in details

### Score 3: Mixed
- Noticeable contradictions on some points
- Core claims still mostly supported
- Requires careful presentation of conflicting evidence

### Score 2: Significant Disagreement
- Major contradictions on important points
- Difficult to determine which sources are correct
- Core conclusions uncertain

### Score 1: Contradictory
- Sources directly contradict each other on core claims
- No clear way to resolve conflicts
- Research question essentially contested

## Specificity (1-5)

### Score 5: Highly Specific
- Claims backed by specific numbers, percentages, dates
- Named tools, versions, methodologies
- Concrete examples and case studies

**Indicators**:
- "In SWE-bench, Claude achieved 23.5% on PowerShell vs 41.2% on Bash"
- "GitHub Copilot v1.123 released March 2024"
- "In a study of 500 commands..."

### Score 4: Mostly Specific
- Many claims have specific backing
- Some generalizations but not for critical points
- Sufficient detail to verify claims

### Score 3: Moderate
- Mix of specific and general claims
- Key points may lack specific backing
- Some verification possible

### Score 2: Mostly General
- Mostly vague claims ("many users", "often", "generally")
- Few specific numbers or examples
- Hard to verify or build upon

### Score 1: Vague
- Almost entirely generalizations
- "PowerShell is harder for LLMs" (no data)
- Marketing language without substance

## Recency (1-5)

### Score 5: Current
- Information from the last 6-12 months for fast-moving topics
- Latest versions of tools/frameworks covered
- Recent developments included

### Score 4: Mostly Current
- Most information within 1-2 years
- Some older but still relevant content
- Not missing major recent developments

### Score 3: Mixed
- Mix of current and older information
- Some possibly outdated claims
- May be missing recent context

### Score 2: Dated
- Mostly 2+ years old
- Likely missing important developments
- Context may have changed significantly

### Score 1: Outdated
- Information significantly outdated
- May be misleading due to changes in field
- Cannot rely on findings

## Overall Assessment Guidelines

### When to Recommend COMPLETE

**All must be true**:
- Coverage ≥ 3
- Source Quality ≥ 3
- Consistency ≥ 3 (or contradictions documented and explained)
- Specificity ≥ 3 for key claims
- Sufficient to answer core research question

### When to Recommend CONTINUE_SEARCH

**Any of these**:
- Coverage ≤ 2 (major gaps)
- Source Quality ≤ 2 for critical claims
- Consistency ≤ 2 with unresolved contradictions
- Specificity ≤ 2 (need concrete data)
- Core question cannot be confidently answered

### Diminishing Returns Detection

Recommend COMPLETE if:
- Previous round added minimal new information
- Scores stable across 2+ rounds
- New searches finding same sources repeatedly
- User's quality threshold met

## Example Evaluations

### Example 1: High Quality Research

```
Coverage: 5/5 - Compared multiple agents, benchmark datasets, user studies
Source Quality: 5/5 - Papers from NeurIPS, official GitHub repos, Microsoft docs
Consistency: 4/5 - Strong consensus on main findings, minor disagreement on magnitude
Specificity: 5/5 - Specific numbers: "41.2% vs 23.5%", "500 test cases"
Recency: 4/5 - Mostly 2024, some 2023 context still relevant

Recommendation: COMPLETE
```

### Example 2: Needs More Work

```
Coverage: 2/5 - Only found general discussions, missing benchmark data
Source Quality: 3/5 - Mix of blogs and forums, few authoritative sources
Consistency: 3/5 - General agreement but based on limited evidence
Specificity: 2/5 - "LLMs struggle with PowerShell" without data
Recency: 3/5 - Some recent, some older

Gaps:
1. No benchmark studies found
2. Missing quantitative data
3. Limited tool-specific analysis

Recommendation: CONTINUE_SEARCH
Next queries: "SWE-bench PowerShell results", "LLM shell command benchmark dataset"
```

### Example 3: Fundamental Issues

```
Coverage: 3/5 - Multiple angles but superficial
Source Quality: 2/5 - Mostly opinion pieces and unverified claims
Consistency: 2/5 - Direct contradictions on key points, no resolution
Specificity: 2/5 - Vague claims dominate
Recency: 3/5 - Mixed

Issues:
- Sources contradict without clear way to resolve
- Low-quality sources for critical claims
- Need to find primary sources or authoritative studies

Recommendation: CONTINUE_SEARCH
Focus: Find authoritative benchmarks or studies to resolve contradictions
```
