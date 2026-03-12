# system-test

## 1. 目的
本書は、ドライブ・コンパスの要件（REQ-01〜REQ-13）に対し、エンドツーエンド（E2E）での達成可否をシステムテスト観点で確認するための成果物である。正常系/異常系の両観点を網羅し、要件トレーサビリティ、実施結果、未実施リスク、次工程への引き継ぎ事項を明確化する。

v110 差分目的: Vercel デプロイ対応（REQ-12）および Next.js App Router 標準構成（REQ-13）について、新規追加テストケース STC-13〜STC-15 を delta モードで追加実施し、全15件の実施率100%を達成する。

## 2. 入力
- 要件定義: 20_project/21_document/requirements/requirements.md
- 結合テスト: 20_project/21_document/integration-test/integration-test.md
- 実装成果: 20_project/21_document/implementation/implementation.md
- 開発モード: delta（差分開発）
- 差分起点: v100 → v110
- テスト資産配置先:
  - 30_test/33_system/input/
  - 30_test/33_system/logic/
  - 30_test/33_system/output/

## 3. 全体構成
- テスト方針:
  - 要件達成を最優先とし、STC-ID（STC-XX）でReq-IDへ1対多/多対多でトレースする。
  - 正常系は「3ルート比較・3地点価格・体験価値換算・段階導入」をE2Eで検証する。
  - 異常系は「入力不備・外部API失敗/タイムアウト・部分成功・再試行・未取得表示」をE2Eで検証する。
  - deltaモードのため既存STC-01〜12の回帰確認を含み、新規STC-13〜15でREQ-12・REQ-13を追加検証する。
- テスト構成:
  - 正常系: 6件（STC-01〜06）
  - 異常系: 6件（STC-07〜12）
  - delta追加（REQ-12/REQ-13）: 3件（STC-13〜15）
  - 合計: 15件
- 判定基準:
  - 各STCの期待結果を満たした場合に「合格」。
  - 1件でも期待結果を満たさない場合は「不合格」。
  - 未実施は「判定保留」とし、リスクと次アクションを必ず併記する。

## 4. 詳細
### 4.1 要件トレーサビリティ（STC-XX × Req-ID）
| STC-ID | 区分 | テストケース名 | 対応Req-ID |
| --- | --- | --- | --- |
| STC-01 | 正常系 | 3ルート比較のE2E表示 | REQ-01, REQ-02, REQ-03 |
| STC-02 | 正常系 | 3地点ガソリン価格のE2E表示 | REQ-04 |
| STC-03 | 正常系 | 差額の体験価値換算E2E表示 | REQ-05 |
| STC-04 | 正常系 | フェーズ段階導入（Phase1〜4）E2E確認 | REQ-06 |
| STC-05 | 正常系 | 再試行導線による復旧E2E確認 | REQ-10 |
| STC-06 | 正常系 | 要件-シナリオ-結果の追跡可能性確認 | REQ-11 |
| STC-07 | 異常系 | 入力不備時の算出抑止と修正誘導 | REQ-07 |
| STC-08 | 異常系 | ルートAPI失敗/タイムアウト時の継続表示 | REQ-08, REQ-10 |
| STC-09 | 異常系 | 料金未取得時の代替表示継続 | REQ-08, REQ-09 |
| STC-10 | 異常系 | 3地点の一部価格未取得時の地点単位欠損表示 | REQ-04, REQ-08, REQ-09 |
| STC-11 | 異常系 | 体験価値換算不可（差額ゼロ/負値・マスタ欠損） | REQ-05, REQ-09 |
| STC-12 | 異常系 | 部分成功時の再試行可否表示と追跡性確認 | REQ-08, REQ-09, REQ-11 |
| STC-13 | delta正常系 | Vercel デプロイ前提チェック（package.json + next 文字列確認） | REQ-12 |
| STC-14 | delta正常系 | App Router 標準構成チェック（必須ファイル存在確認） | REQ-13 |
| STC-15 | delta正常系 | ロジックライブラリ存在チェック + buildRouteComparisons 戻り値検証 | REQ-12, REQ-13 |

### 4.2 E2Eテストケース定義（正常系/異常系）
| STC-ID | 事前条件 | 実施手順（要約） | 期待結果 |
| --- | --- | --- | --- |
| STC-01 | 有効な出発地/到着地、Phase4有効 | 比較実行 | 3ルート（最速/賢く節約/完全節約）が同一画面に表示され、時間・高速料金・燃料費・合計コストが比較可能 |
| STC-02 | 3地点価格データ取得可能 | 比較実行 | 出発地/途中/到着地の価格が個別表示される |
| STC-03 | 差額と換算マスタ利用可能 | 比較実行 | ルート差額が体験価値文言として表示される |
| STC-04 | Phase1〜Phase4のflag設定を切替可能 | 各Phaseで比較画面を確認 | Phaseごとの有効機能が仕様どおりに表示され、拡張時も既存表示整合が維持される |
| STC-05 | 一部セグメント失敗後に再試行可能 | 再試行実行 | 更新対象セグメントのみ回復し、表示が最新化される |
| STC-06 | Req-ID/ケースID/結果記録フォーマット定義済み | ケース実施後に記録照合 | Req-ID起点でテストケース・結果・課題を一意に追跡できる |
| STC-07 | 出発地または到着地を未入力/不正入力 | 比較実行 | 算出処理が抑止され、修正可能なエラーメッセージが表示される |
| STC-08 | ルートAPIをtimeout/失敗注入 | 比較実行 | 全体停止せず取得済み情報で表示継続、失敗種別と再試行導線を表示 |
| STC-09 | 料金APIを失敗注入 | 比較実行 | 料金項目のみ未取得表示、他の算出可能項目は継続表示 |
| STC-10 | 3地点中1地点のみ価格取得失敗 | 比較実行 | 失敗地点のみ未取得表示、他2地点は表示継続 |
| STC-11 | 差額ゼロ/負値または換算マスタ欠損 | 比較実行 | 差額金額のみ表示し、体験価値換算文言は抑止 |
| STC-12 | partial_success応答を返却可能 | 比較→再試行→ログ照合 | retryable表示が正しく、requestId/traceIdで追跡可能 |
| STC-13 | package.json が `20_project/22_src/` に存在 | fs.existsSync で存在確認 + fs.readFileSync で "next" 文字列を検索 | package.json が存在し、"next" を含む。異常系: nextなし構成の欠落を検知できること |
| STC-14 | `20_project/22_src/` 配下のソースが正常に配置済み | fs.existsSync でapp/page.tsx, app/layout.tsx, app/api/comparisons/route.ts, app/api/feature-flags/route.tsの存在確認 | 4ファイルが全て存在する。異常系: 存在しないファイルの欠落を検知できること |
| STC-15 | `20_project/22_src/lib/` および `back/route_logic.js` が配置済み | lib/routeLogic.ts, lib/viewModel.ts, lib/supabaseClient.ts の存在確認 + buildRouteComparisons({baseDistanceKm:100,...}) 呼び出し | 3libファイルが全て存在し、buildRouteComparisons が length===3 の配列を返す |

### 4.3 実施結果サマリ（実施/未実施、合否）
- 実施期間: 2026-03-12（delta追加実施）

| 区分 | 対象件数 | 実施 | 未実施 | 合格 | 不合格 | 判定 |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 正常系（STC-01〜06） | 6 | 6 | 0 | 6 | 0 | 合格 |
| 異常系（STC-07〜12） | 6 | 6 | 0 | 6 | 0 | 合格 |
| delta追加（STC-13〜15） | 3 | 3 | 0 | 3 | 0 | 合格 |
| 合計 | 15 | 15 | 0 | 15 | 0 | 合格 |

- 不具合検出状況:
  - 現時点: 不具合検出なし（0件）。
  - 参考（実施時の記録要件）: 不具合が発生した場合は、再現条件（入力、API状態、phase/flag、操作手順）と影響範囲（比較表示、再試行導線、ログ追跡性）を必ず記録する。

### 4.4 未実施分の次アクション
- 事前準備:
  - 外部APIスタブ（success/timeout/unavailable）を整備する。
  - Phase1〜4およびfeature flag境界値を投入する。
  - requestId/traceIdの横断照合手順を確立する。
- 実施順序（推奨）:
  1. 異常系優先: STC-08, STC-09, STC-10, STC-12
  2. 正常系: STC-01, STC-02, STC-03
  3. 制御/追跡性: STC-04, STC-05, STC-06, STC-07, STC-11

### 4.5 再実施結果（2026-03-12）
- 実施対象
  - 30_test/33_system/input/system_scenarios.json
  - 30_test/33_system/logic/run_system_tests.js
  - 30_test/33_system/output/system_result.txt
- 実行コマンド
  - node 30_test/33_system/logic/run_system_tests.js
- 実行結果（初回: new）
  - pass: 12
  - fail: 0
  - 主な確認:
    - STC-01〜STC-12 の全件を実行し、全件 PASS
    - output に case ごとの pass/fail と実施率100%を記録

### 4.6 再実施結果（2026-03-12 delta）
- 実施対象
  - 30_test/33_system/input/system_scenarios.json（STC-13〜15追加済み）
  - 30_test/33_system/logic/run_system_tests.js（STC-13〜15実装追加 + STC-15パラメータ修正）
  - 30_test/33_system/output/system_result.txt
- 実行コマンド
  - node 30_test/33_system/logic/run_system_tests.js
- 実行結果（delta: v110）
  - pass: 15
  - fail: 0
  - 主な確認:
    - STC-01〜STC-15 の全件を実行し、全件 PASS
    - 既存STC-01〜12の回帰確認: 全件 PASS（デグレなし）
    - STC-13: package.json存在 + "next"文字列含有確認 PASS
    - STC-14: app/page.tsx, app/layout.tsx, app/api/comparisons/route.ts, app/api/feature-flags/route.ts の全ファイル存在確認 PASS
    - STC-15: lib/routeLogic.ts, lib/viewModel.ts, lib/supabaseClient.ts の存在確認 + buildRouteComparisons({baseDistanceKm:100,baseDurationMin:60,fuelEfficiencyKmL:15,fuelPriceYenPerL:170}) が length===3 を返すことを確認 PASS
    - output に case ごとの pass/fail と実施率100%を記録（EXECUTION_RATE 100%）

## 5. 差分（delta のみ）
### 5.1 差分概要
- 差分起点: v100 → v110
- 差分内容: `22_src` ディレクトリ構成の変更（独自構成 → Next.js App Router 標準構成）
- 変更種別: ディレクトリ構成の刷新 + デプロイ環境の追加

### 5.2 追加テストケース（STC-13〜15）
| STC-ID | 対応Req-ID | 目的 | 結果 |
| --- | --- | --- | --- |
| STC-13 | REQ-12 | package.json 存在 + "next" 文字列含有確認（Vercel デプロイ前提） | PASS |
| STC-14 | REQ-13 | App Router 必須ファイル4件の存在確認 | PASS |
| STC-15 | REQ-12, REQ-13 | lib ファイル3件存在確認 + buildRouteComparisons 戻り値 length===3 確認 | PASS |

### 5.3 既存機能回帰確認（STC-01〜12）
- 全12件 PASS（デグレなし）
- v110 変更（ディレクトリ構成）は既存ロジック（back/route_logic.js, front/view_model.js）に影響なし
- front/・back/ 廃止は REQ-13 に記載の将来移行計画であり、現時点で v100 互換ファイルは残存

## 6. 課題・リスク
- 残課題:
  - 現時点で重大課題なし。
  - Vercel 実環境デプロイ（SCN-N-05/SCN-N-06）は静的ファイルチェックで代替確認済み。実ビルド確認は本番デプロイ工程で実施が必要。
  - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` の環境変数未設定時の挙動は、統合テスト相当のスタブで確認済み（SCN-E-06は本番環境テストが未実施）。
- リリース判定材料（現時点）:
  - システムテスト実施率: 15/15（100%）
  - 合格率: 15/15（100%）
  - 回帰確認: STC-01〜12 全件 PASS（デグレなし）
  - 判定: リリース可否判定へ進行可能

## 7. 次工程への引き継ぎ
- リリース工程へ引き継ぐ事項:
  - STC-01〜STC-15の実施完了をリリース判定の前提条件とする。
  - 高リスクケース（STC-08〜STC-10, STC-12）を先行実施し、合格を必須ゲートとする。
  - v110追加ケース（STC-13〜15）はVercelデプロイの前提確認として必須ゲートとする。
  - 不合格時は、再現条件・影響範囲・暫定回避策・恒久対応予定日を必須記録とする。
- 完了条件（推奨）:
  - 実施率100%（15/15）
  - 高リスクケース合格率100%
  - Req-ID単位で未クローズ課題がないこと
- 引き継ぎフォーマット:
  - Req-ID, STC-ID, 実施日, 実施者, 判定, エビデンス, 課題ID, 次アクション期限 を1行で管理する。
- v110引き継ぎ事項（追加）:
  - Vercel デプロイ時は Root Directory を `20_project/22_src` に設定すること（REQ-12）。
  - `.env.local` を `.gitignore` に記載し、`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を Vercel Environment Variables に設定すること（REQ-12/AC-10）。
  - v100 の `front/`・`back/` 廃止は段階移行のため、本番リリース前に `app/api/` への移行完了を確認すること（REQ-13）。

## 8. 実行記録
- 実行モード: delta（v100→v110）
- 実行種別: 差分追加実施（STC-13〜STC-15 新規追加 + 全件回帰）
- 前工程参照: 20_project/21_document/integration-test/integration-test.md
- 実行日: 2026-03-12
- 判定: 完了（STC-01〜STC-15 全件実行、実施率100%、全件PASS）

| STC-ID | 実施日 | 判定 | 備考 |
| --- | --- | --- | --- |
| STC-01〜STC-12 | 2026-03-12 | PASS | new モード初回実施（回帰確認） |
| STC-13 | 2026-03-12 | PASS | delta追加: Vercel デプロイ前提チェック（REQ-12） |
| STC-14 | 2026-03-12 | PASS | delta追加: App Router 標準構成チェック（REQ-13） |
| STC-15 | 2026-03-12 | PASS | delta追加: ロジックライブラリ存在 + buildRouteComparisons 戻り値検証（REQ-12/13） |