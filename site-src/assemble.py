#!/usr/bin/env python3
"""Assemble site/index.html from site-src/template.html + site-src/figures/*.html.

site/ is the publish surface: only index.html, assets/ and .nojekyll live there. The sources
(template, figure fragments, PLAN.md) stay in site-src/ so they are not deployed.

Each figure fragment gets a <title>/<desc> pair injected as the first children of
its <svg> element (accessibility, per site/PLAN.md), and the template comment
<!--FIG:name--> is replaced by the fragment.
"""
from pathlib import Path

BUILD = Path(__file__).parent
FIGS = {
    "fig1-nested": (
        "The three layers",
        "Three nested rings: society, containing the lab operations layer provided by DRDB, containing the experiment.",
    ),
    "fig1-nested-phone": (
        "The three layers, narrow",
        "Society changes at the top, the DRDB operations layer absorbs it in the middle, and the experiment at the bottom stays the same.",
    ),
    "fig2-age-windows": (
        "Eligibility windows on a shared age axis",
        "Five study age windows plotted from birth to sixty months, with markers for two siblings in one family and a vertical line at today.",
    ),
    "fig3-timeline": (
        "DRDB history, March 2020 to November 2026",
        "A timeline in three phases: remote recruitment, return to the lab, and a lab operations platform, with dated milestones.",
    ),
    "fig4-lifecycle": (
        "The path of one family",
        "Registered, eligible, contacted, scheduled, visited, completed, with an auto-released recovery state and a no-more-contact terminal state.",
    ),
    "fig5-er": (
        "The main records and how they relate",
        "Families and children, appointments and conversations, and labs, studies and personnel, joined through the appointment record.",
    ),
    "fig6-architecture": (
        "How DRDB runs",
        "A browser talks to a Node.js API, which writes to MariaDB and reaches Gmail, Google Calendar, and an optional language model.",
    ),
}

template = (BUILD / "template.html").read_text(encoding="utf-8")

for name, (title, desc) in FIGS.items():
    fragment = (BUILD / "figures" / f"{name}.html").read_text(encoding="utf-8").strip()
    n = name
    open_tag_start = fragment.index("<svg ")
    open_tag_end = fragment.index(">", open_tag_start)
    open_tag = fragment[open_tag_start:open_tag_end]
    if 'aria-label="' in open_tag:
        label = open_tag.split('aria-label="')[1].split('"')[0]
        open_tag = open_tag.replace(f'aria-label="{label}"', f'aria-labelledby="{n}-title {n}-desc"')
        title = label.rstrip(".") + "."
    fragment = (
        fragment[:open_tag_start]
        + open_tag
        + f">\n      <title id=\"{n}-title\">{title}</title>\n      <desc id=\"{n}-desc\">{desc}</desc>"
        + fragment[open_tag_end + 1 :]
    )
    comment = f"<!--FIG:{name}-->"
    assert comment in template, comment
    template = template.replace(comment, "\n      " + fragment)

out = BUILD.parent / "site" / "index.html"
out.write_text(template, encoding="utf-8")
print(f"wrote {out} ({len(template.splitlines())} lines)")
