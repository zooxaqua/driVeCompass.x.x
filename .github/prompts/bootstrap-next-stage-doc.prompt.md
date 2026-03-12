---
name: bootstrap-next-stage-doc
description: "工程完了後に次工程の成果物mdを自動生成します。Use when you want to scaffold next-stage handoff documents with required headings."
argument-hint: "現在工程、次工程、new/delta、前工程成果物パス"
agent: dev-lifecycle-orchestrator
---
現在工程の成果物を入力として、次工程の成果物ドキュメントを自動生成してください。

要件:
- 出力先は `20_project/21_document/<next-stage>/<next-stage>.md` とする。
- `dev-lifecycle-handoff` skill のテンプレートに従う。
- 必須見出しをすべて生成する:
  - `## 1. 目的`
  - `## 2. 入力`
  - `## 3. 全体構成`
  - `## 4. 詳細`
  - `## 6. 課題・リスク`
  - `## 7. 次工程への引き継ぎ`
  - `## 5. 差分（delta のみ）`（delta の場合のみ）
- 前工程成果物に不足がある場合は `back-questions.md` を自動生成して差し戻し事項を記載する。

返却:
- 生成したファイルパス
- 見出しチェック結果（不足があれば一覧）
- 差し戻し有無
- 次アクション