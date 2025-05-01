以下に、AIコーディングアシスタント（例: GitHub CopilotやChatGPTなど）へ入力する際の詳細な指示書を作成しました。これを活用することで、VSCode拡張機能の雛形から実装のポイントまでを自動生成しやすくなります。必要に応じてカスタマイズしてお使いください。

---

# VSCode Plugin AIコーディング用 詳細指示書

このドキュメントは、Markdownファイル内の特殊キー `{{ ファイル名 }}` を検出し、該当ファイルが存在する場合その内容で置換してプレビュー表示するVSCode拡張機能を**TypeScript**で開発するための指示書です。ステップごとにコード生成を依頼することで、効率的に拡張機能を作成できます。

---

## 1. 開発環境の前提

- Node.js (推奨 16以上)
- TypeScript
- VSCode Extension API
- `yo code` などで生成したVSCode拡張機能のテンプレート、または手動でのプロジェクトセットアップ

---

## 2. プロジェクト構成

以下のような構成を想定します。  
*(AIには各ファイルに分割したコード生成を指示します)*

```
markdown-dynamic-include/
├── package.json
├── src/
│   ├── extension.ts
│   ├── previewProvider.ts
│   └── utils.ts
├── tsconfig.json
└── README.md
```

### 各ファイルの役割
- **package.json**  
  VSCode拡張機能としてのメタデータ(名前、バージョン、アクティベーションイベントなど)を定義。
- **extension.ts**  
  拡張機能のエントリーポイント。コマンド登録やアクティベーション・非アクティベーションの処理を行う。
- **previewProvider.ts**  
  独自のMarkdownプレビュー機能を提供するためのクラス。実際に置換やエラーハンドリングを行い、結果をHTMLにしてVSCodeへ表示する。
- **utils.ts**  
  特殊キーの正規表現などの共通処理やファイルパス関連のユーティリティを定義する。
- **tsconfig.json**  
  TypeScriptのコンパイル設定。
- **README.md**  
  拡張機能の使い方や概要を記載。

---

## 3. 仕様まとめ

1. **特殊キーの検出**
   - 正規表現 `\{\{\s*(.+?)\s*\}\}` で、Markdownファイル内の `{{ ファイル名 }}` を探す。

2. **ファイルの確認**
   - 検出したファイル名が、現在開いているMarkdownファイルと同じディレクトリに存在するかチェック。

3. **ファイルの読込と置換**
   - 存在する場合はその内容を読み込む。
   - 存在しない場合は、プレビュー上で警告メッセージを表示。

4. **プレビュー表示**
   - Markdownファイルのみプレビューを有効とし、右上のPreviewボタンからプレビューを表示。
   - VSCode標準のMarkdown Previewと同様の見た目だが、ファイル置換済みのデータを表示する。

5. **設定オプション (package.json)**
   - `"markdownDynamicInclude.enablePreview": true`  
     プレビュー機能をON/OFF切り替え
   - `"markdownDynamicInclude.pattern": "\\{\\{\\s*(.+?)\\s*\\}\\}"`  
     特殊キーの正規表現

6. **エラー処理**
   - ファイルが存在しない場合や読み込みに失敗した場合は、プレビュー内にエラーメッセージを表示。

7. **推奨技術**
   - TypeScript
   - VSCode Extension API
   - [Markdown-it](https://github.com/markdown-it/markdown-it) などのMarkdownレンダリングライブラリ

---

## 4. AIコーディング 依頼例

下記ステップを順にAIへ依頼することで、コードの断片を生成・完成させていくことを推奨します。

### 4.1. package.json の生成

#### 指示テンプレート

> **指示例**:  
> 「VSCode拡張機能としての`package.json`を生成してください。名前は `markdown-dynamic-include`、バージョンは `0.0.1`、カテゴリーは `Other`、メインエントリーポイントは `./out/extension.js` とし、アクティベーションイベントは `onLanguage:markdown` および `onCommand:markdown-dynamic-include.preview` を設定してください。拡張機能の設定として、`markdownDynamicInclude.enablePreview`(boolean, default: true)と `markdownDynamicInclude.pattern`(string, default: "\\{\\{\\s*(.+?)\\s*\\}\\}") を含めてください。」

**ポイント**:
- `activationEvents` には `"onLanguage:markdown"` と `"onCommand:markdown-dynamic-include.preview"` を設定し、Markdownファイルを開いたときとコマンド実行時に拡張が有効化されるようにする。
- `contributes` には`configuration`項目を設定して、ユーザーが設定を変更できるようにする。
- `contributes.commands` にはプレビュー用コマンドを登録する。

### 4.2. tsconfig.json の生成

#### 指示テンプレート

> **指示例**:  
> 「VSCode拡張機能の開発に適した設定で`tsconfig.json`を生成してください。ES2020ターゲット、モジュール解決はNode形式、厳格モードを有効にしてください。出力先は`out`フォルダに指定し、拡張機能に必要な型定義も取り込むようにしてください。」

**ポイント**:
- `outDir` は `./out` を指定。
- `"lib"` に `"ES2020"` や `"DOM"` を含める場合もあり。
- `"typeRoots"` や `"types"` に `"@types/vscode"` の指定を入れる。

### 4.3. extension.ts の雛形生成

#### 機能:
- 拡張機能のエントリーポイント。
- `activate` と `deactivate` の関数を定義。
- `activate` 内でコマンド登録(`commands.registerCommand`)を行い、`previewProvider`を呼び出す。

#### 指示テンプレート

> **指示例**:  
> 「TypeScriptで `extension.ts` の雛形コードを作成してください。`activate` 関数と `deactivate` 関数を定義し、`markdown-dynamic-include.preview` というコマンドを登録してコンソールに『Preview command executed』とログが出るだけの簡易処理を入れてください。」

### 4.4. previewProvider.ts の雛形生成

#### 機能:
- `PreviewProvider` クラスを定義。
- `provideTextDocumentContent` (もしくは独自のメソッド)でMarkdownをHTMLに変換して返すロジックを記述。
- 置換処理はここで行う(後述)。

#### 指示テンプレート

> **指示例**:  
> 「TypeScriptで `previewProvider.ts` のコードを作成してください。`PreviewProvider` クラス内に `providePreview` メソッドを作り、受け取ったMarkdown文字列を一旦そのままHTMLに変換して返す流れを作ってください。変換には Markdown-it を利用してください。`markdown-it` のインポートと簡易なHTML変換を実装してください。」

### 4.5. 特殊キーの置換ロジック (utils.ts / previewProvider.ts)

#### 機能:
1. 正規表現 `\{\{\s*(.+?)\s*\}\}` で `{{ ファイル名 }}` を抽出。
2. 該当ファイルが存在すれば、そのファイルの内容に置換。存在しなければエラー表示用の文字列に置換。

#### 指示テンプレート

> **指示例**:  
> 「`utils.ts` に、文字列中の `{{ ファイル名 }}` を検出して、コールバックで置換結果を生成できる関数 `replaceIncludeKeys` を実装してください。サインチャーは `replaceIncludeKeys(source: string, baseDir: string): Promise<string>` の形にして、戻り値として置換後の文字列を返してください。該当ファイルが見つからない場合は `[エラー] "<ファイル名>" は存在しません。` という文字列に置換してください。」

#### さらに previewProvider 側での適用

> **指示例**:  
> 「`previewProvider.ts` の `providePreview` メソッド内で、`replaceIncludeKeys` を呼び出し、置換後のMarkdown文字列を Markdown-it でHTMLに変換して返すように修正してください。」

### 4.6. ユーザー設定の反映 (enablePreview / pattern)

#### 機能:
- `enablePreview` が false の場合はプレビューを表示しない、またはVSCodeに通知メッセージを出す。
- `pattern` の設定値を使って、置換対象の特殊キーを上書きする(デフォルト以外の正規表現が使われる場合に備え、Utils関数内で受け取るか、`previewProvider` が設定から読み出す)。

#### 指示テンプレート

> **指示例**:  
> 「VSCodeの設定値 `markdownDynamicInclude.enablePreview` がfalseの場合、プレビューを表示しないようにしてください。また、`markdownDynamicInclude.pattern` を取得し、正規表現を差し替えられるようにしてください。設定の取得には `workspace.getConfiguration()` を使ってください。」

### 4.7. コマンドからのプレビュー実行

#### 機能:
- ユーザーがコマンドパレットから `Markdown Dynamic File Include: Preview` を呼び出したときにも、プレビューが開くようにする。
- `extension.ts` の `commands.registerCommand('markdown-dynamic-include.preview', ...)` 内で現在のエディタがMarkdownファイルかチェックし、PreviewProviderを呼ぶ。

#### 指示テンプレート

> **指示例**:  
> 「`extension.ts` 内で、`markdown-dynamic-include.preview` コマンドが実行された際、もしアクティブなテキストエディタがMarkdownファイルであれば `PreviewProvider` のメソッドを呼び出してプレビューを表示させるようにしてください。Markdownでなければ情報メッセージを出してください。」

### 4.8. エラーハンドリングとログ出力

#### 機能:
- 例外やファイルIOエラーが発生した場合、VSCodeの出力ウィンドウにログを表示。
- プレビュー内にもエラーメッセージをわかりやすく表示する。

#### 指示テンプレート

> **指示例**:  
> 「ファイル読み込みエラーなどが発生した場合、VSCodeの出力チャネルにエラー内容を出力するとともに、プレビュー内にも `[エラー] 予期せぬエラー` などと表示するようにしてください。必要に応じて `vscode.window.createOutputChannel('Markdown Dynamic Include')` を使ってください。」

### 4.9. 動作テスト

最後に、生成されたコードのビルドとテストを実行します。

- `npm install`  
- `npm run compile` (tsconfig.jsonに従い `./out` 以下に出力されるはず)
- VSCodeで `F5` を押してExtension Hostを起動し、Markdownファイルを開いてテスト。

---

## 5. 補足 (実装例: includeの再帰参照や相対パス)

- まずは同一ディレクトリのみをサポートし、必要に応じて相対パスや再帰参照などに拡張できるようにコード設計を行う。
- 外部ソース(URL)対応も可能だが、セキュリティリスクに注意。

---

## 6. 想定されるAIへの最終的な依頼文例

以下は、すべてのステップを統合してAIに依頼する例です。分割して依頼する場合はステップごとに依頼してください。

> **依頼例:**
> 
> 1. 「VSCode拡張機能の `package.json` を作成してください。名前は `markdown-dynamic-include`、バージョンは `0.0.1`、・・・（以下ステップ4.1の詳細）。」
> 2. 「`tsconfig.json` を・・・（以下ステップ4.2の詳細）。」
> 3. 「`extension.ts` の雛形を・・・（以下ステップ4.3の詳細）。」
> 4. 「`previewProvider.ts` を・・・（以下ステップ4.4の詳細）。」
> 5. 「`utils.ts` に `replaceIncludeKeys` を・・・（以下ステップ4.5の詳細）。」
> 6. 「ユーザー設定 `markdownDynamicInclude.enablePreview` と `markdownDynamicInclude.pattern` を読み取り・・・（以下ステップ4.6の詳細）。」
> 7. 「コマンドパレット用のコマンド `markdown-dynamic-include.preview` を設定して・・・（以下ステップ4.7の詳細）。」
> 8. 「エラーハンドリングとログ出力を・・・（以下ステップ4.8の詳細）。」
> 9. 「生成されたコードをビルドし動作確認したいので・・・（以下ステップ4.9のテスト詳細）。」
> 
> というように、順番に指示を出すことで、AIが必要なコード片を段階的に提案してくれます。

---

## 7. まとめ

本ドキュメントに基づいてAIコーディングアシスタントを活用することで、以下のようなメリットが得られます。

- **段階的なコード生成**  
  1つの大きな指示ではなく、ステップごとの小さな指示を行うことで正確なコードが得られやすい。  
- **柔軟な修正指示**  
  生成結果を確認しながら、「ここをもう少し変更して」「この部分を追加して」などの細かい変更を促しやすい。  
- **拡張性の確保**  
  将来的なマルチディレクトリ対応やネット経由の参照など、仕様拡張がしやすい構造を最初から意識して作成できる。  

以上を参考に、VSCode拡張機能「Markdown Dynamic File Include Preview」を効率的に開発してください。もし機能追加やカスタマイズが必要になったら、同様のプロセスでAIに部分的に指示を与え、コードを拡張していくことが可能です。