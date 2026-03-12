# basic-design

## 1. 目的
本書は、要件定義で整理されたReq-IDを基に、ドライブ・コンパスのシステム全体構成、責務分担、主要インターフェース、正常系および異常系の処理方針を定義する基本設計成果物である。

v100（new）では3ルート比較・3地点ガソリン価格・差額の体験価値化・段階導入方針を一貫した設計として定義した。v110（delta）では、ソースコード配置を Next.js App Router 標準構成（`app/`・`components/`・`lib/`）へ刷新し、Vercel をデプロイ環境として確立する差分設計（DES-13〜DES-15）を追加する。既存ドメイン設計（DES-01〜DES-12）への機能的変更はない。

## 2. 入力
- 要件定義（継続）: 20_project/21_document/requirements/requirements.md（REQ-01〜REQ-11）
- 要件定義（差分）: 20_project/21_document/requirements/requirements.md（REQ-12・REQ-13、v110追加）
- 元要求（新規）: 00_request/minutes_v100.md
- 元要求（差分）: 00_request/minutes_v110.md
- 既存基本設計（差分起点）: 本書 v100 版（DES-01〜DES-12）
- 開発モード: delta（v100 → v110）
- 技術方針: フロントエンド Next.js App Router、バックエンド Next.js API Routes（将来拡張: Supabase Edge Functions）
- デプロイ先: Vercel（Root Directory = `20_project/22_src`）
- 設計前提: レジャー向けに時間効率と移動コスト節約を同時比較できること

## 3. 全体構成
### 3.1 システム構成図（文章定義）
- 利用者は Vercel にホストされた Next.js（App Router）製 Web 画面から、出発地・到着地・車両燃費などの条件を入力する。
- `app/page.tsx`（トップページ）がフォームと表示ロジックを担い、入力完了後は `app/api/comparisons/route.ts`（`POST /api/comparisons`）を呼び出す。
- Route Handler は比較計算ロジックを実行し、必要に応じて外部 API（ルート、料金、ガソリン価格）を呼び出してデータを集約する。Supabase DB は将来拡張として接続準備を維持する（`lib/supabaseClient.ts`）。
- Route Handler は取得済みデータと未取得データを区別して標準レスポンスへ正規化し、3ルート比較結果と補足メッセージを Next.js クライアントへ返却する。
- `app/page.tsx` および `components/` 上のコンポーネントは返却結果を比較カード、3地点価格表示、差額体験価値表示として描画し、未取得項目や再試行導線を UI 上に反映する。
- 環境変数は `.env.local`（ローカル開発）と Vercel Environment Variables（本番）の二重管理とし、Git 管理外を維持する。

### 3.2 FE/BE責務分担
- フロントエンド（Next.js pages/components: `app/`・`components/`）の責務
  - 入力フォームの提供、入力バリデーション（必須・形式）
  - 比較表示 UI（最速/賢く節約/完全節約の3カード）
  - 3地点価格、差額体験価値、未取得表示、再試行導線の描画
  - フェーズごとの機能表示制御（`GET /api/feature-flags` から取得したフラグで制御）
- バックエンド（Next.js API Routes: `app/api/`）の責務
  - ルート比較計算のオーケストレーション（時間・料金・燃料・合計コスト）
  - 外部 API 連携（ルート、料金、ガソリン価格）とタイムアウト/再試行制御
  - 欠損データを含む場合の部分成功レスポンス生成
  - 差額計算と体験価値換算メッセージ生成
  - 監査ログ/障害ログの記録と運用向けメタ情報の付与
- 将来拡張（Supabase）
  - Supabase DB への永続化・キャッシュ（`lib/supabaseClient.ts` より接続）
  - Supabase Edge Functions への業務ロジック移管（フェーズ拡張時に検討）

### 3.3 主要データフロー
- フロー1（比較実行）: 入力受領（`app/page.tsx`）→ 入力妥当性確認 → `POST /api/comparisons`（Route Handler）→ ルート候補取得 → 料金取得 → 燃料費算出 → 合計コスト算出 → 3ルート比較結果返却
- フロー2（価格比較）: 3地点候補特定 → 価格 API 取得（出発地/途中/到着地）→ 地点別価格整形 → 給油判断メッセージ生成
- フロー3（体験価値化）: ルート間差額算出 → 体験換算マスタ参照 → 差額メッセージ生成（ゼロ/負値は専用ルール適用）
- フロー4（部分成功）: 外部 API 失敗検出 → 失敗項目を未取得化 → 算出可能項目のみ返却 → UI で継続表示
- フロー5（フラグ取得）: ページ初期化時 → `GET /api/feature-flags` → フェーズ設定値取得 → 表示制御反映

## 4. 詳細
### 4.1 設計項目一覧（DES-IDとReq-IDトレース）
| DES-ID | 設計項目 | 対応Req-ID | 設計要点 | v110変更 |
| --- | --- | --- | --- | --- |
| DES-01 | 3ルート比較ユースケース設計 | REQ-01, REQ-02, REQ-03 | 最速/賢く節約/完全節約を同一レスポンスモデルで扱い、時間・料金・燃料・合計を比較可能にする。 | 変更なし |
| DES-02 | ルート種別判定ルール設計 | REQ-02 | 高速優先、部分高速、高速不使用の判定条件をバックエンドで一元管理し、フロントは表示ラベルのみ保持する。 | 変更なし |
| DES-03 | 3地点ガソリン価格設計 | REQ-04 | 出発地/途中/到着地の価格取得を独立処理とし、地点単位で成功/失敗を保持する。 | 変更なし |
| DES-04 | 差額体験価値換算設計 | REQ-05 | 差額金額を体験カテゴリに変換するルールを定義し、差額ゼロ/負値時の抑止文言を規定する。 | 変更なし |
| DES-05 | 段階導入フラグ設計 | REQ-06 | フェーズ1〜4の機能可否を設定値で制御し、同一画面で段階的に機能拡張できる構成とする。`GET /api/feature-flags` で取得。 | エンドポイント明確化 |
| DES-06 | 入力バリデーション設計 | REQ-07 | 未入力・不正形式をフロントで早期検知し、バックエンドでも再検証して不正リクエストを拒否する。 | 変更なし |
| DES-07 | 外部API障害時の継続設計 | REQ-08, REQ-09, REQ-10 | API単位のタイムアウト、再試行、部分成功レスポンスを標準化し、処理全体停止を回避する。 | 変更なし |
| DES-08 | 未取得データ表現設計 | REQ-09 | 数値項目はnull許容、状態コードを付与し、UIで「未取得」表示へ確実に変換できる契約を定義する。 | 変更なし |
| DES-09 | 再試行導線設計 | REQ-10 | 失敗項目別に再試行可能なAPIを識別し、ユーザー操作で再実行できる導線を定義する。 | 変更なし |
| DES-10 | トレーサビリティ管理設計 | REQ-11 | Req-ID、DES-ID、次工程の詳細設計IDを対応表で維持し、テスト観点へ連携する。 | 変更なし |
| DES-11 | FE表示コンポーネント分割設計 | REQ-01, REQ-03, REQ-04, REQ-05 | `components/` 配下に RouteComparisonCards・FuelPricePanel 等を分離し、異常系でも部分描画を継続する。 | 配置先を `components/` に更新 |
| DES-12 | BEデータ統合API設計 | REQ-01〜REQ-11 | 単一の比較実行API（`POST /api/comparisons`）で正常系と異常系の統一レスポンスを返し、フロントの分岐複雑度を抑制する。 | エンドポイントパスを明確化 |
| DES-13 | Vercel デプロイ構成設計 | REQ-12 | Vercel の Root Directory を `20_project/22_src` に設定し、他フォルダ（ドキュメント・テスト）と共存。Framework Preset: Next.js（自動認識）、Build Command: `next build`、Output Directory: `.next`。環境変数は `.env.local`（ローカル, Git管理外）と Vercel Environment Variables の二重管理。 | **新規（v110）** |
| DES-14 | Next.js App Router 標準構成設計 | REQ-13 | `app/layout.tsx`（共通レイアウト）・`app/page.tsx`（トップページ）・`app/api/comparisons/route.ts`（POST）・`app/api/feature-flags/route.ts`（GET）・`components/`（UIパーツ）・`lib/supabaseClient.ts`（Supabase初期化）で構成する。 | **新規（v110）** |
| DES-15 | 旧 front/back 構成廃止方針 | REQ-13 | `22_src/front/view_model.js` の責務を `app/page.tsx`・`components/` に移行。`22_src/back/route_logic.js` の責務を `app/api/comparisons/route.ts` に移行。旧ディレクトリは廃止する。 | **新規（v110）** |

### 4.2 正常系方針
- 正常系N-1（3ルート比較）
  - 条件: 出発地・到着地が妥当で、外部APIが必要データを返却する。
  - 方針: `app/api/comparisons/route.ts` で3ルートの時間・料金・燃料・合計を算出し、`app/page.tsx`で横並び比較表示する。
  - 対応: DES-01, DES-02, DES-11, DES-12, DES-14。
- 正常系N-2（3地点価格表示）
  - 条件: 3地点すべての価格データが取得できる。
  - 方針: 地点別価格と価格差に基づく給油判断メッセージを表示する。
  - 対応: DES-03, DES-11, DES-12, DES-14。
- 正常系N-3（差額体験価値表示）
  - 条件: 差額算出と換算マスタ参照が成功する。
  - 方針: 差額金額と体験価値文言を同時表示し、節約効果を意思決定可能な形で提示する。
  - 対応: DES-04, DES-11, DES-12, DES-14。
- 正常系N-4（段階導入運用）
  - 条件: `GET /api/feature-flags` によるフェーズ設定が適切に適用される。
  - 方針: MVP機能を維持しつつ、フェーズ2以降の機能を無停止で追加できる構成にする。
  - 対応: DES-05, DES-10, DES-14。
- 正常系N-5（Vercel デプロイ成功）
  - 条件: Root Directory = `20_project/22_src`、`app/page.tsx` が存在する。
  - 方針: Vercel が Next.js を自動認識し `next build` が成功、`/` アクセスで `app/page.tsx` を正常表示する。
  - 対応: DES-13, DES-14。
- 正常系N-6（環境変数連携）
  - 条件: `NEXT_PUBLIC_SUPABASE_URL`・`NEXT_PUBLIC_SUPABASE_ANON_KEY` が `.env.local` または Vercel Environment Variables に設定済み。
  - 方針: `lib/supabaseClient.ts` が環境変数を読み込み、Supabase に正常接続できる。
  - 対応: DES-13, DES-14。

### 4.3 異常系方針
- 異常系E-1（入力不備）
  - 事象: 出発地/到着地未入力、形式不正。
  - 方針: フロントで即時エラー表示し、バックエンド呼び出しを抑止する。バックエンド到達時は400系で理由を返却する。
  - 対応: DES-06。
- 異常系E-2（ルートAPI失敗/タイムアウト）
  - 事象: ルート取得失敗、応答遅延。
  - 方針: 規定回数再試行後、ルート関連項目を未取得として返却し、再試行導線を表示する。
  - 対応: DES-07, DES-08, DES-09, DES-12。
- 異常系E-3（料金API失敗）
  - 事象: 高速料金取得失敗。
  - 方針: 時間・燃料など算出可能項目は表示継続し、料金は未取得表示とする。
  - 対応: DES-07, DES-08, DES-11, DES-12。
- 異常系E-4（ガソリン価格API部分失敗）
  - 事象: 3地点のうち一部のみ取得成功。
  - 方針: 成功地点のみ表示し、失敗地点は未取得表示とする。給油メッセージは利用可能データのみで生成する。
  - 対応: DES-03, DES-07, DES-08, DES-11, DES-12。
- 異常系E-5（体験価値換算不可）
  - 事象: 換算マスタ未取得、差額ゼロ/負値。
  - 方針: 差額金額のみ表示し、換算文言は抑止または非推奨メッセージに切り替える。
  - 対応: DES-04, DES-08, DES-11, DES-12。
- 異常系E-6（環境変数未設定）
  - 事象: `NEXT_PUBLIC_SUPABASE_URL` または `NEXT_PUBLIC_SUPABASE_ANON_KEY` が未設定。
  - 方針: Supabase 接続処理は失敗し、利用者に接続エラーを通知。開発者ログに環境変数未設定を出力する。
  - 対応: DES-13, DES-14。
- 異常系E-7（Vercel ビルド失敗）
  - 事象: `app/page.tsx` 不在または `package.json` に必須依存が不足。
  - 方針: Vercel ビルドエラーとして検知可能にし、404 を本番環境に露出させない。デプロイ前チェックリストで事前検証する。
  - 対応: DES-13, DES-14, DES-15。

### 4.4 外部API連携設計（失敗時設計含む）
- 連携対象
  - ルートAPI: 走行時間、距離、候補経路
  - 料金API: 高速料金
  - ガソリン価格API: 3地点価格
- 共通失敗時設計
  - タイムアウト値をAPI種別ごとに定義し、最大再試行回数を超過した場合は部分成功として返却する。
  - 失敗情報は項目単位で保持し、レスポンスに失敗種別（timeout、unavailable、invalid）を付与する。
  - 障害時もHTTPレベルは業務継続可能な結果を返し、画面は算出可能項目を表示する。
  - 利用者操作で再試行可能な導線を提供し、再実行時は失敗項目のみ優先更新する。

### 4.5 段階導入方針（MVPから拡張）
- フェーズ1（MVP）
  - 対象: 出発地/到着地入力、所要時間、高速料金表示。
  - 主対応DES: DES-01, DES-02, DES-06, DES-12, DES-13, DES-14。
- フェーズ2
  - 対象: 推定ガソリン代追加、合計移動コスト精度向上。
  - 主対応DES: DES-01, DES-07, DES-12, DES-14。
- フェーズ3
  - 対象: 3地点ガソリン価格比較、給油判断メッセージ。
  - 主対応DES: DES-03, DES-07, DES-08, DES-11, DES-14。
- フェーズ4
  - 対象: 差額の体験価値化。
  - 主対応DES: DES-04, DES-05, DES-11, DES-14。

## 5. 差分（delta のみ）
### 5.1 差分概要
- 差分起点: v100（new）→ v110（delta）
- 差分内容: `22_src` ディレクトリ構成の変更（独自構成 → Next.js App Router 標準構成）＋ Vercel デプロイ設計の追加
- 変更種別: ディレクトリ構成刷新・デプロイ環境追加・旧構成廃止方針策定

### 5.2 変更対照表

| 設計項目 | v100（変更前） | v110（変更後） | 変更理由 |
|---------|--------------|--------------|---------|
| FE ソース配置 | `22_src/front/` | `22_src/app/`（App Router 標準） | Next.js App Router 準拠 |
| BE ソース配置 | `22_src/back/` | `22_src/app/api/`（Route Handler） | App Router API 規約準拠 |
| UI パーツ配置 | 未整理（`front/` 内） | `22_src/components/` | 再利用性向上・責務分離 |
| ユーティリティ配置 | 未整理（`back/` 内） | `22_src/lib/` | Supabase 接続等の共通化 |
| デプロイ先 | 未定義 | Vercel（Root Directory: `20_project/22_src`） | REQ-12 対応 |
| 環境変数管理 | 未定義 | `.env.local`（ローカル）/ Vercel Environment Variables（本番） | セキュアな認証情報管理 |
| TypeScript 設定 | なし | `tsconfig.json` | App Router 型安全性確保 |
| Next.js 設定 | なし | `next.config.js` | ビルド設定の明示化 |
| FE/BE インターフェース | 未定義 | `POST /api/comparisons`・`GET /api/feature-flags` | API エンドポイント確定 |
| Supabase クライアント | なし | `lib/supabaseClient.ts` | 将来拡張への接続準備 |

### 5.3 新規ディレクトリ構成（v110 以降）
```
20_project/22_src/              ← Vercel Root Directory
  app/
    layout.tsx                  # 全ページ共通レイアウト（HTMLBody ラッパー）
    page.tsx                    # トップページ（/ アクセス）← view_model.js 移行先
    globals.css
    api/
      comparisons/
        route.ts                # POST /api/comparisons ← route_logic.js 移行先
      feature-flags/
        route.ts                # GET /api/feature-flags
  components/                   # 再利用UIパーツ（RouteComparisonCards, FuelPricePanel 等）
  lib/
    supabaseClient.ts           # Supabase 接続設定（将来拡張）
  public/                       # 静的ファイル
  .env.local                    # ローカル用環境変数（Git管理外）
  next.config.js
  package.json
  tsconfig.json
```

### 5.4 廃止事項（v110 で削除）
| 廃止ファイル/ディレクトリ | 移行先 | 対応DES |
|------------------------|--------|--------|
| `22_src/front/view_model.js` | `app/page.tsx`・`components/` | DES-15 |
| `22_src/back/route_logic.js` | `app/api/comparisons/route.ts` | DES-15 |
| `22_src/front/`（ディレクトリ） | `app/`・`components/` | DES-15 |
| `22_src/back/`（ディレクトリ） | `app/api/` | DES-15 |

### 5.5 既存設計への影響（DES-01〜DES-12）
| DES-ID | 影響 | 内容 |
|--------|------|------|
| DES-01〜DES-04 | 影響なし | ドメインロジック設計は変更なし |
| DES-05 | エンドポイント明確化 | フラグ取得 API を `GET /api/feature-flags` として確定 |
| DES-06〜DES-10 | 影響なし | バリデーション・障害対応・トレーサビリティは変更なし |
| DES-11 | 配置先更新 | コンポーネント配置先を `components/` に明確化 |
| DES-12 | エンドポイント明確化 | 比較実行 API を `POST /api/comparisons` として確定 |

## 6. 課題・リスク
- 外部API可用性リスク
  - ルート、料金、ガソリン価格APIの停止や仕様変更で比較精度が低下する可能性がある。
- 価格データ鮮度リスク
  - 3地点価格の更新時刻差により、実際の給油価格と乖離する可能性がある。
- 概算表示の認知リスク
  - 高速料金・燃料費が概算である点が十分に伝わらない場合、ユーザー不信につながる可能性がある。
- 体験価値換算の個人差リスク
  - 換算メッセージが利用者属性に合わない場合、提案価値が低下する可能性がある。
- 段階導入時の整合性リスク
  - フェーズ追加時に既存UI/データ契約が崩れると、後方互換性を損なう可能性がある。
- Vercel Root Directory 誤設定リスク【v110追加】
  - Root Directory を `20_project/22_src` 以外に誤設定した場合、ビルドが失敗する。設定値は運用ドキュメントで明文化し、チームに周知する。
- 環境変数漏洩リスク【v110追加】
  - `.env.local` が誤って GitHub にコミットされると Supabase の接続情報が漏洩する。`.gitignore` への追加を必須管理事項とし、pre-commit フックによる検知も検討する。
- Next.js バージョン固定リスク【v110追加】
  - Next.js の破壊的変更（App Router 仕様変更等）により Route Handler や `layout.tsx` の実装が影響を受ける可能性がある。`package.json` でバージョン範囲を明示的に管理する。
- 旧構成ファイル混在リスク【v110追加】
  - `front/`・`back/` ディレクトリが移行完了前に残存すると、実行パスの混乱が生じる。移行完了後に廃止ファイルを削除する手順を詳細設計で定義する。

## 7. 次工程への引き継ぎ
- 詳細設計で確定すべき項目
  - FE詳細設計: `app/page.tsx` 実装仕様、`components/` 各コンポーネント仕様（RouteComparisonCards, FuelPricePanel 等）、未取得表示仕様、再試行UX仕様。
  - BE詳細設計: `POST /api/comparisons` 入出力スキーマ、`GET /api/feature-flags` レスポンス仕様、外部APIアダプタ、再試行ポリシー、ログ設計。
  - データ設計: ルート比較結果スキーマ、地点価格スキーマ、体験価値換算マスタ。
  - デプロイ設計: Vercel 設定ドキュメント（Root Directory・Build Command・Output Directory・環境変数キー一覧）、`.env.local` ローカル設定手順。
  - 移行設計: `view_model.js` → `app/page.tsx`・`components/` 移行手順、`route_logic.js` → `app/api/comparisons/route.ts` 移行手順、旧ディレクトリ削除タイミング。
- テスト観点引き継ぎ
  - 正常系: N-1〜N-6 を結合・システムテスト観点に展開する。
  - 異常系: E-1〜E-7 を単体・結合・システムテストへ展開する。
  - デプロイ検証: ビルド成功・`/` アクセス確認・環境変数注入確認を CI/CD テストに含める。
- トレーサビリティ運用
  - Req-IDとDES-IDの対応を維持し、詳細設計ID、テストケースIDまで連鎖可能な管理表を作成する。
  - v110追加のDES-13〜DES-15はREQ-12・REQ-13と対応づけを維持する。
  - API仕様変更時はDES-07、DES-08、DES-12、DES-14への影響を優先評価する。

## 8. 実行記録
- 実行モード: delta
- 差分バージョン: v100 → v110
- 前工程参照（継続）: 20_project/21_document/requirements/requirements.md（REQ-01〜REQ-11）
- 前工程参照（差分）: 20_project/21_document/requirements/requirements.md（REQ-12・REQ-13）
- 差分起点基本設計: 本書 v100 版（DES-01〜DES-12）
- 追加設計項目: DES-13（Vercel デプロイ構成）、DES-14（Next.js App Router 標準構成）、DES-15（旧構成廃止方針）
- 更新設計項目: DES-05・DES-11・DES-12（エンドポイント/配置先の明確化）
- 変更なし設計項目: DES-01〜DES-04, DES-06〜DES-10
- 判定: 完了（必須見出し確認済み、差分変更対照表含む、DES-13〜DES-15追加、REQ-12・REQ-13トレース確認済み）
