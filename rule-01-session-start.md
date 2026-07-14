# 研发工程效能强制规范 - 会话开始与项目接手

> 本文件为全局规则入口文件。Agent 必须在每次新会话开始时首先读取并执行本文件。
> 本文件与其他 6 个规则文件共同构成完整规则体系。
>
> **规则体系总览（9个文件）**：
> 1. **rule-01-session-start.md**（本文件）- 会话开始与项目接手，**入口必读**
> 2. **rule-02-development.md** - 安全红线 + 开发流程 + 架构原则，**编码前必读**
> 3. **rule-02a-frontend-spec.md** - 前端技术规范（命名/TS/组件/API/状态/路由/样式/性能），**前端编码时参考**
> 4. **rule-02b-backend-security.md** - 后端安全审查6维度，**后端项目必读**
> 5. **rule-03-codegraph.md** - CodeGraph代码分析 + 任务分级 + 工程实践触发矩阵，**代码操作前必读**
> 6. **rule-04-testing.md** - 测试验证 + 浏览器验证 + 可观测性，**自测阶段必读**
> 7. **rule-05-git.md** - Git提交规范 + CI/CD + 质量门禁，**提交前必读**
> 8. **rule-06-delivery.md** - 交付审计 + 双Agent审查 + 回滚流程，**完成时必读**
> 9. **rule-07-board.md** - 自动化工作流 + 可视化看板，**贯穿全程**
>
> **阅读顺序建议**：
> - 新会话开始：1 → 2 → 3/4（按需）→ 任务执行
> - 代码操作前：5 → 任务执行 → 6 → 7
> - 任务完成时：6 → 7

## 0. 会话开始强制自动执行（每次新会话必须执行，无需用户提醒）

### 0.1 最高优先级规则

0.1.1 本文件为全局规则入口，优先级高于所有其他规则文件。Agent 每次新会话开始、切换工作区、继续历史任务时，必须首先完整执行本章节所有步骤，不得跳过任何一步。

0.1.2 即使用户的第一条消息是具体任务指令（如"修复这个 bug""帮我加个功能"），也必须先完成本章节全部步骤，再处理用户任务。

### 0.2 自动执行步骤（按顺序，不可跳过）

#### 步骤 1：读取项目记忆
- 调用 `get_project_brief`（workspacePath: 当前工作区根目录，includeRecentHandoffs: true）
- 调用 `search_project_memory` 搜索最近的任务进度、handoff 记录、阻塞问题

#### 步骤 2：检查 Git 状态
- 运行 `git status` 查看当前分支、未提交改动、未跟踪文件
- 运行 `git log --oneline -5` 查看最近提交记录
- 确认当前分支名称，判断是否在 main/master 上

#### 步骤 3：读取核心文档
- 如果项目存在 `docs/PRD.md`，读取了解产品定位
- 如果项目存在 `docs/TECH_DESIGN.md`，读取了解技术方案
- 如果项目存在 `.trae/rules/project_rules.md`，读取项目特定规则

#### 步骤 4：检查项目配置文件
- 识别项目类型和技术栈（读取 package.json / pyproject.toml / go.mod 等）
- 确认 dev、lint、typecheck、test、build 等命令

#### 步骤 5：创建/更新可视化看板
- 检查项目根目录下是否存在 `.board/index.html`
- 如果不存在，自动创建看板文件（模板见 rule-07-board.md）
- 如果存在，读取看板了解当前进度
- 看板路径：`{workspacePath}/.board/index.html`

#### 步骤 6：输出接手摘要
- 当前项目是什么
- 当前 Git 分支
- 当前进度（哪个阶段、哪些模块完成、哪些进行中）
- 下一步要做什么
- 是否有阻塞问题
- 最近一次 handoff 记录的关键信息
- 看板路径：`{workspacePath}/.board/index.html`

### 0.3 摘要输出格式

每次会话开始必须按以下格式输出：

```
【会话接手摘要】
- 项目名称：xxx
- 工作区根目录：xxx
- 当前 Git 分支：xxx
- 技术栈：xxx
- 当前进度：xxx
- 下一步：xxx
- 阻塞问题：有/无（说明）
- 最近 handoff：xxx
```

### 0.4 禁止行为

0.4.1 禁止跳过步骤直接处理用户任务。
0.4.2 禁止不读取项目记忆就开始编码。
0.4.3 禁止不检查 Git 状态就修改文件。
0.4.4 禁止在 main/master 分支上直接开发（除非用户明确允许）。

### 0.5 与项目规则的关系

0.5.1 如果项目存在 `.trae/rules/project_rules.md`，项目规则中的会话开始流程与本规则合并执行，项目规则可以补充但不能削弱本规则的要求。

0.5.2 如果项目规则与本规则冲突，按以下优先级：用户最新明确指令 > 项目规则 > 本全局规则。

### 0.6 工具不可用时的降级

0.6.1 如果 local-project-memory MCP 不可用，必须明确告知用户，并尝试读取项目内 `.trae/memory/` 目录下的记忆文件。

0.6.2 如果 Git 命令不可用，必须明确告知用户。

0.6.3 所有降级情况必须在接手摘要中标注。

---

## 1. 项目接手流程（15 步标准流程）

### 1.1 统一接手流程

任何后续 Agent 接手项目时，必须按以下顺序执行，不得跳过：

1. 读取当前全局规则
2. 识别项目类型和技术栈
3. 读取项目记忆（get_project_brief，传入 workspacePath，includeRecentHandoffs: true）
4. 查看 Git 状态
5. 检查项目配置文件
6. CodeGraph 分析项目结构（codegraph_status → codegraph_files → codegraph_context）
7. 搜索相关项目记忆（search_project_memory）
8. 查找当前任务相关模块
9. 分析上下游调用关系
10. 分析影响范围
11. 确认已有测试和验证方式
12. 判断是否存在扩展点
13. 确认任务规模档位
14. 制定实施计划
15. 输出接手摘要

### 1.2 项目类型识别

必须优先识别当前项目类型，包括但不限于：前端项目、后端项目、全栈项目、移动端项目、Node.js 项目、Python 项目、Java 项目、Go 项目、Rust 项目、PHP 项目、.NET 项目、脚本项目、桌面应用、浏览器插件、小程序、数据工程项目、AI/LLM 项目、MCP 服务项目、爬虫项目、自动化工具项目、微服务项目、单体应用项目。

### 1.3 配置文件优先级

禁止凭经验猜测项目命令。必须优先读取项目根目录和相关子目录中的配置文件判断技术栈、命令和依赖。

优先识别以下文件：
package.json、pnpm-lock.yaml、yarn.lock、package-lock.json、vite.config.*、next.config.*、nuxt.config.*、astro.config.*、tsconfig.json、jsconfig.json、webpack.config.*、rollup.config.*、eslint.config.*、.eslintrc*、prettier.config.*、pyproject.toml、requirements.txt、poetry.lock、Pipfile、setup.py、Cargo.toml、go.mod、pom.xml、build.gradle、settings.gradle、composer.json、Gemfile、Dockerfile、docker-compose.yml、Makefile、Taskfile.yml、turbo.json、nx.json、lerna.json、wrangler.toml、tauri.conf.json

所有 dev、start、lint、typecheck、test、build、format、preview、serve 命令必须从项目配置中确认，不得臆造。

### 1.4 接手禁止行为

- 新 Agent 不得跳过接手分析直接编码
- 新 Agent 不得绕过已有架构另起炉灶
- 新 Agent 不得忽略历史测试和 Git 记录
- 新 Agent 不得删除或弱化已有安全、权限、隔离、审计逻辑
