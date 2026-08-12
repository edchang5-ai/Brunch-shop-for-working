import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `你是台灣美食資訊分析助手。使用者會給你一間位於彰化市的早午餐(brunch)店資料，包含名稱、地址、類型、網站、官方營業時間與顧客評論。

請判斷並回答三個問題，最後輸出「純 JSON 物件」（不要有 markdown 標記或額外文字），格式如下：
{
  "hasPower": true 或 false 或 null,
  "servesCoffee": true 或 false 或 null,
  "hoursNote": "營業時間簡述字串或 null",
  "summary": "用一句台灣繁體中文總結這間店適不適合帶筆電去工作（考慮營業時間、電源、咖啡、氛圍）"
}

判斷規則：
1. hasPower：店內是否提供插座/電源供客人使用筆電？評論或資訊提到「有插座、有電源、充電、可帶筆電」則為 true；明確提到「沒有插座」則為 false；無法判斷則為 null。
2. servesCoffee：是否供應咖啡？店名、類型或評論提到咖啡則為 true；明確說沒有咖啡則為 false；無法判斷則為 null。
3. hoursNote：官方營業時間的簡單說明（例如「週一~週五 7:00–15:00」），無資料則為 null。`;

function stripJson(text) {
  const cleaned = String(text)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Gemini 回傳格式異常');
  return JSON.parse(cleaned.slice(start, end + 1));
}

export class GeminiClient {
  constructor(apiKey, model = 'gemini-2.0-flash') {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async analyzePlace(place) {
    const model = this.genAI.getGenerativeModel({
      model: this.model,
      generationConfig: { temperature: 0.2 },
    });

    const input = JSON.stringify({
      name: place.name,
      address: place.address,
      types: place.types,
      website: place.website,
      hours: place.hours,
      reviews: place.reviews,
    }, null, 2);

    const result = await model.generateContent([SYSTEM_PROMPT, input]);
    const parsed = stripJson(result.response.text());

    return {
      hasPower: parsed.hasPower ?? null,
      servesCoffee: parsed.servesCoffee ?? null,
      hoursNote: parsed.hoursNote ?? null,
      summary: parsed.summary ?? '',
    };
  }
}
