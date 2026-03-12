---
name: run-dev-lifecycle
description: "工程別エージェント連携で新規/差分開発を実行します。Use when you want orchestrated staged development with handoff documents."
argument-hint: "要求内容、新規/差分、対象機能、完了条件、デプロイ先（例: Vercel）"
agent: dev-lifecycle-orchestrator
---
要求に基づき、工程別エージェント連携で開発を進めてください。

要件:
- 新規要求は new モード、差分要求は delta モードで実行する。
- 各工程で成果物ドキュメント（md）を作成・更新する。
- 前工程成果物に不明点があれば差し戻し、修正後に再実行する。
- 正常系/異常系の観点を各工程で確認する。
- デプロイ先が指定されている場合は、全工程で当該制約を引き継ぎ、release 工程で運用確認観点を必須化する。
- 各工程が完了したら、次工程が存在する場合は `bootstrap-next-stage-doc` の要件で次工程成果物を自動生成する。
- 自動生成後に必須見出しチェックを行い、不足があれば当該工程を未完了として修正する。

返却:
- 実行モード
- 工程ごとの実行結果
- 生成/更新した成果物一覧
- 次工程自動起票の結果
- 差し戻し記録
- 次アクション
