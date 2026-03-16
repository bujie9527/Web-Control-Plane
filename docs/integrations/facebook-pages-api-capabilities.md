# Facebook Pages API 能力总结

> 基于 [Facebook Pages API 官方文档](https://developers.facebook.com/docs/pages-api/) 整理，用于「Facebook 公共主页运营」项目真实接入参考。

---

## 一、API 定位与认证

- **定位**：Facebook Pages API 是 Meta 提供的 Graph API 端点集合，用于创建和管理公共主页的设置与内容。
- **认证**：通过 **Access Token** 认证；多数端点需要 **Page Access Token**（按 Page + 用户 + App 唯一，有过期时间）。
- **获取 Token**：用户需对主页拥有权限或具备相应 **Task**；通过 **Facebook Login for Business** 向用户请求权限并获取 Token。
- **速率限制**：所有 Pages 端点均受 [Rate Limiting](https://developers.facebook.com/docs/graph-api/overview/rate-limiting#pages) 约束，可在 App Dashboard 查看调用消耗。

---

## 二、能力模块总览

| 模块 | 能力摘要 | 典型用途 |
|------|----------|----------|
| **Manage a Page** | 获取可管理的主页列表、Token、Task；主页详情与设置；Meta 建议变更；评价；拉黑用户 | 多主页管理、配置与治理 |
| **Posts** | 发布/获取/更新/删除帖子；发图文、链接；定时发布；受众定向 | 内容发布与排期 |
| **Comments & @Mentions** | 对帖子/评论回复；@提及用户或主页 | 互动与客服 |
| **Insights** | 主页与帖子级指标（曝光、互动等）；支持日/周/28 天/终身 | 数据与报表 |
| **Webhooks** | 实时订阅 feed / messages 变更 | 事件驱动与自动化 |
| **Pages Search** | 按关键词搜索主页（名称、位置等）；用于 @Mention、品牌内容 | 发现与引用主页 |
| **Page Integrity & Webhook** | 主页诚信与相关 Webhook | 合规与风控 |

---

## 三、Task（任务）与权限

用户对主页的 **Task** 决定可调用的能力范围：

| Task | 允许的操作 |
|------|------------|
| **ADVERTISE** | 创建广告、未发布帖子；若连接了 Instagram 可创建广告 |
| **ANALYZE** | 查看谁发布了帖子/评论、查看 Insights |
| **CREATE_CONTENT** | 以主页身份在主页上发布内容 |
| **MANAGE** | 分配与管理主页 Task |
| **MANAGE_LEADS** | 查看与管理线索 |
| **MESSAGING** | 以主页身份发送消息（Messenger） |
| **MODERATE** | 删除/回复帖子评论；若连接 Instagram 可发内容、回复/删评、发私信、同步联系信息、创建广告 |
| **VIEW_MONETIZATION_INSIGHTS** | 查看变现洞察 |

若用户在 UI 中被设为主页 **Admin**，则拥有上述全部 Task。

---

## 四、Manage a Page（主页管理）

- **获取可管理的主页列表**  
  - `GET /user_id/accounts`（User Access Token）  
  - 返回：每页的 `id`、`name`、`access_token`、`tasks`、`category`、`category_list` 等。
- **获取他人 Task**  
  - 具备 `MANAGE` 时：`GET /page_id/roles`，可查看其他人及其在该页的 Task。
- **主页详情**  
  - 具备 `MANAGE` 或 Page Public Content Access：`GET /page_id?fields=about,attire,bio,location,parking,hours,emails,website` 等。
- **更新主页详情**  
  - 具备 `MANAGE`：`POST /page_id`，可更新如 `about` 等字段。
- **Meta 建议变更**  
  - 订阅 `page_upcoming_change` / `page_change_proposal` Webhook 接收建议；可 `POST /page_change_proposal_id` 传入 `accept: true/false` 接受或拒绝。
- **主页设置**  
  - `GET /page_id/settings` 获取设置列表；`POST /page_id/settings` 更新（如 `USERS_CAN_POST`、`USERS_CAN_MESSAGE`、`USERS_CAN_POST_PHOTOS` 等）。
- **评价（Reviews）**  
  - `GET /page_id/ratings`：评价者、PSID、`review_text`、`recommendation_type`（positive/negative）、`created_time`。
- **拉黑用户**  
  - `POST /page_id/blocked`，`user` 为要拉黑的用户 Page-Scoped User ID (PSID)。

---

## 五、Posts（帖子）

- **发布帖子**  
  - `POST /page_id/feed`  
  - 参数：`message`、`link`、`published`（true/false）、`scheduled_publish_time`（定时发布，需在请求后 10 分钟～30 天内）。
- **受众定向**  
  - 使用 `targeting.geo_locations` 或 `feed_targeting.geo_locations`（如国家、城市）限制可见范围。
- **发布图片**  
  - `POST /page_id/photos`，`url` 为图片地址；返回 `id`、`post_id`。
- **发布视频**  
  - 见 [Video API - Publishing](https://developers.facebook.com/docs/video-api/guides/publishing)。
- **获取帖子列表**  
  - `GET /page_id/feed`，返回帖子 id、created_time、message 等。
- **更新帖子**  
  - `POST /page_post_id`，仅能更新由本 App 创建的帖子。
- **删除帖子**  
  - `DELETE /page_post_id`。

常用权限：`pages_manage_posts`、`pages_read_engagement`、`pages_manage_engagement`（注：`pages_read_user_engagement` 已被 Meta 弃用，勿再请求）；发视频需 `publish_video`。需具备 `CREATE_CONTENT`、`MANAGE`、`MODERATE` 等 Task。

---

## 六、Comments and @Mentions（评论与@提及）

- **对帖子评论**  
  - `POST /page_post_id/comments`，`message` 为评论内容；评论作者为主页。
- **获取帖子评论**  
  - `GET /page_post_id/comments?fields=from,message`，可得评论者 PSID、姓名、内容、评论 id。
- **对评论回复**  
  - 对某条评论再发评论：`POST /comment_id/comments`（或等效端点），同上用 `message`。
- **@提及（Mention）**  
  - 在 `message` 中用 `@[PSID]` 或 `@[PSID,PSID,PSID]` 提及用户或主页，对方会收到通知。  
  - 仅能 @ 曾在该主页帖子或评论中出现过的用户/主页。  
  - 需 **Page Mentioning** Feature 及 `pages_read_engagement`、`pages_manage_engagement`；用户需具备 `CREATE_CONTENT`、`MODERATE`。

---

## 七、Insights（洞察）

- **主页级指标**  
  - `GET /page_id/insights/{metric-name}` 或 `GET /page_id/insights?metric=metric1,metric2`  
  - 支持周期：`day`、`week`、`days_28` 等。  
  - 示例指标：`page_impressions_unique`（独立曝光）、`page_impressions_paid`（付费曝光）等。
- **帖子级指标**  
  - `GET /page_post_id/insights?metric=post_reactions_like_total,post_reactions_love_total,...`  
  - 支持 `lifetime` 等周期。
- **视频 Ad Breaks 相关**  
  - 主页：如 `page_daily_video_ad_break_ad_impressions_by_crosspost_status`；  
  - 帖子：如 `post_video_ad_break_ad_impressions`（按 day / lifetime）。
- **注意**：需 `read_insights`、`pages_read_engagement`；请求者需具备 `ANALYZE` Task。部分指标将在 2026 年 6 月 15 日后弃用，需参考 [Deprecated Metrics](https://developers.facebook.com/docs/platforminsights/page/deprecated-metrics)。

---

## 八、Webhooks for Pages（实时订阅）

- **订阅对象**：Page；可订阅字段示例：
  - **feed**：帖子、反应、分享等动态变化。
  - **messages**：Messenger 收到消息（详见 [Webhooks for Messenger](https://developers.facebook.com/docs/messenger-platform/webhook#events)）。
- **安装**：主页需「安装」已配置 Webhook 的 App：`POST /page_id/subscribed_apps?subscribed_fields=feed`（或含 `messages`）；需 Page Access Token（用户具备 CREATE_CONTENT/MANAGE/MODERATE，feed 需 `pages_manage_metadata`、`pages_show_list`，messages 需 `pages_messaging` 与 MESSAGING Task）。
- **用途**：用户发帖、评论、点赞等触发实时通知，便于自动回复、工单或数据分析。

---

## 九、Pages Search（主页搜索）

- **请求**：`GET /pages/search?q=关键词&fields=id,name,location,link,...`  
- **用途**：按关键词查主页（名称、位置等）；用于 @Mention、品牌内容标记、竞品/行业分析。  
- **字段示例**：`id`、`name`、`location`（含 city、country、latitude、longitude、state、street、zip）、`link`、`is_eligible_for_branded_content`、`is_unclaimed`、`verification_status` 等。  
- **权限/Feature**：未登录用户做竞争分析需 **Page Public Content Access**；仅查公开元数据可用 **Page Public Metadata Access**；登录用户可用 User Access Token + app secret。

---

## 十、与「Facebook 公共主页运营」项目的映射建议

| 项目需求 | 建议使用的 API 能力 |
|----------|---------------------|
| 多主页统一管理 | Manage a Page：`/user_id/accounts`、每页 Token 与 Task |
| 每日/定期发帖 | Posts：`POST /page_id/feed`、`/page_id/photos`；定时用 `scheduled_publish_time` |
| 互动与回复 | Comments：对帖子/评论回复；@Mentions 定向回复用户 |
| 数据与 KPI | Insights：主页与帖子级指标，按日/周/28 天聚合 |
| 事件驱动（新帖、新评论） | Webhooks：订阅 `feed`（及可选 `messages`） |
| 发现与引用其他主页 | Pages Search：按关键词查主页，用于 @ 或品牌内容 |

---

## 十一、开发前准备

1. **应用与审核**：在 [Meta for Developers](https://developers.facebook.com/) 创建 App；Permissions 与 Features 需通过 [App Review](https://developers.facebook.com/docs/app-review) 才能在正式环境使用。
2. **Pages API 用例（避免 Invalid Scopes）**：若授权时出现 `Invalid Scopes: pages_read_engagement, pages_manage_posts, pages_manage_engagement`，说明这些权限对你的应用尚未生效。须在 **Meta 应用后台** 为应用添加 **Pages API** 或 **「管理主页」（Manage a Page）** 用例，并在该用例下勾选所需权限（如 `pages_show_list`、`pages_read_engagement`、`pages_manage_posts`、`pages_manage_engagement`）。本系统默认仅请求 `pages_show_list`，待用例与权限配置完成后再在平台设置中填写完整 scope。
3. **登录与 Token**：实现 [Facebook Login for Business](https://developers.facebook.com/docs/facebook-login/facebook-login-for-business)，获取 User Access Token，再通过 `/user_id/accounts` 拿到各主页的 Page Access Token。
4. **ID 约定**：与主页互动用户使用 **Page-Scoped User ID (PSID)**，同一用户在不同主页的 PSID 不同；评论、@Mention、拉黑等均使用 PSID。
5. **文档与版本**：当前示例使用 `v25.0`，实际开发请以 [Changelog](https://developers.facebook.com/docs/pages-api/changelog) 与 [Error Codes](https://developers.facebook.com/docs/pages-api/error-codes) 为准。

---

## 参考链接

- [Facebook Pages API 总览](https://developers.facebook.com/docs/pages-api/)
- [Overview](https://developers.facebook.com/docs/pages-api/overview)
- [Get Started](https://developers.facebook.com/docs/pages-api/getting-started)
- [Manage a Page](https://developers.facebook.com/docs/pages-api/manage-pages)
- [Posts](https://developers.facebook.com/docs/pages-api/posts)
- [Comments and @Mentions](https://developers.facebook.com/docs/pages-api/comments-mentions)
- [Page Insights](https://developers.facebook.com/docs/platforminsights/page)
- [Webhooks for Pages](https://developers.facebook.com/docs/pages-api/webhooks-for-pages)
- [Pages Search](https://developers.facebook.com/docs/pages-api/search-pages)
- [Graph API 概览](https://developers.facebook.com/docs/graph-api/)
- [Rate Limiting（含 Pages）](https://developers.facebook.com/docs/graph-api/overview/rate-limiting#pages)
