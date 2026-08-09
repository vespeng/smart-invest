# SmartInvest · 智能投资终端

> 基于 Next.js 16 + React 19 的股票与基金智能推荐及分析 Dashboard，聚合实时行情、财经新闻与 AI 投研助手，提供一站式研究参考。

数据全部来自开放公开接口（无需 TUSHARE、无需付费 Token），AI 部分兼容任意 OpenAI 协议端点（DeepSeek、通义千问、智谱 GLM、Moonshot、SiliconFlow、OpenAI 等）。

---

## 核心特性

- **市场大盘**：覆盖内地（上证 / 深证 / 创业板 / 科创 50）、港交所（恒生系列）、纳斯达克三大区域指数，支持 tab 切换。
- **新闻驱动机会**：AI 基于实时新闻与量价数据自动生成最多 12 条投资机会，按风险等级分桶展示（买入 / 观望 / 规避），支持股票 / 基金 tab 切换与分页。
- **自选资产**：动态拉取新浪 A 股涨幅榜前 6 名与主流 ETF 实时涨幅前 6 名，无需手动维护。
- **AI 研究助手**：侧边栏对话式交互，自动注入实时行情 + 新闻上下文，返回结构化推荐（含目标价、止损、建仓时机）。
- **资产详情**：点击任意标的查看完整研报（推荐理由、买入区间、目标价、止损位、建仓时机、关联新闻）。
- **主题切换**：深色 / 浅色双主题，根据时段自动生成问候语。
- **可视化**：基于 Recharts 的轻量趋势图，基于 lucide-react 的图标系统。
- **本地持久化**：通过 Zustand persist 中间件保存数据刷新间隔与 AI 配置。
- **自动刷新**：可配置的轮询间隔（默认 60 秒，最小 10 秒）。
- **容错降级**：行情 / 新闻 / AI 任一失败均不阻塞主流程，自动降级到兜底数据或空数组。

---

## 技术栈

| 分类 | 选型 |
| --- | --- |
| 框架 | Next.js 16（App Router, Turbopack, standalone 输出） |
| UI | React 19、Tailwind CSS 3.4、lucide-react、Recharts 2 |
| 状态 | Zustand 5（持久化）、TanStack Query 5（服务端状态） |
| 类型 | TypeScript 5.7 |
| AI | OpenAI SDK 4（兼容任意 OpenAI 协议端点） |
| 包管理 | pnpm |
| 部署 | Docker（多阶段构建）、docker-compose |

---

## 数据源

所有数据源均为开放公开接口，**无需 Token、无需 TUSHARE**。

| 数据 | 接口 | 说明 |
| --- | --- | --- |
| 实时行情 | `https://qt.gtimg.cn/q=sh600519,sz300750,...` | 腾讯公开接口，返回 GBK 编码文本，支持批量 |
| 日 K 线 | `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=sh600519,day,,,N,qfq` | 腾讯前复权日 K |
| A 股涨幅榜 | `https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData` | 新浪涨幅榜，返回标准 JSON |
| 财经新闻 | `https://zhibo.sina.com.cn/api/zhibo/feed?zhibo_id=152` | 新浪财经 7x24 全球实时直播 |
| AI | 任意 OpenAI 兼容端点 | 默认 DeepSeek，可切换通义 / 智谱 / Moonshot / SiliconFlow / OpenAI |

> 内置 ETF 候选池包含 23 只主流内地 ETF（沪深 300、50、中证 500/1000、科创 50/100、创业板、券商、银行、医药、军工、半导体、新能源车、光伏、5G、酒、农业等），按实时涨幅动态排名取前 6。

---

## 项目结构

```
smart-invest/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── stock/route.ts        # 仪表盘 + 搜索接口
│   │   │   ├── news/route.ts         # 新闻接口
│   │   │   └── ai/chat/route.ts      # AI 对话接口
│   │   ├── layout.tsx                # 根布局
│   │   ├── page.tsx                  # 仪表盘主页
│   │   └── globals.css               # 全局样式 + 主题变量
│   ├── components/
│   │   ├── chat/ChatSidebar.tsx      # AI 研究助手侧边栏
│   │   ├── dashboard/
│   │   │   ├── MarketOverview.tsx    # 市场大盘
│   │   │   ├── NewsInsights.tsx      # 新闻驱动机会
│   │   │   ├── AssetGrid.tsx         # 自选资产网格
│   │   │   └── AssetCard.tsx         # 资产卡片
│   │   ├── detail/AssetDetail.tsx    # 资产详情抽屉
│   │   ├── settings/SettingsModal.tsx# 设置弹窗
│   │   ├── providers/QueryProvider.tsx
│   │   └── ui/                       # Badge、Panel 等基础组件
│   ├── services/
│   │   ├── market.ts                 # 行情服务（腾讯 + 新浪）
│   │   ├── news.ts                   # 新闻服务（新浪 7x24）
│   │   ├── ai.ts                     # AI 服务（对话 + Insights 生成）
│   │   └── mock-data.ts              # 兜底 Mock 数据
│   ├── store/useConfigStore.ts       # Zustand 配置存储
│   ├── types/index.ts                # 全局类型定义
│   └── lib/utils.ts                  # 工具函数
├── public/                            # 静态资源
├── Dockerfile                         # 多阶段构建
├── docker-compose.yml                 # 容器编排
├── next.config.mjs                    # standalone 输出
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 快速开始

### 环境要求

- Node.js ≥ 20
- pnpm（推荐）/ npm / yarn

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制示例文件并填入 AI 凭据（行情与新闻无需 Token）：

```bash
cp .env.local.example .env.local
```

`.env.local` 内容示例：

```env
# 行情与新闻无需任何 Token，以下仅需配置 AI 部分
AI_API_KEY=sk-xxxxxxxxxxxxxxxx
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-v4-flash
AI_TEMPERATURE=0.2
```

可选 AI 端点速查：

| 厂商 | AI_BASE_URL | AI_MODEL |
| --- | --- | --- |
| DeepSeek | `https://api.deepseek.com` | `deepseek-v4-flash` |
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` |
| 智谱 GLM | `https://open.bigmodel.cn/api/paas/v4` | `glm-4-flash` |
| Moonshot | `https://api.moonshot.cn/v1` | `moonshot-v1-8k` |
| SiliconFlow | `https://api.siliconflow.cn/v1` | `Qwen/Qwen2.5-7B-Instruct` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |

> 未配置 `AI_API_KEY` 时，AI 对话与 Insights 自动降级为 Mock 模式，行情与新闻照常工作。

### 3. 启动开发服务

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可。

### 4. 生产构建

```bash
pnpm build
pnpm start
```

---

## Docker 部署

项目已内置多阶段 Dockerfile（基于 `node:20-alpine`，输出 standalone 产物）。

```bash
# 直接构建并运行
docker compose up -d --build

# 或仅传递环境变量
AI_API_KEY=sk-xxx docker compose up -d --build
```

容器启动后访问 [http://localhost:3000](http://localhost:3000)。

`docker-compose.yml` 已将 `.env.local` 中的 AI 变量透传到容器，行情与新闻接口无需额外配置。

---

## API 接口

| 路径 | 方法 | 说明 |
| --- | --- | --- |
| `/api/stock` | GET | 返回完整仪表盘数据（行情 + 新闻 + AI Insights），支持 `?q=关键词` 搜索资产 |
| `/api/news` | GET | 返回最新 12 条财经新闻（含情感分析、关联代码、相对时间） |
| `/api/ai/chat` | POST | AI 对话接口，body: `{ message, config?, context? }`，未传 context 时自动拉取实时行情 |

---

## 配置项

通过页面右上角设置按钮可视化配置，存储于浏览器 `localStorage`：

- **数据源**：自动刷新间隔（10–N 秒，默认 60）
- **AI 模型**：API Key、Base URL、模型名、Temperature

> 服务端环境变量优先于浏览器配置；浏览器中的 API Key 仅用于本地开发便利，生产环境应通过 `.env.local` 或容器环境变量注入。

---

## AI Insights 机制

- **自动生成**：每次刷新仪表盘时，若已配置 `AI_API_KEY`，后台会基于当前实时行情 + 新闻生成最多 12 条结构化推荐。
- **10 分钟缓存**：避免重复调用 AI，结果在内存中缓存 10 分钟。
- **风险分桶**：前端按 `action` 与 `riskLevel` 自动归类到「买入 / 观望 / 规避」三栏。
- **类型均衡**：Prompt 强制要求股票与基金各约占一半，确保 tab 切换时两侧均有内容。
- **失败降级**：AI 请求失败时返回空数组，不阻塞仪表盘渲染。

---

## 容错与降级

| 模块 | 失败行为 |
| --- | --- |
| 行情接口 | 新浪涨幅榜失败 → 使用内置兜底自选（茅台 / 宁德 / 中芯 / 比亚迪 / 创业板 ETF / 沪深 300 ETF） |
| 新闻接口 | 失败 → 使用 Mock 新闻 |
| AI Insights | 失败 → 返回空数组，仪表盘其余部分正常 |
| AI 对话 | 失败 → 返回明确的错误提示，不伪装成实时结果 |

---

## 可用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发服务（Turbopack 热更新） |
| `pnpm build` | 生产构建 |
| `pnpm start` | 启动生产服务 |
| `pnpm typecheck` | TypeScript 类型检查 |

---

## 免责声明

- 本项目所有数据与 AI 生成内容**仅供研究参考，不构成任何投资建议**。
- 实时行情存在延迟，请以券商终端为准。
- AI 推荐可能存在偏差，据此交易风险自担。
- 开放接口可能因源站策略调整而失效，本项目不保证数据可用性。

---

## License

MIT
