import * as vscode from 'vscode';
import * as path from 'path';
import { replaceIncludeKeys } from './utils';
import MarkdownIt from 'markdown-it';

export class PreviewProvider {
    private extensionUri: vscode.Uri;

    constructor(extensionUri: vscode.Uri) {
        this.extensionUri = extensionUri;
        console.log('Markdown Dynamic Include プレビュー機能が初期化されました');
    }

    public async showPreview(doc: vscode.TextDocument) {
        // コマンドが実行されたことをユーザーに明示的に通知
        // vscode.window.showInformationMessage('Markdown Dynamic Include プレビューを表示します');
        
        const config = vscode.workspace.getConfiguration('markdownDynamicInclude');
        const enablePreview = config.get<boolean>('enablePreview', true);
        const pattern = config.get<string>('pattern', '\\{\\{\\s*(.+?)\\s*\\}\\}');

        console.log('=== プレビュー処理を開始します ===');
        console.log(`設定: enablePreview=${enablePreview}, pattern=${pattern}`);

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

        // パネルタイトルに識別しやすいマークを付ける
        panel.title = `📝 ${path.basename(doc.fileName)} (置換済)`;

        try {
            // ドキュメントのMarkdown文字列を取得
            const originalText = doc.getText();
            console.log(`元のテキスト長: ${originalText.length}バイト`);
            console.log(`元テキストの一部: ${originalText.substring(0, 100)}...`);
            
            // ファイルのパスを取得
            const docDir = path.dirname(doc.fileName);
            console.log(`現在のファイルディレクトリ: ${docDir}`);
            
            // 特殊キーをファイルの中身で置換
            console.log('replaceIncludeKeys()を呼び出します...');
            const replacedMarkdown = await replaceIncludeKeys(originalText, docDir, pattern);
            console.log(`置換後のテキスト長: ${replacedMarkdown.length}バイト`);
            console.log(`置換後テキストの一部: ${replacedMarkdown.substring(0, 100)}...`);
            
            // オリジナルと置換後のテキストが同じかどうかチェック
            const isTextChanged = originalText !== replacedMarkdown;
            console.log(`テキストが変更されましたか: ${isTextChanged}`);

            // Markdown-it でHTMLに変換
            const md = new MarkdownIt();
            const htmlContent = md.render(replacedMarkdown);
            console.log(`HTML変換後の長さ: ${htmlContent.length}バイト`);

            // Webviewに表示（コードとして表示）
            panel.webview.html = this.getCodeViewContent(replacedMarkdown);
            console.log('プレビュー生成完了');
            
            // 置換結果を通知
            // if (isTextChanged) {
            //     vscode.window.showInformationMessage('特殊キーをファイル内容で置換しました');
            // } else {
            //     vscode.window.showWarningMessage('特殊キーが見つからなかったか、置換に失敗しました');
            // }
        } catch (error: any) {
            // エラーが起きたらログ出力＆パネルにもエラー表示
            console.error(`エラー: ${error.message}`);
            console.error(`スタックトレース: ${error.stack}`);

            panel.webview.html = this.getCodeViewContent(`[エラー] 予期せぬエラーが発生しました。\n${error.message}`);
            vscode.window.showErrorMessage(`プレビュー生成中にエラーが発生しました: ${error.message}`);
        }
    }

    private getWebviewContent(content: string): string {
        return `
            <!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <title>Markdown Preview</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", system-ui, "Ubuntu", "Droid Sans", sans-serif;
                        padding: 0 20px;
                        line-height: 1.6;
                        word-wrap: break-word;
                        color: var(--vscode-editor-foreground, #333);
                        background-color: var(--vscode-editor-background, #fff);
                    }
                    
                    pre {
                        background-color: var(--vscode-textCodeBlock-background, #f8f8f8);
                        border-radius: 3px;
                        padding: 10px;
                        overflow: auto;
                    }
                    
                    code {
                        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
                        font-size: 14px;
                        line-height: 1.4;
                    }
                    
                    a {
                        color: var(--vscode-textLink-foreground, #0366d6);
                        text-decoration: none;
                    }
                    
                    a:hover {
                        text-decoration: underline;
                    }
                    
                    img {
                        max-width: 100%;
                    }
                    
                    blockquote {
                        margin: 0;
                        padding: 0 1em;
                        color: var(--vscode-foreground, #6a737d);
                        border-left: 0.25em solid var(--vscode-activityBar-background, #dfe2e5);
                    }
                    
                    hr {
                        height: 0.25em;
                        border: 0;
                        margin: 24px 0;
                        background-color: var(--vscode-notebook-cellToolbarSeparator, #e1e4e8);
                    }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `;
    }

    private getCodeViewContent(content: string): string {
        // HTMLエスケープ処理
        const escapeHtml = (text: string) => {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };

        return `
            <!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <title>Markdown Code View</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", system-ui, "Ubuntu", "Droid Sans", sans-serif;
                        padding: 0;
                        margin: 0;
                        line-height: 1.6;
                        color: var(--vscode-editor-foreground, #333);
                        background-color: var(--vscode-editor-background, #fff);
                    }
                    
                    pre {
                        background-color: var(--vscode-editor-background, #1e1e1e);
                        margin: 0;
                        padding: 10px;
                        width: 100%;
                        height: 100vh;
                        overflow: auto;
                        box-sizing: border-box;
                    }
                    
                    code {
                        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
                        font-size: 14px;
                        line-height: 1.5;
                        white-space: pre-wrap;
                        word-break: keep-all;
                        color: var(--vscode-editor-foreground, #d4d4d4);
                    }
                </style>
            </head>
            <body>
                <pre><code>${escapeHtml(content)}</code></pre>
            </body>
            </html>
        `;
    }
} 