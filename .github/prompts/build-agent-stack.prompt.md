---
name: build-agent-stack
description: "1つの依頼から custom agent stack（agent + prompt + skill + optional instructions）を作成または調整します。"
argument-hint: "やりたいこと、対象ドメイン、制約、ツール方針を入力してください。"
agent: agent-forge
---
ユーザー依頼から、運用可能な custom agent stack を構築してください。

要件:
- 必要ファイルを必ず判断する: custom agent / prompt / skill / optional instruction。
- frontmatter は有効な YAML で、配置パスは正しいこと。
- tools は最小権限かつ役割特化にすること。
- 実行制約と出力形式を簡潔に明示すること。
- 既存ファイル調整時は意図を維持しつつ、discoverability・境界・整合性を改善すること。

実装サマリーと変更ファイル一覧を短く返してください。
