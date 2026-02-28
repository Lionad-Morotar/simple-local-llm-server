#!/usr/bin/env python3
"""
Search Quality Evaluator - Assesses search results against quality criteria.

Part of the Evaluator-optimizer pattern for the search-web skill.
This script provides structured quality assessment for research results.

Usage:
    python3 evaluator.py --log /path/to/master-log.md --goal "research goal"
    python3 evaluator.py --results "search results text" --round 2
"""

import argparse
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional


def parse_quality_score(text: str, dimension: str) -> tuple:
    """
    Extract quality score for a dimension from evaluator text.
    Returns (score, evidence)
    """
    patterns = [
        rf"\*\*{dimension}\*\*.*?([1-5]).*?-\s*(.+?)(?=\n\s*\*\*|$)",
        rf"{dimension}.*?([1-5]).*?-\s*(.+?)(?=\n|$)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            score = int(match.group(1))
            evidence = match.group(2).strip()
            return score, evidence

    return None, None


def parse_overall_score(text: str) -> Optional[float]:
    """Extract overall quality score from evaluator text."""
    patterns = [
        r"Overall Score.*?([0-9.]+)/5",
        r"overall.*?([0-9.]+)/5",
        r"average.*?([0-9.]+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return float(match.group(1))

    return None


def parse_recommendation(text: str) -> str:
    """Extract completion recommendation from evaluator text."""
    patterns = [
        r"Recommendation.*?\*\*(COMPLETE|CONTINUE)",
        r"Recommendation.*?(COMPLETE|CONTINUE)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).upper()

    # Default based on overall score
    score = parse_overall_score(text)
    if score and score >= 3.0:
        return "COMPLETE"
    return "CONTINUE"


def parse_gaps(text: str) -> List[str]:
    """Extract identified gaps from evaluator text."""
    gaps = []

    # Look for Gap Analysis section
    gap_section = re.search(
        r"Gap Analysis.*?(?:##|$)",
        text,
        re.IGNORECASE | re.DOTALL
    )

    if gap_section:
        section_text = gap_section.group(0)
        # Extract numbered items
        items = re.findall(r"^\s*\d+\.\s*(.+)$", section_text, re.MULTILINE)
        gaps.extend(items)

    return gaps


def parse_recommendations(text: str) -> List[str]:
    """Extract improvement recommendations from evaluator text."""
    recommendations = []

    # Look for Improvement Recommendations section
    rec_section = re.search(
        r"Improvement Recommendations.*?(?:##|$)",
        text,
        re.IGNORECASE | re.DOTALL
    )

    if rec_section:
        section_text = rec_section.group(0)
        # Extract numbered items
        items = re.findall(r"^\s*\d+\.\s*(.+)$", section_text, re.MULTILINE)
        recommendations.extend(items)

    return recommendations


def evaluate_quality(evaluator_text: str) -> Dict:
    """
    Parse evaluator output and return structured quality assessment.
    """
    dimensions = ["Coverage", "Source Quality", "Consistency", "Specificity", "Recency"]

    scores = {}
    for dim in dimensions:
        score, evidence = parse_quality_score(evaluator_text, dim)
        scores[dim.lower().replace(" ", "_")] = {
            "score": score,
            "evidence": evidence
        }

    overall = parse_overall_score(evaluator_text)
    recommendation = parse_recommendation(evaluator_text)
    gaps = parse_gaps(evaluator_text)
    recommendations = parse_recommendations(evaluator_text)

    return {
        "dimensions": scores,
        "overall_score": overall,
        "recommendation": recommendation,
        "gaps": gaps,
        "improvement_recommendations": recommendations,
        "timestamp": datetime.now().isoformat()
    }


def format_evaluation_report(assessment: Dict) -> str:
    """Format quality assessment as markdown report."""

    report = f"""## Quality Evaluation Report

**Timestamp**: {assessment['timestamp']}
**Overall Score**: {assessment['overall_score'] or 'N/A'}/5
**Recommendation**: {'✅ COMPLETE' if assessment['recommendation'] == 'COMPLETE' else '🔍 CONTINUE SEARCH'}

### Dimension Scores

| Dimension | Score | Evidence |
|-----------|-------|----------|
"""

    for dim_name, dim_data in assessment['dimensions'].items():
        score = dim_data['score'] if dim_data['score'] else 'N/A'
        evidence = dim_data['evidence'] if dim_data['evidence'] else 'Not provided'
        report += f"| {dim_name.replace('_', ' ').title()} | {score} | {evidence} |\n"

    if assessment['gaps']:
        report += "\n### Identified Gaps\n\n"
        for i, gap in enumerate(assessment['gaps'], 1):
            report += f"{i}. {gap}\n"

    if assessment['improvement_recommendations']:
        report += "\n### Improvement Recommendations\n\n"
        for i, rec in enumerate(assessment['improvement_recommendations'], 1):
            report += f"{i}. {rec}\n"

    return report


def should_continue_search(assessment: Dict, round_num: int, max_rounds: int = 4) -> bool:
    """
    Determine if search should continue based on assessment.

    Returns True if should continue, False if complete.
    """
    # Hard limit
    if round_num >= max_rounds:
        return False

    # Explicit recommendation
    if assessment['recommendation'] == 'COMPLETE':
        return False

    # Score-based decision
    overall = assessment['overall_score']
    if overall and overall >= 3.5:
        return False

    # Check individual dimensions
    critical_dimensions = ['coverage', 'source_quality', 'consistency']
    for dim in critical_dimensions:
        if dim in assessment['dimensions']:
            score = assessment['dimensions'][dim]['score']
            if score and score <= 2:
                return True

    return True


def main():
    parser = argparse.ArgumentParser(
        description="Evaluate search results quality for search-web skill"
    )
    parser.add_argument(
        "--log", "-l",
        help="Path to master log file to evaluate"
    )
    parser.add_argument(
        "--results", "-r",
        help="Direct search results text to evaluate"
    )
    parser.add_argument(
        "--evaluator-text", "-e",
        help="Raw evaluator output text to parse"
    )
    parser.add_argument(
        "--round", "-n",
        type=int,
        default=1,
        help="Current search round number"
    )
    parser.add_argument(
        "--output", "-o",
        help="Output file for evaluation report"
    )
    parser.add_argument(
        "--format", "-f",
        choices=["json", "markdown"],
        default="markdown",
        help="Output format"
    )

    args = parser.parse_args()

    # If evaluator text provided, parse it
    if args.evaluator_text:
        assessment = evaluate_quality(args.evaluator_text)

        if args.format == "json":
            output = json.dumps(assessment, indent=2)
        else:
            output = format_evaluation_report(assessment)

        if args.output:
            Path(args.output).write_text(output)
            print(f"Evaluation report written to: {args.output}")
        else:
            print(output)

        # Exit code indicates recommendation
        exit_code = 0 if assessment['recommendation'] == 'COMPLETE' else 1
        exit(exit_code)

    # Otherwise, this is a template/reference script
    print("Search Quality Evaluator")
    print("=" * 50)
    print()
    print("This script provides structured quality assessment for search results.")
    print()
    print("Usage modes:")
    print("  1. Parse evaluator output: --evaluator-text 'evaluator response'")
    print("  2. Reference for manual evaluation (see source code)")
    print()
    print("Quality Dimensions:")
    print("  - Coverage: Are all angles addressed?")
    print("  - Source Quality: Are sources authoritative?")
    print("  - Consistency: Do sources agree?")
    print("  - Specificity: Are claims backed by data?")
    print("  - Recency: Is information current?")
    print()
    print("See references/quality-criteria.md for detailed rubrics.")


if __name__ == "__main__":
    main()
