# implementation

## 1. 目的
本書は new モードの実装工程成果として、詳細設計に基づく実装内容と単体評価結果（正常系/異常系）を記録し、結合テスト工程へ引き継ぐことを目的とする。

## 2. 入力
- 詳細設計: 20_project/21_document/detailed-design/detailed-design.md
- 基本設計: 20_project/21_document/basic-design/basic-design.md
- 開発モード: new
- 技術前提:
  - FE: Next.js（App Router）
  - BE: Supabase（Edge Functions + Postgres）

## 3. 全体構成
- FE実装: 20_project/22_src/front/
  - 入力フォーム、比較カード、価格パネル、体験価値パネル、未取得通知
- BE実装: 20_project/22_src/back/
  - 比較オーケストレーション、再試行ハンドラ、feature flag 提供
- 単体評価資産:
  - 入力: 30_test/31_unit/input/
  - ロジック: 30_test/31_unit/logic/
  - 出力: 30_test/31_unit/output/
- 実装成果記録:
  - 本書: 20_project/21_document/implementation/implementation.md

## 4. 詳細
### 4.1 IMP-IDトレーサビリティ（DTL-ID対応）
| IMP-ID | 対応DTL-ID | 区分 | 実装内容 | 主な成果物 |
| --- | --- | --- | --- | --- |
| IMP-01 | DTL-01 | FE/BE/API | 3ルート比較統合レスポンス（最速/賢く節約/完全節約）を実装 | FE ViewModel変換、BE統合レスポンス構築 |
| IMP-02 | DTL-02 | BE | ルート種別判定をバックエンドに一元化 | route candidate 判定ロジック |
| IMP-03 | DTL-03 | FE/BE/API | 3地点ガソリン価格表示と欠損時表現を実装 | fuelPrices整形、UI表示分岐 |
| IMP-04 | DTL-04 | FE/BE | 差額の体験価値換算（条件付き表示）を実装 | 換算マスタ参照、表示抑止制御 |
| IMP-05 | DTL-05 | FE/BE | フェーズ制御および feature flag 判定を実装 | flag解決ロジック、表示制御 |
| IMP-06 | DTL-06 | FE/BE/API | 入力二重検証（FE一次 + BE再検証）を実装 | validateComparisonInput / validateRequestPayload |
| IMP-07 | DTL-07 | BE/API | 外部API失敗時の継続処理（partial_success）を実装 | timeout/retry/circuit breaker |
| IMP-08 | DTL-08 | FE/BE/API | 未取得データの標準表現（null + status）を実装 | DataStatusNotice, dataStatus統一 |
| IMP-09 | DTL-09 | FE/BE | 構造化ログ・監査ログのトレーサビリティを実装 | requestId/traceId連携ログ |

### 4.2 FE実装項目
- IMP-01: ComparisonForm から比較実行を起動し、3ルート比較結果をカード表示する。
- IMP-03: FuelPricePanel で出発/途中/到着の3地点価格を表示し、欠損地点は「未取得」を表示する。
- IMP-04: ExperienceValuePanel で差額と体験価値文言を表示し、依存データ欠損時は抑止する。
- IMP-05: resolveFeatureFlags により phase と flag の両条件で機能表示を制御する。
- IMP-06: validateComparisonInput で必須・形式・範囲を検証し、NG時はAPI呼び出しを抑止する。
- IMP-08: mapApiResponseToViewModel で null/status を UIの未取得表現へ正規化する。

### 4.3 BE実装項目
- IMP-01: route-compare-orchestrator でルート/料金/価格取得を統合し比較結果を返却する。
- IMP-02: fetchRouteCandidates で routeType 判定（fastest/smart_saving/full_saving）を一元管理する。
- IMP-04: buildExperienceValue で差額を換算マスタに照合し文言を生成する。
- IMP-06: validateRequestPayload で業務ルールを再検証し不正入力を 400 で返却する。
- IMP-07: 外部APIごとに timeout・retry（最大2回）・指数バックオフを適用する。
- IMP-07: 連続失敗時のサーキットブレーカで処理全停止を防ぎ partial_success を返却する。
- IMP-08: assembleComparisonResponse で success/partial_success/error を統一フォーマット化する。

### 4.4 API実装項目
- IMP-01: POST /api/v1/comparisons
  - 正常系: 3ルート、3地点価格、体験価値を返却。
  - 異常系: 算出可能項目のみ返却し、errors に失敗セグメントと retryable を格納。
- IMP-07: POST /api/v1/comparisons/retry
  - 正常系: 指定セグメントのみ再計算し updatedSegments を返却。
  - 異常系: 再試行不可セグメントは errors へ記録し既存結果を維持。
- IMP-05: GET /api/v1/feature-flags
  - 正常系: phase と flag セットを返却。
  - 異常系: 取得失敗時は安全側（既定 false）で返却。

### 4.5 ログ実装項目
- IMP-09: FEイベントログ
  - compare_clicked, retry_clicked, validation_failed を記録。
  - 入力値生データは保存せず hash で記録。
- IMP-09: BE構造化ログ
  - 必須キー: timestamp, level, requestId, traceId, dtlId, errorCode。
  - 外部API失敗時は upstream, latency_ms, retryCount を記録。
- IMP-09: 監査ログ
  - comparison_requests と external_api_logs に成功/部分成功/失敗を保存。

### 4.6 feature flag実装項目
- IMP-05: フェーズ別有効化
  - Phase1: ルート/料金
  - Phase2: 燃料費推定
  - Phase3: 3地点価格
  - Phase4: 体験価値換算
- IMP-05: 判定順序
  1. 環境固定設定
  2. phase 判定
  3. rollout_ratio 判定
- IMP-05: 互換性ルール
  - 新規フラグ既定値 false
  - 既存レスポンス項目は削除せず status で無効表現

### 4.7 単体評価結果（関数単位）
| IMP-ID | 対象関数 | 正常系結果 | 異常系結果 | 備考 |
| --- | --- | --- | --- | --- |
| IMP-06 | validateComparisonInput(input) | 必須・形式・範囲が妥当な入力を受理し、API呼び出し許可を返却 | 必須欠落/形式不正を検知し、項目別エラーを返却。API呼び出しを抑止 | FE一次検証 |
| IMP-08 | mapApiResponseToViewModel(response) | success レスポンスを比較カード表示用VMへ正規化 | null + status=missing を未取得表現へ変換し表示継続 | FE表示契約の中核 |
| IMP-05 | resolveFeatureFlags(flags, phase) | phase/flag 条件一致時のみ対象機能を有効化 | flag取得失敗時は安全側（機能無効）で判定 | 段階導入の境界制御 |
| IMP-07 | retryFailedSegments(requestId, failedSegments) | retryable セグメントの再実行成功時に更新結果を反映 | retry不可/上限超過時に失敗セグメントを維持し通知 | FE再試行導線 |
| IMP-06 | validateRequestPayload(payload) | payload妥当時に処理継続を許可 | 型不正/業務ルール違反を 400 VALIDATION_ERROR として返却 | BE再検証 |
| IMP-02 | fetchRouteCandidates(params) | 3ルート候補を取得し routeType を付与 | 外部API失敗時に部分結果または欠損状態で返却 | 判定一元化 |
| IMP-07 | fetchTollFees(routeSet) | ルート別料金を取得し routeSet に反映 | timeout 時は missing_toll を設定し処理継続 | partial_success 要件 |
| IMP-07 | estimateFuelCosts(routeSet, fuelProfile) | 距離/燃費から燃料費を算出し totalCost 連携 | 燃費異常値/不足時はエラーコード付与し当該計算をスキップ | 入力防御を実施 |
| IMP-03 | fetchFuelPrices(locations) | 3地点価格を取得し status=complete で返却 | 一部地点失敗時は失敗地点のみ status=missing で返却 | 部分成功前提 |
| IMP-04 | buildExperienceValue(diffAmount) | 差額を換算マスタに照合し message を生成 | 差額ゼロ/負値、マスタ欠損時は message=null で返却 | 表示抑止ルール |
| IMP-08 | assembleComparisonResponse(context) | success レスポンスを契約通り生成 | 欠損/失敗セグメントを errors に集約し partial_success で返却 | API統一契約 |

### 4.8 実装実体と実行結果
- FE実装ファイル
  - 20_project/22_src/front/view_model.js
- BE実装ファイル
  - 20_project/22_src/back/route_logic.js
- 単体テスト実行ファイル
  - 30_test/31_unit/input/unit_cases.json
  - 30_test/31_unit/logic/run_unit_tests.js
  - 30_test/31_unit/output/unit_result.txt
- 単体テスト実行結果
  - 実行日: 2026-03-12
  - 実行コマンド: node 30_test/31_unit/logic/run_unit_tests.js
  - 結果: 6件 pass / 0件 fail

## 6. 課題・リスク
- 外部API仕様の未確定事項により、実装差し戻しが必要となる可能性:
  - ルートAPIの候補件数保証（常に3候補返却されるか）が未確定。
  - 料金APIの無料区間表現（0円と未取得の区別規約）が未確定。
  - 価格APIの地点解像度（市区町村/座標）と鮮度時刻フォーマットが未確定。
- 体験価値換算マスタの運用ルール（更新頻度、審査責任者）が未確定。
- feature flag 組み合わせ増加によりテストケースが指数的に増える。
- partial_success の頻度が高い場合、利用者が比較結果を過信する回帰リスクがある。

## 7. 次工程への引き継ぎ
- 結合テストでの重点確認
  - API契約: resultStatus/dataStatus/errors.retryable の整合性検証。
  - 部分成功: 取得済み項目継続表示と再試行導線の整合性検証。
  - flag制御: Phase1-4 の表示境界と後方互換の検証。
- テストデータ整備
  - 正常系: 3ルート・3地点・体験価値すべて complete の基準データを準備。
  - 異常系: toll timeout、midway価格欠損、換算マスタ欠損の再現データを準備。
- 運用引き継ぎ
  - requestId/traceId で FEログ・BEログ・監査ログを横断追跡できることを確認。
  - 外部API障害時の一次切り分け手順（upstream別）を運用Runbookへ反映。

## 5. 差分（delta のみ）

### 5.1 delta 概要
- 実行モード: delta
- 実行日: 2026-03-12
- 前工程参照: 20_project/21_document/detailed-design/detailed-design.md

### 5.2 新規作成ファイル一覧
| ファイルパス | 区分 | 説明 |
| --- | --- | --- |
| 20_project/22_src/package.json | 設定 | Next.js 14 / React 18 / Supabase JS 依存定義 |
| 20_project/22_src/tsconfig.json | 設定 | TypeScript コンパイラ設定（App Router 向け） |
| 20_project/22_src/next.config.js | 設定 | Next.js 設定（reactStrictMode: true） |
| 20_project/22_src/app/globals.css | FE | グローバルリセット CSS |
| 20_project/22_src/app/layout.tsx | FE | RootLayout（メタデータ含む） |
| 20_project/22_src/app/page.tsx | FE | メインページ（Client Component: フォーム + 3ルートカード表示） |
| 20_project/22_src/app/api/comparisons/route.ts | API | POST /api/comparisons（デモ固定値での比較計算） |
| 20_project/22_src/app/api/feature-flags/route.ts | API | GET /api/feature-flags（Phase1 固定レスポンス） |
| 20_project/22_src/lib/routeLogic.ts | BE lib | back/route_logic.js の TypeScript 移植（型定義付き） |
| 20_project/22_src/lib/viewModel.ts | FE lib | front/view_model.js の TypeScript 移植（型定義付き） |
| 20_project/22_src/lib/supabaseClient.ts | 共通 | Supabase クライアント初期化 |

### 5.3 既存ファイル変更なし
- 20_project/22_src/back/route_logic.js（維持）
- 20_project/22_src/front/view_model.js（維持）
- 30_test/31_unit/logic/run_unit_tests.js（変更なし — 既存 JS ファイル参照を継続）

### 5.4 delta 単体テスト実行結果
- 実行日: 2026-03-12
- 実行コマンド: node 30_test/31_unit/logic/run_unit_tests.js
- 結果: 6件 pass / 0件 fail（既存テスト全パス確認）
- 出力: 30_test/31_unit/output/unit_result.txt に保存済み

### 5.5 回帰リスク
- back/route_logic.js・front/view_model.js は削除していないため、既存テストへの回帰なし。
- lib/routeLogic.ts は同一ロジックの TypeScript 移植のため、計算結果の差異リスクなし。

## 8. 実行記録
- 実行モード: new → delta（追記）
- 実行種別（new）: 最初の工程から再実施
- 実行種別（delta）: Next.js App Router 実装追加
- 前工程参照: 20_project/21_document/detailed-design/detailed-design.md
- 判定: 完了（22_src/app, 22_src/lib, 単体テスト全パスを確認）
