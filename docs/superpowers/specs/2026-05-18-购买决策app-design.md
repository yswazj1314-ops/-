# 大件商品购买决策 App — 设计文档

- 日期：2026-05-18
- 作者：项目维护者
- 状态：待用户审阅

## 1. 目标与范围

帮助用户在纠结是否购买大件商品时，从财务视角与情绪视角综合给出决策建议。用户填写商品信息与个人财务状况，App 在浏览器本地完成四大指标的计算，并调用大模型给出建设性点评。

**MVP 范围**
- 纯前端 SPA（无后端）
- 一次性使用，不保留历史
- 中文界面，人民币计价
- 同时支持 Claude / OpenAI / DeepSeek 三类 Provider（OpenAI 兼容协议覆盖国内模型）

**非目标（明确排除）**
- 用户账号 / 云端历史
- 多语言、多货币
- 移动端原生 App
- 方案对比（全款 vs 分期 vs 不买并投资）—— 留待 v2

## 2. 用户故事

1. 我想买一台 2 万元的相机，能告诉我从纯财务上是否划算
2. 我对相机有强烈的情绪偏好，能把这部分量化进去
3. 我可以切换"保守 / 平衡 / 进取"档位看不同折现率下的结论
4. 我能让 AI 用人话给我一个建设性的点评，而不只是数字

## 3. 技术栈

- **框架**：React 18 + TypeScript + Vite
- **样式**：Tailwind CSS + shadcn/ui
- **图表**：Recharts（雷达图、评分环）
- **表单**：react-hook-form + zod 校验
- **测试**：Vitest + @testing-library/react
- **LLM SDK**：浏览器 fetch（SSE 流式），不引入官方 SDK 以避免打包体积；统一 OpenAI 兼容协议，Claude 单独适配
- **部署**：静态托管（Vercel / GitHub Pages）

## 4. 输入字段

| 字段 | 类型 | 单位 | 校验 |
|---|---|---|---|
| 商品名称 | string | — | 必填 |
| 购买价格 | number | 元 | >0 |
| 预计使用年限 | number | 年 | 0.5–50 |
| 主要用途 | string | — | 必填，自由文本 |
| 年经济收益 | number | 元/年 | ≥0 |
| 情绪评分 | int | 1–10 | 1–10 |
| 年均维护成本 | number | 元/年 | ≥0 |
| 预计残值 | number | 元 | ≥0，≤购买价 |
| 付款方式 | 'cash' \| 'loan' | — | 必填 |
| └─ 贷款利率（仅分期） | number | %/年 | 0–30 |
| └─ 贷款期限（仅分期） | number | 月 | 1–360 |
| └─ 首付（仅分期） | number | 元 | 0–购买价 |
| 用户年龄 | int | 岁 | 16–100 |
| 月收入 | number | 元/月 | >0 |
| 总储蓄 | number | 元 | ≥0 |
| 月固定支出 | number | 元/月 | ≥0 |
| 现有月还款 | number | 元/月 | ≥0 |
| 偏好档位 | enum | — | conservative/balanced/aggressive |

## 5. 核心算法

### 5.1 折现率（机会成本）

```
保守档:  3.0% （货币基金/活期级）
平衡档:  LPR 1Y （实时拉取；兜底 3.45%）
进取档:  7.0% （股票型基金长期预期）
```

用户在结果页可切换档位重算（不重新调用 LLM）。LPR 拉取失败时使用内置兜底值，并在顶部 banner 提示，允许手动覆盖。

### 5.2 现金流构成（按年）

```
现金流入(每年):  年经济收益 + 年情绪收益
年情绪收益    = (月收入 × 情绪评分/10) ÷ 使用年限

现金流出(每年):  年维护成本
                + 月供 × 12        （仅分期）
t=0 流出:        全款额 或 首付
期末流入(t=N):   残值（同样需折现）
```

### 5.3 四大指标

| 指标 | 公式 | 健康阈值 |
|---|---|---|
| **NPV** | Σ_{t=1..N}(净现金流_t / (1+r)^t) - 初始流出 + 残值/(1+r)^N | NPV ≥ 0 |
| **购买力压力系数** | 购买价 ÷ (年收入 + 储蓄×0.3) | <0.30 健康；0.30–0.50 一般；>0.50 危险 |
| **现金流冲击（剩余应急月数）** | (储蓄 - 首付/全款) ÷ 月支出 | ≥6 健康；3–6 一般；<3 危险 |
| **单位使用成本（年）** | (购买价 + 年维护成本 × 使用年限 - 残值) ÷ 使用年限 | 与年经济收益对比 |

### 5.4 归一化与综合评分

每项指标分段线性映射到 0–100：

```
NPV 子分:
   NPV ≥ 购买价×0.3  → 100
   NPV ∈ [0, 购买价×0.3] → 60 + 40×(NPV / (购买价×0.3))
   NPV ∈ [-购买价×0.5, 0] → 60×(1 + NPV/(购买价×0.5))
   NPV < -购买价×0.5 → 0

现金流冲击子分（剩余应急月数 m）:
   m ≥ 12 → 100
   m ∈ [6,12] → 80 + 20×(m-6)/6
   m ∈ [3,6] → 50 + 30×(m-3)/3
   m ∈ [0,3] → 20×(m/3)
   m < 0 → 0

购买力压力子分（系数 p）:
   p ≤ 0.15 → 100
   p ∈ [0.15, 0.30] → 80 + 20×(0.30-p)/0.15
   p ∈ [0.30, 0.50] → 50 + 30×(0.50-p)/0.20
   p ∈ [0.50, 1.0]  → 50×(1.0-p)/0.5
   p > 1.0 → 0

单位使用成本子分:
   令 ratio = 年经济收益 / 年单位使用成本
   ratio ≥ 1.5 → 100
   ratio ∈ [1.0, 1.5] → 70 + 30×(ratio-1.0)/0.5
   ratio ∈ [0.5, 1.0] → 40 + 30×(ratio-0.5)/0.5
   ratio < 0.5 → 40×ratio/0.5
```

综合评分：

```
综合分 = 0.40 × NPV子分
       + 0.25 × 现金流冲击子分
       + 0.20 × 购买力压力子分
       + 0.15 × 单位使用成本子分

档位:
  ≥ 75  → "推荐购买"
  50–75 → "谨慎考虑"
  < 50  → "不推荐"
```

## 6. 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      Browser (纯前端 SPA)                         │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │  InputForm   │ -> │  Calculator  │ -> │   ResultPanel    │   │
│  │  (表单+校验)  │    │  (本地算法)   │    │ (评分+雷达+点评)  │   │
│  └──────────────┘    └──────┬───────┘    └────────┬─────────┘   │
│                             │                     │             │
│                     ┌───────▼───────┐     ┌───────▼───────┐     │
│                     │  RateService  │     │  LLMService   │     │
│                     │ (LPR 拉取)    │     │ (流式调用)     │     │
│                     └───────┬───────┘     └───────┬───────┘     │
└─────────────────────────────┼─────────────────────┼─────────────┘
                              │                     │
                  ┌───────────▼─────┐    ┌──────────▼──────────┐
                  │ LPR JSON 接口   │    │ Claude/OpenAI/      │
                  │ (含兜底)        │    │ DeepSeek API        │
                  └─────────────────┘    └─────────────────────┘
```

### 6.1 模块职责

| 模块 | 文件位置 | 职责 |
|---|---|---|
| `InputForm` | `src/components/InputForm.tsx` | 全部字段、分组卡片、zod 校验、提交 |
| `Calculator` | `src/lib/calculator.ts` | **纯函数**，输入 `DecisionInput` + 折现率，输出 `ScoreReport` |
| `RateService` | `src/lib/rateService.ts` | 拉取 LPR，24h 缓存到 localStorage，失败兜底 |
| `LLMService` | `src/lib/llmService.ts` | 三 Provider 适配，prompt 模板，SSE 流式 |
| `ResultPanel` | `src/components/ResultPanel.tsx` | 评分环、雷达图、流式点评、档位切换 |
| `SettingsDialog` | `src/components/SettingsDialog.tsx` | API Key、Provider、利率手动覆盖 |

### 6.2 关键类型（TypeScript）

```ts
type DecisionInput = {
  itemName: string;
  price: number;
  usageYears: number;
  purpose: string;
  annualEconomicReturn: number;
  emotionScore: number;
  annualMaintenance: number;
  salvageValue: number;
  financing: { type: 'cash' } | { type: 'loan'; rate: number; termMonths: number; downPayment: number };
  age: number;
  monthlyIncome: number;
  savings: number;
  monthlyExpense: number;
  monthlyDebtPayment: number;
  riskProfile: 'conservative' | 'balanced' | 'aggressive';
};

type Subscores = { npv: number; runway: number; pressure: number; perYear: number };

type ScoreReport = {
  discountRate: number;
  rawMetrics: {
    npv: number;
    pressureRatio: number;
    runwayMonths: number;
    annualUnitCost: number;
  };
  subscores: Subscores;
  compositeScore: number;
  verdict: '推荐购买' | '谨慎考虑' | '不推荐';
  diagnostics: string[];   // 结构化要点供 LLM 引用
};

type LLMSettings = {
  provider: 'claude' | 'openai' | 'deepseek' | 'custom-openai-compat';
  apiKey: string;
  baseURL?: string;
  model?: string;
  rememberKey: boolean;
};
```

## 7. 数据流

```
1) 加载页面
   └─ RateService.fetchLPR()
        └─ 成功: 缓存 24h
        └─ 失败: 用兜底值 + 顶部黄色提示

2) 用户填表 → 点击"开始分析"
   ├─ zod 校验
   ├─ Calculator.compute(input, discountRate)
   ├─ 立即渲染评分环 + 雷达图（毫秒级）
   └─ LLMService.streamReview(input, scoreReport)
        └─ SSE 流式追加到点评区

3) 用户切换档位 / 改输入 → 仅本地重算
   └─ "重新生成点评"按钮显式触发 LLM
```

## 8. LLM Prompt 设计（要点）

```
system:
  你是一位理性的个人理财顾问。基于用户提供的财务计算结果，
  给出建设性的购买建议。语气友好但坦诚，不奉承。

user payload (JSON):
  {
    input: <DecisionInput>,
    metrics: <ScoreReport.rawMetrics>,
    subscores: <ScoreReport.subscores>,
    compositeScore, verdict, diagnostics
  }

要求输出:
  1. 一段 80-150 字的整体判断
  2. 三条具体建议（如有风险点请直接指出）
  3. 一条"如果你仍要买"的优化建议（如选择残值更高的品牌、延后购买等）
```

## 9. 错误处理

| 场景 | 处理 |
|---|---|
| LPR API 失败 | 兜底值 + 顶部黄色 banner，允许手动覆盖 |
| LLM API 失败/超时 | 评分照常显示；点评区"模型调用失败 [重试]"按钮 |
| 未配置 API Key | 评分照常显示；点评区显示"请先配置 API Key" + 跳转 |
| 字段校验失败 | 表单内联红色提示，禁用提交 |
| NaN/Infinity | 显示"—"，诊断列表中标注，不崩页 |

## 10. 测试策略

| 层 | 工具 | 覆盖 |
|---|---|---|
| 单元 | Vitest | `Calculator` 每个公式 + 边界值（0、负数、极大值）；归一化分段函数；NPV 现金流求和 |
| 组件 | Vitest + Testing Library | `InputForm` 校验、`ResultPanel` 不同 `ScoreReport` 下的渲染 |
| 集成（mock fetch） | Vitest | `RateService` 成功/失败/缓存命中；`LLMService` SSE 拼接、超时、重试 |
| E2E（可暂缓） | Playwright | 完整路径：填表 → 计算 → 点评 → 切换档位 |

最低覆盖目标：`Calculator` 100% 行覆盖，其他模块 ≥70%。

## 11. 项目结构（建议）

```
src/
  App.tsx
  main.tsx
  components/
    InputForm/
      index.tsx
      ItemSection.tsx
      FinanceSection.tsx
      PreferenceSection.tsx
    ResultPanel/
      index.tsx
      ScoreRing.tsx
      RadarChart.tsx
      LLMReview.tsx
    SettingsDialog.tsx
    RateBanner.tsx
  lib/
    calculator.ts        // 纯函数核心算法
    rateService.ts
    llmService.ts
    schema.ts            // zod schema + 类型推导
  hooks/
    useLPR.ts
    useLLMStream.ts
  styles/
    globals.css
tests/
  calculator.test.ts
  rateService.test.ts
  llmService.test.ts
  components/...
```

## 12. 开放问题 / 风险

1. **LPR 数据源 CORS**：人民银行官网无开放 API，需选择第三方 CORS 友好接口或采用"前端硬编码 + 半月一次手动更新"的兜底方案。MVP 实施时再评估具体接口。
2. **Provider 适配**：Claude 与 OpenAI 协议不同，需在 `LLMService` 内做轻量适配层。
3. **大模型流式跨域**：Claude API 已支持 CORS（带 `anthropic-dangerous-direct-browser-access` 头）；OpenAI 与 DeepSeek 也支持浏览器直接调用。

## 13. 验收标准

- 所有输入字段都能正确收集与校验
- 四大指标计算与文档公式逐字一致（通过单测验证）
- 雷达图与评分环正确呈现 4 个子分
- 三种 Provider 都可成功流式调用并显示点评
- LPR API 失败时不影响主流程
- 综合分边界值 75/50 触发正确的 verdict 文案
