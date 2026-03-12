---
name: drivecompass-domain
description: "ドライブ・コンパス案件の専門情報を提供します。Use for domain constraints, route comparison rules, fuel-price strategy, and phased delivery hints."
argument-hint: "参照したい工程と検討対象（ルート、料金、ガソリン、UXなど）"
user-invocable: true
---
# DriveCompass Domain

本 skill は本案件特有の専門情報を集約します。エージェント本体は汎用に保ち、ドメイン知識はこの skill を参照して適用します。

## ドメイン要件の核
- レジャー向けに「時間効率」と「節約」を比較可能にする。
- 3パターンのルートを比較する。
  - 最速
  - 賢く節約（部分高速）
  - 完全節約（全下道）
- 出発地/途中/到着地のガソリン価格を可視化する。
- 差額を体験価値に変換して提示する。

## 推奨技術スタック
- Frontend: Next.js (React)
- Backend: Supabase

## 段階導入の推奨順
1. MVP: 目的地入力 + 所要時間 + 高速代
2. ガソリン代概算の追加
3. 地点別ガソリン価格比較の追加
4. 差額の使い道提案の追加

## 参照リソース
- [domain checklist](./assets/domain-checklist.md)
- [mode policy](./assets/new-vs-delta-policy.md)
