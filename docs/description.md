# VSCode Plugin 詳細仕様書

## プラグイン名
Markdown Dynamic File Include Preview

## 概要
Markdownファイル (`.md`) 内の特殊キー（例: `{{ ファイル名 }}`）を検出し、そのキーに対応するファイルが存在する場合、そのファイルの内容で置換した結果をPreview表示する。

## 対象ファイル
- `.md`（Markdown形式）のファイルのみ

## 特殊キーのフォーマット
- `{{ ファイル名 }}`
- 例: `{{ test.md }}`
- 空白の有無は許容するが、基本は空白1つまでとする（例: `{{test.md}}` も許容）。

## 機能詳細

### 1. 特殊キーの検出と認識
- エディタ内のMarkdownファイルを開くまたは編集すると、自動的にファイル内の特殊キーを検索。
- 正規表現パターンによる検出:
```regex
\{\{\s*(.+?)\s*\}\}
```

### 2. 対応ファイルの確認
- 特殊キー内に記述されたファイル名が、現在開いているMarkdownファイルと同じディレクトリ内に存在するかを確認。

### 3. ファイル内容による置換
- 存在する場合は、そのファイルの内容を読み取り、特殊キーの部分をファイル内容に置換。
- 存在しない場合は、警告またはエラー文をプレビュー内に表示。

### 4. Preview表示
- 表示中のファイルがMarkdownファイルの場合のみ、エディター右上にPreviewボタンを設置。
- Previewボタンがクリックされると、エディターの右横にPreviewを新しいタブまたはパネルとして表示。
- Markdown以外のファイルの場合はPreview表示および置換は行わない。

## UI仕様
- VSCodeの標準Markdown Previewと同様の見た目を採用。
- Previewエリアには、MarkdownをHTMLにレンダリングした結果を表示。
- ファイルが存在しない場合は、赤字または警告色で「`[ファイル名]が存在しません`」と表示。
- PreviewボタンはMarkdownファイルの場合のみエディター右上に表示される。

## 設定オプション
- プレビューのオン・オフ切り替え（デフォルト: オン）
- 特殊キーの定義を変更可能（デフォルト: `{{ ファイル名 }}`）

```json
"markdownDynamicInclude.enablePreview": true,
"markdownDynamicInclude.pattern": "\\{\\{\\s*(.+?)\\s*\\}\\}"
```

## エラー処理
- 対応ファイルが存在しない場合や読み込みに失敗した場合、Preview内でユーザーにわかりやすいエラーメッセージを表示。
- 例:
```
[エラー] "sample.md" は存在しません。
```

## 推奨する実装技術
- TypeScript
- VSCode Extension API
- Markdown-itライブラリを用いたレンダリング

## プロジェクト構成
```
markdown-dynamic-include/
├── package.json
├── src/
│   ├── extension.ts
│   └── previewProvider.ts
├── tsconfig.json
└── README.md
```

## 拡張可能性
将来的に以下のような機能を追加可能:
- 複数階層に対応したファイル参照
- Markdown以外のファイルフォーマットへの対応
- GitHubなど外部ソースからのファイル取得

