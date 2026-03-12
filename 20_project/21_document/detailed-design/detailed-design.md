# detailed-design

## 1. 目的
本書は、要件定義および基本設計で定義した要求・設計方針を、実装工程で迷わない粒度の詳細設計へ分解することを目的とする。対象は新規開発（new モード）のドライブ・コンパスであり、3ルート比較、3地点ガソリン価格、差額の体験価値化、段階導入（MVP→拡張）を一貫して実装可能にする。

## 2. 入力
- 基本設計書（DES-01〜DES-12）
- 要件定義書（REQ-01〜REQ-11）
- 開発モード: new
- 技術前提:
  - FE: Next.js（React, App Router）
  - BE: Supabase（Edge Functions + Postgres）

## 3. 全体構成
### 3.1 コンポーネント構成
- FE（Next.js）
  - 入力フォーム、比較結果表示、未取得表示、再試行導線、feature flag 判定
- BFF/API 層（Next.js Route Handler）
  - 認証/入力再検証、相関ID付与、Supabase Function 呼び出し
- BE（Supabase Edge Functions）
  - ルート比較オーケストレーション、外部API連携、部分成功レスポンス生成
- DB（Supabase Postgres）
  - リクエスト履歴、比較結果、価格情報、換算マスタ、feature flag 設定、監査ログ

### 3.2 処理シーケンス
1. 利用者が出発地・到着地・車両情報を入力し比較実行。
2. FE が入力を一次検証後、比較 API を呼び出す。
3. BE が外部 API（ルート・料金・価格）を並列呼び出しし、算出可能項目を統合。
4. 成功時は 3ルート比較 + 3地点価格 + 体験価値を返却。
5. 一部失敗時は未取得項目と再試行対象を明示して返却。
6. FE は feature flag に応じて段階機能を表示・非表示制御。

### 3.3 追跡可能性マトリクス（DTL-ID）
| DTL-ID | 対応Req-ID | 対応DES-ID | 区分 | 詳細設計テーマ |
| --- | --- | --- | --- | --- |
| DTL-01 | REQ-01, REQ-03 | DES-01, DES-11, DES-12 | FE/BE | 3ルート比較表示と統合レスポンス |
| DTL-02 | REQ-02 | DES-02 | BE | ルート種別判定ルール一元化 |
| DTL-03 | REQ-04 | DES-03, DES-11, DES-12 | FE/BE | 3地点ガソリン価格表示 |
| DTL-04 | REQ-05 | DES-04, DES-11, DES-12 | FE/BE | 差額の体験価値換算 |
| DTL-05 | REQ-06 | DES-05, DES-10 | FE/BE | 段階導入 feature flag |
| DTL-06 | REQ-07 | DES-06 | FE/BE | 入力バリデーション（二重検証） |
| DTL-07 | REQ-08, REQ-10 | DES-07, DES-09, DES-12 | BE | API失敗時継続・再試行 |
| DTL-08 | REQ-09 | DES-08, DES-11, DES-12 | FE/BE | 未取得データの標準表現 |
| DTL-09 | REQ-11 | DES-10 | FE/BE | ログ/監査を含むトレーサビリティ |

## 4. 詳細
### 4.1 FE詳細設計
#### 4.1.1 画面/コンポーネント
- `ComparisonForm`
  - 入力: 出発地、到着地、車両燃費、燃料種別
  - 役割: REQ-07 の一次バリデーション、比較実行トリガー
- `RouteComparisonCards`
  - 入力: 3ルート配列（最速/賢く節約/完全節約）
  - 役割: 時間・高速料金・燃料費・合計コスト表示
- `FuelPricePanel`
  - 入力: 出発/途中/到着の価格データ
  - 役割: 地点別価格・価格差メッセージ表示
- `ExperienceValuePanel`
  - 入力: 差額金額、換算メッセージ
  - 役割: 差額の体験価値化表示
- `DataStatusNotice`
  - 入力: 未取得項目一覧、再試行可否
  - 役割: 異常系通知、再試行導線表示

#### 4.1.2 FE主要モジュール/関数
- `validateComparisonInput(input)`
  - 必須項目・文字数・地名フォーマットを検証
  - NG時は API 未呼び出しでエラーメッセージ返却
- `mapApiResponseToViewModel(response)`
  - API レスポンスを表示用 ViewModel へ変換
  - `null` + `status=missing` を「未取得」に統一
- `resolveFeatureFlags(flags, phase)`
  - phase と flag の両方で表示可否判定
- `retryFailedSegments(requestId, failedSegments)`
  - 失敗セグメント単位で再試行 API 呼び出し

#### 4.1.3 状態管理
- `idle` → `validating` → `loading` → `success` / `partial_success` / `error`
- `partial_success` 時も描画継続し、`DataStatusNotice` を強制表示

#### 4.1.4 FE エラーハンドリング
- 入力不備: フィールド直下に修正可能メッセージ表示
- 通信失敗: トースト + 結果領域にリトライボタン表示
- 部分失敗: 未取得バッジ表示、再試行対象セグメントを明示

#### 4.1.5 FE ログ方針
- 画面イベントログ: `compare_clicked`, `retry_clicked`, `validation_failed`
- 送信項目: `requestId`, `sessionId`, `phase`, `failedSegments`
- 個人情報方針: 入力文字列の生値はログ保存しない（ハッシュ化）

### 4.2 BE詳細設計
#### 4.2.1 Edge Functions 構成
- `route-compare-orchestrator`
  - 比較実行のメイン関数
  - ルート、料金、価格 API の並列呼び出しと統合
- `route-retry-handler`
  - 失敗セグメントのみ再計算
- `feature-flag-provider`
  - ユーザー/環境ごとの flag 返却

#### 4.2.2 BE主要モジュール/関数
- `validateRequestPayload(payload)`
  - 必須項目、型、範囲、業務ルールを検証
- `fetchRouteCandidates(params)`
  - 最速/賢く節約/完全節約候補を取得
- `fetchTollFees(routeSet)`
  - ルート別高速料金取得
- `estimateFuelCosts(routeSet, fuelProfile)`
  - 距離と燃費から燃料費算出
- `fetchFuelPrices(locations)`
  - 出発/途中/到着の価格取得
- `buildExperienceValue(diffAmount)`
  - 差額を換算マスタで文言化
- `assembleComparisonResponse(context)`
  - 正常/部分成功/異常を統一レスポンス化

#### 4.2.3 非機能制御
- タイムアウト: 外部APIごとに 3秒（価格 API は 2秒）
- 再試行: 最大2回、指数バックオフ（200ms, 600ms）
- サーキットブレーカ: 連続失敗 5 回で 60 秒オープン

#### 4.2.4 BE エラーハンドリング
- `VALIDATION_ERROR`（400）: 入力不正
- `UPSTREAM_TIMEOUT`（200 + partial）: 外部タイムアウト
- `UPSTREAM_UNAVAILABLE`（200 + partial）: 外部停止
- `INTERNAL_ERROR`（500）: 予期しない例外
- 方針: 業務継続可能な場合は 200 で `resultStatus=partial_success`

#### 4.2.5 BE ログ方針
- 構造化ログ JSON を採用
- 必須キー: `timestamp`, `level`, `requestId`, `traceId`, `dtlId`, `reqIds`, `desIds`, `errorCode`
- 監査ログ: 比較実行結果の要約（成功/部分成功/失敗）をDB保存
- 障害ログ: 外部API失敗時に upstream 名と応答時間を記録

### 4.3 API/DB仕様
#### 4.3.1 API: 比較実行
- エンドポイント: `POST /api/v1/comparisons`
- 用途: 3ルート比較、3地点価格、体験価値の統合結果取得

リクエスト
```json
{
  "requestId": "cpr_20260312_0001",
  "phase": 3,
  "origin": "東京都渋谷区",
  "destination": "静岡県伊東市",
  "vehicle": {
    "fuelEfficiencyKmL": 14.2,
    "fuelType": "regular"
  },
  "options": {
    "includeExperienceValue": false,
    "locale": "ja-JP"
  }
}
```

レスポンス（正常）
```json
{
  "requestId": "cpr_20260312_0001",
  "resultStatus": "success",
  "routes": [
    {
      "type": "fastest",
      "durationMin": 165,
      "tollYen": 4200,
      "fuelCostYen": 1850,
      "totalCostYen": 6050,
      "dataStatus": "complete"
    },
    {
      "type": "smart_saving",
      "durationMin": 190,
      "tollYen": 2300,
      "fuelCostYen": 1760,
      "totalCostYen": 4060,
      "dataStatus": "complete"
    },
    {
      "type": "full_saving",
      "durationMin": 245,
      "tollYen": 0,
      "fuelCostYen": 1690,
      "totalCostYen": 1690,
      "dataStatus": "complete"
    }
  ],
  "fuelPrices": {
    "origin": { "yenPerL": 172.4, "status": "complete" },
    "midway": { "yenPerL": 168.9, "status": "complete" },
    "destination": { "yenPerL": 174.1, "status": "complete" }
  },
  "experienceValue": {
    "diffYen": 1990,
    "message": "ご当地スイーツ2回分に相当",
    "status": "complete"
  },
  "errors": []
}
```

レスポンス（部分成功）
```json
{
  "requestId": "cpr_20260312_0001",
  "resultStatus": "partial_success",
  "routes": [
    {
      "type": "fastest",
      "durationMin": 165,
      "tollYen": null,
      "fuelCostYen": 1850,
      "totalCostYen": null,
      "dataStatus": "missing_toll"
    }
  ],
  "fuelPrices": {
    "origin": { "yenPerL": 172.4, "status": "complete" },
    "midway": { "yenPerL": null, "status": "missing" },
    "destination": { "yenPerL": 174.1, "status": "complete" }
  },
  "experienceValue": {
    "diffYen": null,
    "message": null,
    "status": "missing_dependency"
  },
  "errors": [
    {
      "segment": "toll",
      "errorCode": "UPSTREAM_TIMEOUT",
      "retryable": true
    },
    {
      "segment": "fuel_price_midway",
      "errorCode": "UPSTREAM_UNAVAILABLE",
      "retryable": true
    }
  ]
}
```

#### 4.3.2 API: 失敗セグメント再試行
- エンドポイント: `POST /api/v1/comparisons/retry`
- リクエスト
```json
{
  "requestId": "cpr_20260312_0001",
  "segments": ["toll", "fuel_price_midway"]
}
```
- レスポンス
```json
{
  "requestId": "cpr_20260312_0001",
  "resultStatus": "success",
  "updatedSegments": ["toll", "fuel_price_midway"],
  "errors": []
}
```

#### 4.3.3 API: feature flag 取得
- エンドポイント: `GET /api/v1/feature-flags?userScope=public`
- レスポンス
```json
{
  "phase": 3,
  "flags": {
    "FF_PHASE_1_ROUTE_AND_TOLL": true,
    "FF_PHASE_2_FUEL_ESTIMATE": true,
    "FF_PHASE_3_FUEL_PRICE_3POINT": true,
    "FF_PHASE_4_EXPERIENCE_VALUE": false,
    "FF_RETRY_SEGMENT": true
  }
}
```

#### 4.3.4 DBデータモデル
- `comparison_requests`
  - 主キー: `request_id`
  - 主項目: `phase`, `origin_hash`, `destination_hash`, `vehicle_profile`, `result_status`, `created_at`
- `comparison_route_results`
  - 主キー: `id`
  - 外部キー: `request_id`
  - 主項目: `route_type`, `duration_min`, `toll_yen`, `fuel_cost_yen`, `total_cost_yen`, `data_status`
- `comparison_fuel_prices`
  - 主キー: `id`
  - 外部キー: `request_id`
  - 主項目: `point_type`（origin/midway/destination）, `yen_per_l`, `status`, `fetched_at`
- `experience_value_master`
  - 主キー: `id`
  - 主項目: `min_yen`, `max_yen`, `message_template`, `category`
- `feature_flags`
  - 主キー: `flag_key`
  - 主項目: `enabled`, `phase_from`, `rollout_ratio`, `updated_at`
- `external_api_logs`
  - 主キー: `id`
  - 主項目: `request_id`, `upstream`, `status_code`, `latency_ms`, `error_code`, `created_at`

### 4.4 正常系/異常系詳細
#### 4.4.1 正常系
| シナリオ | 関連DTL-ID | 入力 | 状態遷移 | 出力 |
| --- | --- | --- | --- | --- |
| N-01 3ルート比較成功 | DTL-01, DTL-02 | 出発地/到着地/車両情報 | `idle→validating→loading→success` | 3ルートの時間・料金・燃料・合計を完全表示 |
| N-02 3地点価格成功 | DTL-03 | 比較 API 実行結果 | `loading→success` | 出発/途中/到着の価格と給油メッセージ表示 |
| N-03 体験価値換算成功 | DTL-04 | 差額金額, 換算マスタ | `loading→success` | 差額 + 体験価値文言表示 |
| N-04 フェーズ制御成功 | DTL-05 | phase, feature flags | `app_init→flags_loaded` | phase に応じた表示のみ有効化 |

#### 4.4.2 異常系
| シナリオ | 関連DTL-ID | 入力 | 状態遷移 | 出力 |
| --- | --- | --- | --- | --- |
| E-01 入力不備 | DTL-06 | 必須欠落/形式不正入力 | `idle→validating→error` | フィールド単位エラー、API未実行 |
| E-02 ルートAPI失敗 | DTL-07, DTL-08 | 外部APIタイムアウト | `loading→partial_success` | 取得済み項目のみ表示、未取得明示、再試行可 |
| E-03 料金未取得 | DTL-07, DTL-08 | toll取得失敗 | `loading→partial_success` | `tollYen=null`、`dataStatus=missing_toll` |
| E-04 価格API部分失敗 | DTL-03, DTL-07, DTL-08 | 3地点中1地点失敗 | `loading→partial_success` | 失敗地点のみ未取得表示、他は継続表示 |
| E-05 換算不可 | DTL-04, DTL-08 | 差額ゼロ/負値 or マスタ未取得 | `loading→partial_success` | 差額のみ表示、換算文言抑止 |
| E-06 予期しない内部例外 | DTL-09 | 実行時例外 | `loading→error` | 汎用エラー表示 + 問い合わせ導線 |

### 4.5 段階導入（MVP→拡張）feature flag 設計
| フェーズ | 有効化条件 | 関連flag | 有効機能 | 無効時挙動 |
| --- | --- | --- | --- | --- |
| Phase 1（MVP） | `phase>=1` | `FF_PHASE_1_ROUTE_AND_TOLL` | 入力、時間、高速料金 | 比較画面そのものを非表示 |
| Phase 2 | `phase>=2` | `FF_PHASE_2_FUEL_ESTIMATE` | 推定ガソリン代、合計コスト | 燃料費は「準備中」表示 |
| Phase 3 | `phase>=3` | `FF_PHASE_3_FUEL_PRICE_3POINT` | 3地点価格、給油判断 | 価格パネル非表示 |
| Phase 4 | `phase>=4` | `FF_PHASE_4_EXPERIENCE_VALUE` | 体験価値換算 | 差額金額のみ表示 |

- フラグ評価順序
  1. 環境固定フラグ（本番/検証）
  2. phase 判定
  3. ユーザーセグメント（ロールアウト率）
- 互換性ルール
  - 新フラグ追加時は既定値 `false`。
  - 既存レスポンス項目は削除せず、未使用時は `null` + `status` で表現。

## 6. 課題・リスク
- 外部APIの可用性と SLA 変動
  - 部分成功が増えると比較の納得感が低下する。
- 価格鮮度のばらつき
  - 3地点価格の更新時刻差で推奨がぶれる可能性がある。
- 体験価値換算の主観性
  - 属性不一致で文言価値が低下するため、将来的にパーソナライズが必要。
- feature flag 運用複雑化
  - フラグ増加に伴い組み合わせテスト数が増大する。
- 部分成功時の UI 理解負荷
  - 未取得表示が多い場合、ユーザーが結果を誤読するリスクがある。

## 7. 次工程への引き継ぎ
### 7.1 実装への引き継ぎ事項
- FE実装
  - `ComparisonForm`, `RouteComparisonCards`, `FuelPricePanel`, `ExperienceValuePanel`, `DataStatusNotice` の順で実装。
  - `mapApiResponseToViewModel` で未取得表現を統一。
- BE実装
  - `route-compare-orchestrator` を先行実装し、`route-retry-handler` を後続実装。
  - 外部APIアダプタは共通のタイムアウト/再試行ポリシーを適用。
- API契約
  - `resultStatus`, `dataStatus`, `errors[].retryable` は必須。
  - 破壊的変更は禁止し、追加は後方互換で行う。
- DB実装
  - `comparison_requests` を親テーブルとして履歴を一元化。
  - 監査用途で `external_api_logs` を必須保存。
- テスト接続
  - DTL-ID単位で単体・結合・システムテスト観点を作成。
  - 最低限、N-01〜N-04、E-01〜E-06 をテストケース化。

### 7.2 トレーサビリティ運用
- 実装チケット、テストケース、障害票に DTL-ID を付与する。
- DTL-ID は Req-ID, DES-ID と 1対多で紐づけ、差分改修時も履歴を維持する。

## 8. 実行記録
- 実行モード: new
- 実行種別: 最初の工程から再実施
- 前工程参照: 20_project/21_document/basic-design/basic-design.md
- 判定: 完了（API I/O、データモデル、正常系/異常系、feature flag設計を確認）
