import * as vscode from 'vscode';
import { PreviewProvider } from './previewProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Markdown Dynamic Include extension is now active!');
    // 追加のログを出力して、コンソールへの出力が機能しているか確認
    console.log('Checking if console log is working properly...');
    console.log('Debug: extension.ts is loaded correctly');

    // コマンド登録
    const previewCommand = vscode.commands.registerCommand('markdown-dynamic-include.preview', () => {
        console.log('Preview command was triggered');
        
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            console.log('No active editor found');
            vscode.window.showInformationMessage('No active editor found.');
            return;
        }

        const doc = editor.document;
        console.log(`Active document: ${doc.fileName}, Language: ${doc.languageId}`);
        
        if (doc.languageId !== 'markdown') {
            console.log('The active file is not a Markdown file');
            vscode.window.showInformationMessage('The active file is not a Markdown file.');
            return;
        }

        console.log('Creating PreviewProvider instance');
        // Markdownファイルであればプレビューを生成
        const previewProvider = new PreviewProvider(context.extensionUri);
        
        console.log('Calling showPreview method');
        previewProvider.showPreview(doc);
        
        console.log('Preview command execution completed');
    });

    // 拡張機能にコマンドを登録
    context.subscriptions.push(previewCommand);
    console.log('Command registered successfully');
}

export function deactivate() {
    console.log('Markdown Dynamic Include extension is now deactivated.');
} 