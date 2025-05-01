import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

// デバッグメッセージをVSCodeの通知としても表示するヘルパー関数
function debugLog(message: string, showNotification = false) {
    // 通常のコンソールログ
    console.log(message);
    
    // 重要なデバッグメッセージの場合は通知も表示
    if (showNotification) {
        vscode.window.showInformationMessage(`[Debug] ${message}`);
    }
}

export async function replaceIncludeKeys(
    source: string,
    baseDir: string,
    pattern: string
): Promise<string> {
    // 通常のコンソールログとVSCode通知の両方を使用
    debugLog('=== ファイル置換処理を開始します ===', true);
    debugLog(`パターン: ${pattern}`);
    debugLog(`ベースディレクトリ: ${baseDir}`);

    // 元のテキストをログ出力（デバッグ用）
    debugLog(`元テキストの長さ: ${source.length}バイト`);
    
    // 特殊文字のエスケープ問題を調査
    debugLog(`入力テキストに {{ が含まれているか: ${source.includes('{{')}`);
    const bracesPos = source.indexOf('{{');
    if (bracesPos >= 0) {
        debugLog(`{{ の位置: ${bracesPos}, 周辺テキスト: ${source.substring(Math.max(0, bracesPos-10), Math.min(source.length, bracesPos+20))}`);
    }
    
    // テストとして直接テキスト置換を試みる
    const testReplace = source.replace(/\{\{\s*README\.md\s*\}\}/g, "TEST_REPLACED");
    const directReplaceWorked = testReplace !== source;
    debugLog(`直接置換テスト ({{ README.md }} → TEST_REPLACED): ${directReplaceWorked ? '成功' : '失敗'}`, true);
    
    if (!directReplaceWorked) {
        // デバッグのためVSCode通知を表示
        vscode.window.showWarningMessage('置換テストに失敗しました。テキストに問題があるかもしれません。');
    }
    
    // パターンマッチングの前にファイルの存在確認
    const readmeExists = fs.existsSync(path.join(baseDir, 'README.md'));
    debugLog(`README.mdファイルは存在しますか: ${readmeExists}`);
    
    if (readmeExists) {
        try {
            const readmeContent = fs.readFileSync(path.join(baseDir, 'README.md'), 'utf-8');
            debugLog(`README.mdの読み込み成功: ${readmeContent.length}バイト`);
        } catch (err) {
            debugLog(`README.mdの読み込みエラー: ${err}`, true);
        }
    }

    // マッチする全てのパターンを検索
    let matches = [];
    
    try {
        // 安全のため、文字列検索を手動で行う
        debugLog('正規表現ではなく、単純な文字列検索を試みます');
        
        // 最もシンプルな方法: 文字列として {{ と }} を探す
        let startPos = 0;
        while (true) {
            const openBrace = source.indexOf('{{', startPos);
            if (openBrace === -1) break;
            
            const closeBrace = source.indexOf('}}', openBrace);
            if (closeBrace === -1) break;
            
            const fullMatch = source.substring(openBrace, closeBrace + 2);
            const fileName = source.substring(openBrace + 2, closeBrace).trim();
            
            debugLog(`マッチ発見: "${fullMatch}" (ファイル名: "${fileName}")`);
            
            matches.push({
                fullMatch,
                fileName,
                index: openBrace
            });
            
            startPos = closeBrace + 2;
        }
        
        debugLog(`文字列検索で見つかったマッチ数: ${matches.length}`, true);
    } catch (error) {
        debugLog(`エラー発生: ${error}`, true);
    }

    // マッチしたパターンごとに置換処理
    let replaced = source;
    for (const match of matches) {
        debugLog(`マッチ処理: "${match.fullMatch}" (ファイル名: "${match.fileName}")`);
        
        const filePath = path.join(baseDir, match.fileName.trim());
        debugLog(`ファイルパス: ${filePath}`);

        let fileContent = `[エラー] "${match.fileName}" は存在しません。`;
        if (fs.existsSync(filePath)) {
            debugLog('ファイルは存在します');
            try {
                fileContent = fs.readFileSync(filePath, 'utf-8');
                debugLog(`ファイル読み込み成功: ${fileContent.length}バイト`);
            } catch (err: any) {
                debugLog(`ファイル読み込みエラー: ${err.message}`, true);
                fileContent = `[エラー] "${match.fileName}" を読み込みできませんでした。`;
            }
        } else {
            debugLog(`ファイルが存在しません: ${filePath}`, true);
        }

        // 直接substring + 連結で置換を行う（String.replaceではなく）
        const beforeStr = replaced.substring(0, match.index);
        const afterStr = replaced.substring(match.index + match.fullMatch.length);
        const newStr = beforeStr + fileContent + afterStr;
        
        // 置換が成功したかどうかを判定
        const isChanged = newStr !== replaced;
        debugLog(`置換実行: ${isChanged ? '成功' : '失敗'}`);
        
        replaced = newStr;
    }

    // 最終処理結果
    const isChanged = replaced !== source;
    debugLog(`処理完了: 置換が実行されましたか: ${isChanged}`, true);
    
    return replaced;
} 