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

---
パッケージの作り方
npm run compile
npm run package

初期のインストール方法
code --install-extension markdown-dynamic-include-0.1.0.vsix

パッケージの更新方法
code --list-extensions
code --uninstall-extension 拡張子
code --install-extension markdown-dynamic-include-0.1.1.vsix

