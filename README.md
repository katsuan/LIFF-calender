# LIFF Calendar Share

LINE上で開くLIFF画面からGoogleカレンダー登録用URLを生成し、そのままFlex Messageで共有するサンプルです。

## 対応内容

- 画面入力: 件名、開始日時、終了日時、予定詳細、関連URL
- GoogleカレンダーURL生成
- Flex Messageプレビュー
- LINEトークへの送信
  - `liff.sendMessages()` で現在のトークに送信
  - `liff.shareTargetPicker()` で送信先を選んで共有

## 起動方法

```bash
npm start
```

起動後に `http://localhost:3000` を開きます。

## LIFF設定

1. LINE Developers で LIFF アプリを作成します。
2. 作成した LIFF ID を画面上の `LIFF ID` に入力します。
3. LINE アプリ内で LIFF を開くと、`現在のトークに送信` が利用できます。

## 送信されるFlex Message

- 件名
- 開始日時
- 終了日時
- 詳細テキスト
- `Googleカレンダーに追加` ボタン
- 任意で `関連URLを開く` ボタン

## 補足

- GoogleカレンダーURLは `https://calendar.google.com/calendar/render` のテンプレートURLを利用しています。
- タイムゾーンはブラウザの `Intl.DateTimeFormat().resolvedOptions().timeZone` を利用します。
- 関連URLは `http` / `https` のみ許可しています。
