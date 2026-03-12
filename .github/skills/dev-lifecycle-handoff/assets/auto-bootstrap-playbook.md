# Auto Bootstrap Playbook

工程完了時に次工程の成果物を自動起票するための運用手順です。

## ステージ順序
1. requirements
2. basic-design
3. detailed-design
4. implementation
5. integration-test
6. system-test
7. release

## 実行ルール
- 現在工程が完了し、見出しチェックを通過したら次工程を起票する。
- 次工程が `release` の後は起票しない。
- モードは現在工程の `new/delta` をそのまま引き継ぐ。

## 次工程起票テンプレート
入力:
- 現在工程: <current-stage>
- 次工程: <next-stage>
- モード: <new|delta>
- 前工程成果物パス: `20_project/21_document/<current-stage>/<current-stage>.md`

出力:
- `20_project/21_document/<next-stage>/<next-stage>.md`
- 不足がある場合: `20_project/21_document/<next-stage>/back-questions.md`

## 品質ゲート
- 必須見出しが全てあること。
- delta モード時は `## 5. 差分（delta のみ）` があること。
- 不足時は完了にせず、修正後に再チェックすること。
