import { createServer } from "node:http";

const port = 6124;
let pageAvailable = true;

const navigation = [
  menu(1, "首页", "/"),
  menu(2, "企业实力", "/strength"),
  menu(3, "AI 战略", "/ai-strategy"),
  menu(4, "核心能力", "/capabilities"),
  menu(5, "产品矩阵", "/products"),
  menu(6, "解决方案", "/solutions"),
  menu(7, "标杆案例", "/cases"),
  menu(8, "关于我们", "/about"),
  menu(9, "联系我们", "/contact"),
];

const page = {
  layout: { pageType: "HOME", schemaVersion: 1 },
  name: "首页",
  pageKey: "home",
  sections: [
    section("hero", "HeroSection", {
      backgroundImageAlt: "云台数据智能能力示意图",
      backgroundImageUrl: media("hero"),
      mainTitle: "让组织拥有持续进化的数字智能能力",
      primaryButton: action("了解解决方案", "/solutions"),
      secondaryButton: action("预约交流", "/contact"),
      subTitle: "以可信的数据基础和可落地的智能能力，连接业务场景与持续增长。",
    }, {}, { layout: "left", spacing: "large", theme: "dark" }),
    section("metrics", "MetricsSection", {
      summary: "用可验证的数据展示服务能力与实践积累。",
      title: "以成果建立信任",
    }, {
      items: [
        { description: "行业数字化实践经验", unit: "+年", value: "11" },
        { description: "数字化项目建设经验", unit: "+", value: "100" },
        { description: "持续深耕与服务", unit: "大行业", value: "5" },
        { description: "企业智能体产品即将发布", unit: " Agent", value: "AI" },
      ],
    }, { layout: "four-columns", spacing: "standard", theme: "light" }),
    section("image-text", "ImageTextSection", {
      action: action("了解我们", "/about"),
      body: "从数据治理、行业理解到工程交付，持续把复杂问题转化为可运营、可演进的数字能力。",
      imageAlt: "云台数据团队进行方案研讨",
      imageUrl: media("team"),
      summary: "可靠的交付来自完整的方法、稳定的团队和长期主义。",
      title: "可靠的交付来自系统能力",
    }, {}, { layout: "image-right", spacing: "large", theme: "light" }),
    section("ai-cards", "AiCardSection", {
      summary: "将模型、数据和业务流程连接为可持续运行的智能应用。",
      title: "从数字化到智能化",
    }, {
      items: [
        aiCard(1, "Knowledge", "企业知识库", "沉淀组织经验与业务知识", "knowledge"),
        aiCard(2, "Assistant", "AI 业务助手", "辅助日常业务处理与协同", "assistant"),
        aiCard(3, "Analytics", "智能分析", "自动生成分析与决策支持", "analytics"),
        aiCard(4, "Agent", "企业智能体", "推动业务流程智能化与自动化", "agent"),
      ],
    }, { layout: "three-columns", spacing: "large", theme: "dark" }),
    section("capabilities", "CapabilitySection", {
      summary: "构建企业数字化与智能化核心底座。",
      title: "围绕经营管理、数据智能与 AI 应用",
    }, {
      items: [
        capability(1, "企业经营管理能力", ["ERP", "业财一体化", "集团管控", "供应链协同"]),
        capability(2, "数据智能平台能力", ["数据治理", "数据中台", "数据仓库", "BI 分析", "实时数据平台"]),
        capability(3, "AI 创新应用能力", ["企业知识库", "智能问答", "AI 助手", "智能分析", "Agent 平台", "流程智能化"]),
      ],
    }, { layout: "three-columns", spacing: "large", theme: "light" }),
    section("products", "ProductGridSection", {
      summary: "面向多行业场景提供可组合的数据智能产品。",
      title: "产品矩阵",
    }, {
      items: [
        listing(1, "数据治理平台", "统一标准、质量与资产管理", "product-one", "/products/1"),
        listing(2, "企业数据中台", "连接数据资产与业务应用", "product-two", "/products/2"),
        listing(3, "智能分析平台", "让业务洞察更及时、更可信", "product-three", "/products/3"),
      ],
    }, { layout: "three-columns", spacing: "standard", theme: "light" }),
    section("solutions", "SolutionGridSection", {
      summary: "结合行业特点，把技术能力转化为清晰的解决路径。",
      title: "行业解决方案",
    }, {
      items: [
        { customerTags: ["央企", "能源"], description: "贯通生产经营数据，支撑精细化运营。", iconUrl: media("energy"), id: 11, name: "能源行业方案" },
        { customerTags: ["制造业"], description: "连接研发、生产与供应链协同。", iconUrl: media("manufacturing"), id: 12, name: "制造行业方案" },
      ],
    }, { layout: "two-columns", spacing: "standard", theme: "dark" }),
    section("cases", "CaseGridSection", {
      summary: "以真实业务成果验证产品、方案与服务能力。",
      title: "客户实践",
    }, {
      items: [
        { id: 21, keywords: ["制造业"], summary: "构建统一数据底座，提升协同效率。", title: "大型制造集团数字化实践" },
        { id: 22, keywords: ["能源"], summary: "建立经营分析体系，支撑管理决策。", title: "能源企业数据治理实践" },
        { id: 23, keywords: ["医疗"], summary: "连接业务数据，提升服务质量。", title: "医疗行业智能分析实践" },
      ],
    }, { layout: "three-columns", spacing: "standard", theme: "light" }),
    section("contact-cta", "ContactCtaSection", {
      action: action("联系我们", "/contact"),
      summary: "告诉我们你的业务目标，一起梳理合适的数据智能落地路径。",
      title: "从一次交流开始",
    }, {}, { layout: "centered", spacing: "large", theme: "dark" }),
  ],
  seo: {
    description: "武汉云台数据为企业提供可信、可落地的数据智能产品与解决方案。",
    keywords: ["数据智能", "数据治理", "人工智能"],
    title: "武汉云台数据",
  },
};

const strengthPage = {
  layout: { pageType: "STRENGTH", schemaVersion: 1 },
  name: "企业实力",
  pageKey: "strength",
  sections: [
    section("strength-hero", "HeroSection", {
      backgroundImageAlt: "云台数据服务团队交流现场",
      backgroundImageUrl: media("strength-hero"),
      mainTitle: "十余年的行业积累，是持续创新的基础",
      primaryButton: action("预约交流", "/contact"),
      subTitle: "以行业理解、工程交付与长期服务，陪伴企业走向数据智能。",
    }, {}, { layout: "left", spacing: "large", theme: "dark" }),
    section("honors", "LogoWallSection", {
      displayLimit: 6,
      summary: "能力沉淀来自持续服务和专业认可。",
      title: "资质与荣誉",
    }, {
      items: [
        { iconUrl: media("honor-data"), id: 101, name: "数据管理能力成熟度认证" },
        { iconUrl: media("honor-service"), id: 102, name: "数字化服务优秀案例" },
        { iconUrl: media("honor-innovation"), id: 103, name: "科技创新企业认证" },
      ],
    }, { layout: "honor-grid", spacing: "standard", theme: "light" }),
    section("client-logos", "LogoWallSection", {
      displayLimit: 8,
      summary: "服务覆盖能源、制造与公共服务等行业。",
      title: "服务客户",
    }, {
      items: [
        { id: 201, industry: "能源", logoUrl: media("client-energy"), name: "能源行业客户" },
        { id: 202, industry: "制造", logoUrl: media("client-manufacturing"), name: "制造行业客户" },
        { id: 203, industry: "公共服务", logoUrl: media("client-public"), name: "公共服务客户" },
      ],
    }, { layout: "logo-wall", spacing: "standard", theme: "light" }),
    section("strength-metrics", "MetricsSection", {
      summary: "持续在真实业务场景中交付可验证的成果。",
      title: "实力沉淀",
    }, {
      items: [
        { iconUrl: media("metric-service"), id: 301, label: "服务客户", metricValue: "100+" },
        { iconUrl: media("metric-project"), id: 302, label: "项目交付", metricValue: "200+" },
        { iconUrl: media("metric-industry"), id: 303, label: "重点行业", metricValue: "5" },
      ],
    }, { layout: "three-columns", spacing: "large", theme: "light" }),
  ],
  seo: {
    description: "武汉云台数据的企业实力、服务客户与行业积累。",
    keywords: ["企业实力", "数据智能", "行业服务"],
    title: "企业实力｜云台数据",
  },
};

const aiStrategyPage = {
  layout: { pageType: "AI_STRATEGY", schemaVersion: 1 },
  name: "AI 战略",
  pageKey: "ai-strategy",
  sections: [
    section("ai-hero", "HeroSection", {
      backgroundImageAlt: "云台数据 AI 战略示意图",
      backgroundImageUrl: media("ai-hero"),
      mainTitle: "让 AI 能力可靠地进入业务现场",
      primaryButton: action("与 AI 专家交流", "/contact?direction=AI应用开发"),
      subTitle: "以数据治理为基础，把知识、模型与业务流程连接为可持续运行的智能应用。",
    }, {}, { layout: "left", spacing: "large", theme: "dark" }),
    section("ai-strategy-cards", "AiCardSection", {
      summary: "从可验证的业务问题出发，构建可持续运营的 AI 应用能力。",
      title: "AI 战略与实践",
    }, {
      items: [
        aiCard(401, "Knowledge", "企业知识库", "沉淀组织知识，让经验可检索、可复用。", "ai-knowledge"),
        aiCard(402, "Assistant", "AI 业务助手", "协助日常处理与跨部门协同。", "ai-assistant"),
        aiCard(403, "Analytics", "智能分析", "将业务数据转化为可行动的洞察。", "ai-analytics"),
        aiCard(404, "Agent", "企业智能体", "连接规则、工具与流程，推动业务自动化。", "ai-agent"),
      ],
    }, { layout: "two-columns", spacing: "large", theme: "dark" }),
    section("ai-contact", "ContactCtaSection", {
      action: action("预约 AI 应用交流", "/contact?direction=AI应用开发"),
      summary: "告诉我们您的业务目标，一起评估安全、可落地的 AI 应用路径。",
      title: "从一个业务场景开始",
    }, {}, { layout: "centered", spacing: "large", theme: "dark" }),
  ],
  seo: {
    description: "武汉云台数据 AI 战略与企业智能应用实践。",
    keywords: ["AI 战略", "企业智能体", "AI 应用开发"],
    title: "AI 战略｜云台数据",
  },
};

const capabilitiesPage = {
  layout: { pageType: "CAPABILITIES", schemaVersion: 1 },
  name: "核心能力",
  pageKey: "capabilities",
  sections: [
    section("capabilities-hero", "HeroSection", {
      backgroundImageAlt: "云台数据核心能力示意图",
      backgroundImageUrl: media("capabilities-hero"),
      mainTitle: "把数据能力转化为可持续的业务竞争力",
      primaryButton: action("预约交流", "/contact?direction=数据治理"),
      subTitle: "围绕经营管理、数据智能和 AI 应用，形成从规划到交付再到运营的完整能力闭环。",
    }, {}, { layout: "left", spacing: "large", theme: "dark" }),
    section("capability-columns", "CapabilitySection", {
      emptyStateText: "核心能力正在持续完善，欢迎联系我们交流具体场景。",
      summary: "以行业理解、工程能力和长期运营，支撑数字化与智能化的持续演进。",
      title: "覆盖业务与技术的核心能力",
    }, {
      items: [
        capability(501, "企业经营管理能力", ["ERP", "业财一体化", "集团管控", "供应链协同"]),
        capability(502, "数据智能平台能力", ["数据治理", "数据仓库", "BI 分析", "实时数据平台"]),
        capability(503, "AI 创新应用能力", ["企业知识库", "智能问答", "AI 助手", "流程智能化"]),
      ],
    }, { layout: "three-columns", spacing: "large", theme: "light" }),
    section("capabilities-contact", "ContactCtaSection", {
      action: action("讨论您的业务场景", "/contact?direction=数据治理"),
      summary: "告诉我们当前的业务挑战，一起确定可落地的数据智能路径。",
      title: "从清晰的问题开始",
    }, {}, { layout: "centered", spacing: "large", theme: "dark" }),
  ],
  seo: {
    description: "武汉云台数据的经营管理、数据智能与 AI 创新应用能力。",
    keywords: ["核心能力", "数据治理", "企业智能"],
    title: "核心能力｜云台数据",
  },
};

const productsPage = {
  layout: { pageType: "PRODUCTS", schemaVersion: 1 },
  name: "产品矩阵",
  pageKey: "products",
  sections: [
    section("products-hero", "HeroSection", {
      backgroundImageAlt: "云台数据产品矩阵示意图",
      backgroundImageUrl: media("products-hero"),
      mainTitle: "可组合、可持续演进的数据智能产品",
      primaryButton: action("预约交流", "/contact?direction=数据治理"),
      subTitle: "以可信数据基础连接业务系统、分析洞察与智能应用。",
    }, {}, { layout: "left", spacing: "large", theme: "dark" }),
    section("product-grid", "ProductGridSection", {
      emptyStateText: "产品信息正在更新，请稍后再试。",
      summary: "面向企业不同发展阶段，提供可组合的数据智能产品能力。",
      title: "产品矩阵",
    }, {
      items: [
        { detailLink: "/products/1", id: 1, logoUrl: media("product-governance"), name: "数据治理平台", status: "PUBLISHED", subTitle: "统一标准、质量与资产管理" },
        { detailLink: "/products/2", id: 2, logoUrl: media("product-middle-platform"), name: "企业数据中台", status: "PUBLISHED", subTitle: "连接数据资产与业务应用" },
        { detailLink: "/products/3", id: 3, logoUrl: media("product-analytics"), name: "智能分析平台", status: "COMING_SOON", subTitle: "让业务洞察更及时、更可信" },
      ],
    }, { layout: "three-columns", spacing: "large", theme: "light" }),
  ],
  seo: {
    description: "武汉云台数据智能产品矩阵。",
    keywords: ["数据治理", "数据中台", "智能分析"],
    title: "产品矩阵｜云台数据",
  },
};

const solutionsPage = {
  layout: { pageType: "SOLUTIONS", schemaVersion: 1 },
  name: "解决方案",
  pageKey: "solutions",
  sections: [
    section("solutions-hero", "HeroSection", {
      backgroundImageAlt: "云台数据行业解决方案交流现场",
      backgroundImageUrl: media("solutions-hero"),
      mainTitle: "让数据智能贴近每一个行业的真实问题",
      primaryButton: action("预约交流", "/contact"),
      subTitle: "从业务痛点、数据基础到持续运营，形成适配行业场景的解决路径。",
    }, {}, { layout: "left", spacing: "large", theme: "dark" }),
    section("solution-grid", "SolutionGridSection", {
      emptyStateText: "行业解决方案正在更新，请稍后再试。",
      summary: "围绕典型业务场景，提供清晰、可执行的数据智能解决路径。",
      title: "行业解决方案",
    }, {
      items: [
        {
          customerTags: ["央企", "能源"],
          description: "贯通生产经营数据，支撑精细化运营与安全管理。",
          iconUrl: media("solution-energy"),
          id: 11,
          name: "能源行业解决方案",
        },
        {
          customerTags: ["制造业", "集团企业"],
          description: "连接研发、生产与供应链协同，提升经营响应效率。",
          iconUrl: media("solution-manufacturing"),
          id: 12,
          name: "制造行业解决方案",
        },
      ],
    }, { layout: "two-columns", spacing: "large", theme: "light" }),
  ],
  seo: {
    description: "云台数据行业解决方案，帮助企业将数据智能落地到真实业务场景。",
    keywords: ["行业解决方案", "能源数字化", "制造数字化"],
    title: "行业解决方案｜云台数据",
  },
};

const casesPage = {
  layout: { pageType: "CASES", schemaVersion: 1 },
  name: "客户案例",
  pageKey: "cases",
  sections: [
    section("cases-hero", "HeroSection", {
      backgroundImageAlt: "云台数据客户项目交流现场",
      backgroundImageUrl: media("cases-hero"),
      mainTitle: "以真实业务成果验证数据智能的价值",
      primaryButton: action("预约交流", "/contact"),
      subTitle: "从项目背景到持续成效，呈现面向复杂业务场景的实施经验。",
    }, {}, { layout: "left", spacing: "large", theme: "dark" }),
    section("case-grid", "CaseGridSection", {
      emptyStateText: "客户案例正在更新，请稍后再试。",
      summary: "通过真实项目，了解数据智能如何支持业务协同与经营决策。",
      title: "客户案例",
    }, {
      items: [
        {
          detailLink: "/cases/21",
          id: 21,
          keywords: ["制造业", "数据治理"],
          summary: "构建统一数据底座，提升跨部门协同与经营分析效率。",
          thumbnailUrl: media("case-manufacturing"),
          title: "大型制造集团数据智能实践",
        },
        {
          detailLink: "/cases/22",
          id: 22,
          keywords: ["能源", "经营分析"],
          summary: "建立面向经营管理的分析体系，支撑持续决策优化。",
          thumbnailUrl: media("case-energy"),
          title: "能源企业数据治理实践",
        },
      ],
    }, { layout: "two-columns", spacing: "large", theme: "light" }),
  ],
  seo: {
    description: "云台数据客户案例，展示数据智能在真实业务场景中的实践成果。",
    keywords: ["客户案例", "数据治理案例", "行业数字化"],
    title: "客户案例｜云台数据",
  },
};

const aboutPage = {
  layout: { pageType: "ABOUT", schemaVersion: 1 },
  name: "关于我们",
  pageKey: "about",
  sections: [
    section("about-hero", "HeroSection", {
      backgroundImageAlt: "云台数据研发团队协作现场",
      backgroundImageUrl: media("about-hero"),
      mainTitle: "以数据智能，让组织持续进化",
      primaryButton: action("与我们交流", "/contact"),
      subTitle: "我们以行业理解、技术研发和工程实践，长期陪伴企业构建可持续的数字智能能力。",
    }, {}, { layout: "left", spacing: "large", theme: "dark" }),
    section("research-system", "ImageTextSection", {
      action: action("了解核心能力", "/capabilities"),
      body: "以业务场景为起点，连接数据治理、工程交付与人工智能应用，让研发成果能够稳定进入真实运营。",
      imageAlt: "云台数据研发体系示意",
      imageUrl: media("about-research"),
      summary: "创新不是孤立的技术尝试，而是持续服务业务的系统能力。",
      title: "面向业务价值的创新研发体系",
    }, {}, { layout: "image-right", spacing: "large", theme: "dark" }),
    section("university-partners", "LogoWallSection", {
      displayLimit: 6,
      summary: "与高校及科研伙伴保持长期交流，共同推进前沿能力的工程化落地。",
      title: "合作高校与科研伙伴",
    }, {
      items: [
        { id: 301, industry: "联合研究与人才交流", logoUrl: media("partner-university-a"), name: "合作高校 A" },
        { id: 302, industry: "数据智能联合课题", logoUrl: media("partner-university-b"), name: "合作高校 B" },
        { id: 303, industry: "人工智能应用研究", logoUrl: media("partner-university-c"), name: "合作高校 C" },
      ],
    }, { layout: "logo-wall", spacing: "standard", theme: "light" }),
    section("research-directions", "LogoWallSection", {
      displayLimit: 6,
      summary: "围绕行业数字化与智能化转型，持续沉淀可复用、可演进的技术能力。",
      title: "重点研发方向",
    }, {
      items: [
        { description: "构建可信、可治理的数据基础。", iconUrl: media("direction-data"), id: 311, name: "数据治理与平台" },
        { description: "让分析洞察更及时地服务决策。", iconUrl: media("direction-analytics"), id: 312, name: "实时分析与决策" },
        { description: "连接模型能力与真实业务流程。", iconUrl: media("direction-ai"), id: 313, name: "AI 创新应用" },
      ],
    }, { layout: "honor-grid", spacing: "large", theme: "dark" }),
    section("development-timeline", "TimelineSection", {
      displayLimit: 8,
      summary: "每一步都围绕长期客户价值和可持续服务能力展开。",
      title: "发展历程",
    }, {
      items: [
        { description: "以企业数字化服务为起点，沉淀行业交付经验。", id: "2014", time: "2014", title: "开启数字化实践" },
        { description: "形成面向数据治理与经营分析的系统化能力。", id: "2018", time: "2018", title: "深化数据智能服务" },
        { description: "将 AI 能力引入业务场景，探索可运营的智能应用。", id: "2023", time: "2023", title: "拓展 AI 创新应用" },
      ],
    }, { spacing: "large", theme: "light" }),
    section("values", "LogoWallSection", {
      displayLimit: 6,
      summary: "以长期主义对待客户承诺、技术选择和每一次交付。",
      title: "我们的价值观与承诺",
    }, {
      items: [
        { description: "从业务实效出发，持续创造可衡量的价值。", iconUrl: media("value-practical"), id: 321, name: "务实创造价值" },
        { description: "以开放协作连接客户、伙伴与团队。", iconUrl: media("value-collaboration"), id: 322, name: "开放协同" },
        { description: "对交付质量与长期服务保持责任感。", iconUrl: media("value-responsibility"), id: 323, name: "长期负责" },
      ],
    }, { layout: "honor-grid", spacing: "large", theme: "light" }),
    section("about-contact", "ContactCtaSection", {
      action: action("预约交流", "/contact"),
      summary: "告诉我们你的业务目标，一起探索可持续的数据智能路径。",
      title: "从一次深入交流开始",
    }, {}, { layout: "centered", spacing: "large", theme: "dark" }),
  ],
  seo: {
    description: "了解云台数据的研发体系、合作伙伴、发展历程与长期承诺。",
    keywords: ["关于云台数据", "数据智能研发", "企业数字化"],
    title: "关于我们｜云台数据",
  },
};

const caseDetails = new Map([
  [21, {
    background: "大型制造集团存在数据标准不统一、跨部门协同效率不足的问题。",
    coverUrl: media("case-manufacturing-cover"),
    customerName: "大型制造集团",
    id: 21,
    industry: "制造业",
    result: "形成统一数据底座和经营分析机制，提升关键业务协同效率。",
    seoDescription: "大型制造集团数据智能实践案例。",
    seoTitle: "大型制造集团数据智能实践｜云台数据",
    solution: "围绕数据治理、数据集成和经营分析建立可持续运营的能力体系。",
    status: "PUBLISHED",
    title: "大型制造集团数据智能实践",
  }],
  [22, {
    background: "能源企业需要提升经营数据的及时性与管理决策的可追溯性。",
    coverUrl: media("case-energy-cover"),
    customerName: "能源企业",
    id: 22,
    industry: "能源",
    result: "建立统一指标体系，为经营分析与管理决策提供稳定的数据支持。",
    seoDescription: "能源企业数据治理实践案例。",
    seoTitle: "能源企业数据治理实践｜云台数据",
    solution: "梳理核心业务口径，建设数据治理和经营分析协同机制。",
    status: "PUBLISHED",
    title: "能源企业数据治理实践",
  }],
]);

const productDetails = new Map([
  [1, {
    coverUrl: media("product-governance-cover"),
    description: "统一管理数据标准、质量、资产与安全规则，让数据从可见走向可信、可用。",
    id: 1,
    seoDescription: "云台数据治理平台，帮助企业建立可信的数据基础。",
    seoTitle: "数据治理平台｜云台数据",
    status: "PUBLISHED",
    title: "数据治理平台",
  }],
  [2, {
    coverUrl: media("product-middle-platform-cover"),
    description: "连接数据资产与业务应用，支撑跨部门协同和经营分析。",
    id: 2,
    seoDescription: "云台企业数据中台，连接数据资产与业务应用。",
    seoTitle: "企业数据中台｜云台数据",
    status: "PUBLISHED",
    title: "企业数据中台",
  }],
]);

const solutionDetails = new Map([
  [11, {
    customerTags: ["央企", "能源"],
    description: "贯通生产经营数据，支撑精细化运营与安全管理。",
    detailJson: { description: "贯通生产经营数据，支撑精细化运营与安全管理。" },
    iconUrl: media("solution-energy"),
    id: 11,
    name: "能源行业解决方案",
  }],
]);

const privacyPage = {
  layout: { pageType: "LEGAL", schemaVersion: 1 },
  name: "隐私政策",
  pageKey: "privacy-policy",
  sections: [section("privacy-hero", "HeroSection", {
    mainTitle: "隐私政策",
    subTitle: "我们重视并保护访问者与客户的个人信息。",
  }, {}, { layout: "left", spacing: "large", theme: "light" })],
  seo: { description: "云台数据隐私政策。", keywords: ["隐私政策"], title: "隐私政策｜云台数据" },
};

const termsPage = {
  ...privacyPage,
  name: "服务条款",
  pageKey: "terms-of-service",
  sections: [section("terms-hero", "HeroSection", {
    mainTitle: "服务条款",
    subTitle: "使用本网站前请阅读适用的服务条款。",
  }, {}, { layout: "left", spacing: "large", theme: "light" })],
  seo: { description: "云台数据服务条款。", keywords: ["服务条款"], title: "服务条款｜云台数据" },
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);

  if (url.pathname === "/__health") return send(response, 200, { data: { status: "ok" } });
  if (url.pathname === "/__control") {
    pageAvailable = url.searchParams.get("page") !== "error";
    return send(response, 200, { data: { pageAvailable } });
  }
  if (url.pathname === "/portal/api/site/config") {
    return send(response, 200, { data: {
      brandSlogan: "让数据成为组织持续进化的力量",
      brandTagline: "数据智能产品与解决方案",
      filingNumber: "鄂ICP备00000000号",
      filingUrl: "https://beian.miit.gov.cn",
      logoDarkUrl: media("logo"),
      logoLightUrl: media("logo"),
      privacyPolicyPath: "/legal/privacy",
      seoDescription: "武汉云台数据官网",
      seoKeywords: "数据智能,数据治理",
      siteTitle: "云台数据",
      termsOfServicePath: "/legal/terms",
    } });
  }
  if (url.pathname === "/portal/api/site/navigation") return send(response, 200, { data: navigation });
  if (url.pathname === "/portal/api/contact-info") {
    return send(response, 200, { data: {
      businessPhone: "027-8888 8888",
      contactAddress: "湖北省武汉市",
      contactEmail: "contact@example.com",
    } });
  }
  if (url.pathname === "/portal/api/cooperation-direction-tags") {
    return send(response, 200, { data: [{ tagText: "AI应用开发" }, { tagText: "数据治理" }] });
  }
  const productDetailMatch = url.pathname.match(/^\/portal\/api\/products\/(\d+)$/);
  if (productDetailMatch) {
    const product = productDetails.get(Number(productDetailMatch[1]));
    return product
      ? send(response, 200, { data: product })
      : send(response, 404, { code: 30001, data: null, message: "product not found" });
  }
  const caseDetailMatch = url.pathname.match(/^\/portal\/api\/cases\/(\d+)$/);
  if (caseDetailMatch) {
    const caseDetail = caseDetails.get(Number(caseDetailMatch[1]));
    return caseDetail
      ? send(response, 200, { data: caseDetail })
      : send(response, 404, { code: 30001, data: null, message: "case not found" });
  }
  const solutionDetailMatch = url.pathname.match(/^\/portal\/api\/industry-solutions\/(\d+)$/);
  if (solutionDetailMatch) {
    const solution = solutionDetails.get(Number(solutionDetailMatch[1]));
    return solution
      ? send(response, 200, { data: solution })
      : send(response, 404, { code: 40101, data: null, message: "solution not found" });
  }
  if (url.pathname === "/portal/api/page-builder/pages") {
    if (!pageAvailable) return send(response, 503, { code: 80000, data: null, message: "mock unavailable" });
    const routePath = url.searchParams.get("routePath");
    const pageForRoute = routePath === "/"
      ? page
      : routePath === "/strength"
        ? strengthPage
        : routePath === "/ai-strategy"
          ? aiStrategyPage
          : routePath === "/capabilities"
            ? capabilitiesPage
            : routePath === "/products"
              ? productsPage
              : routePath === "/solutions"
                ? solutionsPage
                : routePath === "/cases"
                  ? casesPage
                  : routePath === "/about"
                    ? aboutPage
                    : routePath === "/legal/privacy"
                      ? privacyPage
                      : routePath === "/legal/terms"
                        ? termsPage
          : null;
    return pageForRoute
      ? send(response, 200, { data: pageForRoute })
      : send(response, 404, { code: 30001, data: null, message: "page not found" });
  }

  return send(response, 404, { code: 404, data: null, message: "not found" });
});

server.listen(port, "127.0.0.1");

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

function send(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function menu(id, menuName, routePath) {
  return { children: [], id, menuName, openInNewTab: false, routePath, targetType: "INTERNAL_ROUTE" };
}

function section(id, component, props, bindingData, style) {
  return { bindingData, component, id, props, style, visible: true };
}

function action(text, routePath) {
  return { enabled: true, openInNewTab: false, routePath, targetType: "INTERNAL_ROUTE", text };
}

function media(name) {
  return `https://cdn.example.com/${name}.svg`;
}

function aiCard(id, englishName, name, description, icon) {
  return { description, englishName, iconUrl: media(icon), id, jumpLink: "/ai-strategy", name };
}

function capability(id, name, items) {
  return { id, items: items.map((item, index) => ({ id: id * 10 + index, name: item })), name };
}

function listing(id, name, abstractText, image, detailLink) {
  return { abstractText, detailLink, id, name, thumbnailUrl: media(image) };
}
