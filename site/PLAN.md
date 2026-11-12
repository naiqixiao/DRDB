# DRDB project page (GitHub Pages): design plan

## Context
DRDB has no public landing page. You want a GitHub Pages site that explains **why** DRDB exists and the developmental-research background behind it, not a feature manual. The source is the unpublished manuscript work in `manuscript/` (gitignored): `narrative_outline.md` (story, "research happens in a changing world" frame, history table, vignette), `draft.md` (literature), and `review_and_completion_plan.md` §3 (what the code actually does). The visual language is the **diagram-design** skill with its **default editorial skin**.

A second source is the lab's public **Baby Lab Handbook, DRDB section** (https://mcmaster-baby-lab.github.io/handbook/DRDB and its sub-pages: recruitment, DRDBFamily, personnel, studies, DRDBLab, FAQs). It describes how DRDB is used day to day. The page uses it for lived practice (how a recruiter works, the lab's etiquette, training) and links to it as "the training materials".

Decisions made:
- Site lives in a new top-level **`site/`** folder, deployed from `master` by a GitHub Actions workflow.
- Default diagram-design tokens: paper `#f5f5f5`, ink `#2d3142`, muted `#4f5d75`, accent `#bf4520` (dark-mode values from `style-guide.md`). Fonts: Instrument Serif for headings and callouts, Geist for body, Geist Mono for eyebrows and labels.
- Usage numbers come from you (below). Other unverified manuscript numbers are left out.

## Guardrails for content (from review §3)
- Describe only features that exist in v3.2.2. Do **not** claim Microsoft integration, VPN enforcement, maps in reminders, "equal rate" of contact, or a diversity dashboard.
- Wording: "randomized presentation order to reduce position bias"; "MariaDB (MySQL-compatible)"; AI is *optional* and *can* run on a local model.
- Use proportionate verbs ("supports", "reduces the risk of"). No marketing adjectives.
- Do not mention the journal submission; at most say "a methods paper is in preparation".
- From the handbook, do **not** copy internal details: staff names or emails, the production URL, SharePoint links, or the McMaster VPN note. VPN and "MySQL" are local deployment choices, not software features. The handbook gives reminder times (3 PM); the code makes the time configurable per lab (defaults in `server/jobs/scheduler.js`), so the page says only "the day before".
- The handbook FAQ says emails aren't sent in Training Mode. Review §3 lists this as unconfirmed. Check it in the code (TrainingSet handling in `server/api/controllers/*` and the reminder/email paths) before claiming it; otherwise write "practice families kept separate from real data and statistics".

## Files to create
```
site/
  PLAN.md                 # this plan, copied in
  index.html              # single long-form page, all diagrams as inline SVG
  assets/site.css         # tokens (light + dark), layout, type ramp
  assets/favicon.svg      # simple DRDB monogram
  .nojekyll
.github/workflows/pages.yml   # actions/upload-pages-artifact (path: site) + actions/deploy-pages
```
Inline SVG (not images) so diagrams use the same CSS tokens and switch with dark mode. No JS framework; at most a few lines for the mobile nav.

## Page layout
Single column, 720px reading width for prose, figures break out to 1040px. Hairline rules between sections, borders instead of shadows, radius ≤ 8px. Each section opens with a mono eyebrow ("01 · THE PROBLEM") and a serif H2. Accent is used on 1–2 elements per figure only. Sticky top bar: DRDB wordmark · Background · History · Principles · In practice · Training · GitHub. Mobile: 16px gutter; wide SVGs scroll inside their own container (pattern from `assets/template.html`).

## Sections and content

**0. Hero**
- Eyebrow: `DEVELOPMENTAL RESEARCH DATABASE · OPEN SOURCE · MIT`
- H1 (serif): *Research happens in a changing world. Its infrastructure should keep the science constant.*
- Lead (2 sentences): every experiment depends on an operations layer (pool, eligibility, contacts, schedules, rooms, people). DRDB is a self-hosted system that turns lab coordination into enforced rules.
- Buttons: View on GitHub · Deploy with Docker.
- **Figure A, Nested diagram:** *Society* (pandemics, communication norms, privacy law, staff turnover) ⊃ *Lab operations layer* (accent) ⊃ *The experiment*. Caption: the operations layer absorbs outside change so the experiment stays the same.

**1. The invisible operations layer** (problem)
Prose from the model Introduction ¶1, then a two-column list of six questions. Each item: the question, one line on the threat to research quality, and a citation.
- Who is eligible? (non-naïve or out-of-window participants are excluded after testing: Frank et al., 2017)
- Who contacts whom? (over-contact; spreadsheet row order decides who gets invited: Hurwitz et al., 2017; Peeler et al., 2021)
- Who can see what? (local files can't be reached remotely; shared files are too open)
- Who does the work? (new RAs every term; procedural fidelity)
- Who shares the space? (rooms and parking; a missed infant visit can close an age window)
- Who is in the pool? (representativeness: Nielsen et al., 2017; Sugden & Moulson, 2015)

**2. Why developmental research is the stress test**
Three short points: eligibility windows only weeks wide, so it changes daily; one family holds several participants; families are recruited from the community and their goodwill has to last for years.
- **Figure B, Gantt:** age axis 0 to 60 months, 4–5 study age windows as bars, two sibling markers (4 mo and 36 mo) with a vertical "today" line. The study the infant enters next is accented. This shows eligibility changing over time and across siblings.

**3. Born in March 2020** (history as adaptation)
Narrative: repository created 29 Mar 2020, about two weeks after the provincial emergency; records on lab computers had become unreachable. Then the three-question spine: 2020 *"Can we reach families at all?"* → 2023 *"Who gets which room, and when?"* → 2026 *"Can a new RA run this lab correctly on day one?"*
- **Figure C, Timeline** (honest time scale, 2020–2026): three phase bands (Remote recruitment · Return to the lab · Lab operations platform) with milestones: training mode (Nov 2020), v1.0.0 (Jan 2021), real-time updates (Feb 2021), testing rooms and multi-lab (Jun 2023), setup wizard v3 (Apr 2026), Docker plus optional local AI (Sep 2026), participation rules (Nov 2026). Accent on Mar 2020 and v3. The quiet 2025 stretch stays visible as an annotated gap ("stable routine use").
- **Table: External shift → disruption → DRDB adaptation.** About 8 rows from narrative_outline §2. Rows marked "[verify]" there are dropped unless confirmed in code.

**4. Design principles**
Numbered list 0–5. Principle 0 is set larger as the overarching one.
0. Adapt the infrastructure so the science can stay constant · 1. One source of truth · 2. Encode etiquette as rules (lab locking, auto-release after 14 days, contact warnings, prerequisite and exclusion rules) · 3. Automate the routine; keep humans for judgment · 4. Safe to learn (training mode with practice families) · 5. Privacy by default (self-hosted; optional local LLM).

**5. Following one family**
The vignette from narrative_outline §3 (two siblings, randomized eligible list, real-time "someone just opened this family" warning, booking locks the family to Lab A, calendar invites, reminder with parking instructions, completion and release, later exclusion from Lab C's study).
- **Figure D, State machine (lifecycle phase map):** Registered → Eligible → Contacted → Scheduled · *locked to lab* (accent) → Visited → Completed · *released*. Side transitions: no reply for 14 days → auto-released; "no more contact". At most 8 states.
- One closing line on the adult-cohort parallel.

**5b. Lab etiquette, written into software** (new; from the handbook)
Two columns. On the left, the rule as the handbook teaches it to new RAs (quoted). On the right, how DRDB enforces it or makes it easy. Each row has a mono tag pointing to the handbook sub-page.
| Lab practice (handbook) | What DRDB does |
|---|---|
| Record every call "so other researchers don't call back with the same information" | Conversation log on each family; real-time warning when someone else has the family open |
| "Make the most of the participant's time": bundle studies into one visit, and ask about eligible siblings | Additional eligible studies and eligible siblings are highlighted while booking |
| Follow up "in a timely manner" | Every contact sets a next-contact reminder (default 7 days) and a follow-ups queue |
| Mark completed studies so a family is "not contacted again for that study" | Completion status plus prerequisite and exclusion rules |
| Respect a family's wish to stop | "No More Contact" flag |
| Email templates "should be the same as the ones in the approved study ethics protocol" | Per-study templates, generated and proofread before sending |
| Block unavailable time on your calendar | Experimenter calendars linked; invites go to families and experimenters |
| Mark people inactive when they leave | Retired personnel removed from studies but kept in history |
This section shows principle 2 ("Encode etiquette as rules") with real practice rather than abstraction.

**5c. Learning DRDB** (new; short)
- How a new RA starts: Admin or Lab Manager adds them → assigned to studies as an experimenter → practises in **Training Mode** with practice families → switches to Working Mode.
- Links to the six handbook sub-pages as a compact "Training materials" index (Recruitment · Family information · Researchers · Studies · Lab setup · FAQs), plus a note that the handbook is the founding lab's own and other labs can adapt it.

**6. In use** (stat strip, varied widths rather than three equal cards)
- 13,310 families · 15,295 children in the founding lab's database
- 2,600+ families have visited for a study
- ~39 visits per month on average since 2021
- 10+ universities have deployed DRDB
Small mono caption: "Founding lab, as of 2026."

**7. Beyond developmental research**
A short paragraph: any lab with a standing community pool has the same problems. Examples: a cognitive-aging lab re-inviting older adults each year; EEG and imaging groups sharing one registry and excluding non-naïve participants. How DRDB differs from subject-pool systems and REDCap/Qualtrics: it manages the pool and the operations around it, not data capture.

**8. Under the hood** (brief, for technical readers)
- **Figure F, ER sketch:** a redrawn version of the handbook's "data structure and relations" figure in diagram-design style, showing three data groups (Families & children · Lab relationships: labs, studies, personnel · Appointments). Use ≤7 entities: Family, Child, Lab, Study, Personnel, Appointment, Conversation. Accent on Appointment, which joins them. Load `type-er.md`.
- **Figure E, Architecture** (6 nodes or fewer): Browser (Vue 3 + Vuetify) → Express API (accent) → MariaDB; Express → Gmail and Calendar (link color); Express ⇢ optional LLM (local or external, dashed); cron jobs inside the API box.
- Compact feature list: duplicate detection and merge, Excel/CSV import, per-lab email branding, Zoom links, per-lab time zones, shared parking board, encrypted migration, Swagger API, setup wizard.
- Deploy: `docker compose up`, with links to README and docs.

**9. References** (APA, from draft.md, DOI-linked): Byers-Heinlein et al. 2020; Frank et al. 2017; Hurwitz et al. 2017; Nielsen et al. 2017; Peeler et al. 2021; Sugden & Moulson 2015; Sheskin et al. 2020 (check the DOI before including).

**10. Footer:** MIT license · GitHub · Training handbook · "A methods paper describing DRDB is in preparation."

## Diagram-design rules applied
For each figure, load its type reference first (`type-nested.md`, `type-gantt.md`, `type-timeline.md`, `type-state.md` plus `semantic-patterns.md` lifecycle, `type-architecture.md`). Each figure has 9 nodes or fewer, at most 2 accents, Geist 600 node names, Geist Mono sublabels, masked arrow labels, orthogonal connectors, no shadows, a `<title>` and `<desc>` for accessibility, and dark-mode tokens.

## Verification
1. `python3 -m http.server -d site 8000`, then check the page in Chrome (claude-in-chrome) at desktop width and at 375px, in light and dark mode. Look for no horizontal page scroll, figures scrolling inside their own containers, and no label collisions.
2. Run `python3 ~/.claude/skills/diagram-design/scripts/self_check.py site/index.html` and fix what it reports.
3. Fact check: grep the code for every feature named on the page (e.g., Fisher–Yates in `server/api/controllers/child.js`, auto-release in `server/jobs/scheduler.js`, parking board, training set), and check milestone dates with `git log`.
4. Check that every external link, DOI, and handbook sub-page link resolves. Grep the page for internal-only strings (staff emails, `drdb.mcmaster.ca`, `sharepoint`) and confirm none appear.
5. After pushing: set Settings → Pages → Source to "GitHub Actions", confirm the workflow run succeeds, and open `https://naiqixiao.github.io/DRDB/`.
