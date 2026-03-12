# detailed-design

## 1. 目的
本書は、要件定義および基本設計で定義した要求・設計方針を、実装工程で迷わない粒度の詳細設計へ分解することを目的とする。

v100（new）では、3ルート比較・3地点ガソリン価格・差額の体験価値化・段階導入（MVP→拡張）を一貫して実装可能にする詳細設計（DTL-01〜DTL-09）を定義した。

v110（delta）では、ソースコード配置を Next.js App Router 標準構成へ移行し、Vercel デプロイを可能にするための詳細設計（DTL-10〜DTL-17）を追加する。具体的には、プロジェクト設定・`app/layout.tsx`・`app/page.tsx`・Route Handler 2本・Supabase クライアント・TypeScript 移植（`lib/routeLogic.ts`・`lib/viewModel.ts`）の実装仕様を定義する。既存ドメイン設計（DTL-01〜DTL-09）への機能的変更はない。

## 2. 入力
- 基本設計書（DES-01〜DES-15）
- 要件定義書（REQ-01〜REQ-13）
- 開発モード: delta（v100 → v110）
- 差分起点: 本書 v100 版（DTL-01〜DTL-09）
- 既存 FE ロジック: `20_project/22_src/front/view_model.js`
- 既存 BE ロジック: `20_project/22_src/back/route_logic.js`
- 技術前提:
  - FE: Next.js 14（React 18, App Router）
  - BFF/API: Next.js Route Handler（`app/api/`）
  - BE ライブラリ: `lib/routeLogic.ts`（`route_logic.js` の TypeScript 移植）
  - DB: Supabase Postgres（将来拡張、MVP では接続準備のみ）
  - デプロイ先: Vercel（Root Directory = `20_project/22_src`）

## 3. 全体構成
### 3.1 コンポーネント構成
- FE（Next.js App Router）
  - `app/layout.tsx`: 全ページ共通レイアウト（HTML ラッパー・グローバル CSS・メタデータ）
  - `app/page.tsx`: トップページ、入力フォーム・比較結果表示・状態管理
  - `components/`: 再利用 UI パーツ（`RouteComparisonCards`・`FuelPricePanel`・`ExperienceValuePanel`・`DataStatusNotice`）
  - `lib/viewModel.ts`: FE 表示ロジック（旧 `front/view_model.js` の TypeScript 移植）
- BFF/API 層（Next.js Route Handler）
  - `app/api/comparisons/route.ts`: `POST /api/comparisons`（比較実行・入力再検証・比較ロジック呼び出し）
  - `app/api/feature-flags/route.ts`: `GET /api/feature-flags`（フェーズ設定返却）
- BE ライブラリ
  - `lib/routeLogic.ts`: ルート比較・燃料費算出・体験価値換算（旧 `back/route_logic.js` の TypeScript 移植）
  - `lib/supabaseClient.ts`: Supabase 接続設定（将来の DB 連携用）
- DB（Supabase Postgres）
  - `lib/supabaseClient.ts` 経由で接続。MVP では未使用だが定義必須。
  - リクエスト履歴・比較結果・価格情報・換算マスタ・feature flag 設定・監査ログ

### 3.2 処理シーケンス
1. 利用者が出発地・到着地・燃費を入力し比較実行ボタンを押す。
2. `app/page.tsx` が入力を一次検証後、`POST /api/comparisons` を fetch 呼び出し。
3. `app/api/comparisons/route.ts` がリクエストを再検証し、`lib/routeLogic.ts` の `buildRouteComparisons` をオーケストレーション実行。
4. 成功時は 3ルート比較 + 3地点価格 + 体験価値を JSON で返却（`200`）。
5. 一部失敗時は未取得項目と再試行対象を明示して部分成功を返却（`200 + resultStatus: partial_success`）。
6. `app/page.tsx` が `lib/viewModel.ts` の `buildScreenModel` を使って API レスポンスを表示用 ViewModel に変換し描画。
7. 初期化時に `GET /api/feature-flags` を呼び出し、フェーズ設定に応じた表示制御を反映。

### 3.3 追跡可能性マトリクス（DTL-ID）
| DTL-ID | 対応 Req-ID | 対応 DES-ID | 区分 | 詳細設計テーマ | バージョン |
| --- | --- | --- | --- | --- | --- |
| DTL-01 | REQ-01, REQ-03 | DES-01, DES-11, DES-12 | FE/BE | 3ルート比較表示と統合レスポンス | v100 |
| DTL-02 | REQ-02 | DES-02 | BE | ルート種別判定ルール一元化 | v100 |
| DTL-03 | REQ-04 | DES-03, DES-11, DES-12 | FE/BE | 3地点ガソリン価格表示 | v100 |
| DTL-04 | REQ-05 | DES-04, DES-11, DES-12 | FE/BE | 差額の体験価値換算 | v100 |
| DTL-05 | REQ-06 | DES-05, DES-10 | FE/BE | 段階導入 feature flag | v100 |
| DTL-06 | REQ-07 | DES-06 | FE/BE | 入力バリデーション（二重検証） | v100 |
| DTL-07 | REQ-08, REQ-10 | DES-07, DES-09, DES-12 | BE | API失敗時継続・再試行 | v100 |
| DTL-08 | REQ-09 | DES-08, DES-11, DES-12 | FE/BE | 未取得データの標準表現 | v100 |
| DTL-09 | REQ-11 | DES-10 | FE/BE | ログ/監査を含むトレーサビリティ | v100 |
| DTL-10 | REQ-12, REQ-13 | DES-13, DES-14 | FE | Next.js プロジェクト設定 | **v110** |
| DTL-11 | REQ-13 | DES-14 | FE | `app/layout.tsx` 設計 | **v110** |
| DTL-12 | REQ-01, REQ-13 | DES-14 | FE | `app/page.tsx` 設計（トップページ） | **v110** |
| DTL-13 | REQ-01〜REQ-11, REQ-13 | DES-12, DES-14 | API | `app/api/comparisons/route.ts` 設計 | **v110** |
| DTL-14 | REQ-06, REQ-13 | DES-05, DES-14 | API | `app/api/feature-flags/route.ts` 設計 | **v110** |
| DTL-15 | REQ-12, REQ-13 | DES-13, DES-14 | BE/DB | `lib/supabaseClient.ts` 設計 | **v110** |
| DTL-16 | REQ-01〜REQ-05, REQ-13 | DES-15 | BE | `lib/routeLogic.ts`（旧 `back/route_logic.js` TypeScript 移植） | **v110** |
| DTL-17 | REQ-01, REQ-04, REQ-05, REQ-13 | DES-11, DES-15 | FE | `lib/viewModel.ts`（旧 `front/view_model.js` TypeScript 移植） | **v110** |

## 4. 詳細
### 4.1 FE詳細設計
#### 4.1.1 プロジェクト設定（DTL-10）
**対応 Req-ID**: REQ-12, REQ-13 / **対応 DES-ID**: DES-13, DES-14

**`package.json` 必須依存（`20_project/22_src/package.json`）**
```json
{
  "dependencies": {
    "next": "14.x",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@supabase/supabase-js": "^2.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/react": "^18.x",
    "@types/node": "^20.x"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

**`tsconfig.json`（`20_project/22_src/tsconfig.json`）**
- `compilerOptions.strict: true`（厳格型チェック有効）
- `compilerOptions.paths: { "@/*": ["./*"] }`（`@/` エイリアスでプロジェクトルートを参照）
- `compilerOptions.target: "ES2017"`、`module: "esnext"`、`moduleResolution: "bundler"`
- `include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"]`

**`next.config.js`（`20_project/22_src/next.config.js`）**
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};
module.exports = nextConfig;
```

正常系: `next build` が 0 エラーで完了 / 異常系: 型エラー・依存不足は CI でエラーとして検出

---

#### 4.1.2 `app/layout.tsx`（DTL-11）
**対応 Req-ID**: REQ-13 / **対応 DES-ID**: DES-14

```typescript
// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ドライブ・コンパス",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
```

| 項目 | 仕様 |
| --- | --- |
| `lang` 属性 | `"ja"` 固定 |
| グローバル CSS | `./globals.css` をインポート |
| `metadata.title` | `"ドライブ・コンパス"` |
| Server Component | `"use client"` なし（Server Component） |

正常系: `/` アクセスで `<html lang="ja">` が描画される / 異常系: globals.css 未存在はビルドエラー

---

#### 4.1.3 `app/page.tsx`（DTL-12）
**対応 Req-ID**: REQ-01, REQ-07, REQ-13 / **対応 DES-ID**: DES-14

**ディレクティブ**: `"use client"`（フォーム操作・状態管理に必須）

**状態定義**
| 状態名 | 説明 | 遷移元 | 遷移先 |
| --- | --- | --- | --- |
| `idle` | 初期状態 | — | `loading` |
| `loading` | `POST /api/comparisons` 呼び出し中 | `idle` | `success` / `partial_success` / `error` |
| `success` | 全データ取得完了 | `loading` | `idle` |
| `partial_success` | 一部データ未取得 | `loading` | `idle` |
| `error` | バリデーション失敗またはネットワーク障害 | `idle` / `loading` | `idle` |

**fetch 呼び出し仕様**
- `ComparisonForm` の `onSubmit` ハンドラから `fetch("/api/comparisons", { method: "POST", body: JSON.stringify({ origin, destination, fuelEfficiencyKmL }) })` を呼び出す。
- レスポンスの `resultStatus` を確認し、`"success"` → `success`、`"partial_success"` → `partial_success` へ状態遷移。
- `!response.ok`（400/500系）は `error` 状態へ遷移しエラーメッセージを設定。

**表示ロジック**
- API 成功後、`lib/viewModel.ts` の `buildScreenModel(payload)` を呼び出し、結果を `ScreenModel` に変換して各 component へ props 渡し。
- `partial_success` 時も描画継続し、`DataStatusNotice` を必ず表示。

**コンポーネント呼び出し**
```
<ComparisonForm onSubmit={handleSubmit} />
{state === "loading"  && <LoadingSpinner />}
{(state === "success" || state === "partial_success") && (
  <>
    <RouteComparisonCards cards={screenModel.cards} />
    {showFuelPricePanel && <FuelPricePanel prices={screenModel.fuelPrices} />}
    {showExperienceValue && <ExperienceValuePanel experience={screenModel.experience} />}
    {state === "partial_success" && <DataStatusNotice errors={apiErrors} />}
  </>
)}
{state === "error" && <ErrorNotice message={errorMessage} onRetry={handleRetry} />}
```

---

#### 4.1.4 画面/コンポーネント（v100 継続）
**対応 DTL-ID**: DTL-01〜DTL-08

- `ComparisonForm`
  - 入力: 出発地、到着地、車両燃費（`fuelEfficiencyKmL`: 正のnumber）
  - 役割: REQ-07 の一次バリデーション、比較実行トリガー
  - バリデーション: 出発地・到着地は必須・最大50文字、燃費は 1〜100 の数値
- `RouteComparisonCards`
  - 入力: `ComparisonCard[]`（`lib/viewModel.ts` から生成）
  - 役割: 時間・高速料金・燃料費・合計コスト表示（3カード横並び）
- `FuelPricePanel`
  - 入力: `FuelPricePoint[]`（`lib/viewModel.ts` から生成）
  - 役割: 地点別価格・価格差メッセージ表示。feature flag `showFuelPrice=true` 時のみ表示。
- `ExperienceValuePanel`
  - 入力: `string | null`（`screenModel.experience`）
  - 役割: 差額の体験価値化表示。feature flag `showExperienceValue=true` 時のみ表示。
- `DataStatusNotice`
  - 入力: `errors[]`（API レスポンスの `errors` 配列）
  - 役割: 部分成功時の未取得通知・再試行導線表示

---

#### 4.1.5 `lib/viewModel.ts`（DTL-17）
**対応 Req-ID**: REQ-01, REQ-04, REQ-05, REQ-13 / **対応 DES-ID**: DES-11, DES-15
**移植元**: `20_project/22_src/front/view_model.js`

**型定義**
```typescript
// lib/viewModel.ts

export interface ComparisonCard {
  title: string;        // ルート種別ラベル（"fastest" | "smart_saving" | "full_saving"）
  timeLabel: string;    // 例: "165分"
  tollLabel: string;    // 例: "4,200円"
  fuelLabel: string;    // 例: "1,850円"
  totalLabel: string;   // 例: "6,050円"
}

export interface FuelPricePoint {
  point: "origin" | "midway" | "destination";
  label: string;        // 例: "172円/L" or "未取得"
}

export interface ScreenModel {
  cards: ComparisonCard[];
  fuelPrices: FuelPricePoint[];
  experience: string | null;
}
```

**関数仕様**
| 関数名 | 引数 | 戻り値 | 処理概要 |
| --- | --- | --- | --- |
| `mapToComparisonCards` | `routes: RouteComparison[]` | `ComparisonCard[]` | 各ルートを表示用カード形式へ変換 |
| `buildFuelPricePanel` | `prices: Record<string, number \| null>` | `FuelPricePoint[]` | 地点単位で価格ラベルを生成。`null` は `"未取得"` |
| `buildScreenModel` | `payload: ApiComparisonsResponse` | `ScreenModel` | API レスポンス全体を表示用 ScreenModel に変換 |

**移植差分**
- `mapToComparisonCards`: `tollLabel` / `fuelLabel` / `totalLabel` に `toLocaleString()` を適用し桁区切りを付与（v100 JS 版は未適用）。
- `buildFuelPricePanel`: `null` チェックを `== null` から TypeScript の厳格 null チェック（`price === null || price === undefined`）へ変更。
- `buildScreenModel`: `payload.experienceValue` が `null` の場合、`experience: null` を返す（v100 JS 版は `message` プロパティを直接参照しクラッシュリスクあり）。

正常系: `buildScreenModel` が `ScreenModel` を返す / 異常系: `routes` が空配列の場合 `cards: []` を返し、クラッシュしない

---

#### 4.1.6 状態管理
- 状態型: `"idle" | "loading" | "success" | "partial_success" | "error"`
- ライブラリ: React `useState` + `useCallback`（外部状態管理ライブラリ不使用）
- 遷移: `idle → loading → success/partial_success/error`（`error` または成功後は `idle` へ戻る）
- `partial_success` 時も描画継続し、`DataStatusNotice` を強制表示

#### 4.1.7 FE エラーハンドリング
| エラー種別 | 状態遷移 | 表示方針 |
| --- | --- | --- |
| 入力不備（バリデーション NG） | `idle → error` | フィールド直下に修正可能メッセージ表示。API 呼び出しは抑止。 |
| 通信失敗（4xx/5xx） | `loading → error` | トースト + 結果領域にリトライボタン表示 |
| 部分失敗（partial_success） | `loading → partial_success` | 未取得バッジ表示。UI 描画は継続。 |

#### 4.1.8 FE ログ方針
- 画面イベントログ: `compare_clicked`, `retry_clicked`, `validation_failed`
- 送信項目: `requestId`, `sessionId`, `phase`, `failedSegments`
- 個人情報方針: 入力文字列の生値はログ保存しない（ハッシュ化）

---

### 4.2 BFF/API詳細設計
#### 4.2.1 `app/api/comparisons/route.ts`（DTL-13）
**対応 Req-ID**: REQ-01〜REQ-11, REQ-13 / **対応 DES-ID**: DES-12, DES-14

**関数シグネチャ**
```typescript
// app/api/comparisons/route.ts
export async function POST(request: Request): Promise<Response>
```

**リクエストボディ**
```typescript
{
  origin: string;              // 出発地（必須）
  destination: string;         // 到着地（必須）
  fuelEfficiencyKmL: number;   // 燃費 km/L（必須、正の数）
}
```

**バリデーション仕様**
| フィールド | 必須 | 型 | 制約 | NG 時の動作 |
| --- | --- | --- | --- | --- |
| `origin` | ✓ | string | 1〜50 文字 | 400 返却 |
| `destination` | ✓ | string | 1〜50 文字 | 400 返却 |
| `fuelEfficiencyKmL` | ✓ | number | 1 以上 100 以下 | 400 返却 |

**正常系処理フロー**
1. リクエストボディを `request.json()` でパース。
2. バリデーション実行。NG なら `400` を即時返却。
3. ルートテンプレート（fastest / smart_saving / full_saving）を設定値から生成。
4. `lib/routeLogic.ts` の `buildRouteComparisons(input)` を呼び出し。
5. `lib/routeLogic.ts` の `buildExperienceValue(fastestCostYen, candidateCostYen)` で体験価値算出。
6. 統合レスポンスを組み立て、`Response.json(body, { status: 200 })` で返却。

**正常系レスポンス（200）**
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
    "origin":      { "yenPerL": 172.4, "status": "complete" },
    "midway":      { "yenPerL": 168.9, "status": "complete" },
    "destination": { "yenPerL": 174.1, "status": "complete" }
  },
  "experienceValue": {
    "diffYen": 1990,
    "message": "ご当地スイーツ2人分に相当",
    "status": "complete"
  },
  "errors": []
}
```

**部分成功レスポンス（200）**
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
    "origin":      { "yenPerL": 172.4, "status": "complete" },
    "midway":      { "yenPerL": null,  "status": "missing" },
    "destination": { "yenPerL": 174.1, "status": "complete" }
  },
  "experienceValue": {
    "diffYen": null,
    "message": null,
    "status": "missing_dependency"
  },
  "errors": [
    { "segment": "toll",             "errorCode": "UPSTREAM_TIMEOUT",      "retryable": true },
    { "segment": "fuel_price_midway","errorCode": "UPSTREAM_UNAVAILABLE",  "retryable": true }
  ]
}
```

**異常系レスポンス**
| HTTP Status | 条件 | ボディの `errorCode` |
| --- | --- | --- |
| `400` | バリデーション失敗 | `VALIDATION_ERROR` |
| `500` | 予期しない例外 | `INTERNAL_ERROR` |

---

#### 4.2.2 `app/api/feature-flags/route.ts`（DTL-14）
**対応 Req-ID**: REQ-06, REQ-13 / **対応 DES-ID**: DES-05, DES-14

**関数シグネチャ**
```typescript
// app/api/feature-flags/route.ts
export async function GET(): Promise<Response>
```

**MVP 固定値レスポンス（200）**
```json
{
  "phase": 1,
  "flags": {
    "showFuelPrice": false,
    "showExperienceValue": false
  }
}
```

- MVP では DB 参照なし・固定値返却。フェーズ 2 以降は Supabase `feature_flags` テーブルを参照する実装に差し替える。
- 正常系: 200 + 上記 JSON / 異常系: 500（予期しない例外）

---

#### 4.2.3 再試行 API（v100 継続）
- エンドポイント: `POST /api/v1/comparisons/retry`（将来拡張、MVP では実装不要）
- リクエスト: `{ requestId: string, segments: string[] }`
- レスポンス: `{ requestId, resultStatus, updatedSegments, errors }`

---

#### 4.2.4 feature flag 評価ルール（v100 継続）
| フェーズ | 有効化条件 | `showFuelPrice` | `showExperienceValue` | 有効機能 |
| --- | --- | --- | --- | --- |
| Phase 1（MVP） | `phase >= 1` | `false` | `false` | 入力、時間、高速料金 |
| Phase 2 | `phase >= 2` | `false` | `false` | 推定ガソリン代・合計コスト追加 |
| Phase 3 | `phase >= 3` | `true` | `false` | 3地点価格・給油判断 |
| Phase 4 | `phase >= 4` | `true` | `true` | 体験価値換算 |

---

#### 4.2.5 正常系/異常系詳細（API 層）
| シナリオ | 関連 DTL-ID | 入力 | 状態遷移 | 出力 |
| --- | --- | --- | --- | --- |
| N-01 3ルート比較成功 | DTL-01, DTL-02, DTL-13 | 出発地/到着地/燃費 | `idle→loading→success` | 3ルートの時間・料金・燃料・合計を完全表示 |
| N-02 3地点価格成功 | DTL-03, DTL-13 | 比較 API 実行結果 | `loading→success` | 出発/途中/到着の価格と給油メッセージ表示 |
| N-03 体験価値換算成功 | DTL-04, DTL-13 | 差額金額, 換算マスタ | `loading→success` | 差額 + 体験価値文言表示 |
| N-04 フェーズ制御成功 | DTL-05, DTL-14 | phase, feature flags | `app_init→flags_loaded` | phase に応じた表示のみ有効化 |
| E-01 入力不備 | DTL-06 | 必須欠落/形式不正入力 | `idle→error` | フィールド単位エラー、API 未実行 |
| E-02 ルートAPI失敗 | DTL-07, DTL-08 | 外部APIタイムアウト | `loading→partial_success` | 取得済み項目のみ表示、未取得明示、再試行可 |
| E-03 料金未取得 | DTL-07, DTL-08 | toll取得失敗 | `loading→partial_success` | `tollYen=null`、`dataStatus=missing_toll` |
| E-04 価格API部分失敗 | DTL-03, DTL-07, DTL-08 | 3地点中1地点失敗 | `loading→partial_success` | 失敗地点のみ未取得表示、他は継続表示 |
| E-05 換算不可 | DTL-04, DTL-08 | 差額ゼロ/負値 or マスタ未取得 | `loading→partial_success` | 差額のみ表示、換算文言抑止 |
| E-06 予期しない内部例外 | DTL-09 | 実行時例外 | `loading→error` | 汎用エラー表示 + 問い合わせ導線 |

---

### 4.3 BE詳細設計
#### 4.3.1 `lib/routeLogic.ts`（DTL-16）
**対応 Req-ID**: REQ-01〜REQ-05, REQ-13 / **対応 DES-ID**: DES-15
**移植元**: `20_project/22_src/back/route_logic.js`

**型定義**
```typescript
// lib/routeLogic.ts

export type RouteType = "fastest" | "smart_saving" | "full_saving";

export interface RouteInput {
  baseDistanceKm: number;
  baseDurationMin: number;
  fuelEfficiencyKmL: number;   // 正の数（> 0）
  fuelPriceYenPerL: number;    // 非負の数（>= 0）
}

export interface RouteComparison {
  type: RouteType;
  distanceKm: number;
  durationMin: number;
  tollYen: number;
  fuelCostYen: number;
  totalCostYen: number;
}

export interface ExperienceValue {
  diffYen: number;
  message: string;
}
```

**関数仕様**
| 関数名 | 引数 | 戻り値 | 正常系 | 異常系 |
| --- | --- | --- | --- | --- |
| `calculateFuelCost` | `distanceKm: number`, `fuelEfficiencyKmL: number`, `fuelPriceYenPerL: number` | `number` | 燃料費を円単位で四捨五入返却 | `fuelEfficiencyKmL <= 0` は `Error` をスロー |
| `buildRouteComparisons` | `input: RouteInput` | `RouteComparison[]` | 3ルート配列を返却 | `input` 欠損は `Error` |
| `buildExperienceValue` | `fastestCostYen: number`, `candidateCostYen: number` | `ExperienceValue` | 差額ゼロ/負値は `"差額なし"` メッセージ、3000円以上は `"現地ランチ2人分"` | 引数が `NaN` は `Error` |

**ルートテンプレート定数**
```typescript
const ROUTE_TEMPLATES = [
  { type: "fastest",      distanceFactor: 1.00, durationFactor: 1.00, tollYen: 4200 },
  { type: "smart_saving", distanceFactor: 1.05, durationFactor: 1.15, tollYen: 2300 },
  { type: "full_saving",  distanceFactor: 1.12, durationFactor: 1.45, tollYen: 0    },
] as const;
```

**移植差分**
- `module.exports` → `export function` / `export interface` へ変更（ESM 形式）。
- `function roundYen` を file-private ヘルパーとして維持（`export` 不要）。
- `buildExperienceValue` の引数を `diffAmount: number` から `(fastestCostYen: number, candidateCostYen: number): ExperienceValue` に変更（差額計算を関数内部で処理）。

---

#### 4.3.2 Route Handler から lib への呼び出し（DTL-13 → DTL-16）
- `app/api/comparisons/route.ts` は `lib/routeLogic.ts` を `import { buildRouteComparisons, buildExperienceValue } from "@/lib/routeLogic"` で参照。
- テンプレートに使用する `baseDistanceKm`・`baseDurationMin` は MVP ではリクエストボディから仮に `100km`・`120min` をデフォルト値として使用（外部 API 連携前の暫定実装）。
- 外部 API 失敗時は `null` でラップした部分成功レスポンスを返す（既存 DTL-07 の継続設計に準拠）。

---

#### 4.3.3 非機能制御（v100 継続）
- タイムアウト: 外部APIごとに 3秒（価格 API は 2秒）
- 再試行: 最大2回、指数バックオフ（200ms, 600ms）
- サーキットブレーカ: 連続失敗 5 回で 60 秒オープン

#### 4.3.4 BE ログ方針（v100 継続）
- 構造化ログ JSON を採用
- 必須キー: `timestamp`, `level`, `requestId`, `traceId`, `dtlId`, `reqIds`, `desIds`, `errorCode`
- 監査ログ: 比較実行結果の要約（成功/部分成功/失敗）をDB保存
- 障害ログ: 外部API失敗時に upstream 名と応答時間を記録

---

### 4.4 DB設計
#### 4.4.1 `lib/supabaseClient.ts`（DTL-15）
**対応 Req-ID**: REQ-12, REQ-13 / **対応 DES-ID**: DES-13, DES-14

```typescript
// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

| 環境変数 | 設定場所 | 説明 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` / Vercel Environment Variables | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` / Vercel Environment Variables | Supabase Anon Key |

- MVP では `supabase` クライアントは `lib/supabaseClient.ts` に定義するのみで、実際の DB 呼び出しは行わない。
- `.env.local` は Git 管理外（`.gitignore` に追記）。
- 正常系: `import { supabase } from "@/lib/supabaseClient"` でクライアント取得 / 異常系: 環境変数未設定は `!` アサーション により実行時エラー → 設定漏れをデプロイ前に検出する。

---

#### 4.4.2 DB データモデル（v100 継続）
- `comparison_requests`
  - 主キー: `request_id`
  - 主項目: `phase`, `origin_hash`, `destination_hash`, `vehicle_profile`, `result_status`, `created_at`
- `comparison_route_results`
  - 主キー: `id` / 外部キー: `request_id`
  - 主項目: `route_type`, `duration_min`, `toll_yen`, `fuel_cost_yen`, `total_cost_yen`, `data_status`
- `comparison_fuel_prices`
  - 主キー: `id` / 外部キー: `request_id`
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

---

### 4.5 エラーコード定義
| エラーコード | HTTP Status | 発生箇所 | 説明 | 対応 DTL-ID |
| --- | --- | --- | --- | --- |
| `VALIDATION_ERROR` | 400 | `app/api/comparisons/route.ts` | 入力バリデーション失敗（必須欠落・型不正・範囲外） | DTL-06, DTL-13 |
| `UPSTREAM_TIMEOUT` | 200（partial） | `lib/routeLogic.ts` / Route Handler | 外部API応答タイムアウト | DTL-07 |
| `UPSTREAM_UNAVAILABLE` | 200（partial） | `lib/routeLogic.ts` / Route Handler | 外部APIサービス停止 | DTL-07 |
| `INTERNAL_ERROR` | 500 | `app/api/comparisons/route.ts`・`app/api/feature-flags/route.ts` | 予期しない例外（try-catch で捕捉） | DTL-09 |
| `MISSING_DEPENDENCY` | — | レスポンス内 `status` フィールド | 依存データが未取得のため算出不可 | DTL-08 |

- 業務継続可能な失敗（外部API障害）は HTTP 200 + `resultStatus: "partial_success"` + エラー配列で表現。
- 業務継続不可の失敗（バリデーション・内部例外）は HTTP 4xx/5xx で表現。
- FE はレスポンスの HTTP Status と `resultStatus` を両方確認して状態遷移を決定する。

## 5. 差分（delta のみ）
### 5.1 v100 → v110 変更対照表
| 変更項目 | v100（変更前） | v110（変更後） | 変更理由 | 影響 DTL-ID |
| --- | --- | --- | --- | --- |
| ソースコード配置 | `22_src/front/`・`22_src/back/` | `22_src/app/`・`22_src/lib/`・`22_src/components/` | Vercel デプロイのための Next.js App Router 標準構成への移行 | DTL-10〜DTL-17 |
| FE ロジックファイル | `front/view_model.js`（CommonJS） | `lib/viewModel.ts`（TypeScript / ESM） | 型安全性確保・Next.js との統合 | DTL-17 |
| BE ロジックファイル | `back/route_logic.js`（CommonJS） | `lib/routeLogic.ts`（TypeScript / ESM） | 型安全性確保・Route Handler からの直接 import | DTL-16 |
| 比較 API エンドポイント | `POST /api/v1/comparisons`（想定） | `POST /api/comparisons`（Next.js Route Handler） | App Router の `app/api/` 規則に準拠 | DTL-13 |
| feature-flags エンドポイント | `GET /api/v1/feature-flags`（想定） | `GET /api/feature-flags`（Next.js Route Handler） | App Router の `app/api/` 規則に準拠 | DTL-14 |
| レイアウト | 未定義（v100 は実装前提の設計のみ） | `app/layout.tsx`（lang="ja", metadata, globals.css） | Next.js App Router 必須ファイル | DTL-11 |
| トップページ | 未定義（v100 は実装前提の設計のみ） | `app/page.tsx`（"use client", 状態管理, fetch） | Next.js App Router 必須ファイル | DTL-12 |
| Supabase 接続 | Supabase Edge Functions 直接呼び出し（将来想定） | `lib/supabaseClient.ts`（createClient, MVP では未使用） | Vercel/Next.js 環境への適合、将来拡張の準備 | DTL-15 |
| プロジェクト設定 | 未定義 | `package.json`・`tsconfig.json`・`next.config.js` | Vercel ビルドの前提 | DTL-10 |
| DTL-01〜DTL-09 | 変更なし | 変更なし | ドメイン要件への機能的変更なし | — |
| 詳細設計書の構成 | 4.1 FE / 4.2 BE / 4.3 API・DB / 4.4 正常異常系 / 4.5 feature flag | 4.1 FE / 4.2 BFF/API / 4.3 BE / 4.4 DB / 4.5 エラーコード | 必須見出し要件への適合・可読性向上 | 全体 |

### 5.2 既存ドメイン設計への影響範囲
- **影響なし**: DTL-01〜DTL-09 のドメインロジック（3ルート比較・3地点価格・体験価値換算・段階導入・バリデーション・障害継続・未取得表現・再試行・トレーサビリティ）
- **影響あり（配置変更のみ）**: `buildRouteComparisons`・`buildExperienceValue`（`route_logic.js` → `lib/routeLogic.ts` へ移植；ロジック内容は変更なし）
- **影響あり（配置変更のみ）**: `mapToComparisonCards`・`buildFuelPricePanel`・`buildScreenModel`（`view_model.js` → `lib/viewModel.ts` へ移植；型安全化と null チェック強化あり）

---

## 6. 課題・リスク
- **外部APIの可用性と SLA 変動**（v100 継続）
  - 部分成功が増えると比較の納得感が低下する。
- **価格鮮度のばらつき**（v100 継続）
  - 3地点価格の更新時刻差で推奨がぶれる可能性がある。
- **体験価値換算の主観性**（v100 継続）
  - 属性不一致で文言価値が低下するため、将来的にパーソナライズが必要。
- **feature flag 運用複雑化**（v100 継続）
  - フラグ増加に伴い組み合わせテスト数が増大する。
- **部分成功時の UI 理解負荷**（v100 継続）
  - 未取得表示が多い場合、ユーザーが結果を誤読するリスクがある。
- **環境変数の未設定リスク**（v110 追加）
  - `NEXT_PUBLIC_SUPABASE_URL`・`NEXT_PUBLIC_SUPABASE_ANON_KEY` が Vercel に未設定の場合、`lib/supabaseClient.ts` の `!` アサーションで実行時エラーとなる。CI での環境変数バリデーションステップの追加を推奨。
- **TypeScript 移植時の型漏れ**（v110 追加）
  - `route_logic.js`・`view_model.js` の移植時に、`strict: true` のもとで潜在的な型エラーが顕在化する可能性がある。移植後に `tsc --noEmit` を実行してエラーゼロを確認すること。
- **MVP の暫定実装によるデータ精度**（v110 追加）
  - `app/api/comparisons/route.ts` が `baseDistanceKm`・`baseDurationMin` にデフォルト値を使用しているため、比較結果の精度は外部 API 連携実装後に初めて確保される。

## 7. 次工程への引き継ぎ
### 7.1 実装への引き継ぎ事項
**FE 実装（優先順）**
1. `next.config.js`・`tsconfig.json`・`package.json` を作成し `npm install`（DTL-10）。
2. `app/layout.tsx` を作成し `globals.css` を配置（DTL-11）。
3. `lib/viewModel.ts` を `front/view_model.js` から移植し、型定義と厳格 null チェックを追加（DTL-17）。
4. `app/page.tsx` を `"use client"` で実装。状態管理は `useState`、fetch 後に `buildScreenModel` を呼び出す（DTL-12）。
5. `components/` に `ComparisonForm`・`RouteComparisonCards` 等を実装（DTL-01, DTL-11）。

**BE/API 実装（優先順）**
1. `lib/routeLogic.ts` を `back/route_logic.js` から移植。型定義と ESM エクスポートを追加（DTL-16）。
2. `lib/supabaseClient.ts` を作成し、`.env.local` に環境変数を設定（DTL-15）。
3. `app/api/comparisons/route.ts` を実装。バリデーション・`buildRouteComparisons` 呼び出し・レスポンス組み立てを含む（DTL-13）。
4. `app/api/feature-flags/route.ts` を実装。MVP 固定値を返す（DTL-14）。

**API 契約**
- `resultStatus`, `dataStatus`, `errors[].retryable` は必須。
- 破壊的変更は禁止し、追加は後方互換で行う。

**DB 実装**
- MVP では未使用だが `lib/supabaseClient.ts` は必ず実装・コミットする（DTL-15）。
- フェーズ 2 以降で `comparison_requests` を親テーブルとして履歴を一元化。

**テスト接続**
- DTL-ID 単位で単体・結合・システムテスト観点を作成。
- 最低限、N-01〜N-04、E-01〜E-06 をテストケース化。
- TypeScript 移植ファイル（DTL-16, DTL-17）は既存 `30_test/` の単体テストを TypeScript 化して検証。

### 7.2 トレーサビリティ運用
- 実装チケット、テストケース、障害票に DTL-ID を付与する。
- DTL-ID は Req-ID, DES-ID と 1対多で紐づけ、差分改修時も履歴を維持する。
- v110 追加分（DTL-10〜DTL-17）は基本設計の DES-13〜DES-15 と対応している。

## 8. 実行記録
- 実行モード: delta
- 実行種別: 差分追記（v100 → v110）
- 差分起点: 本書 v100 版（DTL-01〜DTL-09）
- 追加 DTL-ID: DTL-10〜DTL-17（Next.js App Router 標準構成への移行）
- 前工程参照:
  - `20_project/21_document/requirements/requirements.md`（REQ-12・REQ-13 v110 追加）
  - `20_project/21_document/basic-design/basic-design.md`（DES-13〜DES-15 v110 追加）
  - `20_project/22_src/front/view_model.js`（DTL-17 移植元）
  - `20_project/22_src/back/route_logic.js`（DTL-16 移植元）
- 判定: 完了（DTL-10〜DTL-17 の仕様・型定義・正常系/異常系・移植差分を確認。必須見出し 1〜8 を全充足）

