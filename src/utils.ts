import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

// デバッグメッセージをVSCodeの通知としても表示するヘルパー関数
function debugLog(message: string, showNotification = false) {
    // 通常のコンソールログ
    // console.log(message);
    
    // 重要なデバッグメッセージの場合は通知も表示
    if (showNotification) {
        vscode.window.showInformationMessage(`[Debug] ${message}`);
    }
}

// Markdownファイルからh1ヘッダーを抽出する関数
function extractH1FromMarkdown(content: string): string {
    // h1ヘッダーを探す正規表現
    const h1Regex = /^#\s+(.+)$/m;
    const match = content.match(h1Regex);
    
    if (match && match[1]) {
        return match[1].trim();
    }
    
    return '[エラー] h1ヘッダーが見つかりませんでした。';
}

export async function replaceIncludeKeys(
    source: string,
    baseDir: string,
    pattern: string
): Promise<string> {
    // 通常のコンソールログとVSCode通知の両方を使用
    debugLog('=== ファイル置換処理を開始します ===');
    debugLog(`パターン: ${pattern}`);
    debugLog(`ベースディレクトリ: ${baseDir}`);
    debugLog(`元テキストの長さ: ${source.length}バイト`);
    debugLog(`入力テキストに {{ が含まれているか: ${source.includes('{{')}`);
    const bracesPos = source.indexOf('{{');
    if (bracesPos >= 0) {
        debugLog(`{{ の位置: ${bracesPos}, 周辺テキスト: ${source.substring(Math.max(0, bracesPos-10), Math.min(source.length, bracesPos+20))}`);
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
            const contentInsideBraces = source.substring(openBrace + 2, closeBrace).trim();
            
            // | が含まれているか確認
            const parts = contentInsideBraces.split('|').map(part => part.trim());
            const fileName = parts[0];
            const extractKey = parts.length > 1 ? parts[1] : '';
            
            debugLog(`マッチ発見: "${fullMatch}" (ファイル名: "${fileName}", 抽出キー: "${extractKey}")`);
            
            matches.push({
                fullMatch,
                fileName,
                extractKey,
                index: openBrace
            });
            
            startPos = closeBrace + 2;
        }
        
        debugLog(`文字列検索で見つかったマッチ数: ${matches.length}`);
    } catch (error) {
        debugLog(`エラー発生: ${error}`, true);
    }

    // 修正：複数の置換を正しく処理するために、置換後のインデックスの調整が必要
    // マッチを逆順（末尾から）に処理することで、インデックスがずれる問題を回避
    matches.sort((a, b) => b.index - a.index);
    
    debugLog(`マッチを逆順に並べ替えました（${matches.length}件）`);

    // マッチしたパターンごとに置換処理
    let replaced = source;
    for (const match of matches) {
        debugLog(`マッチ処理: "${match.fullMatch}" (ファイル名: "${match.fileName}", 抽出キー: "${match.extractKey}")`);
        
        const filePath = path.join(baseDir, match.fileName.trim());
        debugLog(`ファイルパス: ${filePath}`);

        let fileContent = `[エラー] "${match.fileName}" は存在しません。`;
        if (fs.existsSync(filePath)) {
            debugLog('ファイルは存在します');
            try {
                fileContent = fs.readFileSync(filePath, 'utf-8');
                debugLog(`ファイル読み込み成功: ${fileContent.length}バイト`);
                
                // 抽出キーがある場合、それに応じた処理
                if (match.extractKey) {
                    debugLog(`抽出キー処理: ${match.extractKey}`);
                    const fileExt = path.extname(match.fileName).toLowerCase();
                    
                    if (fileExt === '.md' && match.extractKey === 'h1') {
                        // Markdownファイルからh1ヘッダーを抽出
                        const h1Content = extractH1FromMarkdown(fileContent);
                        fileContent = h1Content;
                        debugLog(`h1抽出結果: ${h1Content}`);
                    } else {
                        // 未対応の抽出キー
                        fileContent = `[警告] 抽出キー "${match.extractKey}" はサポートされていません。`;
                        debugLog(`未対応の抽出キー: ${match.extractKey}`, true);
                    }
                }
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
    debugLog(`処理完了: 置換が実行されましたか: ${isChanged}`);
    
    return replaced;
} 