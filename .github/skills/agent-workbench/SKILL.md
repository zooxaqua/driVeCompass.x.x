---
name: agent-workbench
description: "任意のCopilot customization stackを設計・調整します。.agent.md/.prompt.md/SKILL.md/.instructions.md を一貫した挙動と高い発見性で整備するときに使用します。"
argument-hint: "依頼内容、対象ドメイン、制約、期待する出力ファイルを入力"
user-invocable: true
---
# Agent Workbench

任意ドメイン向けに、エージェントカスタマイズ一式を作成または調整します。

## 使う場面
- 新しい専門エージェントをゼロから作るとき。
- 対応する prompt と再利用可能な skill を同時に整備するとき。
- discovery されない、または挙動が広すぎる既存構成を調整するとき。
- frontmatter とファイル構造を標準化したいとき。

## 手順
1. 依頼を必要なプリミティブに分類する。
   - Agent: 振る舞いとツール方針
   - Prompt: 単発実行の入口
   - Skill: 再利用ワークフローと assets
   - Instruction: 広く適用する常時ルール
2. frontmatter を作成し、命名整合を担保する。
3. [agent template](./assets/agent-template.md)、[prompt template](./assets/prompt-template.md)、[skill template](./assets/skill-template.md) を起点に作成する。
4. ドメイン固有の制約と出力スキーマを追加する。
5. [tuning checklist](./assets/tuning-checklist.md) で品質を確認する。
6. 作成または更新ファイルを根拠付きで報告する。

## 品質基準
- Description に trigger phrases と意図キーワードが含まれている。
- Tools が最小構成で妥当性を説明できる。
- 境界条件として「やらないこと」が明確。
- 出力形式が明示され、検証可能。
- パスとファイル名が VS Code customization 規約に沿っている。
