---
applyTo: ".github/agents/*.md,.github/prompts/*.md,.github/skills/**/SKILL.md"
description: "カスタム agent / prompt / skill ファイルを作成・調整するときの品質ルール。"
---
カスタマイズファイルを編集するときのルール:

- YAML frontmatter は有効かつ簡潔に保つ。
- discovery のためにキーワードを含む description を記述する。
- tools は役割に必要な最小集合に限定する。
- スコープ拡大を防ぐため制約を明示する。
- 出力形式を明確に定義し、応答の一貫性を保つ。
- 要求がない限り、特定ドメインに固定しすぎない再利用可能な文面にする。
