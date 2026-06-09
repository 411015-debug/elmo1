# Google Apps Script 單字資料上傳流程

此文件說明如何讓管理頁的「儲存單字」按鈕，將單字資料送到 Google Apps Script 後端，並寫入 Google 試算表。

## 1. 建立 Google 試算表

1. 開啟 Google Drive。
2. 建立一個新的 Google 試算表。
3. 將第一列標題設為：
   - `word`
   - `translation`
   - `pos`
   - `example`
   - `root`
   - `createdAt`
4. 儲存試算表名稱，例如：`ELMO 單字庫`。

## 2. 建立 Google Apps Script 專案

1. 在試算表中，點選上方選單：`擴充功能` > `Apps Script`。
2. 如果是新專案，會開啟 Apps Script 編輯器。
3. 在 `Code.gs` 中貼上以下程式碼：

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var payload = JSON.parse(e.postData.contents);

    var row = [
      payload.word || "",
      payload.translation || "",
      payload.pos || "",
      payload.example || "",
      payload.root || "",
      new Date(),
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: "已新增單字。" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## 3. 部署為 Web App

1. 在 Apps Script 編輯器中，點選右上角的 `部署` 按鈕。
2. 選擇 `新增部署`。
3. 部署類型選 `網頁應用程式`。
4. 權限設定：
   - `執行應用程式的身分`：選擇 `我自己`。
   - `可以存取應用程式的人員`：選擇 `任何人` 或 `任何人，即使是匿名使用者`。若想讓前端網頁直接送出資料，通常需要選擇 `任何人，即使是匿名使用者`。
5. 點選 `部署`。
6. 複製「Web 應用程式 URL」。

## 4. 更新前端 JavaScript

1. 開啟專案中的 `script.js`。
2. 找到以下常數：

```javascript
const GAS_ENDPOINT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";
```

3. 用你剛剛部署後的 Web App URL 替換它。

## 5. 前端送出行為說明

當管理者在表單填完以下欄位：
- 英文單字（`word`）
- 中文翻譯（`translation`）
- 詞性（`pos`）
- 例句（`example`）
- 字根分析（`root`）

並按下「儲存單字」時，程式會：

1. 先將資料存到本地瀏覽器的 `localStorage`（方便快速使用、離線瀏覽）。
2. 再將相同資料送到 Google Apps Script 後端。
3. 後端接收後，解析 JSON，並把資料寫入 Google 試算表。

若後端傳送失敗，前端仍會保存本地資料，並顯示錯誤訊息在管理頁中。

## 6. 測試步驟

1. 開啟網站，切換到「管理頁」。
2. 輸入一組新單字資料，點擊「儲存單字」。
3. 如果已設定正確的 Apps Script URL，應該會看到「已儲存單字並送出後端。」的訊息。
4. 前往 Google 試算表，確認該筆資料是否已新增。

## 7. 其他注意事項

- 如果使用 `YOUR_SCRIPT_ID` 佔位網址，前端會跳過後端送出，這時只會存於本地。
- 若出現 CORS 或權限問題，請確認 Apps Script 已部署為 Web App，且存取權限為「任何人」或「任何人，即使是匿名使用者」。
- 若要進一步保護資料，建議改為使用 OAuth、API Key 或 Cloud Function 作為後端代理。

## 8. 檔案修改摘要

- `script.js`
  - 新增 `GAS_ENDPOINT_URL` 常數。
  - 新增 `sendToGoogleSheet()` 函式，將表單資料 POST 到 Apps Script。
  - 修改 `handleFormSubmit()` 為非同步函式，按下儲存時同時送出後端資料。
- `styles.css`
  - 修正卡片背面內容可捲動，避免例句超出範圍。
