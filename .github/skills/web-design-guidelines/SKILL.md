---
name: web-design-guidelines
description: Audit frontend code and rendered UI for web design, accessibility, interaction, responsive layout, typography, and usability issues. Use when reviewing a UI, checking UX, or validating a web page before completion.
argument-hint: <file-or-pattern>
---

# Web Design Guidelines

Use this skill to review a UI implementation against current web interface standards.

## Review Workflow

1. Identify the files or rendered page to review.
2. Inspect the structure, styles, and interaction code.
3. Check responsive behavior at narrow and wide viewports.
4. Check keyboard access, focus visibility, semantic controls, labels, alt text, contrast, and touch target sizes.
5. Check layout stability, overflow, text wrapping, loading states, empty states, and error states.
6. Report findings concisely as `path:line - issue - recommended fix`, ordered by severity.
7. Recheck the changed surface after fixes.

## Core Checks

- Use semantic HTML for headings, navigation, buttons, links, forms, and lists.
- Every meaningful image has useful alt text; decorative images are hidden from assistive technology.
- Icon-only buttons have an accessible name and a visible focus state.
- Links and buttons clearly communicate their action and do not overlap or nest incorrectly.
- Text and controls remain readable and usable at mobile widths.
- Do not rely on color alone to communicate state.
- Maintain sufficient contrast and respect `prefers-reduced-motion`.
- Avoid layout shifts when images, labels, loading states, or dynamic content appear.
- Check that hover-only interactions also have a keyboard or touch equivalent.
- Keep errors specific and actionable.

## Output Format

Findings first, highest severity first. Use terse file and line references. If no issues are found, state that clearly and mention remaining test gaps.

For the latest detailed rules, fetch:
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md

Reference skill: https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines
