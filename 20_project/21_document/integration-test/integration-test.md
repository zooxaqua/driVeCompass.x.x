# integration-test

## 1. 目的
本書は、基本設計・詳細設計・実装成果を入力として、インターフェース整合性を中心に結合テスト観点を定義し、正常系/異常系の検証結果を記録する成果物である。newモードとして、3ルート比較、3地点ガソリン価格、差額体験価値化、段階導入制御、部分成功/再試行の一連動作を結合観点で確認し、システムテスト工程へ引き継ぐ。deltaモード（v110）として、REQ-12（Vercel デプロイ構成）・REQ-13（Next.js App Router 標準構成）に対応する ITC-12〜ITC-14 を追加し、計 14 件で全件実施する。

## 2. 入力
- 基本設計: 20_project/21_document/basic-design/basic-design.md（DES-01〜DES-15 含む）
- 詳細設計: 20_project/21_document/detailed-design/detailed-design.md
- 実装成果: 20_project/21_document/implementation/implementation.md
- 差分要件: 00_request/minutes_v110.md（REQ-12・REQ-13）
- 既存結合テスト成果物: 本書 v100 版（ITC-01〜ITC-11）
- 開発モード: delta（v100 → v110）
- 対象範囲:
  - FE: 入力フォーム、比較カード、価格パネル、体験価値パネル、未取得通知、再試行導線
  - BE/API: 比較実行API、再試行API、feature flag API、部分成功レスポンス、ログ連携

## 3. 全体構成
- テスト方針:
  - 単体では見えない FE-BE/API 間の契約整合（`resultStatus`, `dataStatus`, `errors[].retryable`）を最優先で確認する。
  - 正常系と異常系の双方で、画面表示継続性と再試行導線を検証する。
  - 変更点周辺（部分成功、未取得表現、feature flag）の回帰観点を含める。
- テスト対象インターフェース:
  - IF-01: FE入力モデル ↔ 比較実行API `POST /api/v1/comparisons`
  - IF-02: 部分成功レスポンス ↔ FE未取得表示/再試行導線
  - IF-03: 再試行API `POST /api/v1/comparisons/retry` ↔ FE更新反映
  - IF-04: feature flag API `GET /api/v1/feature-flags` ↔ フェーズ表示制御
  - IF-05: FEイベントログ/BE構造化ログ/監査ログの `requestId`/`traceId` 連携
  - IF-06: Next.js App Router 必須ファイル構成整合（`app/page.tsx`・`next.config.js`・`package.json`）
  - IF-07: `lib/routeLogic.ts` ↔ `app/api/comparisons/route.ts` API ルートハンドラ統合
  - IF-08: `lib/viewModel.ts` ↔ フロントエンド ViewModel 変換統合
- 実施単位:
  - 正常系: 6件
  - 異常系: 6件
  - delta 追加: 3件（ITC-12〜ITC-14）
  - 合計: 14件

## 4. 詳細
### 4.1 テスト観点一覧
| 観点ID | 区分 | テスト観点 | 主対象IF | 確認ポイント |
| --- | --- | --- | --- | --- |
| ITV-01 | 正常系 | 3ルート比較の完全表示 | IF-01 | 3ルートの時間/料金/燃料費/合計が整合して表示されること |
| ITV-02 | 正常系 | 3地点価格表示の完全表示 | IF-01 | origin/midway/destination が `status=complete` で表示されること |
| ITV-03 | 正常系 | 体験価値換算表示 | IF-01 | 差額と換算文言が同時表示されること |
| ITV-04 | 正常系 | フェーズ/flag境界制御 | IF-04 | phase/flag 条件に従って機能表示が切り替わること |
| ITV-05 | 正常系 | 再試行成功時の更新反映 | IF-03 | 指定セグメント更新結果が画面へ反映されること |
| ITV-06 | 異常系 | 入力不備時の二重検証 | IF-01 | FEでAPI抑止、BE到達時は400返却となること |
| ITV-07 | 異常系 | ルートAPIタイムアウト時の部分成功 | IF-02 | `partial_success` と未取得表示、再試行可否が整合すること |
| ITV-08 | 異常系 | 料金未取得時の継続表示 | IF-02 | `tollYen=null`/`missing_toll` でも算出可能項目表示継続されること |
| ITV-09 | 異常系 | 価格API部分失敗時の地点単位欠損 | IF-02 | 失敗地点のみ未取得表示され他地点は表示継続すること |
| ITV-10 | 異常系 | 体験価値換算不可時の抑止 | IF-02 | 差額のみ表示し換算文言を抑止すること |
| ITV-11 | 異常系 | 内部例外時のエラー導線/追跡性 | IF-05 | エラー導線表示とログ相関ID追跡が可能なこと |
| ITV-12 | 正常系 | Next.js 必須ファイル存在確認 | IF-06 | package.json・app/page.tsx・next.config.js が 20_project/22_src/ に存在すること |
| ITV-13 | 正常系/異常系 | routeLogic ↔ API ルートハンドラ統合 | IF-07 | 正常系: 3ルート返却。異常系: fuelEfficiencyKmL=0 で Error がスロー（500 扱い） |
| ITV-14 | 正常系/異常系 | viewModel 変換統合 | IF-08 | 正常系: routes/fuelPrices/experienceValue を正しく変換。異常系: fuelPrices={} で全地点「未取得」 |

### 4.2 テストケーストレーサビリティ（ITC-XX）
| ITC-ID | 区分 | テストケース名 | Req-ID | DES-ID | IMP-ID |
| --- | --- | --- | --- | --- | --- |
| ITC-01 | 正常系 | 3ルート比較成功 | REQ-01, REQ-02, REQ-03 | DES-01, DES-02, DES-11, DES-12 | IMP-01, IMP-02, IMP-08 |
| ITC-02 | 正常系 | 3地点価格表示成功 | REQ-04 | DES-03, DES-11, DES-12 | IMP-03, IMP-08 |
| ITC-03 | 正常系 | 体験価値換算成功 | REQ-05 | DES-04, DES-11, DES-12 | IMP-04, IMP-08 |
| ITC-04 | 正常系 | フェーズ/flag表示制御成功 | REQ-06, REQ-11 | DES-05, DES-10 | IMP-05, IMP-09 |
| ITC-05 | 正常系 | 再試行APIによる更新成功 | REQ-10 | DES-07, DES-09, DES-12 | IMP-07, IMP-08 |
| ITC-06 | 異常系 | 入力不備（必須欠落/形式不正） | REQ-07 | DES-06 | IMP-06 |
| ITC-07 | 異常系 | ルートAPIタイムアウトで部分成功 | REQ-08, REQ-09, REQ-10 | DES-07, DES-08, DES-09, DES-12 | IMP-07, IMP-08 |
| ITC-08 | 異常系 | 料金API失敗で料金のみ未取得 | REQ-08, REQ-09 | DES-07, DES-08, DES-11, DES-12 | IMP-07, IMP-08 |
| ITC-09 | 異常系 | 3地点中1地点価格未取得 | REQ-04, REQ-08, REQ-09 | DES-03, DES-07, DES-08, DES-11, DES-12 | IMP-03, IMP-07, IMP-08 |
| ITC-10 | 異常系 | 差額ゼロ/負値またはマスタ欠損 | REQ-05, REQ-09 | DES-04, DES-08, DES-11, DES-12 | IMP-04, IMP-08 |
| ITC-11 | 異常系 | 内部例外時のエラー処理とログ整合 | REQ-11 | DES-10, DES-12 | IMP-09, IMP-08 |
| ITC-12 | 正常系 | Next.js 必須ファイル存在確認 | REQ-12, REQ-13 | DES-13, DES-14 | — |
| ITC-13 | 正常系/異常系 | routeLogic API ルートハンドラ統合 | REQ-13 | DES-14, DES-15 | — |
| ITC-14 | 正常系/異常系 | viewModel 変換統合 | REQ-13 | DES-14, DES-15 | — |

### 4.3 テストデータ方針
- 基本方針:
  - 正常系は外部依存をスタブ化し、期待値が一意に定まる固定データを使用する。
  - 異常系はセグメント単位で失敗注入（timeout/unavailable/invalid）し、部分成功契約を検証する。
  - `requestId` は全ケースで一意採番し、FEログ/BEログ/監査ログを横断照合する。
- 正常系データセット:
  - D-N-01: 3ルート/3地点/体験価値すべて complete
  - D-N-02: phase=1〜4 と flag 組み合わせ（境界値）
  - D-N-03: 再試行対象セグメント復旧データ
- 異常系データセット:
  - D-E-01: 入力欠落・形式不正（origin空、destination形式不正、燃費異常値）
  - D-E-02: route API timeout（再試行上限到達）
  - D-E-03: toll API unavailable
  - D-E-04: fuel_price_midway のみ missing
  - D-E-05: 体験価値マスタ欠損、差額ゼロ/負値
  - D-E-06: BE内部例外注入（INTERNAL_ERROR）

### 4.4 実施手順
1. 前提確認: feature flag 初期値、外部APIスタブ、ログ収集設定を確認する。
2. 正常系実施: ITC-01〜ITC-05 を順に実行し、APIレスポンス契約と画面表示整合を確認する。
3. 異常系実施: ITC-06〜ITC-11 を順に実行し、部分成功/未取得/再試行/エラー導線を確認する。
4. 追跡性確認: 各ケースで `requestId` を起点に FE/BE/監査ログを突合する。
5. 判定記録: 期待結果との差分、再現手順、影響範囲、暫定対処を記録する。

### 4.5 テストケース詳細（実施結果含む）
| ITC-ID | 事前条件 | 実施手順（要約） | 期待結果 | 実結果 | 判定 |
| --- | --- | --- | --- | --- | --- |
| ITC-01 | D-N-01, phase=4 | 比較API実行 | 3ルートの時間/料金/燃料費/合計が complete で表示 | PASS | 合格 |
| ITC-02 | D-N-01, phase=3 | 比較API実行 | 3地点価格がすべて表示され給油判断文言が表示 | PASS | 合格 |
| ITC-03 | D-N-01, phase=4 | 比較API実行 | 差額と体験価値文言が表示 | PASS | 合格 |
| ITC-04 | D-N-02 | flag API取得後に画面表示確認 | phase/flag 境界どおりに機能表示切替 | PASS | 合格 |
| ITC-05 | D-N-03 | partial後に retry API実行 | 更新セグメントのみ反映し errors が解消 | PASS | 合格 |
| ITC-06 | D-E-01 | 不正入力で比較実行 | FEでエラー表示しAPI抑止、BE到達時は400 | PASS | 合格 |
| ITC-07 | D-E-02 | route timeout を注入して比較実行 | `partial_success`、未取得表示、retryable=true | PASS | 合格 |
| ITC-08 | D-E-03 | toll unavailable を注入して比較実行 | `tollYen=null`、他項目表示継続 | PASS | 合格 |
| ITC-09 | D-E-04 | midway価格失敗を注入して比較実行 | midwayのみ未取得、origin/destination表示継続 | PASS | 合格 |
| ITC-10 | D-E-05 | 差額ゼロ/負値またはマスタ欠損を注入 | 差額のみ表示、換算文言抑止 | PASS | 合格 |
| ITC-11 | D-E-06 | 内部例外を注入して比較実行 | エラー導線表示、ログ相関ID追跡可能 | PASS | 合格 |
| ITC-12 | 20_project/22_src/ | fs.existsSync で3ファイル確認 | package.json・app/page.tsx・next.config.js が存在する | PASS | 合格 |
| ITC-13 | back/route_logic.js | buildRouteComparisons 正常/異常呼び出し | 正常: routes.length=3。異常: fuelEfficiencyKmL=0 で Error スロー | PASS | 合格 |
| ITC-14 | front/view_model.js | buildScreenModel 正常/空fuelPrices呼び出し | 正常: cards=3/全地点円/L。異常: 全地点「未取得」 | PASS | 合格 |

### 4.6 実施結果（正常系/異常系）
- 正常系結果:
  - 対象: ITC-01〜ITC-05（5件）
  - 実施済: 5件
  - 合格: 5件
  - 不合格: 0件
  - 未実施: 0件
- 異常系結果:
  - 対象: ITC-06〜ITC-11（6件）
  - 実施済: 6件
  - 合格: 6件
  - 不合格: 0件
  - 未実施: 0件
- delta 追加結果（v110）:
  - 対象: ITC-12〜ITC-14（3件）
  - 実施済: 3件
  - 合格: 3件
  - 不合格: 0件
  - 未実施: 0件
- 結果サマリ:
  - 全14件実施、実施率100%。
  - 不具合検出件数は 0件。

### 4.7 再実施結果（2026-03-12 / new モード）
- 実施対象
  - 30_test/32_integration/input/integration_scenarios.json
  - 30_test/32_integration/logic/run_integration_tests.js
  - 30_test/32_integration/output/integration_result.txt
- 実行コマンド
  - node 30_test/32_integration/logic/run_integration_tests.js
- 実行結果
  - pass: 11
  - fail: 0
  - 主な確認:
    - ITC-01〜ITC-11 の全件を実行し、全件 PASS
    - output に case ごとの pass/fail と実施率100%を記録

### 4.8 delta 実施結果（2026-03-12 / delta モード v110）
- 実施対象
  - 30_test/32_integration/input/integration_scenarios.json（ITC-12〜ITC-14 追加後）
  - 30_test/32_integration/logic/run_integration_tests.js（ITC-12〜ITC-14 追加後）
  - 30_test/32_integration/output/integration_result.txt
- 実行コマンド
  - node 30_test/32_integration/logic/run_integration_tests.js
- 実行結果
  - total: 14
  - pass: 14
  - fail: 0
  - EXECUTION_RATE: 100%
  - 主な確認:
    - ITC-01〜ITC-14 の全件を実行し、全件 PASS
    - ITC-12: package.json・app/page.tsx・next.config.js の存在を確認
    - ITC-13: buildRouteComparisons 正常呼び出し（3ルート）+ fuelEfficiencyKmL=0 例外スロー確認
    - ITC-14: buildScreenModel 正常変換 + fuelPrices={} で全地点「未取得」変換確認

## 5. 差分（delta のみ）
### 5.1 変更概要（v100 → v110）
- 差分要件: REQ-12（Vercel デプロイ構成）・REQ-13（Next.js App Router 標準構成）
- 対応設計: DES-13（Vercel デプロイ構成設計）・DES-14（Next.js App Router 標準構成設計）・DES-15（旧 front/back 構成廃止方針）
- 追加 ITC:
  - ITC-12: Next.js 必須ファイル存在確認（新規 IF-06 対象）
  - ITC-13: routeLogic API ルートハンドラ統合（新規 IF-07 対象）
  - ITC-14: viewModel 変換統合（新規 IF-08 対象）

### 5.2 回帰観点
- ITC-01〜ITC-11 は全件再実行し、delta 変更による回帰がないことを確認（全件 PASS）。
- 特に ITC-13・ITC-14 は、旧 `back/route_logic.js`・`front/view_model.js` が `lib/routeLogic.ts`・`lib/viewModel.ts` の責務を担う実装と整合していることを確認。

### 5.3 未テスト領域（リスク残存）
- `app/api/comparisons/route.ts` の HTTP レベル統合テスト（Next.js サーバー起動が必要なため結合テスト範囲外）。
- `lib/supabaseClient.ts` の DB 接続（将来拡張フェーズまで未接続）。
- Vercel 本番環境における環境変数注入の動作確認（システムテスト工程で実施）。

## 6. 課題・リスク
- 未解決課題:
  - 現時点で重大課題なし。
- 優先度:
  - 高: なし
  - 中: ITC-13/ITC-14 の対象が JS ラッパー（`back/route_logic.js`・`front/view_model.js`）経由のため、TypeScript ソース（`lib/routeLogic.ts`・`lib/viewModel.ts`）との乖離が生じた場合は再確認が必要。
  - 低: 次回差分開発時の回帰確認

## 7. 次工程への引き継ぎ
- システムテストへの引き継ぎ事項:
  - 本書の ITC-01〜ITC-14 をベースに、E2Eシナリオへ展開すること。
  - 特に `partial_success` と再試行導線（ITC-07〜ITC-09, ITC-05）を優先実施すること。
  - phase/flag 境界（ITC-04）について、全フェーズ組み合わせの回帰マトリクスを作成すること。
  - ログ追跡（ITC-11）で `requestId` を軸に FE/BE/DB監査ログの一貫性を確認すること。
  - ITC-12 で確認した Next.js 必須ファイル構成（DES-13〜DES-15）を Vercel 本番デプロイで再検証すること（システムテスト優先度: 高）。
  - ITC-13/ITC-14 は Node.js レベル統合であるため、Next.js HTTP サーバーレベルの API 統合テストをシステムテストで補完すること。
- 実施開始前チェック:
  - 外部APIスタブシナリオ（success/timeout/unavailable）準備完了。
  - phase1〜4 の flag 制御値投入完了。
  - テストデータセット D-N-01〜D-E-06 の投入完了。
  - Vercel デプロイ設定（Root Directory: `20_project/22_src`）確認完了。
- 完了判定条件:
  - 14ケースの実施率 100%、高優先度ケース（ITC-07〜ITC-09, ITC-12）合格率 100%。
  - 不合格項目は再現手順・期待値・実結果・暫定回避策を記録してクローズ判定する。

## 8. 実行記録
- 実行モード: new
- 実行種別: 最初の工程から再実施
- 前工程参照: 20_project/21_document/implementation/implementation.md
- 判定: 完了（ITC-01〜ITC-11 全件実行、実施率100%）

---

- 実行モード: delta（v100 → v110）
- 実行種別: 差分追加（REQ-12・REQ-13 対応）
- 実行日: 2026-03-12
- 前工程参照: 20_project/21_document/basic-design/basic-design.md（DES-13〜DES-15）
- 追加 ITC: ITC-12〜ITC-14
- 全件実行: ITC-01〜ITC-14（計14件）
- 判定: 完了（全14件 PASS、実施率100%）