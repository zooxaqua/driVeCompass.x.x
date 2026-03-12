# release

## 1. 目的
本書は、ドライブ・コンパスの各開発フェーズにおいてリリース可否を判定し、利用者向け/運用向けのリリース情報と未解決課題を整理することを目的とする。

- **v100（new）**: 初回リリース。基本ドメイン機能（3ルート比較・3地点価格・体験価値換算・段階導入）の品質証跡を確認し Go 判定。
- **v110（delta）**: Next.js App Router 標準構成への移行・Vercel デプロイ対応の差分リリース。ITC-12〜14、STC-13〜15 を追加実施し、全件 PASS を確認して Go 判定。

## 2. 入力
- 要件定義: [20_project/21_document/requirements/requirements.md](20_project/21_document/requirements/requirements.md)
- 結合テスト: [20_project/21_document/integration-test/integration-test.md](20_project/21_document/integration-test/integration-test.md)
- システムテスト: [20_project/21_document/system-test/system-test.md](20_project/21_document/system-test/system-test.md)
- 実装: [20_project/21_document/implementation/implementation.md](20_project/21_document/implementation/implementation.md)
- 差分起点バージョン: v100 → v110（00_request/minutes_v110.md）
- 判定日: 2026-03-12
- 開発モード: delta

## 3. 全体構成
- リリース判定（v110 delta）: 可（Go）
- 判定観点:
  - 要件充足状況（REQ-01〜REQ-13 の充足可否。REQ-12・REQ-13 は v110 追加）
  - テスト実施率（結合テスト 14/14、システムテスト 15/15、単体テスト 6/6）
  - 未解決課題の影響評価と回避策の有無
  - デプロイ環境（Vercel）の構成要件充足状況
- 出力対象:
  - 利用者向けリリースノート草案
  - 運用向けリリースノート草案（Vercel デプロイ手順含む）
  - 次工程への引き継ぎ事項

## 4. 詳細

### 4.1 リリース判定

#### v110 delta 判定
- **判定: 可（Go）**
- 判定理由（要約）:
  - v110 差分要件（REQ-12: Vercel デプロイ構成、REQ-13: Next.js App Router 標準構成）に対応するテストケース ITC-12〜14・STC-13〜15 を全件追加実施し、全件 PASS を確認した。
  - 単体テスト 6/6 PASS（delta 追加後も回帰なし）。
  - 結合テスト 14/14 PASS（実施率 100%）。
  - システムテスト 15/15 PASS（実施率 100%）。
  - リリース判定を阻害する重大未解決課題なし。既知の制約事項はすべて回避策あり。

#### v100 new 判定（参考・変更なし）
- 判定: 可（Go）（2026-03-12 確定済み）
- 結合テスト 11/11 PASS、システムテスト 12/12 PASS で Go 判定確定。

### 4.2 判定根拠

#### 要件充足
| 区分 | Req-ID | 充足状況 |
| --- | --- | --- |
| v100 継続要件 | REQ-01〜REQ-11 | 充足（ITC-01〜11、STC-01〜12 全件 PASS） |
| v110 追加要件 | REQ-12（Vercel デプロイ構成） | 充足（ITC-12、STC-13 PASS） |
| v110 追加要件 | REQ-13（App Router 標準構成） | 充足（ITC-12〜14、STC-14〜15 PASS） |

#### テスト実施率
| テスト種別 | v100 (new) | v110 delta 追加 | 合計 | 実施率 | 全件合否 |
| --- | --- | --- | --- | --- | --- |
| 単体テスト | 6 件 | — | 6/6 | 100% | 全 PASS |
| 結合テスト | 11 件 | 3 件（ITC-12〜14） | 14/14 | 100% | 全 PASS |
| システムテスト | 12 件 | 3 件（STC-13〜15） | 15/15 | 100% | 全 PASS |
| **総合** | — | — | **35/35** | **100%** | **全 PASS** |

#### 不具合検出状況
- 不具合: 0 件（v110 delta 範囲において検出なし）

### 4.3 未解決課題（正常系/異常系）

#### v110 既知制約（リリース判定を阻害しない）
| No. | 課題内容 | 影響 | 回避策 / 次アクション |
| --- | --- | --- | --- |
| 1 | デモ固定値使用中（距離 150 km・120 分・170 円/L） | 実際の経路・燃料価格が反映されない | 次差分で Google Maps API 連携を実装。現時点はデモ表示として運用 |
| 2 | feature-flags は Phase1 固定 | フェーズ切替が手動設定不可 | 次差分で DB/環境変数連携を実装。現時点は Phase1 機能セットで固定運用 |
| 3 | Supabase 環境変数未設定時は実行時エラー | `.env.local` 未整備環境で起動不可 | デプロイ前に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を Vercel 管理画面または `.env.local` に設定必須 |

#### v100 残課題（変更なし）
- 重大課題なし（全件実施・全件 PASS）。

### 4.4 リスク評価（影響と回避策）
- リスク1: 部分成功契約の不整合
  - 影響: UI 表示と API 応答の不一致により、意思決定に誤りが生じる可能性。
  - 回避策: ITC-07〜09、STC-08〜10 を必須ゲート化し、契約差異を是正する。
- リスク2: 再試行導線の反映漏れ
  - 影響: 利用者が復旧操作後も古い情報を参照する可能性。
  - 回避策: ITC-05、STC-05、STC-12 で更新対象セグメントの差分反映を検証済み。
- リスク3: feature flag 境界の表示不整合
  - 影響: フェーズ機能の誤表示により運用事故を誘発する可能性。
  - 回避策: Phase1 固定運用のため現時点では境界不整合が発生しない。DB 連携時に境界マトリクスを再検証する。
- リスク4: ログ追跡性不足
  - 影響: 障害発生時の原因特定遅延、復旧時間増大。
  - 回避策: requestId/traceId 突合手順を固定化し、STC-12 で証跡を取得済み。
- リスク5（v110 追加）: 環境変数未設定による起動失敗
  - 影響: Supabase 接続 URL/キー未設定環境でアプリが実行時エラー。
  - 回避策: Vercel 管理画面で必須変数を設定する運用手順を徹底する。ローカルは `.env.local` を整備する。

### 4.5 リリースノート草案

#### 利用者向け（草案）
- **v110 アップデート（2026-03-12）**
  - フロントエンドの配信基盤を Vercel に対応しました。
  - アプリの読み込み速度・可用性が向上しました。
  - 3ルート比較・3地点価格比較・差額の体験価値表示はすべて継続提供しています。
  - 全件テスト（35/35 PASS）により品質確認済みです。
- **注意**: 現バージョンはデモ固定値（150 km・120 分・170 円/L）を使用しています。実際の経路データとの連携は次バージョンで提供予定です。

#### 運用向け（草案）
- リリース判定: **Go**（v100 継続 + v110 delta）
- ゲート達成:
  - 単体テスト 6/6 実施、全件 PASS
  - 結合テスト 14/14 実施、全件 PASS（ITC-12〜14 追加）
  - システムテスト 15/15 実施、全件 PASS（STC-13〜15 追加）
- Vercel デプロイ設定:
  - 対象環境: Preview / Production
  - Root Directory: `20_project/22_src`
  - Framework Preset: Next.js（自動検出）
  - 必須環境変数: `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`（Vercel 管理画面で設定）
  - ローカル: `20_project/22_src/.env.local` を手動作成（Git 管理外）
- 継続監視項目:
  - 次回差分開発時は ITC/STC フルマトリクスを再実施すること
  - Google Maps API 連携実装後、ITC/STC に実データ検証ケースを追加すること

### 4.6 再実施エビデンス（2026-03-12、v110 delta）

#### v110 追加成果物（App Router 標準構成）
- `20_project/22_src/app/page.tsx`
- `20_project/22_src/app/layout.tsx`
- `20_project/22_src/app/globals.css`
- `20_project/22_src/app/api/comparisons/route.ts`
- `20_project/22_src/app/api/feature-flags/route.ts`
- `20_project/22_src/lib/routeLogic.ts`
- `20_project/22_src/lib/viewModel.ts`
- `20_project/22_src/lib/supabaseClient.ts`
- `20_project/22_src/next.config.js`
- `20_project/22_src/package.json`
- `20_project/22_src/tsconfig.json`

#### v100 既存成果物（回帰確認済み）
- `20_project/22_src/front/view_model.js`
- `20_project/22_src/back/route_logic.js`

#### テスト実行結果
| テスト種別 | 実行スクリプト | 結果 |
| --- | --- | --- |
| 単体テスト | `30_test/31_unit/logic/run_unit_tests.js` | **6 pass / 0 fail** |
| 結合テスト | `30_test/32_integration/logic/run_integration_tests.js` | **14 pass / 0 fail** |
| システムテスト | `30_test/33_system/logic/run_system_tests.js` | **15 pass / 0 fail** |

#### 判定補足
- 実体成果物ゲート（`22_src` 配下 App Router 必須ファイル群の存在）は達成。
- ITC-12〜14 の結合テスト追加分（IF-06, IF-07, IF-08）および STC-13〜15 のシステムテスト追加分（REQ-12, REQ-13）を全件消化し、delta リリース判定を **Go** とする。

## 5. 差分（delta: v100 → v110）

### 5.1 変更点サマリ
| 区分 | 変更内容 | 対応 Req-ID |
| --- | --- | --- |
| ディレクトリ構成追加 | `20_project/22_src/app/` ディレクトリに App Router 標準構成を追加 | REQ-13 |
| API ルートハンドラ追加 | `app/api/comparisons/route.ts`・`app/api/feature-flags/route.ts` を追加 | REQ-13 |
| ライブラリ追加 | `lib/routeLogic.ts`・`lib/viewModel.ts`・`lib/supabaseClient.ts` を追加 | REQ-12, REQ-13 |
| Next.js 設定ファイル追加 | `next.config.js`・`package.json`・`tsconfig.json` を `22_src/` 直下に配置 | REQ-12 |
| デプロイ先追加 | Vercel Root Directory = `20_project/22_src`、Framework Preset = Next.js | REQ-12 |
| 環境変数管理追加 | Vercel 管理画面 / `.env.local`（ローカル、Git 管理外）で Supabase 接続情報を管理 | REQ-12 |
| v100 構成の継続 | `front/view_model.js`・`back/route_logic.js` は廃止予定だが v110 段階では残存 | — |

### 5.2 ロールバック観点
- Vercel では直前の安定デプロイへの即時ロールバックが可能（Vercel 管理画面 → Deployments → 当該デプロイを "Promote to Production" で復帰）。
- feature flags が Phase1 固定のため、ロールバック後もフェーズ設定の巻き戻しは不要。
- Supabase 接続情報変更時は環境変数のみ更新すれば足りる。コード変更は不要。

### 5.3 delta テスト追加一覧
| ID | テスト種別 | テストケース名 | 対応 Req-ID | 結果 |
| --- | --- | --- | --- | --- |
| ITC-12 | 結合 | Next.js 必須ファイル存在確認 | REQ-12, REQ-13 | PASS |
| ITC-13 | 結合 | routeLogic API ルートハンドラ統合 | REQ-13 | PASS |
| ITC-14 | 結合 | viewModel 変換統合 | REQ-13 | PASS |
| STC-13 | システム | Vercel デプロイ前提チェック | REQ-12 | PASS |
| STC-14 | システム | App Router 標準構成チェック | REQ-13 | PASS |
| STC-15 | システム | ロジックライブラリ存在 + buildRouteComparisons 戻り値検証 | REQ-12, REQ-13 | PASS |

## 6. 課題・リスク

### 6.1 v110 既知制約（次差分対応予定）
- 課題1: デモ固定値の使用
  - 内容: 距離 150 km・120 分・170 円/L はハードコードされたデモ値。
  - 影響: 実ユーザーの経路情報が反映されない。
  - 回避策: 現時点はデモ表示として運用する。次差分で Google Maps API 連携を実装する。
- 課題2: feature-flags の Phase1 固定
  - 内容: feature-flags は現在 Phase1 固定で、DB/環境変数による動的切替が未実装。
  - 影響: フェーズ拡張機能（Phase2〜4）が有効化できない。
  - 回避策: Phase1 機能セットでの固定運用を継続する。次差分で DB/環境変数連携を実装する。
- 課題3: Supabase 環境変数未設定時の実行時エラー
  - 内容: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` が未設定の場合、起動時に実行時エラーが発生する。
  - 影響: 環境変数未整備の開発環境・ステージング環境で起動不可。
  - 回避策: Vercel デプロイ前に管理画面での環境変数設定を必須工程とする。ローカル開発では `.env.local` を整備する。

### 6.2 継続運用の課題
- 課題4: 回帰運用の継続
  - 内容: 次回差分開発でも ITC/STC 全件実行ルールを維持する。
  - 影響: 未実施が発生すると release 開始不可となる。

## 7. 次工程への引き継ぎ

### 7.1 次差分（Google Maps API 連携）
- 優先度: 高
- 内容: デモ固定値（距離・時間・燃料価格）を実際の Google Maps API データに置き換える。
- 対応ファイル: `lib/routeLogic.ts`、`app/api/comparisons/route.ts`
- 追加すべきテスト: ITC/STC への実データ検証ケース（Google Maps API モック含む）

### 7.2 次差分（feature-flags DB/環境変数連携）
- 優先度: 中
- 内容: feature-flags の Phase 設定を DB または環境変数で動的管理できるようにする。
- 対応ファイル: `app/api/feature-flags/route.ts`、`lib/supabaseClient.ts`

### 7.3 即時アクション（v110 リリース作業）
1. Vercel プロジェクトの Root Directory を `20_project/22_src` に設定する。
2. Vercel 管理画面で `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定する。
3. Preview デプロイで到達性を確認後、Production へ昇格させる。
4. リリース後の監視でエラー発生率・再試行率を確認する。

### 7.4 ロールバック方針
- Vercel の Deployments 一覧から直前の安定デプロイを "Promote to Production" で即時復帰可能。
- 環境変数のみの変更はコードデプロイ不要で即時反映可能。
- feature flags が Phase1 固定のため、ロールバック後のフェーズ設定の巻き戻しは不要。

### 7.5 再判定ゲート
- 次差分（Google Maps API 連携・feature-flags DB 連携）完了後に ITC/STC フルマトリクスを再実施し、release 再判定を行う。

## 8. 実行記録

- 実行モード: delta
- 実行種別: v100 → v110 差分更新
- 差分起点: 00_request/minutes_v110.md（Next.js App Router 標準構成への移行・Vercel デプロイ対応）
- 前工程参照:
  - 20_project/21_document/requirements/requirements.md（REQ-12, REQ-13 追加確認）
  - 20_project/21_document/integration-test/integration-test.md（ITC-12〜14 追加確認）
  - 20_project/21_document/system-test/system-test.md（STC-13〜15 追加確認）
  - 20_project/21_document/implementation/implementation.md
- テスト実施結果:
  - 単体テスト 6/6 PASS
  - 結合テスト 14/14 PASS（ITC-12〜14 追加、実施率 100%）
  - システムテスト 15/15 PASS（STC-13〜15 追加、実施率 100%）
- 判定: **完了（Go）**
  - release 文書を delta モードで更新。実施率・未解決課題・Vercel デプロイ手順・ロールバック観点を根拠付きで反映。