---
name: dev-lifecycle-handoff
description: "工程別エージェントの成果物連携を標準化します。Use for stage handoff docs, new/delta mode handling, and back-question loops between stages."
argument-hint: "実行モード、工程名、前工程成果物のパス"
user-invocable: true
---
# Dev Lifecycle Handoff

開発工程間のドキュメント連携を標準化する skill です。

## 使う場面
- 新規開発または差分開発の工程実行を開始するとき
- 前工程成果物を次工程へ引き継ぐとき
- 不明点を前工程へ差し戻すとき

## 手順
1. 実行モードを判定する（`new` / `delta`）。
2. デプロイ先・運用環境（例: Vercel Preview/Production）を入力から抽出し、全工程に引き継ぐ。
3. 対象工程の成果物テンプレートを [stage template](./assets/stage-output-template.md) から作成する。
4. 前工程成果物をレビューし、欠落情報を [question template](./assets/back-question-template.md) で明示する。
5. 回答・修正後、当該工程から再実行する。
6. 完了時に次工程向け引き継ぎ事項を明記する。
7. 工程完了後の自動起票は [auto bootstrap playbook](./assets/auto-bootstrap-playbook.md) に従う。

## 成果物配置
- `20_project/21_document/<stage>/<stage>.md`
- 差し戻し記録: `20_project/21_document/<stage>/back-questions.md`

## 品質基準
- 正常系/異常系の観点がある。
- 全体構成が明記されている。
- delta モード時は差分セクションがある。
- 次工程が迷わない引き継ぎ情報がある。
- 要件IDまたは設計項目IDで追跡できる。
- デプロイ先指定時は、release 工程で環境変数・到達性・ロールバック観点が追跡できる。
