# Tuning Checklist

既存のエージェントカスタマイズを改善するときに使うチェックリストです。

- Description に、ユーザーが実際に入力する具体的な trigger phrases が含まれている。
- Agent の責務が単一で、境界が明確である。
- Tools が最小構成で、実タスクに整合している。
- Frontmatter が有効な YAML で、引用符が正しい。
- Agent 名と Prompt 名の参照が一致している。
- Skill の `name` がフォルダ名と一致している。
- 出力形式が明示され、ぶれない。
- 再利用可能なロジックが skill assets に集約され、重複していない。
- パスが `.github/agents`、`.github/prompts`、`.github/skills`、`.github/instructions` に従っている。
