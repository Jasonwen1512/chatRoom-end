const express = require("express");
const cors = require("cors"); //允許前端進行跨來源請求
const { google } = require("googleapis");
const SocketServer = require("ws").Server;
const app = express();
const port = 3000;

// 開啟伺服器
const server = app.listen(port, () => {
  console.log(`後端伺服器已啟動：http://localhost:${port}`);
});

const wss = new SocketServer({ server });

app.use(express.json()); // 解析 JSON 格式的請求
app.use(cors());

const SHEET_ID = "1avbFWz5s6hSadPJj0A13bSyM6Pp8wiXARx2vpAXaJ6c";
const RANGE_FOR_SIGNIN = "A:B";
const RANGE_FOR_CHAT = "D:E";

let clients = [];
wss.on("connection", (ws) => {
  // 監聽訊息
  ws.on("message", (data) => {
    data = data.toString();
    ws.send(data);

    // 回傳所有前端訊息
    let clients = wss.clients;
    clients.forEach((client) => {
      client.send(data);
    });
  });

  ws.on("close", () => {
    clients = clients.filter((client) => client !== ws); // 移除已關閉的連接
    // console.log("伺服器已關閉");
  });
});

// 載入 Service Account 憑證
const auth = new google.auth.GoogleAuth({
  keyFile: "service-account.json", // Service Account 檔案路徑
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// 讀取資料的API（註冊登入）
app.get("/api/readLoginAndSignin", async (req, res) => {
  try {
    // 取得 Google Sheets API 客戶端
    const sheets = google.sheets({
      version: "v4",
      auth: await auth.getClient(),
    });

    // 呼叫 Google Sheets API 讀取資料
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE_FOR_SIGNIN,
    });

    // 回傳讀取到的資料
    res.status(200).json({ message: "讀取成功", data: result.data.values });
  } catch (error) {
    console.error("讀取失敗:", error);
    res.status(500).json({ error: "讀取失敗", details: error.message });
  }
});

// 讀取資料的API（聊天室）
app.get("/api/readChat", async (req, res) => {
  try {
    // 取得 Google Sheets API 客戶端
    const sheets = google.sheets({
      version: "v4",
      auth: await auth.getClient(),
    });

    // 呼叫 Google Sheets API 讀取資料
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE_FOR_CHAT,
    });

    // 回傳讀取到的資料
    res.status(200).json({ message: "讀取成功", data: result.data.values });
  } catch (error) {
    console.error("讀取失敗:", error);
    res.status(500).json({ error: "讀取失敗", details: error.message });
  }
});

// 寫入資料的API（註冊登入）
app.post("/api/writeLoginAndSignin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 取得 Google Sheets API 客戶端
    const sheets = google.sheets({
      version: "v4",
      auth: await auth.getClient(),
    });

    // 準備寫入的資料
    const resource = {
      values: [[email, password]],
    };

    // 呼叫 Google Sheets API
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: RANGE_FOR_SIGNIN,
      valueInputOption: "USER_ENTERED",
      resource,
    });

    res.status(200).json({ message: "寫入成功", result: result.data });
  } catch (error) {
    console.error("寫入失敗:", error);
    res.status(500).json({ error: "寫入失敗", details: error.message });
  }
});

// 寫入資料的API（聊天室）
app.post("/api/writeChat", async (req, res) => {
  try {
    const { account, message } = req.body;

    // 取得 Google Sheets API 客戶端
    const sheets = google.sheets({
      version: "v4",
      auth: await auth.getClient(),
    });

    // 準備寫入的資料
    const resource = {
      values: [[account, message]],
    };

    // 呼叫 Google Sheets API
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: RANGE_FOR_CHAT,
      valueInputOption: "USER_ENTERED",
      resource,
    });

    res.status(200).json({ message: "寫入成功", result: result.data });
  } catch (error) {
    console.error("寫入失敗:", error);
    res.status(500).json({ error: "寫入失敗", details: error.message });
  }
});
