以下は、**Markdown Dynamic File Include Preview** を実装するためのVSCode拡張機能プロジェクトのサンプルコード一式です。  
最小限の構成ですが、ポイントとなる部分（特殊キーの置換やプレビュー機能、エラーハンドリング、ユーザー設定の反映など）を盛り込んでいます。

---

## 1. プロジェクト構成

```
markdown-dynamic-include/
├── package.json
├── tsconfig.json
├── src/
│   ├── extension.ts
│   ├── previewProvider.ts
│   └── utils.ts
└── README.md
```

---

## 2. ファイル別ソースコード

### 2.1. package.json

> プロジェクトのメタ情報を定義し、VSCode拡張機能として認識させるための設定を行います。  
> - **activationEvents**: `onLanguage:markdown` と `onCommand:markdown-dynamic-include.preview` を指定  
> - **contributes**: 設定項目(`markdownDynamicInclude.*`)やコマンドを定義  

```jsonc
{
  "name": "markdown-dynamic-include",
  "displayName": "Markdown Dynamic File Include Preview",
  "description": "Replace {{ filename }} keys in Markdown files with the content of the referenced file, and preview it.",
  "version": "0.0.1",
  "publisher": "your-publisher-name",
  "engines": {
    "vscode": "^1.50.0"
  },
  "categories": [
    "Other"
  ],
  "activationEvents": [
    "onLanguage:markdown",
    "onCommand:markdown-dynamic-include.preview"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "markdown-dynamic-include.preview",
        "title": "Markdown Dynamic File Include: Preview"
      }
    ],
    "configuration": {
      "type": "object",
      "title": "Markdown Dynamic Include",
      "properties": {
        "markdownDynamicInclude.enablePreview": {
          "type": "boolean",
          "default": true,
          "description": "Enable or disable the dynamic file include preview."
        },
        "markdownDynamicInclude.pattern": {
          "type": "string",
          "default": "\\{\\{\\s*(.+?)\\s*\\}\\}",
          "description": "Regular expression pattern for detecting include keys."
        }
      }
    }
  },
  "scripts": {
    "compile": "tsc -p .",
    "watch": "tsc -w -p ."
  },
  "devDependencies": {
    "@types/node": "^16.0.0",
    "@types/vscode": "^1.50.0",
    "typescript": "^4.0.0"
  },
  "dependencies": {
    "markdown-it": "^13.0.1"
  }
}
```

---

### 2.2. tsconfig.json

> TypeScriptコンパイル設定を定義します。  
> - `outDir` は `./out`  
> - `target` は `ES2020` など  
> - `"lib"` に `"ES2020"` / `"DOM"` を加えるなど、必要に応じて調整  

```jsonc
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out",
    "lib": [
      "ES2020",
      "DOM"
    ],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "types": [
      "node",
      "vscode"
    ],
    "esModuleInterop": true
  },
  "exclude": [
    "node_modules",
    ".vscode-test"
  ]
}
```

---

### 2.3. src/extension.ts

> 拡張機能のエントリーポイント。  
> - `activate`: 拡張機能の初期化処理  
> - `registerCommand`: コマンドパレット用の「Preview」コマンドを登録  
> - アクティブエディタがMarkdownの場合だけプレビューを表示するよう制御  

```ts
import * as vscode from 'vscode';
import { PreviewProvider } from './previewProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Markdown Dynamic Include extension is now active!');

    // コマンド登録
    const previewCommand = vscode.commands.registerCommand('markdown-dynamic-include.preview', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No active editor found.');
            return;
        }

        const doc = editor.document;
        if (doc.languageId !== 'markdown') {
            vscode.window.showInformationMessage('The active file is not a Markdown file.');
            return;
        }

        // Markdownファイルであればプレビューを生成
        const previewProvider = new PreviewProvider(context.extensionUri);
        previewProvider.showPreview(doc);
    });

    // 拡張機能にコマンドを登録
    context.subscriptions.push(previewCommand);
}

export function deactivate() {
    console.log('Markdown Dynamic Include extension is now deactivated.');
}
```

---

### 2.4. src/previewProvider.ts

> カスタムプレビューを生成・表示するクラス。  
> - `showPreview`: 現在開いているMarkdownドキュメントを解析・置換し、HTMLとしてWebviewに表示  
> - ユーザー設定(`enablePreview`, `pattern`)の取得  
> - `markdown-it` によるHTML変換  

```ts
import * as vscode from 'vscode';
import * as path from 'path';
import { replaceIncludeKeys } from './utils';
import MarkdownIt from 'markdown-it';

export class PreviewProvider {
    private extensionUri: vscode.Uri;

    constructor(extensionUri: vscode.Uri) {
        this.extensionUri = extensionUri;
    }

    public async showPreview(doc: vscode.TextDocument) {
        const config = vscode.workspace.getConfiguration('markdownDynamicInclude');
        const enablePreview = config.get<boolean>('enablePreview', true);
        const pattern = config.get<string>('pattern', '\\{\\{\\s*(.+?)\\s*\\}\\}');

        if (!enablePreview) {
            vscode.window.showInformationMessage('Dynamic File Include Preview is disabled in settings.');
            return;
        }

        // Webviewパネルを作成
        const panel = vscode.window.createWebviewPanel(
            'markdownDynamicIncludePreview',
            `Dynamic Include Preview: ${path.basename(doc.fileName)}`,
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        try {
            // ドキュメントのMarkdown文字列を取得
            const originalText = doc.getText();
            // 特殊キーをファイルの中身で置換
            const replacedMarkdown = await replaceIncludeKeys(originalText, path.dirname(doc.fileName), pattern);

            // Markdown-it でHTMLに変換
            const md = new MarkdownIt();
            const htmlContent = md.render(replacedMarkdown);

            // Webviewに表示
            panel.webview.html = this.getWebviewContent(htmlContent);
        } catch (error: any) {
            // エラーが起きたらログ出力＆パネルにもエラー表示
            const outputChannel = vscode.window.createOutputChannel('Markdown Dynamic Include');
            outputChannel.appendLine(`[Error] ${error.message}`);
            outputChannel.show(true);

            panel.webview.html = this.getWebviewContent(`<p style="color:red;">[エラー] 予期せぬエラーが発生しました。<br>${error.message}</p>`);
        }
    }

    private getWebviewContent(content: string): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Markdown Dynamic Include Preview</title>
                <style>
                    body {
                        font-family: sans-serif;
                        padding: 1rem;
                    }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `;
    }
}
```

---

### 2.5. src/utils.ts

> 特殊キーの置換ロジックを実装。  
> - `replaceIncludeKeys`: 正規表現で `{{ ファイル名 }}` を検出し、ファイルを読み込んでその内容と置換する  
> - ファイルがない場合はエラーメッセージを差し込む  

```ts
import * as fs from 'fs';
import * as path from 'path';

export async function replaceIncludeKeys(
    source: string,
    baseDir: string,
    pattern: string
): Promise<string> {
    // ユーザー設定 or デフォルトのパターンを正規表現として利用
    const regex = new RegExp(pattern, 'g');

    // 同期的に一括置換する場合は、ファイルの読み込みも同期的に行うか検討。
    // ここでは簡易的に非同期→同期の混合作業をするためPromiseを返す。
    // 大きいファイルの場合はパフォーマンスに注意。
    let replaced = source;
    let match;

    while ((match = regex.exec(source)) !== null) {
        const fullMatch = match[0];    // 例: "{{ sample.md }}"
        const fileName = match[1];    // 例: "sample.md"

        const filePath = path.join(baseDir, fileName);

        let fileContent = `[エラー] "${fileName}" は存在しません。`;
        if (fs.existsSync(filePath)) {
            try {
                fileContent = fs.readFileSync(filePath, 'utf-8');
            } catch (err) {
                fileContent = `[エラー] "${fileName}" を読み込みできませんでした。`;
            }
        }

        // 置換
        replaced = replaced.replace(fullMatch, fileContent);
    }

    return replaced;
}
```

---

### 2.6. README.md

> 拡張機能の概要・使い方を記載します。

```md
# Markdown Dynamic File Include Preview

VSCode拡張機能: Markdownファイル中の `{{ ファイル名 }}` を探してそのファイルの内容で動的に置換し、プレビュー表示します。

## 使い方

1. VSCodeでこの拡張機能をインストール・有効化する
2. Markdownファイルを開くと右上の「Markdown Dynamic File Include: Preview」ボタン（またはコマンドパレット）からプレビューを表示できます
3. `{{ sample.md }}` のように書くと、同ディレクトリ内にある `sample.md` の内容がプレビュー時に差し込まれます
4. ファイルが存在しない場合や読み込みエラーがある場合は、エラー表示がプレビューに表示されます

## 設定項目

- `markdownDynamicInclude.enablePreview` (boolean, default: `true`)  
  動的プレビューを有効/無効に切り替えます

- `markdownDynamicInclude.pattern` (string, default: `"\\{\\{\\s*(.+?)\\s*\\}\\}"`)  
  特殊キーを検出するための正規表現パターンを指定できます

## ライセンス

MIT
```

---

## 3. ビルドと実行

1. **依存関係のインストール**
   ```bash
   cd markdown-dynamic-include
   npm install
   ```

2. **TypeScriptコンパイル**
   ```bash
   npm run compile
   ```
   - 成功すると `out/` フォルダが生成され、コンパイル済みJavaScriptファイルが配置されます。

3. **VSCodeで拡張機能をデバッグ実行**
   - このフォルダをVSCodeで開きます。
   - `F5` キーまたは「実行とデバッグ」パネルから「Launch Extension」を選択して拡張機能ホストを起動します。
   - 新しいVSCodeウィンドウが立ち上がり、その環境で拡張機能が有効化されます。

4. **動作確認**
   - 新しいVSCodeウィンドウで `.md` ファイルを作成・編集し、例として `{{ sample.md }}` を書いてみてください。
   - 同じディレクトリに `sample.md` というファイルを用意し、何か文章を入れておきます。
   - コマンドパレット（`Ctrl+Shift+P` / `Cmd+Shift+P`）で `Markdown Dynamic File Include: Preview` を選択すると、プレビューが開きます。
   - `{{ sample.md }}` の部分が実際のファイル内容に置換されて表示されれば成功です。

---

## 4. 機能拡張のヒント

- **相対パス対応の拡張**  
  同一ディレクトリだけでなく、相対パスを解決できるようにする（`./`, `../` など）。
- **再帰的置換**  
  置換先のファイル内にさらに `{{ ... }}` がある場合は繰り返し処理して完全展開する。
- **外部ソース(URL)参照**  
  セキュリティに留意しながら、インターネット上のリソースも取り込めるようにする。

---

以上のコードをコピーして`markdown-dynamic-include`ディレクトリ配下に配置し、手順に沿ってビルド・起動してください。  
これで**Markdownファイルに書かれた `{{ ファイル名 }}` を置換してプレビュー表示**するVSCode拡張機能が完成します。  