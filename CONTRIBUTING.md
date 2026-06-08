# Contributing to Zero-Trust Agent Framework

Thanks for your interest in improving the framework. This project benefits most from people who've deployed agents in production and learned something the hard way.

---

## What Makes a Good Contribution

### High Value
- **Production war stories** — What broke, why, and how you fixed it. These become examples and cautionary tales in the framework docs.
- **New agent scope examples** — Real-world configurations for agent types not yet covered (see `examples/`).
- **Template improvements** — Refinements to templates based on actual usage (missing fields, unclear instructions, better defaults).
- **Security model extensions** — New guardrail patterns, approval workflows, or isolation techniques.
- **Proactive watcher patterns** — New watcher types for different domains (fintech, healthcare, e-commerce, etc.).

### Also Welcome
- Typo fixes and documentation clarity improvements
- Translations
- Better ASCII diagrams
- Links to related tools, papers, or projects

### Not a Fit
- Vendor-specific SDK integrations (the framework is methodology-first, not tied to any platform)
- Changes that add mandatory dependencies
- Content that promotes a specific commercial product

---

## How to Contribute

### 1. Open an Issue First (for non-trivial changes)

Before writing a large PR, open an issue describing:
- What you want to change or add
- Why it matters (ideally: "I deployed an agent and this happened...")
- How you'd approach it

This saves everyone time and ensures your contribution fits the project direction.

### 2. Fork and Branch

```bash
git clone https://github.com/chrismaz11/zero-trust-agent.git
cd zero-trust-agent
git checkout -b feat/your-improvement
```

### 3. Make Your Changes

- Follow the existing file structure and naming conventions
- Use Markdown for all documentation
- Include practical examples (config snippets, pseudocode, real scenarios)
- If adding a new example agent, use the same structure as existing examples in `examples/`

### 4. Submit a PR

- Clear title describing the change
- Body explaining *what* changed and *why*
- Link to any related issues
- If it's a war story or lesson learned, include enough context for others to learn from it

---

## Code of Conduct

Be constructive, be specific, be respectful. This is a professional project aimed at making AI agents safer. Contributions are evaluated on merit and relevance.

---

## Questions?

Open an issue with the `question` label, or reach out to [@chrismaz11](https://github.com/chrismaz11).
