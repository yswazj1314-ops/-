# 固定资产购置决策

一个用于评估大件商品/固定资产是否值得购买的 React 应用。它把购买决策拆成净现值、现金流冲击、购买力压力、单位使用成本等维度，生成综合评分、结论和 AI 顾问点评。

## 功能

- 大件商品购买信息录入
- 全款/分期付款两种融资方式
- LPR 利率读取、24 小时缓存、兜底值和手动覆盖
- NPV、现金流冲击、购买力压力、单位使用成本四项指标计算
- 综合评分环、雷达图和诊断提示
- 可浏览的计算规则弹窗
- OpenAI、Claude、OpenAI-compatible provider 的流式 AI 点评
- API Key 本地保存选项
- 玻璃拟态界面风格

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Hook Form
- Zod
- Recharts
- Vitest

## 本地运行

```bash
npm install
npm run dev
```

默认地址：

```text
http://127.0.0.1:5173/
```

## 测试

```bash
npm test -- --run
```

## 构建

```bash
npm run build
```

构建产物会生成在 `dist/` 目录。该目录默认不提交到 Git。

## AI 点评配置

点击页面右上角的 `API 设置`，可选择：

- OpenAI
- Claude
- OpenAI-compatible provider，例如 DeepSeek 等

API Key 默认只保存在当前浏览器运行时状态。勾选“记住密钥”后，会保存到本地浏览器 `localStorage`。请勿把真实 API Key 写入代码或提交到仓库。

## 计算规则概览

综合评分由四项子分加权得到：

```text
综合评分 = NPV 分 × 40%
        + 现金流冲击分 × 25%
        + 购买力压力分 × 20%
        + 单位使用成本分 × 15%
```

结论阈值：

- `>= 75`：推荐购买
- `50 - 74`：谨慎考虑
- `< 50`：不推荐

页面内的 `计算规则` 弹窗提供了更完整的公式和评分说明。

## 隐私说明

本项目不内置真实 API Key，不上传用户填写的个人财务数据到自有服务器。AI 点评功能会把当前表单数据和计算结果发送给用户配置的模型服务商，请在使用真实 API Key 前确认对应服务商的数据政策。

## 开发备注

- `node_modules/`、`dist/`、`.env`、构建缓存等文件已通过 `.gitignore` 排除
- LPR 默认使用兜底值；如果需要接入公开接口，可通过 `VITE_LPR_API_URL` 覆盖
- 代码中的测试 key 都是占位字符串，不是真实密钥
