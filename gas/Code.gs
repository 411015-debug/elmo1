/**
 * Apps Script: 接收單字資料並寫入目前試算表的範例
 * 部署為 Web App 後，將得到一個 exec URL，填入前端的 GAS_ENDPOINT_URL。
 * 權限請設定為「任何人，即使是匿名使用者」以允許瀏覽器直接 POST。
 */

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: 'ELMO GAS OK' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents = e.postData && e.postData.contents;
    if (!contents) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'No post data' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(contents);

    // 取得目前作用中的試算表與第一個工作表
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();

    // 建立欄位順序：word, translation, pos, example, root, createdAt
    var row = [
      payload.word || '',
      payload.translation || '',
      payload.pos || '',
      payload.example || '',
      payload.root || '',
      new Date(),
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: '已新增單字。' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}