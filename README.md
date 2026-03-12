# ドライブ・コンパス 〜節約とタイパの天秤〜

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-2-green?logo=supabase)
![Vercel](https://img.shields.io/badge/Vercel-deployed-black?logo=vercel)

---

## 1. プロジェクト概要

| 項目 | 内容 |
| --- | --- |
| **アプリ名** | ドライブ・コンパス 〜節約とタイパの天秤〜 |
| **コンセプト** | レジャー時の「時間効率（タイパ）」と「移動コスト節約」を同時に比較・判断できる体験を提供する。単なる経路検索にとどまらず、移動で浮いた金額を現地体験に変換して外出の満足度を高める。 |
| **対象ユーザー** | 家族・友人とレジャー外出する層。週末や休日に行楽地へドライブする際のルート選びに悩んでいる人。 |
| **バージョン** | v110 (2026-03-12 リリース) |

---

## 2. デモ

**公開 URL**: [https://drivecompassapp.vercel.app/](https://drivecompassapp.vercel.app/)

> **注意（現バージョン）**: 現在はデモ固定値（距離 150 km・120 分・170 円/L）を使用しています。実際の経路データとの連携は次バージョンで提供予定です。

---

## 3. 主要機能

### 3ルート比較表示
出発地と到着地を入力すると、以下の3パターンのルート提案を横並びで表示します。

| ルート | 概要 | 特徴 |
| --- | --- | --- |
| **最速** | 全行程で高速道路利用 | 遊ぶ時間を最大化 |
| **賢く節約** | 一部区間のみ高速利用 | 渋滞・峠を回避しつつ費用最適化 |
| **完全節約** | 全行程を下道利用 | 差額を観光・食事に回せる |

各ルートの比較軸:
- 所要時間
- 高速料金
- 推定ガソリン代
- 合計移動コスト

### ガソリン価格の見える化
出発地・途中地点・到着地の3地点でガソリン価格を提示し、給油戦略を支援します。

- **出発地**: 出発前の満タン給油可否を判断
- **途中（高速 SA）**: SA 給油が割高な場合に注意喚起
- **到着地**: 帰路給油の方が安い場合に提案

### 差額の体験価値換算
最速ルートと節約ルートの差額をレジャー体験（食事・スイーツ等）に換算して表示し、節約の実感と外出の満足度を高めます。

---

## 4. 技術スタック

| カテゴリ | 技術 | バージョン |
| --- | --- | --- |
| フロントエンド | Next.js (App Router) | 14.2.3 |
| フロントエンド | React | ^18 |
| フロントエンド | TypeScript | ^5 |
| バックエンド | Next.js API Routes (Route Handler) | — |
| バックエンド | Supabase | ^2 |
| デプロイ | Vercel | — |
| テスト | Node.js スクリプト | — |

---

## 5. ローカル開発手順

### 前提条件

- Node.js 18 以上
- npm 9 以上
- Supabase プロジェクト（接続 URL・Anon Key が取得済みであること）

### インストール

```bash
# リポジトリをクローン
git clone <リポジトリURL>
cd driVeCompass.x.x

# 依存パッケージをインストール（ソースディレクトリで実行）
cd 20_project/22_src
npm install
```

### 環境変数の設定

`20_project/22_src/.env.local` を手動作成し、以下の変数を設定してください。

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

> **重要**: `.env.local` は `.gitignore` に登録済みです。GitHub へのコミットは絶対にしないでください。

### 開発サーバーの起動

```bash
# 20_project/22_src ディレクトリ内で実行
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスしてください。

### ビルド確認

```bash
npm run build
npm run start
```

---

## 6. フォルダ構成

```
driVeCompass.x.x/
├── README.md                    # 本ファイル
├── HOWTOUSE.md                  # ユーザー向け操作説明
├── .github/                     # GitHub Actions / Copilot エージェント定義
│   ├── agents/
│   ├── instructions/
│   ├── prompts/
│   └── skills/
├── 00_request/                  # 議事録・要求定義
│   ├── minutes_v100.md
│   └── minutes_v110.md
├── 10_bug/                      # バグ情報管理
├── 20_project/
│   ├── 21_document/             # 各工程のエージェント成果物
│   │   ├── requirements/        # 要件定義
│   │   ├── basic-design/        # 基本設計
│   │   ├── detailed-design/     # 詳細設計
│   │   ├── implementation/      # 実装記録
│   │   ├── integration-test/    # 結合テスト結果
│   │   ├── system-test/         # システムテスト結果
│   │   └── release/             # リリース判定記録
│   └── 22_src/                  # ← Vercel Root Directory
│       ├── app/                 # Next.js App Router
│       │   ├── layout.tsx       # 全ページ共通レイアウト
│       │   ├── page.tsx         # トップページ（/）
│       │   ├── globals.css      # グローバルスタイル
│       │   └── api/
│       │       ├── comparisons/
│       │       │   └── route.ts # POST /api/comparisons
│       │       └── feature-flags/
│       │           └── route.ts # GET /api/feature-flags
│       ├── components/          # 再利用 UI パーツ
│       ├── lib/                 # ユーティリティ
│       │   ├── supabaseClient.ts
│       │   ├── routeLogic.ts
│       │   └── viewModel.ts
│       ├── public/              # 静的ファイル
│       ├── .env.local           # ローカル用環境変数（Git 管理外）
│       ├── next.config.js
│       ├── package.json
│       └── tsconfig.json
└── 30_test/                     # テストスイート
    ├── 31_unit/                 # 単体テスト
    │   ├── input/unit_cases.json
    │   ├── logic/run_unit_tests.js
    │   └── output/unit_result.txt
    ├── 32_integration/          # 結合テスト
    │   ├── input/integration_scenarios.json
    │   ├── logic/run_integration_tests.js
    │   └── output/integration_result.txt
    └── 33_system/               # システムテスト
        ├── input/system_scenarios.json
        ├── logic/run_system_tests.js
        └── output/system_result.txt
```

---

## 7. デプロイ手順（Vercel）

### 初回セットアップ

1. [Vercel](https://vercel.com/) にログインし、「New Project」からリポジトリをインポートします。
2. **Root Directory** を `20_project/22_src` に設定します（これが最重要）。
3. **Framework Preset** は `Next.js`（Vercel が自動検出）。
4. 「Environment Variables」に以下の変数を追加します。

| 変数名 | 説明 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトの URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の Anon（公開）キー |

5. 「Deploy」をクリックしてデプロイを実行します。

### デプロイ確認

- デプロイ完了後、Vercel が発行した URL または [https://drivecompassapp.vercel.app/](https://drivecompassapp.vercel.app/) にアクセスして動作確認してください。
- `GET /` で 404 が出る場合は `app/page.tsx` の配置と Root Directory 設定を確認してください。

### ロールバック手順

Vercel 管理画面 → **Deployments** → 復帰させたいデプロイを選択 → **「Promote to Production」** を実行すると、直前の安定バージョンに即時ロールバックできます。

---

## 8. テスト実行

テストはリポジトリルートから実行します（Node.js が必要）。

### 単体テスト（6 件）

```bash
node 30_test/31_unit/logic/run_unit_tests.js
```

結果は `30_test/31_unit/output/unit_result.txt` に出力されます。

### 結合テスト（14 件）

```bash
node 30_test/32_integration/logic/run_integration_tests.js
```

結果は `30_test/32_integration/output/integration_result.txt` に出力されます。

### システムテスト（15 件）

```bash
node 30_test/33_system/logic/run_system_tests.js
```

結果は `30_test/33_system/output/system_result.txt` に出力されます。

### テスト結果サマリ（v110 時点）

| テスト種別 | 件数 | 結果 |
| --- | --- | --- |
| 単体テスト | 6 / 6 | 全 PASS |
| 結合テスト | 14 / 14 | 全 PASS |
| システムテスト | 15 / 15 | 全 PASS |
| **合計** | **35 / 35** | **全 PASS** |

---

## 9. 未解決課題・今後の予定

### 現バージョン（v110）の既知制約

| # | 課題 | 影響 | 回避策・次アクション |
| --- | --- | --- | --- |
| 1 | **デモ固定値を使用**（距離 150 km・120 分・170 円/L） | 実際の経路・燃料価格が反映されない | 次差分で Google Maps API 連携を実装。現時点はデモ表示として運用 |
| 2 | **feature-flags が Phase1 固定** | フェーズ切替が手動設定不可 | 次差分で DB/環境変数連携を実装。現時点は Phase1 機能セットで固定運用 |
| 3 | **Supabase 環境変数未設定時に実行時エラー** | `.env.local` 未整備環境で起動不可 | Vercel 管理画面または `.env.local` に必須変数を設定してから起動する |

### 今後の開発ロードマップ

| フェーズ | 内容 |
| --- | --- |
| Phase 1（現在） | 出発地・目的地入力 → 所要時間・高速料金の表示（デモ値） |
| Phase 2 | Google Maps API 連携による実データ対応 |
| Phase 3 | 3地点ガソリン価格比較の動的取得 |
| Phase 4 | 差額の体験価値換算（食事・観光スポット等との連携） |

---

## ライセンス

本プロジェクトはプライベートリポジトリです。無断転載・再配布を禁じます。