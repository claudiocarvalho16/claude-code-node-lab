---
name: create-issue
description: Create a clear, standardized, implementation-ready GitHub Issue from the available problem context without publishing it.
disable-model-invocation: true
---

# GitHub Issue Creator

## Purpose

Transform raw context about a bug, feature, improvement, technical debt, or investigation into a clear and standardized GitHub Issue.

The generated Issue must be understandable and actionable by someone who did not participate in the original discussion.

This Skill only prepares the Issue content. It must never create, publish, edit, close, or otherwise mutate an Issue on GitHub.

## Working Principles

1. Understand the problem before writing the Issue.
2. Use all relevant context already available before asking for additional information.
3. Separate facts, evidence, and hypotheses.
4. Never invent missing information.
5. Remove conversational noise, repetition, and irrelevant history.
6. Preserve technical details that materially help understanding, reproduction, validation, or implementation.
7. Describe the problem and expected outcome independently from a specific implementation whenever possible.
8. Do not prescribe a technical solution unless the solution is explicitly part of the provided context or is itself the subject of the Issue.
9. Prefer observable and verifiable statements.
10. Keep the Issue concise enough to be practical, but complete enough to be worked on without relying on the original conversation.

## Context Gathering

Before drafting the Issue, identify as much of the following information as possible from the available context:

- What happened or what needs to change?
- Where does the problem or need occur?
- What is the current behavior?
- What is the expected behavior or desired outcome?
- What impact does the problem or limitation cause?
- Is there evidence such as logs, errors, examples, endpoints, screenshots, metrics, or references?
- Is the behavior reproducible?
- Is there relevant technical context?
- Are there known constraints, dependencies, or previous decisions?
- Are there assumptions or hypotheses that have not yet been confirmed?

Do not turn this list into a mandatory questionnaire.

Use the context already available first.

Ask for additional information only when a missing detail materially prevents the creation of a useful and accurate Issue. If the available context is sufficient, generate the Issue directly.

## Issue Classification

Classify the Issue internally before writing it.

Possible classifications include:

- Bug
- Feature
- Improvement
- Technical Debt
- Investigation

The classification should influence which sections are useful, but it must not result in rigid or unnecessarily verbose templates.

### Bug

Prioritize:

- current behavior;
- expected behavior;
- reproduction information when available;
- evidence;
- impact;
- acceptance criteria.

### Feature

Prioritize:

- context;
- problem or user/business need;
- desired outcome;
- scope;
- acceptance criteria.

### Improvement

Prioritize:

- current limitation;
- expected improvement;
- impact;
- acceptance criteria.

### Technical Debt

Prioritize:

- current technical limitation;
- consequences or risks;
- desired technical outcome;
- relevant constraints;
- acceptance criteria when applicable.

### Investigation

Prioritize:

- observed symptom;
- available evidence;
- known facts;
- hypotheses;
- questions to answer;
- expected investigation outcome.

## Fact, Evidence, and Hypothesis Handling

Never convert an assumption or correlation into a confirmed cause.

### Fact

A confirmed behavior, condition, decision, or observation.

Example:

> Requests to `GET /tasks?status=DONE` return tasks with other statuses.

### Evidence

Information that supports the description of the problem.

Examples:

- logs;
- stack traces;
- metrics;
- request/response examples;
- screenshots;
- commit references;
- monitoring data;
- timestamps.

### Hypothesis

A possible explanation that has not been confirmed.

Example:

> The behavior started after the cache change, but a causal relationship has not been confirmed.

When hypotheses are relevant, label them explicitly as hypotheses.

## Writing Rules

### Language

Generate the Issue in Portuguese by default.

Use another language only when explicitly requested or when the repository context clearly establishes another required language.

### Tone

Use clear, objective, professional language.

Avoid:

- conversational filler;
- unnecessary narrative;
- vague statements;
- blame;
- speculation presented as fact;
- implementation details that do not help define the problem.

### Title

The title must:

- be short and specific;
- describe the problem or desired outcome;
- make sense without opening the Issue;
- avoid generic verbs or labels such as "Ajustar", "Corrigir", or "Melhorar" when a more specific description is possible;
- avoid unnecessary implementation details.

Prefer outcome-oriented titles.

Examples:

Bad:

> Ajustar endpoint de tasks

Better:

> Permitir filtrar tasks por status

Bad:

> Corrigir filtro

Better:

> Filtro por status retorna tasks com status incorreto

### Problem Description

Describe the problem independently from a proposed implementation whenever possible.

Prefer:

> O endpoint não permite restringir os resultados por status.

Avoid:

> Precisamos adicionar um parâmetro no controller e alterar o service.

The second form may be included only when that implementation decision is already established and materially relevant.

### Acceptance Criteria

Acceptance criteria must describe observable, verifiable outcomes.

They must not be a checklist of implementation tasks.

Prefer:

- `GET /tasks` aceita filtro por status.
- Apenas tasks com o status informado são retornadas.
- Sem o filtro, o comportamento atual é preservado.
- Valores inválidos são rejeitados adequadamente.

Avoid:

- Alterar `TasksController`.
- Criar parâmetro `status`.
- Alterar `TasksService`.

Use Markdown checkboxes for acceptance criteria.

### Technical Details

Include technical information only when it helps someone:

- understand the problem;
- reproduce it;
- investigate it;
- validate the solution;
- respect an existing constraint or decision.

Do not turn the Issue into a low-level implementation specification unless explicitly requested.

## Output Structure

Use the following structure as the default model:

```markdown
# <Título>

## Contexto

<Contexto mínimo necessário para compreender o cenário.>

## Problema

<Descrição objetiva do problema, limitação ou necessidade.>

## Comportamento esperado

<Resultado ou comportamento desejado.>

## Critérios de aceite

- [ ] <Critério observável e verificável>
- [ ] <Critério observável e verificável>

## Evidências

<Evidências relevantes disponíveis.>

## Observações técnicas

<Informações técnicas úteis, restrições ou decisões já estabelecidas.>
```

The structure is adaptive.

Only include sections that add useful information.

Do not output empty sections or placeholders when information is unavailable.

For example, omit `Evidências` when no relevant evidence exists.

## Optional Sections

When useful, the following sections may be added:

### Impacto

Use when the impact helps establish severity, priority, or business/user relevance.

### Escopo

Use when explicit boundaries are important.

### Fora de escopo

Use when avoiding scope ambiguity is materially useful.

### Hipóteses

Use when one or more unconfirmed explanations are relevant to the investigation.

### Reprodução

Use primarily for bugs when reproducible steps are known and useful.

### Dependências

Use when implementation or validation depends on another system, team, Issue, decision, or prerequisite.

### Referências

Use for relevant links, Issue numbers, PRs, commits, documentation, dashboards, or other traceable references.

### Questões a responder

Use primarily for investigation Issues where the expected deliverable is knowledge rather than a direct product change.

## Quality Check

Before presenting the final Issue, verify:

- Is the problem or need clear?
- Does the title accurately represent the Issue?
- Can someone understand the Issue without access to the original conversation?
- Is the expected outcome clear?
- Are the acceptance criteria observable and verifiable?
- Are facts, evidence, and hypotheses correctly separated?
- Has any missing information been invented?
- Is unnecessary conversation history removed?
- Are relevant technical details preserved?
- Does the Issue avoid prescribing implementation without a valid reason?
- Are all included sections useful?
- Are empty or redundant sections removed?

If any check fails, revise the Issue before presenting it.

## Constraints

This Skill must not:

- run `gh issue create`;
- call GitHub APIs to create an Issue;
- publish the generated content;
- modify an existing Issue;
- assign users;
- apply labels;
- add milestones;
- close or reopen Issues;
- create branches or commits as a side effect.

Its responsibility ends after generating the proposed Issue content for human review.

If the user explicitly asks to publish the Issue, treat publication as a separate action outside this Skill and require an explicit command for that action.

## Final Response

Present the generated Issue as Markdown ready to be copied into GitHub.

Do not add unnecessary explanation before or after the Issue.

If important information is missing but the Issue can still be useful, generate the best possible version and clearly mark only the specific uncertainty that matters.
