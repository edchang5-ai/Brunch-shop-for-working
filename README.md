# Brunch Shop for Working（彰化市）

查詢彰化市早午餐店的**營業時間、有無電源插座、是否供應咖啡**，方便挑選適合帶筆電去工作的店家。

資料來源：Google Maps Places API（店家與營業時間）+ Google Gemini（分析評論推斷電源與咖啡資訊）。

## 功能

- 表單式搜尋：輸入關鍵字（預設「彰化市 brunch」）即可列出店家
- 每間店可單獨分析，或一鍵分析全部
- AI 分析結果：電源插座（有/無/待確認）、咖啡（有/無/待確認）、營業時間、適不適合工作的小結

## 技術架構

```
public/          前端（表單式介面，純 HTML/CSS/JS）
lib/google.js    Google Maps Places API 用戶端（搜尋 + 詳細資料）
lib/gemini.js    Gemini 用戶端（從評論推斷電源、咖啡）
server.js        Express 後端（/api/search、/api/analyze）
```

## 事前準備

1. 申請 **Google Maps Platform** API Key，並啟用 *Places API*。
2. 申請 **Google AI Studio** 的 Gemini API Key（Gemini API）。
3. 兩者都需在本機安裝 Node.js 18 以上。

## 安裝與執行

```bash
cp .env.example .env
# 編輯 .env，填入 GOOGLE_MAPS_API_KEY 與 GEMINI_API_KEY

npm install
npm start
```

開啟 http://localhost:3000 即可使用。

## API

### POST /api/search

查詢店家清單。

```json
{ "query": "彰化市 brunch", "count": 10 }
```

### POST /api/analyze

對單一店家做 AI 分析（電源 / 咖啡 / 營業時間）。

```json
{ "placeId": "ChIJ..." }
```

## 注意事項

- Gemini 是從店家評論與資訊**推斷**電源與咖啡，非店家官方保證，結果僅供參考。
- Places API 與 Gemini API 皆為付費服務，分析全部店家時會消耗配額，建議先小筆數測試。
- 目前搜尋範圍以關鍵字為主，可把查詢改成「彰化市 + 特定區域」縮小範圍。
