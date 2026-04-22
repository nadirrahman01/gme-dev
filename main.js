(() => {
  "use strict";

  const CURRENT_DATE = new Date("2026-04-22T12:00:00Z");
  const CACHE_TTL_MS = 72 * 60 * 60 * 1000;
  const STORAGE_PREFIX = "gme_v1_";
  const CORDOBA_LOGO_PATH = "assets/Cordoba Capital Logo (500 x 200 px) (3).png";

  const el = (id) => document.getElementById(id);
  const all = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const state = {
    activeModule: "MONITOR",
    currentCountry: "US",
    peerSet: "global_watch",
    domain: "macro",
    compareA: "KZ",
    compareB: "UZ",
    compareSeries: "inflation",
    chartSeries: "inflation",
    chartSecondarySeries: "",
    chartTransform: "level",
    chartCountries: ["KZ", "UZ"],
    loaded: new Map(),
    loading: new Map(),
    lastWarning: "",
    chart: null
  };

  const COUNTRIES = {
    US: { iso2: "US", wb: "USA", name: "United States", region: "G-20 DM", aliases: ["usa", "us", "united states", "america"] },
    GB: { iso2: "GB", wb: "GBR", name: "United Kingdom", region: "G-20 DM", aliases: ["uk", "gb", "gbr", "united kingdom", "britain"] },
    DE: { iso2: "DE", wb: "DEU", name: "Germany", region: "G-20 DM", aliases: ["de", "deu", "germany"] },
    FR: { iso2: "FR", wb: "FRA", name: "France", region: "G-20 DM", aliases: ["fr", "fra", "france"] },
    JP: { iso2: "JP", wb: "JPN", name: "Japan", region: "G-20 DM", aliases: ["jp", "jpn", "japan"] },
    CN: { iso2: "CN", wb: "CHN", name: "China", region: "G-20 EM", aliases: ["cn", "chn", "china"] },
    IN: { iso2: "IN", wb: "IND", name: "India", region: "G-20 EM", aliases: ["in", "ind", "india"] },
    BR: { iso2: "BR", wb: "BRA", name: "Brazil", region: "G-20 EM", aliases: ["br", "bra", "brazil"] },
    ZA: { iso2: "ZA", wb: "ZAF", name: "South Africa", region: "G-20 EM", aliases: ["za", "zaf", "south africa"] },
    MX: { iso2: "MX", wb: "MEX", name: "Mexico", region: "G-20 EM", aliases: ["mx", "mex", "mexico"] },
    KR: { iso2: "KR", wb: "KOR", name: "South Korea", region: "Asia DM", aliases: ["kr", "kor", "south korea", "korea"] },
    PL: { iso2: "PL", wb: "POL", name: "Poland", region: "Europe EM", aliases: ["pl", "pol", "poland"] },
    TR: { iso2: "TR", wb: "TUR", name: "Turkiye", region: "Europe EM", aliases: ["tr", "tur", "turkey", "turkiye"] },
    NL: { iso2: "NL", wb: "NLD", name: "Netherlands", region: "Europe DM", aliases: ["nl", "nld", "netherlands", "dutch"] },
    KZ: { iso2: "KZ", wb: "KAZ", name: "Kazakhstan", region: "Central Asia EM", aliases: ["kz", "kaz", "kazakhstan"] },
    UZ: { iso2: "UZ", wb: "UZB", name: "Uzbekistan", region: "Central Asia EM", aliases: ["uz", "uzb", "uzbekistan"] },
    KG: { iso2: "KG", wb: "KGZ", name: "Kyrgyzstan", region: "Central Asia EM", aliases: ["kg", "kgz", "kyrgyzstan"] },
    TJ: { iso2: "TJ", wb: "TJK", name: "Tajikistan", region: "Central Asia EM", aliases: ["tj", "tjk", "tajikistan"] },
    TM: { iso2: "TM", wb: "TKM", name: "Turkmenistan", region: "Central Asia EM", aliases: ["tm", "tkm", "turkmenistan"] },
    ID: { iso2: "ID", wb: "IDN", name: "Indonesia", region: "South-East Asia EM", aliases: ["id", "idn", "indonesia"] },
    VN: { iso2: "VN", wb: "VNM", name: "Vietnam", region: "South-East Asia EM", aliases: ["vn", "vnm", "vietnam", "viet nam"] },
    TH: { iso2: "TH", wb: "THA", name: "Thailand", region: "South-East Asia EM", aliases: ["th", "tha", "thailand"] },
    MY: { iso2: "MY", wb: "MYS", name: "Malaysia", region: "South-East Asia EM", aliases: ["my", "mys", "malaysia"] },
    PH: { iso2: "PH", wb: "PHL", name: "Philippines", region: "South-East Asia EM", aliases: ["ph", "phl", "philippines"] },
    SG: { iso2: "SG", wb: "SGP", name: "Singapore", region: "South-East Asia DM", aliases: ["sg", "sgp", "singapore"] },
    PK: { iso2: "PK", wb: "PAK", name: "Pakistan", region: "South Asia EM", aliases: ["pk", "pak", "pakistan"] },
    BD: { iso2: "BD", wb: "BGD", name: "Bangladesh", region: "South Asia EM", aliases: ["bd", "bgd", "bangladesh"] },
    LK: { iso2: "LK", wb: "LKA", name: "Sri Lanka", region: "South Asia EM", aliases: ["lk", "lka", "sri lanka"] },
    MA: { iso2: "MA", wb: "MAR", name: "Morocco", region: "Africa EM", aliases: ["ma", "mar", "morocco"] }
  };

  const COUNTRY_ORDER = [
    "US", "GB", "DE", "FR", "JP", "CN", "IN", "BR", "ZA", "MX", "KR", "PL",
    "TR", "NL", "KZ", "UZ", "KG", "TJ", "TM", "ID", "VN", "TH", "MY", "PH",
    "SG", "PK", "BD", "LK", "MA"
  ];

  const PEER_SETS = {
    global_watch: {
      label: "Global allocator watch",
      countries: ["US", "GB", "DE", "JP", "CN", "IN", "BR", "KZ", "UZ", "ID", "VN", "MY", "PL", "TR"]
    },
    central_asia: {
      label: "Central Asia",
      countries: ["KZ", "UZ", "KG", "TJ", "TM"]
    },
    south_east_asia: {
      label: "South-East Asia",
      countries: ["ID", "VN", "TH", "MY", "PH", "SG"]
    },
    g20_em: {
      label: "G-20 emerging",
      countries: ["CN", "IN", "BR", "ZA", "MX", "TR", "ID"]
    },
    europe_em: {
      label: "Europe EM",
      countries: ["PL", "TR"]
    }
  };

  const SOURCE_TIERS = {
    official: "Tier 1 official domestic",
    institutional: "Tier 2 multilateral/institutional",
    market: "Tier 3 market",
    cordoba: "Tier 4 Cordoba curated"
  };

  const SERIES = [
    {
      id: "gdp_growth",
      label: "Real GDP growth",
      short: "GDP",
      domain: "macro",
      bucket: "Growth",
      wb: "NY.GDP.MKTP.KD.ZG",
      unit: "%",
      decimals: 1,
      frequency: "Annual",
      orientation: "higher-good",
      bestSource: "National statistics office national accounts",
      activeSource: "World Bank WDI API",
      sourceName: "World Bank WDI, compiled from official national accounts",
      sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG",
      tier: SOURCE_TIERS.institutional,
      status: "official"
    },
    {
      id: "inflation",
      label: "Inflation, consumer prices",
      short: "CPI",
      domain: "inflation",
      bucket: "Inflation",
      wb: "FP.CPI.TOTL.ZG",
      unit: "%",
      decimals: 1,
      frequency: "Annual",
      orientation: "higher-bad",
      bestSource: "National statistics office CPI release",
      activeSource: "World Bank WDI API",
      sourceName: "World Bank WDI, compiled from IMF and official CPI sources",
      sourceUrl: "https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG",
      tier: SOURCE_TIERS.institutional,
      status: "official"
    },
    {
      id: "unemployment",
      label: "Unemployment rate",
      short: "Unemp",
      domain: "macro",
      bucket: "Growth",
      wb: "SL.UEM.TOTL.ZS",
      unit: "%",
      decimals: 1,
      frequency: "Annual",
      orientation: "higher-bad",
      bestSource: "National labour statistics release",
      activeSource: "World Bank WDI API",
      sourceName: "World Bank WDI, modelled ILO estimate",
      sourceUrl: "https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS",
      tier: SOURCE_TIERS.institutional,
      status: "modelled"
    },
    {
      id: "broad_money_growth",
      label: "Broad money growth",
      short: "M2 growth",
      domain: "liquidity",
      bucket: "Liquidity",
      wb: "FM.LBL.BMNY.ZG",
      unit: "%",
      decimals: 1,
      frequency: "Annual",
      orientation: "balanced",
      bestSource: "Central bank monetary survey",
      activeSource: "World Bank WDI API",
      sourceName: "World Bank WDI, IMF International Financial Statistics",
      sourceUrl: "https://data.worldbank.org/indicator/FM.LBL.BMNY.ZG",
      tier: SOURCE_TIERS.institutional,
      status: "official"
    },
    {
      id: "broad_money_gdp",
      label: "Broad money",
      short: "M2/GDP",
      domain: "liquidity",
      bucket: "Liquidity",
      wb: "FM.LBL.BMNY.GD.ZS",
      unit: "% GDP",
      decimals: 1,
      frequency: "Annual",
      orientation: "balanced",
      bestSource: "Central bank monetary survey",
      activeSource: "World Bank WDI API",
      sourceName: "World Bank WDI, IMF International Financial Statistics",
      sourceUrl: "https://data.worldbank.org/indicator/FM.LBL.BMNY.GD.ZS",
      tier: SOURCE_TIERS.institutional,
      status: "official"
    },
    {
      id: "private_credit",
      label: "Domestic credit to private sector by banks",
      short: "Private credit/GDP",
      domain: "liquidity",
      bucket: "Credit",
      wb: "FD.AST.PRVT.GD.ZS",
      unit: "% GDP",
      decimals: 1,
      frequency: "Annual",
      orientation: "balanced",
      bestSource: "Central bank banking sector balance sheet",
      activeSource: "World Bank WDI API",
      sourceName: "World Bank WDI, IMF International Financial Statistics",
      sourceUrl: "https://data.worldbank.org/indicator/FD.AST.PRVT.GD.ZS",
      tier: SOURCE_TIERS.institutional,
      status: "official"
    },
    {
      id: "current_account",
      label: "Current account balance",
      short: "CA/GDP",
      domain: "external",
      bucket: "External",
      wb: "BN.CAB.XOKA.GD.ZS",
      unit: "% GDP",
      decimals: 1,
      frequency: "Annual",
      orientation: "higher-good",
      bestSource: "Central bank balance of payments",
      activeSource: "World Bank WDI API",
      sourceName: "World Bank WDI, IMF Balance of Payments",
      sourceUrl: "https://data.worldbank.org/indicator/BN.CAB.XOKA.GD.ZS",
      tier: SOURCE_TIERS.institutional,
      status: "official"
    },
    {
      id: "reserves_months",
      label: "Total reserves in months of imports",
      short: "Reserves",
      domain: "external",
      bucket: "External",
      wb: "FI.RES.TOTL.MO",
      unit: "months",
      decimals: 1,
      frequency: "Annual",
      orientation: "higher-good",
      bestSource: "Central bank international reserves release",
      activeSource: "World Bank WDI API",
      sourceName: "World Bank WDI",
      sourceUrl: "https://data.worldbank.org/indicator/FI.RES.TOTL.MO",
      tier: SOURCE_TIERS.institutional,
      status: "official"
    },
    {
      id: "short_term_debt_reserves",
      label: "Short-term debt to reserves",
      short: "ST debt/reserves",
      domain: "external",
      bucket: "External",
      wb: "DT.DOD.DSTC.IR.ZS",
      unit: "%",
      decimals: 1,
      frequency: "Annual",
      orientation: "higher-bad",
      bestSource: "Debt office and central bank external debt release",
      activeSource: "World Bank WDI API",
      sourceName: "World Bank International Debt Statistics / WDI",
      sourceUrl: "https://data.worldbank.org/indicator/DT.DOD.DSTC.IR.ZS",
      tier: SOURCE_TIERS.institutional,
      status: "official"
    },
    {
      id: "real_interest",
      label: "Real interest rate",
      short: "Real rate",
      domain: "inflation",
      bucket: "Policy",
      wb: "FR.INR.RINR",
      unit: "%",
      decimals: 1,
      frequency: "Annual",
      orientation: "balanced",
      bestSource: "Central bank policy/rates database",
      activeSource: "World Bank WDI API",
      sourceName: "World Bank WDI, IMF International Financial Statistics",
      sourceUrl: "https://data.worldbank.org/indicator/FR.INR.RINR",
      tier: SOURCE_TIERS.institutional,
      status: "official"
    },
    {
      id: "bank_capital_assets",
      label: "Bank capital to assets",
      short: "Capital/assets",
      domain: "banking",
      bucket: "Core health",
      wb: "FB.BNK.CAPA.ZS",
      unit: "%",
      decimals: 1,
      frequency: "Annual",
      orientation: "higher-good",
      bestSource: "Banking supervisor financial soundness indicators",
      activeSource: "World Bank WDI API",
      sourceName: "World Bank WDI, IMF Financial Soundness Indicators",
      sourceUrl: "https://data.worldbank.org/indicator/FB.BNK.CAPA.ZS",
      tier: SOURCE_TIERS.institutional,
      status: "official"
    },
    {
      id: "bank_reg_capital_rwa",
      label: "Bank regulatory capital to risk-weighted assets",
      short: "CAR",
      domain: "banking",
      bucket: "Core health",
      wb: "GFDD.SI.05",
      unit: "%",
      decimals: 1,
      frequency: "Annual",
      orientation: "higher-good",
      bestSource: "Banking supervisor / IMF FSI",
      activeSource: "World Bank GFDD API",
      sourceName: "World Bank GFDD, IMF Financial Soundness Indicators",
      sourceUrl: "https://databank.worldbank.org/metadataglossary/global-financial-development/series/GFDD.SI.05",
      tier: SOURCE_TIERS.institutional,
      status: "official"
    },
    {
      id: "bank_leverage",
      label: "Bank capital to total assets",
      short: "Leverage proxy",
      domain: "banking",
      bucket: "Core health",
      wb: "GFDD.SI.03",
      unit: "%",
      decimals: 1,
      frequency: "Annual",
      orientation: "higher-good",
      bestSource: "Banking supervisor / IMF FSI",
      activeSource: "World Bank GFDD API",
      sourceName: "World Bank GFDD, IMF Financial Soundness Indicators",
      sourceUrl: "https://databank.worldbank.org/metadataglossary/global-financial-development/series/GFDD.SI.03",
      tier: SOURCE_TIERS.institutional,
      status: "official"
    },
    {
      id: "bank_zscore",
      label: "Bank Z-score",
      short: "Z-score",
      domain: "banking",
      bucket: "Core health",
      wb: "GFDD.SI.01",
      unit: "",
      decimals: 1,
      frequency: "Annual",
      orientation: "higher-good",
      bestSource: "World Bank GFDD bank-level aggregation",
      activeSource: "World Bank GFDD API",
      sourceName: "World Bank GFDD, Bankscope and Orbis",
      sourceUrl: "https://databank.worldbank.org/metadataglossary/global-financial-development/series/GFDD.SI.01",
      tier: SOURCE_TIERS.institutional,
      status: "modelled"
    },
    {
      id: "bank_npl",
      label: "Bank nonperforming loans to gross loans",
      short: "NPL",
      domain: "banking",
      bucket: "Asset quality",
      wb: "FB.AST.NPER.ZS",
      unit: "%",
      decimals: 1,
      frequency: "Annual",
      orientation: "higher-bad",
      bestSource: "Banking supervisor financial soundness indicators",
      activeSource: "World Bank WDI API",
      sourceName: "World Bank WDI, IMF Financial Soundness Indicators",
      sourceUrl: "https://data.worldbank.org/indicator/FB.AST.NPER.ZS",
      tier: SOURCE_TIERS.institutional,
      status: "official"
    },
    {
      id: "bank_provisions_npl",
      label: "Provisions to nonperforming loans",
      short: "Provisions/NPL",
      domain: "banking",
      bucket: "Asset quality",
      wb: "GFDD.SI.07",
      unit: "%",
      decimals: 1,
      frequency: "Annual",
      orientation: "higher-good",
      bestSource: "Banking supervisor / IMF FSI",
      activeSource: "World Bank GFDD API",
      sourceName: "World Bank GFDD, IMF Financial Soundness Indicators",
      sourceUrl: "https://databank.worldbank.org/metadataglossary/global-financial-development/series/GFDD.SI.07",
      tier: SOURCE_TIERS.institutional,
      status: "official"
    },
    {
      id: "bank_roa",
      label: "Bank return on assets after tax",
      short: "ROA",
      domain: "banking",
      bucket: "Profitability",
      wb: "GFDD.EI.05",
      unit: "%",
      decimals: 1,
      frequency: "Annual",
      orientation: "higher-good",
      bestSource: "Banking supervisor aggregate income statement",
      activeSource: "World Bank GFDD API",
      sourceName: "World Bank GFDD, Bankscope and Orbis",
      sourceUrl: "https://databank.worldbank.org/metadataglossary/global-financial-development/series/GFDD.EI.05",
      tier: SOURCE_TIERS.institutional,
      status: "modelled"
    },
    {
      id: "bank_roe",
      label: "Bank return on equity after tax",
      short: "ROE",
      domain: "banking",
      bucket: "Profitability",
      wb: "GFDD.EI.06",
      unit: "%",
      decimals: 1,
      frequency: "Annual",
      orientation: "higher-good",
      bestSource: "Banking supervisor aggregate income statement",
      activeSource: "World Bank GFDD API",
      sourceName: "World Bank GFDD, Bankscope and Orbis",
      sourceUrl: "https://databank.worldbank.org/metadataglossary/global-financial-development/series/GFDD.EI.06",
      tier: SOURCE_TIERS.institutional,
      status: "modelled"
    },
    {
      id: "bank_nim",
      label: "Bank net interest margin",
      short: "NIM",
      domain: "banking",
      bucket: "Profitability",
      wb: "GFDD.EI.01",
      unit: "%",
      decimals: 1,
      frequency: "Annual",
      orientation: "balanced",
      bestSource: "Banking supervisor aggregate income statement",
      activeSource: "World Bank GFDD API",
      sourceName: "World Bank GFDD, Bankscope and Orbis",
      sourceUrl: "https://databank.worldbank.org/metadataglossary/global-financial-development/series/GFDD.EI.01",
      tier: SOURCE_TIERS.institutional,
      status: "modelled"
    },
    {
      id: "bank_cost_income",
      label: "Bank cost-to-income ratio",
      short: "Cost/income",
      domain: "banking",
      bucket: "Profitability",
      wb: "GFDD.EI.07",
      unit: "%",
      decimals: 1,
      frequency: "Annual",
      orientation: "higher-bad",
      bestSource: "Banking supervisor aggregate income statement",
      activeSource: "World Bank GFDD API",
      sourceName: "World Bank GFDD, Bankscope and Orbis",
      sourceUrl: "https://databank.worldbank.org/metadataglossary/global-financial-development/series/GFDD.EI.07",
      tier: SOURCE_TIERS.institutional,
      status: "modelled"
    },
    {
      id: "bank_liquid_reserves",
      label: "Bank liquid reserves to bank assets",
      short: "Liquid reserves",
      domain: "banking",
      bucket: "Liquidity and funding",
      wb: "FD.RES.LIQU.AS.ZS",
      unit: "%",
      decimals: 1,
      frequency: "Annual",
      orientation: "higher-good",
      bestSource: "Central bank / IMF IFS banking liquidity",
      activeSource: "World Bank WDI API",
      sourceName: "World Bank WDI, IMF International Financial Statistics",
      sourceUrl: "https://data.worldbank.org/indicator/FD.RES.LIQU.AS.ZS",
      tier: SOURCE_TIERS.institutional,
      status: "official"
    },
    {
      id: "gfdd_private_credit",
      label: "Private credit by deposit money banks to GDP",
      short: "Bank credit/GDP",
      domain: "banking",
      bucket: "Systemic vulnerability",
      wb: "GFDD.DI.01",
      unit: "% GDP",
      decimals: 1,
      frequency: "Annual",
      orientation: "balanced",
      bestSource: "BIS credit database / central bank credit aggregates",
      activeSource: "World Bank GFDD API",
      sourceName: "World Bank GFDD",
      sourceUrl: "https://databank.worldbank.org/source/global-financial-development",
      tier: SOURCE_TIERS.institutional,
      status: "official"
    }
  ];

  const SERIES_BY_ID = Object.fromEntries(SERIES.map((s) => [s.id, s]));

  const SERIES_GROUPS = {
    core: ["gdp_growth", "inflation", "unemployment", "broad_money_growth", "private_credit", "current_account", "reserves_months", "bank_npl", "bank_capital_assets"],
    country: ["gdp_growth", "inflation", "unemployment", "broad_money_growth", "broad_money_gdp", "private_credit", "current_account", "reserves_months", "short_term_debt_reserves", "real_interest", "bank_npl", "bank_capital_assets"],
    bank: ["bank_capital_assets", "bank_reg_capital_rwa", "bank_leverage", "bank_zscore", "bank_npl", "bank_provisions_npl", "bank_roa", "bank_roe", "bank_nim", "bank_cost_income", "bank_liquid_reserves", "broad_money_growth", "private_credit", "gfdd_private_credit", "current_account", "reserves_months"],
    external: ["current_account", "reserves_months", "short_term_debt_reserves", "gdp_growth", "inflation"],
    liquidity: ["broad_money_growth", "broad_money_gdp", "private_credit", "real_interest", "gdp_growth", "inflation"],
    inflation: ["inflation", "real_interest", "gdp_growth", "unemployment", "broad_money_growth"],
    chart: ["gdp_growth", "inflation", "broad_money_growth", "private_credit", "current_account", "reserves_months", "bank_npl", "bank_capital_assets", "bank_zscore", "gfdd_private_credit"]
  };

  const CORDOBA_RESEARCH = [
    {
      id: "global_volatility",
      title: "Navigating Volatility, Trump's Second Term, China's Retaliation, Global Shifts, and Emerging Opportunities",
      url: "https://cordobarg.com/navigating-volatility-trumps-second-term-chinas-retaliation-global-shifts-and-emerging-opportunities/",
      countries: ["US", "CN"],
      domains: ["macro", "inflation", "external"],
      tags: ["volatility", "rates", "geopolitics"]
    },
    {
      id: "global_change",
      title: "Navigating Change, Europe's Transformation, China's Challenges, US Debt Struggles, and Emerging Opportunities",
      url: "https://cordobarg.com/navigating-change-europes-transformation-chinas-challenges-us-debt-struggles-and-emerging-opportunities/",
      countries: ["GB", "DE", "FR", "CN", "US"],
      domains: ["macro", "liquidity", "external"],
      tags: ["europe", "china", "debt"]
    },
    {
      id: "malaysia_macro",
      title: "No One's Watching Malaysia. Maybe They Should Be",
      url: "https://cordobarg.com/no-ones-watching-malaysia-maybe-they-should-be/",
      countries: ["MY"],
      domains: ["macro", "external"],
      tags: ["malaysia", "em", "bonds"]
    },
    {
      id: "malaysia_bonds",
      title: "May 2025 Malaysia Bond Market Outlook",
      url: "https://cordobarg.com/may-2025-malaysia-bond-market-outlook/",
      countries: ["MY"],
      domains: ["liquidity", "external", "inflation"],
      tags: ["rates", "bonds", "malaysia"]
    },
    {
      id: "dutch_pension_reform",
      title: "Dutch Pension Reform: Implications on the Euro and Gilt Curve",
      url: "https://cordobarg.com/dutch-pension-reform-implications-on-the-euro-and-gilt-curve/",
      countries: ["NL", "GB"],
      domains: ["inflation", "liquidity"],
      tags: ["pensions", "rates", "curves", "sovereign"]
    },
    {
      id: "kazatomprom_uranium",
      title: "What You Need to Know About the World's Biggest Uranium Producer",
      url: "https://cordobarg.com/what-you-need-to-know-about-the-worlds-biggest-uranium-producer/",
      countries: ["KZ"],
      domains: ["macro", "external"],
      tags: ["uranium", "commodities", "energy"]
    },
    {
      id: "digital_central_asia",
      title: "The Case for a Digital Central Asia: Financing the Region's Most Undervalued Growth Story",
      url: "https://cordobarg.com/the-case-for-a-digital-central-asia-financing-the-regions-most-undervalued-growth-story/",
      countries: ["KZ", "UZ"],
      domains: ["macro", "liquidity", "external"],
      tags: ["central asia", "digitalisation", "development"]
    },
    {
      id: "morocco_green_industrial",
      title: "Will Morocco Be at the Forefront of North Africa's Green Industrial Take-Off?",
      url: "https://cordobarg.com/will-morocco-be-at-the-forefront-of-north-africas-green-industrial-take-off/",
      countries: ["MA"],
      domains: ["macro", "external"],
      tags: ["morocco", "green industry", "fdi"]
    }
  ];

  const EVENT_LIBRARY = {
    KZ: [
      { year: 2015, label: "Tenge float and oil shock adjustment", tags: ["fx", "external"] },
      { year: 2020, label: "Pandemic and oil demand shock", tags: ["macro", "liquidity"] },
      { year: 2022, label: "Regional geopolitical shock and trade rerouting", tags: ["external", "banking"] }
    ],
    UZ: [
      { year: 2017, label: "FX liberalisation and reform acceleration", tags: ["external", "macro"] },
      { year: 2020, label: "Pandemic policy response", tags: ["macro", "liquidity"] }
    ],
    US: [
      { year: 2008, label: "Global financial crisis", tags: ["banking", "liquidity"] },
      { year: 2020, label: "Pandemic policy shock", tags: ["macro", "liquidity"] },
      { year: 2022, label: "Rapid Fed tightening cycle", tags: ["inflation", "rates"] }
    ],
    PL: [
      { year: 2020, label: "Pandemic policy shock", tags: ["macro", "liquidity"] },
      { year: 2022, label: "Regional energy and inflation shock", tags: ["external", "inflation"] }
    ],
    default: [
      { year: 2008, label: "Global financial crisis", tags: ["banking", "liquidity"] },
      { year: 2020, label: "Pandemic shock", tags: ["macro"] },
      { year: 2022, label: "Global inflation and rates shock", tags: ["inflation", "liquidity"] }
    ]
  };

  const MARKET_STATIC_LIMITS = [
    "Live sovereign curves, CDS, bank equities and FX ticks require licensed market feeds or an API key. This static page does not fabricate them.",
    "Market overlay panels therefore show transmission checklists from macro/banking data, not live prices.",
    "A production deployment can add a scheduled CSV/JSON snapshot published into the repository, or a licensed client-side market API."
  ];

  const screenMeta = {
    MONITOR: ["MONITOR", "Global Monitor", "Search, monitor, compare and route the next analytical step from a single dense board."],
    CTRY: ["CTRY", "Country Monitor", "What changed, why it matters, pressure points, analogues, markets, and handoff."],
    COMP: ["COMP", "Comparison", "Country vs country, peer median, percentile bands, and now vs analogue screens."],
    BANK: ["BANK", "Banking System Stability", "A macroprudential stability module covering capital, asset quality, profitability, funding and systemic risk."],
    EXTL: ["EXTL", "External Vulnerability", "External balances, reserves, debt service pressure and FX transmission."],
    LIQD: ["LIQD", "Liquidity And Money", "Money, credit, real rates and the risk-premium impulse."],
    INFL: ["INFL", "Inflation And Policy", "Inflation pressure, real rates, labour slack and duration risk."],
    CHRT: ["CHRT", "Chart Builder", "Multi-country, multi-transform charting with annotations and export."],
    ALRT: ["ALRT", "Saved Monitors And Local Alerts", "Static-safe watchlists stored locally and evaluated when the page is open."],
    RLS: ["RLS", "Release And Freshness Board", "Per-series source, frequency, latest observation, source update and adapter status."],
    NOTE: ["NOTE", "Analyst Note Helper", "Build a concise CRG-style macro handoff from regime, market, banking and provenance data."]
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setHtml(node, html) {
    if (node) node.innerHTML = html;
  }

  function setText(node, text) {
    if (node) node.textContent = text;
  }

  function fmt(value, decimals = 1, unit = "") {
    if (value == null || Number.isNaN(Number(value))) return "No data";
    const n = Number(value);
    const fixed = Math.abs(n) >= 100 && decimals > 0 ? n.toFixed(Math.max(0, decimals - 1)) : n.toFixed(decimals);
    if (unit === "%" || unit === "% GDP") return `${fixed}${unit === "% GDP" ? "% GDP" : "%"}`;
    if (unit === "months") return `${fixed}m`;
    return `${fixed}${unit ? ` ${unit}` : ""}`;
  }

  function compact(value, decimals = 1) {
    if (value == null || Number.isNaN(Number(value))) return "--";
    return Number(value).toFixed(decimals);
  }

  function mean(values) {
    const clean = values.filter((v) => v != null && !Number.isNaN(Number(v)));
    if (!clean.length) return null;
    return clean.reduce((sum, v) => sum + Number(v), 0) / clean.length;
  }

  function stdev(values) {
    const avg = mean(values);
    if (avg == null || values.length < 2) return 0;
    const variance = values.reduce((sum, v) => sum + Math.pow(Number(v) - avg, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function pctRank(values, latest) {
    const clean = values.filter((v) => v != null && !Number.isNaN(Number(v))).sort((a, b) => a - b);
    if (!clean.length || latest == null || Number.isNaN(Number(latest))) return null;
    const below = clean.filter((v) => v <= latest).length;
    return Math.round((below / clean.length) * 100);
  }

  function formatDate(dateStr) {
    if (!dateStr) return "Not supplied";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return d.toISOString().slice(0, 10);
  }

  function ageYears(year) {
    if (!year) return null;
    return CURRENT_DATE.getUTCFullYear() - Number(year);
  }

  function freshnessLabel(stats, def) {
    if (!stats || !stats.latest) return { label: "No static data", tone: "bad" };
    const age = ageYears(stats.latest.year);
    if (age == null) return { label: "Period unknown", tone: "warn" };
    if (def.frequency === "Annual") {
      if (age <= 2) return { label: "Current for annual", tone: "good" };
      if (age <= 3) return { label: "Lagged annual", tone: "warn" };
      return { label: `Stale: ${age}y lag`, tone: "bad" };
    }
    if (age <= 1) return { label: "Current", tone: "good" };
    return { label: "Lagged", tone: "warn" };
  }

  function attentionClass(itemOrScore, def = null) {
    if (typeof itemOrScore === "number") {
      if (itemOrScore >= 76) return "attention-live attention-critical";
      if (itemOrScore >= 62) return "attention-live attention-watch";
      return "";
    }
    const item = itemOrScore;
    if (!item || !item.stats || !item.def) return "";
    const risk = riskFromStat(item.stats, def || item.def);
    const fresh = freshnessLabel(item.stats, item.def);
    if (fresh.tone === "bad") return "attention-live attention-stale";
    if (risk >= 76) return "attention-live attention-critical";
    if (risk >= 62 || Math.abs(item.stats.delta || 0) > Math.max(1, Math.abs(item.stats.mean || 0) * 0.15)) {
      return "attention-live attention-watch";
    }
    return "";
  }

  function orientationAdjustedZ(stat, def) {
    if (!stat) return null;
    const z = stat.z || 0;
    if (def.orientation === "higher-good") return z;
    if (def.orientation === "higher-bad") return -z;
    return -Math.abs(z);
  }

  function signalTone(z, def) {
    const oriented = orientationAdjustedZ({ z }, def);
    if (oriented == null) return "neutral";
    if (oriented > 0.75) return "good";
    if (oriented < -0.75) return "bad";
    if (Math.abs(z) > 1.25) return "warn";
    return "neutral";
  }

  function scoreFromZ(z) {
    return Math.round(50 + (clamp(z || 0, -2.5, 2.5) / 2.5) * 40);
  }

  function riskFromStat(stat, def) {
    if (!stat) return null;
    if (def.orientation === "higher-bad") return scoreFromZ(stat.z);
    if (def.orientation === "higher-good") return scoreFromZ(-stat.z);
    return Math.round(50 + (Math.min(Math.abs(stat.z || 0), 2.5) / 2.5) * 40);
  }

  function sourceBadge(def, stats) {
    const fresh = freshnessLabel(stats, def);
    return `
      <span class="source-badge tone-${fresh.tone}" title="${escapeHtml(def.bestSource)}">
        ${escapeHtml(def.activeSource)} | ${escapeHtml(def.frequency)} | ${escapeHtml(fresh.label)}
      </span>
    `;
  }

  function cacheKey(countryCode, seriesId) {
    const country = COUNTRIES[countryCode];
    const def = SERIES_BY_ID[seriesId];
    return `${STORAGE_PREFIX}wb_${country?.wb}_${def?.wb}`;
  }

  function getCached(countryCode, seriesId) {
    try {
      const raw = localStorage.getItem(cacheKey(countryCode, seriesId));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed.timestamp || Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
      return parsed;
    } catch (err) {
      return null;
    }
  }

  function setCached(countryCode, seriesId, payload) {
    try {
      localStorage.setItem(cacheKey(countryCode, seriesId), JSON.stringify({ ...payload, timestamp: Date.now() }));
    } catch (err) {
      // Local storage can be unavailable in private browsing. The page still works without caching.
    }
  }

  async function fetchWorldBankSeries(countryCode, def) {
    const country = COUNTRIES[countryCode];
    if (!country || !def || !def.wb) {
      return emptySeriesPayload(def, "Country or source definition missing.");
    }

    const cached = getCached(countryCode, def.id);
    if (cached) {
      return {
        series: cached.series || [],
        provenance: {
          ...buildProvenance(def, cached.updatedAt || null),
          cache: "browser-cache",
          warning: cached.warning || ""
        }
      };
    }

    const url = `https://api.worldbank.org/v2/country/${country.wb}/indicator/${def.wb}?format=json&per_page=200`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return emptySeriesPayload(def, `World Bank API returned HTTP ${response.status}.`);
      }
      const json = await response.json();
      const header = Array.isArray(json) ? json[0] : null;
      const rows = Array.isArray(json) ? json[1] : null;
      const updatedAt = header && header.lastupdated ? header.lastupdated : null;
      if (!Array.isArray(rows)) {
        return emptySeriesPayload(def, "World Bank API did not return an observation array.");
      }
      const series = rows
        .filter((row) => row && row.value != null && row.date)
        .map((row) => {
          const year = Number.parseInt(row.date, 10);
          return {
            year,
            period: `${year}-12-31`,
            value: Number(row.value)
          };
        })
        .filter((point) => Number.isFinite(point.year) && Number.isFinite(point.value))
        .sort((a, b) => a.year - b.year);

      setCached(countryCode, def.id, { series, updatedAt, warning: "" });
      return {
        series,
        provenance: buildProvenance(def, updatedAt)
      };
    } catch (err) {
      return emptySeriesPayload(def, "Direct API fetch failed. Check network/CORS or use cached/static CSV snapshots.");
    }
  }

  function emptySeriesPayload(def, warning) {
    return {
      series: [],
      provenance: {
        ...buildProvenance(def, null),
        warning,
        cache: "none"
      }
    };
  }

  function buildProvenance(def, updatedAt) {
    return {
      seriesId: def.id,
      source: def.sourceName,
      activeSource: def.activeSource,
      bestSource: def.bestSource,
      tier: def.tier,
      url: def.sourceUrl,
      frequency: def.frequency,
      releaseDate: updatedAt || "Not supplied by adapter",
      lastUpdated: updatedAt || "Not supplied by adapter",
      officialStatus: def.status,
      interpolated: false,
      adapter: def.wb ? "World Bank JSON API" : "Static metadata only",
      cache: "network"
    };
  }

  function computeStats(series, def) {
    if (!series || !series.length) return null;
    const latest = series[series.length - 1];
    const prev = series.length > 1 ? series[series.length - 2] : null;
    const window = series.slice(-12);
    const values = window.map((point) => point.value);
    const avg = mean(values);
    const sd = stdev(values);
    const z = sd > 0 ? (latest.value - avg) / sd : 0;
    const delta = prev ? latest.value - prev.value : 0;
    const percentile = pctRank(values, latest.value);
    const yoy = prev && prev.value !== 0 ? ((latest.value - prev.value) / Math.abs(prev.value)) * 100 : null;
    const analogueYears = window
      .filter((point) => point.year !== latest.year)
      .map((point) => ({
        year: point.year,
        diff: Math.abs((sd > 0 ? (point.value - avg) / sd : 0) - z)
      }))
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 3)
      .map((point) => point.year);
    return {
      latest,
      prev,
      mean: avg,
      stdev: sd,
      z,
      delta,
      yoy,
      percentile,
      window,
      analogueYears,
      points: series,
      formatted: fmt(latest.value, def.decimals, def.unit)
    };
  }

  async function ensureCountryData(countryCode, seriesIds) {
    const code = countryCode || state.currentCountry;
    if (!state.loaded.has(code)) state.loaded.set(code, {});
    const loaded = state.loaded.get(code);
    const missing = seriesIds.filter((id) => !loaded[id]);
    if (!missing.length) return loaded;

    const loadKey = `${code}_${missing.slice().sort().join("_")}`;
    if (state.loading.has(loadKey)) {
      await state.loading.get(loadKey);
      return state.loaded.get(code);
    }

    const promise = Promise.all(
      missing.map(async (seriesId) => {
        const def = SERIES_BY_ID[seriesId];
        const payload = await fetchWorldBankSeries(code, def);
        const stats = computeStats(payload.series, def);
        loaded[seriesId] = { def, stats, provenance: payload.provenance, series: payload.series };
      })
    );
    state.loading.set(loadKey, promise);
    await promise;
    state.loading.delete(loadKey);
    return loaded;
  }

  async function ensureMany(countries, seriesIds) {
    const queue = countries.slice();
    const workerCount = Math.min(3, queue.length);
    const workers = Array.from({ length: workerCount }, async () => {
      while (queue.length) {
        const country = queue.shift();
        await ensureCountryData(country, seriesIds);
      }
    });
    await Promise.all(workers);
  }

  function enginesFor(data) {
    const s = (id) => data[id]?.stats;
    const d = (id) => SERIES_BY_ID[id];
    const adj = (id) => orientationAdjustedZ(s(id), d(id)) ?? 0;
    const raw = (id) => s(id)?.z ?? 0;

    const growth = (raw("gdp_growth") || 0) - (raw("unemployment") || 0) * 0.35;
    const inflation = adj("inflation") + (raw("real_interest") || 0) * 0.15;
    const liquidity = (raw("broad_money_growth") || 0) * 0.45 + (raw("private_credit") || 0) * 0.25 - Math.abs(raw("real_interest") || 0) * 0.15;
    const external = adj("current_account") * 0.45 + adj("reserves_months") * 0.35 + adj("short_term_debt_reserves") * 0.2;
    const bank = bankingScore(data).stabilityZ;

    return {
      growth: { z: growth, score: scoreFromZ(growth), label: "Growth" },
      inflation: { z: inflation, score: scoreFromZ(inflation), label: "Inflation" },
      liquidity: { z: liquidity, score: scoreFromZ(liquidity), label: "Liquidity" },
      external: { z: external, score: scoreFromZ(external), label: "External" },
      banking: { z: bank, score: scoreFromZ(bank), label: "Banking" }
    };
  }

  function bankingScore(data) {
    const ids = [
      "bank_capital_assets",
      "bank_reg_capital_rwa",
      "bank_leverage",
      "bank_zscore",
      "bank_npl",
      "bank_provisions_npl",
      "bank_roa",
      "bank_roe",
      "bank_cost_income",
      "bank_liquid_reserves",
      "gfdd_private_credit"
    ];
    const oriented = ids
      .map((id) => {
        const item = data[id];
        if (!item || !item.stats) return null;
        const def = SERIES_BY_ID[id];
        if (id === "gfdd_private_credit") return -Math.abs(item.stats.z || 0) * 0.65;
        return orientationAdjustedZ(item.stats, def);
      })
      .filter((value) => value != null && Number.isFinite(value));
    const stabilityZ = oriented.length ? mean(oriented) : 0;
    return {
      stabilityZ,
      stabilityScore: scoreFromZ(stabilityZ),
      coverage: Math.round((oriented.length / ids.length) * 100)
    };
  }

  function regimeLabel(engines) {
    const g = engines.growth.z;
    const i = engines.inflation.z;
    const e = engines.external.z;
    const l = engines.liquidity.z;

    let growth = "near-trend growth";
    if (g > 0.65) growth = "above-trend growth";
    if (g < -0.65) growth = "below-trend growth";

    let price = "contained inflation";
    if (i < -0.65) price = "inflation pressure";
    if (i > 0.65) price = "disinflation support";

    let fragility = "balanced funding";
    if (e < -0.65 || l < -0.65) fragility = "funding or liquidity pressure";
    if (e > 0.65 && l > 0.2) fragility = "supportive balance sheet";

    return `${capitalise(growth)} with ${price} and ${fragility}`;
  }

  function capitalise(text) {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
  }

  function firstMarket(engines) {
    const channels = marketChannels(engines);
    return channels.sort((a, b) => b.score - a.score)[0]?.name || "Mixed";
  }

  function marketChannels(engines) {
    const g = engines.growth.z;
    const i = engines.inflation.z;
    const l = engines.liquidity.z;
    const e = engines.external.z;
    const b = engines.banking.z;
    return [
      {
        name: "Rates",
        score: Math.round(45 + 25 * Math.abs(i) + 12 * Math.abs(i - g)),
        text: i < -0.6 ? "Inflation pressure keeps duration sensitive." : "Rates risk is more catalyst-led."
      },
      {
        name: "FX",
        score: Math.round(40 + 35 * Math.max(0, -e) + 10 * Math.max(0, -l)),
        text: e < -0.6 ? "External pressure should show first in FX and reserves." : "External buffers reduce first-round FX stress."
      },
      {
        name: "Credit",
        score: Math.round(40 + 25 * Math.max(0, -l) + 22 * Math.max(0, -b) + 10 * Math.max(0, -g)),
        text: b < -0.6 || l < -0.6 ? "Bank and liquidity pressure can lead spreads." : "Credit signal is not the leading stress point."
      },
      {
        name: "Equity beta",
        score: Math.round(40 + 20 * Math.abs(g) + 18 * Math.abs(l) + 12 * Math.max(0, -b)),
        text: g > 0.6 && l > 0 ? "Growth/liquidity support can lift beta." : "Dispersion matters more than index beta."
      }
    ].map((channel) => ({ ...channel, score: clamp(channel.score, 0, 100) }));
  }

  function pressureItems(data, engines) {
    const items = [];
    Object.values(data).forEach((item) => {
      if (!item.stats) return;
      const zAbs = Math.abs(item.stats.z || 0);
      if (zAbs < 0.55) return;
      const tone = signalTone(item.stats.z, item.def);
      items.push({
        label: item.def.label,
        value: item.stats.formatted,
        z: item.stats.z,
        tone,
        text: `${item.def.short} is ${item.stats.z > 0 ? "above" : "below"} its recent history (z ${compact(item.stats.z, 2)}).`,
        source: item.def.activeSource
      });
    });
    items.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
    if (!items.length) {
      items.push({
        label: "Regime stability",
        value: "Low dispersion",
        z: 0,
        tone: "neutral",
        text: "Most loaded official indicators are close to recent history; watch catalysts rather than levels.",
        source: "Engine composite"
      });
    }
    const dominant = Object.values(engines).sort((a, b) => Math.abs(b.z) - Math.abs(a.z))[0];
    if (dominant) {
      items.unshift({
        label: `${dominant.label} engine`,
        value: `${dominant.score}/100`,
        z: dominant.z,
        tone: dominant.z > 0.7 ? "good" : dominant.z < -0.7 ? "bad" : "neutral",
        text: `${dominant.label} is the dominant engine; this should structure the note and export sequence.`,
        source: "Composite engine"
      });
    }
    return items.slice(0, 6);
  }

  function renderMiniItem(item) {
    return `
      <div class="mini-item tone-${escapeHtml(item.tone || "neutral")} ${escapeHtml(item.attention || "")}">
        <div class="mini-item-top">
          <strong>${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(item.value)}</span>
        </div>
        <p>${escapeHtml(item.text)}</p>
        <small>${escapeHtml(item.source || "")}</small>
      </div>
    `;
  }

  function metricCard(item, options = {}) {
    const stats = item?.stats;
    const def = item?.def;
    if (!def || !stats) return "";
    const fresh = freshnessLabel(stats, def);
    const z = stats.z == null ? "--" : compact(stats.z, 2);
    return `
      <div class="metric-card tone-${escapeHtml(signalTone(stats.z, def))} ${escapeHtml(attentionClass(item))}" data-series="${escapeHtml(def.id)}">
        <div class="metric-top">
          <span>${escapeHtml(options.label || def.short)}</span>
          <b>${escapeHtml(stats.formatted)}</b>
        </div>
        <div class="metric-mid">Period ${escapeHtml(String(stats.latest.year))} | z ${escapeHtml(z)} | pct ${stats.percentile ?? "--"}</div>
        ${sourceBadge(def, stats)}
        <div class="metric-foot">${escapeHtml(fresh.label)}</div>
      </div>
    `;
  }

  function paneMetric(item) {
    if (!item || !item.def) return "";
    if (!item.stats) {
      return `
        <div class="pane-row unavailable">
          <span>${escapeHtml(item.def.short)}</span>
          <strong>No static data</strong>
          <small>${escapeHtml(item.provenance.warning || "No observation returned by active static adapter.")}</small>
        </div>
      `;
    }
    const fresh = freshnessLabel(item.stats, item.def);
    return `
      <div class="pane-row tone-${escapeHtml(signalTone(item.stats.z, item.def))} ${escapeHtml(attentionClass(item))}">
        <span>${escapeHtml(item.def.short)}</span>
        <strong>${escapeHtml(item.stats.formatted)}</strong>
        <small>${escapeHtml(item.stats.latest.year)} | z ${escapeHtml(compact(item.stats.z, 2))} | ${escapeHtml(item.def.activeSource)} | ${escapeHtml(fresh.label)}</small>
      </div>
    `;
  }

  async function renderActiveModule() {
    const active = state.activeModule;
    setScreenHeader(active);
    setLoadingStatus("Resolving official and institutional source stack...");
    try {
      if (active === "MONITOR") await renderMonitor();
      if (active === "CTRY") await renderCountry();
      if (active === "COMP") await renderComparison();
      if (active === "BANK") await renderBank();
      if (active === "EXTL") await renderDomain("external");
      if (active === "LIQD") await renderDomain("liquidity");
      if (active === "INFL") await renderDomain("inflation");
      if (active === "CHRT") await renderChartModule();
      if (active === "ALRT") await renderAlerts();
      if (active === "RLS") await renderReleaseBoard();
      if (active === "NOTE") await renderNote();
      await renderContextPanel();
      setLoadingStatus(state.lastWarning || "Ready");
    } catch (err) {
      console.error(err);
      setLoadingStatus("Render failed. Check console for details.");
      showToast("A module failed to render. The static page remains available.");
    }
  }

  function setScreenHeader(code) {
    const meta = screenMeta[code] || screenMeta.MONITOR;
    setText(el("screen-code"), meta[0]);
    setText(el("screen-title"), meta[1]);
    setText(el("screen-subtitle"), meta[2]);
    all(".function-key").forEach((button) => button.classList.toggle("active", button.dataset.module === code));
    all(".workflow-step").forEach((button) => button.classList.toggle("active", button.dataset.module === code));
    all(".module-screen").forEach((screen) => screen.classList.toggle("active", screen.dataset.screen === code));
  }

  function setLoadingStatus(text) {
    setText(el("status-left"), text);
  }

  async function renderMonitor() {
    const peerSet = PEER_SETS[state.peerSet] || PEER_SETS.global_watch;
    const countries = peerSet.countries;
    setText(el("monitor-status"), `Source stack: ${countries.length} countries`);
    await ensureMany(countries, SERIES_GROUPS.core);
    const rows = countries.map((code) => {
      const data = state.loaded.get(code) || {};
      const engines = enginesFor(data);
      const bank = bankingScore(data);
      const country = COUNTRIES[code];
      const gdp = data.gdp_growth?.stats;
      const infl = data.inflation?.stats;
      const external = data.current_account?.stats;
      return `
        <tr data-country-row="${escapeHtml(code)}" class="${escapeHtml(attentionClass(Math.max(engines.external.score, 100 - engines.inflation.score, 100 - bank.stabilityScore)))}">
          <td>
            <button class="table-link" type="button" data-open-country="${escapeHtml(code)}">${escapeHtml(country.name)}</button>
            <small>${escapeHtml(country.region)}</small>
          </td>
          <td>${escapeHtml(regimeLabel(engines))}</td>
          <td>${scoreCell(engines.growth.score, gdp?.z)}</td>
          <td>${scoreCell(engines.inflation.score, infl?.z)}</td>
          <td>${scoreCell(engines.liquidity.score, data.broad_money_growth?.stats?.z)}</td>
          <td>${scoreCell(engines.external.score, external?.z)}</td>
          <td>${scoreCell(bank.stabilityScore, engines.banking.z)}</td>
          <td>${escapeHtml(firstMarket(engines))}</td>
        </tr>
      `;
    });
    setHtml(el("monitor-rows"), rows.join(""));
    setText(el("monitor-status"), `${countries.length} countries | ${SERIES_GROUPS.core.length} core series`);

    const inflections = countries
      .flatMap((code) => {
        const data = state.loaded.get(code) || {};
        return Object.values(data)
          .filter((item) => item.stats && Math.abs(item.stats.z || 0) > 0.75)
          .map((item) => ({
            label: `${COUNTRIES[code].name}: ${item.def.short}`,
            value: item.stats.formatted,
            z: item.stats.z,
            tone: signalTone(item.stats.z, item.def),
            text: `${item.def.label} is ${item.stats.z > 0 ? "above" : "below"} recent history; ${firstMarket(enginesFor(data))} should be watched first.`,
            source: item.def.activeSource
          }));
      })
      .sort((a, b) => Math.abs(b.z) - Math.abs(a.z))
      .slice(0, 6);
    setHtml(el("top-inflections"), inflections.map(renderMiniItem).join("") || renderMiniItem({
      label: "No large cross-country moves",
      value: "Stable",
      text: "No loaded country has a core indicator more than 0.75 standard deviations from recent history.",
      source: "Composite monitor",
      tone: "neutral"
    }));

    const channelTotals = { Rates: 0, FX: 0, Credit: 0, "Equity beta": 0 };
    countries.forEach((code) => {
      marketChannels(enginesFor(state.loaded.get(code) || {})).forEach((channel) => {
        channelTotals[channel.name] += channel.score;
      });
    });
    const channelHtml = Object.entries(channelTotals)
      .map(([name, total]) => {
        const score = Math.round(total / countries.length);
        return channelCard(name, score, `Average pressure across ${peerSet.label}.`);
      })
      .join("");
    setHtml(el("market-priority"), channelHtml);

    const suggestions = [
      `compare ${countries[0]} vs ${countries[1]} inflation`,
      `${state.currentCountry} banking system`,
      `chart private credit ${state.currentCountry}`,
      `${state.currentCountry} external vulnerability`
    ];
    setHtml(el("command-suggestions"), suggestions.map((cmd) => `<button type="button" data-command="${escapeHtml(cmd)}">${escapeHtml(cmd)}</button>`).join(""));
  }

  function scoreCell(score, z) {
    const tone = score >= 65 ? "good" : score <= 35 ? "bad" : Math.abs(z || 0) > 1 ? "warn" : "neutral";
    return `<span class="score-cell tone-${tone}"><b>${score ?? "--"}</b><small>z ${compact(z || 0, 1)}</small></span>`;
  }

  function channelCard(name, score, text) {
    const tone = score > 70 ? "bad" : score > 55 ? "warn" : "neutral";
    return `
      <div class="channel-card tone-${tone}">
        <div class="channel-top"><span>${escapeHtml(name)}</span><strong>${score}</strong></div>
        <div class="progress"><i style="width:${clamp(score, 0, 100)}%"></i></div>
        <p>${escapeHtml(text)}</p>
      </div>
    `;
  }

  async function renderCountry() {
    await ensureCountryData(state.currentCountry, SERIES_GROUPS.country);
    const data = state.loaded.get(state.currentCountry) || {};
    const country = COUNTRIES[state.currentCountry];
    const engines = enginesFor(data);
    const loadedCount = Object.values(data).filter((item) => item.stats).length;
    const coverage = Math.round((loadedCount / SERIES_GROUPS.country.length) * 100);

    setText(el("country-regime-title"), `${country.name}: ${regimeLabel(engines)}`);
    setText(el("country-confidence"), `Coverage ${coverage}%`);
    setHtml(el("country-regime-body"), `
      <p>${escapeHtml(countryRegimeText(country, data, engines))}</p>
      <p class="muted-line">${escapeHtml("Workflow: compare the country against peers, inspect banking stability, export the chart, then hand the finding into NOTE.")}</p>
    `);

    const keyIds = ["gdp_growth", "inflation", "current_account", "broad_money_growth", "private_credit", "bank_npl"];
    setHtml(el("country-key-ratios"), keyIds.map((id) => metricCard(data[id])).join(""));

    setHtml(el("engine-cards"), Object.values(engines).map((engine) => engineCard(engine)).join(""));
    setHtml(el("implication-list"), marketChannels(engines).sort((a, b) => b.score - a.score).map((channel) => renderMiniItem({
      label: channel.name,
      value: `${channel.score}/100`,
      text: channel.text,
      source: "Derived from current engines",
      tone: channel.score > 70 ? "bad" : channel.score > 55 ? "warn" : "neutral"
    })).join(""));
    setHtml(el("stress-lanes"), stressLanes(data, engines).map(renderMiniItem).join(""));
    renderIndicatorRows(data, "all");
  }

  function countryRegimeText(country, data, engines) {
    const gdp = data.gdp_growth?.stats;
    const inflation = data.inflation?.stats;
    const ca = data.current_account?.stats;
    const bank = bankingScore(data);
    const parts = [];
    if (gdp) parts.push(`Growth is ${gdp.formatted} for ${gdp.latest.year}, ${gdp.z > 0 ? "above" : "below"} its 12-observation history by z ${compact(gdp.z, 2)}.`);
    if (inflation) parts.push(`Inflation is ${inflation.formatted}, with the inflation engine at ${engines.inflation.score}/100 after adjusting for the fact that higher CPI is a risk signal.`);
    if (ca) parts.push(`The external balance is ${ca.formatted}, placing the external engine at ${engines.external.score}/100.`);
    parts.push(`Banking stability screens at ${bank.stabilityScore}/100 with ${bank.coverage}% macroprudential coverage in the static adapter.`);
    return `${country.name} is in a ${regimeLabel(engines).toLowerCase()} regime. ${parts.join(" ")}`;
  }

  function engineCard(engine) {
    const tone = engine.score >= 65 ? "good" : engine.score <= 35 ? "bad" : Math.abs(engine.z) > 1 ? "warn" : "neutral";
    return `
      <div class="engine-card tone-${tone}">
        <div class="engine-top"><span>${escapeHtml(engine.label)}</span><b>${engine.score}</b></div>
        <div class="progress"><i style="width:${clamp(engine.score, 0, 100)}%"></i></div>
        <small>z ${escapeHtml(compact(engine.z, 2))} vs country history</small>
      </div>
    `;
  }

  function stressLanes(data, engines) {
    const lanes = [
      {
        label: "External funding",
        score: 50 + 30 * Math.max(0, -engines.external.z),
        text: data.current_account?.stats ? `Current account is ${data.current_account.stats.formatted}; watch reserves, FX basis and rollover windows.` : "External source coverage is insufficient; do not infer live FX stress."
      },
      {
        label: "Liquidity rollover",
        score: 50 + 25 * Math.max(0, -engines.liquidity.z),
        text: data.broad_money_growth?.stats ? `Money growth is ${data.broad_money_growth.stats.formatted}; watch credit impulse and local spread momentum.` : "Liquidity source coverage is incomplete."
      },
      {
        label: "Bank asset quality",
        score: 50 + 25 * Math.max(0, -engines.banking.z),
        text: data.bank_npl?.stats ? `NPL ratio is ${data.bank_npl.stats.formatted}; watch provisioning, deposit trends and refinancing risk.` : "NPL data not returned by the active static adapter."
      },
      {
        label: "Duration repricing",
        score: 50 + 25 * Math.max(0, -engines.inflation.z),
        text: data.inflation?.stats ? `Inflation pressure remains the first duration channel when CPI is elevated vs history.` : "Inflation source coverage is incomplete."
      }
    ];
    return lanes
      .map((lane) => ({
        label: lane.label,
        value: `${Math.round(clamp(lane.score, 0, 100))}/100`,
        text: lane.text,
        source: "Stress sentinel",
        tone: lane.score > 72 ? "bad" : lane.score > 58 ? "warn" : "neutral"
      }))
      .sort((a, b) => Number.parseInt(b.value, 10) - Number.parseInt(a.value, 10));
  }

  function renderIndicatorRows(data, filter) {
    const tbody = el("indicator-rows");
    if (!tbody) return;
    const rows = SERIES_GROUPS.country
      .map((id) => data[id] || { def: SERIES_BY_ID[id], stats: null, provenance: buildProvenance(SERIES_BY_ID[id], null) })
      .filter((item) => {
        if (filter === "movers") return item.stats && Math.abs(item.stats.z || 0) >= 0.75;
        if (filter === "gaps") return !item.stats;
        return true;
      })
      .map((item) => indicatorRow(item));
    setHtml(tbody, rows.join("") || `<tr><td colspan="9" class="empty-row">No rows match this filter.</td></tr>`);
  }

  function indicatorRow(item) {
    const def = item.def;
    const stats = item.stats;
    const fresh = freshnessLabel(stats, def);
    if (!stats) {
      return `
        <tr class="data-gap">
          <td>${escapeHtml(def.label)}<small>${escapeHtml(def.bestSource)}</small></td>
          <td colspan="4">No observation returned by active static adapter.</td>
          <td>${escapeHtml(def.activeSource)}</td>
          <td>${escapeHtml(item.provenance?.releaseDate || "Not supplied")}</td>
          <td><span class="source-badge tone-bad">${escapeHtml(fresh.label)}</span></td>
          <td>${escapeHtml(item.provenance?.warning || "Use domestic supervisor/source CSV for production coverage.")}</td>
        </tr>
      `;
    }
    return `
      <tr>
        <td>${escapeHtml(def.label)}<small>${escapeHtml(def.bestSource)}</small></td>
        <td>${escapeHtml(stats.formatted)}</td>
        <td>${escapeHtml(stats.latest.year)}</td>
        <td>${escapeHtml(compact(stats.z, 2))}</td>
        <td>${stats.percentile ?? "--"}</td>
        <td><a href="${escapeHtml(def.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(def.activeSource)}</a><small>${escapeHtml(def.status)}</small></td>
        <td>${escapeHtml(formatDate(item.provenance.releaseDate))}</td>
        <td><span class="source-badge tone-${escapeHtml(fresh.tone)}">${escapeHtml(fresh.label)}</span></td>
        <td>${escapeHtml(readThrough(def, stats))}</td>
      </tr>
    `;
  }

  function readThrough(def, stats) {
    const z = stats.z || 0;
    const abs = Math.abs(z);
    if (abs < 0.5) return "Near its recent range; treat as context unless direction changes.";
    if (def.orientation === "higher-bad" && z > 0) return "Pressure is elevated; check policy reaction and market pricing.";
    if (def.orientation === "higher-good" && z < 0) return "Buffer is weaker than usual; watch financing and confidence channels.";
    if (def.orientation === "balanced") return "Unusual level; direction matters more than good/bad labelling.";
    return "Supportive relative to recent history, but verify persistence.";
  }

  async function renderComparison() {
    const seriesId = state.compareSeries;
    const peerSet = PEER_SETS[state.peerSet] || PEER_SETS.global_watch;
    const countries = Array.from(new Set([state.compareA, state.compareB, ...peerSet.countries]));
    await ensureMany(countries, Array.from(new Set([seriesId, ...SERIES_GROUPS.core])));
    const def = SERIES_BY_ID[seriesId];
    const values = countries
      .map((code) => ({ code, item: state.loaded.get(code)?.[seriesId] }))
      .filter((row) => row.item?.stats)
      .map((row) => row.item.stats.latest.value);
    const median = percentileValue(values, 50);

    setText(el("comparison-title"), `${COUNTRIES[state.compareA].name} vs ${COUNTRIES[state.compareB].name}: ${def.label}`);
    const aItem = state.loaded.get(state.compareA)?.[seriesId];
    const bItem = state.loaded.get(state.compareB)?.[seriesId];
    setHtml(el("comparison-summary"), `
      ${compareSummaryCard(state.compareA, aItem, median)}
      ${compareSummaryCard(state.compareB, bItem, median)}
      <div class="summary-card">
        <span>Peer median</span>
        <strong>${escapeHtml(fmt(median, def.decimals, def.unit))}</strong>
        <small>${escapeHtml(peerSet.label)} | ${values.length} countries with observations</small>
      </div>
    `);

    const rows = countries.map((code) => {
      const item = state.loaded.get(code)?.[seriesId];
      const country = COUNTRIES[code];
      if (!item?.stats) {
        return `
          <tr class="data-gap">
            <td>${escapeHtml(country.name)}</td>
            <td>${escapeHtml(def.short)}</td>
            <td colspan="6">No observation from active static adapter.</td>
          </tr>
        `;
      }
      const diff = item.stats.latest.value - median;
      return `
        <tr>
          <td><button class="table-link" type="button" data-open-country="${escapeHtml(code)}">${escapeHtml(country.name)}</button><small>${escapeHtml(country.region)}</small></td>
          <td>${escapeHtml(def.label)}</td>
          <td>${escapeHtml(item.stats.formatted)}</td>
          <td>${escapeHtml(item.stats.latest.year)}</td>
          <td>${escapeHtml(diff >= 0 ? "+" : "")}${escapeHtml(fmt(diff, def.decimals, def.unit))}</td>
          <td>${item.stats.percentile ?? "--"}</td>
          <td>${escapeHtml((item.stats.analogueYears || []).join(", ") || "Insufficient history")}</td>
          <td>${sourceBadge(def, item.stats)}</td>
        </tr>
      `;
    });
    setHtml(el("comparison-rows"), rows.join(""));

    const heatmapIds = ["gdp_growth", "inflation", "broad_money_growth", "current_account", "bank_npl", "bank_capital_assets"];
    await ensureMany(countries, heatmapIds);
    const heatmap = countries.slice(0, 10).map((code) => {
      const cells = heatmapIds.map((id) => {
        const item = state.loaded.get(code)?.[id];
        if (!item?.stats) return `<span class="heat-cell empty">--</span>`;
        const tone = signalTone(item.stats.z, item.def);
        return `<span class="heat-cell tone-${tone}" title="${escapeHtml(item.def.label)}">${escapeHtml(compact(item.stats.z, 1))}</span>`;
      }).join("");
      return `<div class="heat-row"><b>${escapeHtml(COUNTRIES[code].name)}</b>${cells}</div>`;
    }).join("");
    setHtml(el("comparison-heatmap"), `
      <div class="heat-header"><span></span>${heatmapIds.map((id) => `<em>${escapeHtml(SERIES_BY_ID[id].short)}</em>`).join("")}</div>
      ${heatmap}
    `);

    setHtml(el("analogue-panel"), [state.compareA, state.compareB].map((code) => {
      const item = state.loaded.get(code)?.[seriesId];
      return renderMiniItem({
        label: `${COUNTRIES[code].name} analogues`,
        value: item?.stats?.analogueYears?.join(", ") || "No analogue",
        text: item?.stats ? `Closest periods are based on ${def.short} z-score distance inside the loaded history window.` : "No analogue can be computed without series history.",
        source: def.activeSource,
        tone: "neutral"
      });
    }).join(""));
  }

  function compareSummaryCard(code, item, median) {
    const country = COUNTRIES[code];
    if (!item?.stats) {
      return `<div class="summary-card unavailable"><span>${escapeHtml(country.name)}</span><strong>No data</strong><small>${escapeHtml(item?.provenance?.warning || "Static adapter returned no observation.")}</small></div>`;
    }
    const diff = item.stats.latest.value - median;
    return `
      <div class="summary-card tone-${escapeHtml(signalTone(item.stats.z, item.def))}">
        <span>${escapeHtml(country.name)}</span>
        <strong>${escapeHtml(item.stats.formatted)}</strong>
        <small>${escapeHtml(diff >= 0 ? "above" : "below")} peer median by ${escapeHtml(fmt(Math.abs(diff), item.def.decimals, item.def.unit))}</small>
      </div>
    `;
  }

  function percentileValue(values, percentile) {
    const clean = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
    if (!clean.length) return null;
    const idx = clamp((percentile / 100) * (clean.length - 1), 0, clean.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper) return clean[lower];
    return clean[lower] + (clean[upper] - clean[lower]) * (idx - lower);
  }

  async function renderBank() {
    await ensureCountryData(state.currentCountry, SERIES_GROUPS.bank);
    const data = state.loaded.get(state.currentCountry) || {};
    const country = COUNTRIES[state.currentCountry];
    const score = bankingScore(data);
    setText(el("bank-title"), `${country.name} Financial System Monitor`);
    setText(el("bank-score"), score.stabilityScore);

    const keyIds = ["bank_reg_capital_rwa", "bank_capital_assets", "bank_npl", "bank_liquid_reserves", "bank_roa", "gfdd_private_credit"];
    setHtml(el("bank-core-strip"), keyIds.map((id) => metricCard(data[id])).join(""));
    setHtml(el("bank-narrative"), `
      <p>${escapeHtml(bankNarrative(country, data, score))}</p>
      <p class="muted-line">${escapeHtml("Market overlay is an honest transmission map. Live bank equities, CDS and curves are not connected in this static GitHub Pages deployment.")}</p>
    `);

    renderBankPane("bank-core-health", ["bank_reg_capital_rwa", "bank_capital_assets", "bank_leverage", "bank_zscore"], data);
    renderBankPane("bank-asset-quality", ["bank_npl", "bank_provisions_npl", "private_credit"], data);
    renderBankPane("bank-profitability", ["bank_roa", "bank_roe", "bank_nim", "bank_cost_income"], data);
    renderBankPane("bank-liquidity", ["bank_liquid_reserves", "broad_money_growth", "reserves_months"], data);
    renderBankPane("bank-systemic", ["gfdd_private_credit", "private_credit", "current_account", "reserves_months"], data);
    setHtml(el("bank-market-overlay"), MARKET_STATIC_LIMITS.map((text) => renderMiniItem({
      label: "Static market constraint",
      value: "Honest mode",
      text,
      source: "GitHub Pages architecture",
      tone: "warn"
    })).join(""));

    const heatIds = ["bank_reg_capital_rwa", "bank_zscore", "bank_npl", "bank_provisions_npl", "bank_roa", "bank_cost_income", "bank_liquid_reserves", "gfdd_private_credit"];
    setHtml(el("bank-heatmap"), `
      <div class="bank-heat-grid">
        ${heatIds.map((id) => {
          const item = data[id];
          if (!item?.stats) return `<div class="bank-heat-cell unavailable"><span>${escapeHtml(SERIES_BY_ID[id].short)}</span><b>No data</b><small>${escapeHtml(SERIES_BY_ID[id].activeSource)}</small></div>`;
          const risk = riskFromStat(item.stats, item.def);
          const tone = risk > 70 ? "bad" : risk > 58 ? "warn" : "good";
          return `<div class="bank-heat-cell tone-${tone}"><span>${escapeHtml(item.def.short)}</span><b>${risk}</b><small>${escapeHtml(item.stats.formatted)} | ${escapeHtml(item.def.activeSource)}</small></div>`;
        }).join("")}
      </div>
    `);

    const analogueItems = bankingAnalogueItems(data);
    setHtml(el("bank-analogues"), analogueItems.map(renderMiniItem).join(""));
  }

  function bankNarrative(country, data, score) {
    const npl = data.bank_npl?.stats;
    const cap = data.bank_reg_capital_rwa?.stats || data.bank_capital_assets?.stats;
    const liq = data.bank_liquid_reserves?.stats;
    const credit = data.gfdd_private_credit?.stats || data.private_credit?.stats;
    const parts = [`${country.name}'s banking stability score is ${score.stabilityScore}/100, using ${score.coverage}% of the macroprudential data requested by the static adapter.`];
    if (cap) parts.push(`Capital screens at ${cap.formatted} in ${cap.latest.year}.`);
    if (npl) parts.push(`Asset quality shows NPLs at ${npl.formatted}; the direction and z-score matter more than a single level.`);
    if (liq) parts.push(`Liquidity reserves are ${liq.formatted}, useful as a system-level funding buffer but not a substitute for deposit-flow data.`);
    if (credit) parts.push(`Credit depth is ${credit.formatted}; high positive z-scores should be treated as systemic vulnerability rather than strength.`);
    return parts.join(" ");
  }

  function renderBankPane(id, ids, data) {
    setHtml(el(id), ids.map((seriesId) => {
      const item = data[seriesId] || { def: SERIES_BY_ID[seriesId], stats: null, provenance: buildProvenance(SERIES_BY_ID[seriesId], null) };
      return paneMetric(item);
    }).join(""));
  }

  function bankingAnalogueItems(data) {
    const bankSeries = ["bank_npl", "bank_capital_assets", "bank_zscore", "bank_roa", "bank_liquid_reserves"];
    return bankSeries.map((id) => {
      const item = data[id];
      return {
        label: SERIES_BY_ID[id].short,
        value: item?.stats?.analogueYears?.join(", ") || "No analogue",
        text: item?.stats ? `Closest historical observations based on the current z-score of ${SERIES_BY_ID[id].label}.` : "No history returned by active adapter.",
        source: SERIES_BY_ID[id].activeSource,
        tone: item?.stats && Math.abs(item.stats.z) > 1 ? "warn" : "neutral"
      };
    });
  }

  async function renderDomain(domain) {
    const group = domain === "external" ? SERIES_GROUPS.external : domain === "liquidity" ? SERIES_GROUPS.liquidity : SERIES_GROUPS.inflation;
    await ensureCountryData(state.currentCountry, group);
    const data = state.loaded.get(state.currentCountry) || {};
    const engines = enginesFor(data);
    const panelId = domain === "external" ? "external-panel" : domain === "liquidity" ? "liquidity-panel" : "inflation-panel";
    const checklistId = domain === "external" ? "external-checklist" : domain === "liquidity" ? "liquidity-checklist" : "inflation-checklist";

    setHtml(el(panelId), `
      <div class="domain-metrics">${group.map((id) => metricCard(data[id])).join("")}</div>
      <div class="domain-narrative">
        <h3>${escapeHtml(COUNTRIES[state.currentCountry].name)} ${escapeHtml(domain)} read</h3>
        <p>${escapeHtml(domainNarrative(domain, data, engines))}</p>
      </div>
    `);
    setHtml(el(checklistId), domainChecklist(domain, data, engines).map(renderMiniItem).join(""));
  }

  function domainNarrative(domain, data, engines) {
    if (domain === "external") {
      return `External engine is ${engines.external.score}/100. Start with current account, reserves and short-term debt; then test whether FX, spreads or bank funding would be the first market channel.`;
    }
    if (domain === "liquidity") {
      return `Liquidity engine is ${engines.liquidity.score}/100. The useful question is whether money and credit are easing enough to offset external or banking pressure.`;
    }
    return `Inflation engine is ${engines.inflation.score}/100. The duration question is whether inflation pressure is fading fast enough to validate the market's policy path.`;
  }

  function domainChecklist(domain, data, engines) {
    if (domain === "external") {
      return [
        { label: "FX", value: `${marketChannels(engines).find((c) => c.name === "FX").score}/100`, text: "Watch reserves, current account direction, external debt rollover and policy credibility.", source: "External engine", tone: engines.external.z < -0.7 ? "bad" : "neutral" },
        { label: "Spreads", value: "Funding", text: "Sovereign spreads usually care first when external and liquidity engines deteriorate together.", source: "Transmission map", tone: engines.external.z < -0.7 && engines.liquidity.z < 0 ? "warn" : "neutral" }
      ];
    }
    if (domain === "liquidity") {
      return [
        { label: "Credit impulse", value: `${engines.liquidity.score}/100`, text: "Separate credit depth from credit acceleration; high depth can be vulnerability.", source: "Liquidity engine", tone: Math.abs(engines.liquidity.z) > 0.8 ? "warn" : "neutral" },
        { label: "Risk premium", value: "Check", text: "If liquidity weakens while growth slows, spreads can move before macro data confirms.", source: "Transmission map", tone: engines.liquidity.z < -0.7 ? "bad" : "neutral" }
      ];
    }
    return [
      { label: "Duration", value: `${marketChannels(engines).find((c) => c.name === "Rates").score}/100`, text: "Inflation pressure vs growth determines whether curves reprice before narrative changes.", source: "Inflation engine", tone: engines.inflation.z < -0.7 ? "bad" : "neutral" },
      { label: "Policy credibility", value: "Watch", text: "Real rates, inflation persistence and labour slack are the minimum policy screen.", source: "Policy checklist", tone: "neutral" }
    ];
  }

  async function renderChartModule() {
    const chartSeriesIds = Array.from(new Set([state.chartSeries, state.chartSecondarySeries].filter(Boolean)));
    await ensureMany(state.chartCountries, chartSeriesIds);
    renderChartCountryPicks();
    renderChartAnnotations();
    renderChartTemplates();
    drawChart();
  }

  function renderChartCountryPicks() {
    setHtml(el("chart-country-picks"), COUNTRY_ORDER.map((code) => {
      const checked = state.chartCountries.includes(code) ? "checked" : "";
      return `
        <label class="check-pill">
          <input type="checkbox" value="${escapeHtml(code)}" ${checked} data-chart-country />
          <span>${escapeHtml(COUNTRIES[code].name)}</span>
        </label>
      `;
    }).join(""));
  }

  function transformSeries(points, transform) {
    if (!points || !points.length) return [];
    if (transform === "level") return points.map((p) => ({ x: String(p.year), y: p.value }));
    if (transform === "indexed") {
      const base = points[0].value || 1;
      return points.map((p) => ({ x: String(p.year), y: (p.value / base) * 100 }));
    }
    if (transform === "yoy") {
      return points.slice(1).map((p, index) => {
        const prev = points[index];
        return { x: String(p.year), y: prev.value ? ((p.value - prev.value) / Math.abs(prev.value)) * 100 : null };
      });
    }
    if (transform === "zscore") {
      const values = points.map((p) => p.value);
      const avg = mean(values);
      const sd = stdev(values);
      return points.map((p) => ({ x: String(p.year), y: sd ? (p.value - avg) / sd : 0 }));
    }
    return points.map((p) => ({ x: String(p.year), y: p.value }));
  }

  function drawChart() {
    const canvas = el("main-chart");
    if (!canvas || typeof Chart === "undefined") {
      setLoadingStatus("Chart.js is not available; charting needs the CDN asset.");
      return;
    }
    const seriesIds = Array.from(new Set([state.chartSeries, state.chartSecondarySeries].filter(Boolean)));
    const def = SERIES_BY_ID[state.chartSeries];
    const datasets = [];
    state.chartCountries.forEach((code) => {
      seriesIds.forEach((seriesId) => {
        const item = state.loaded.get(code)?.[seriesId];
        const points = item?.series || [];
        const index = datasets.length;
        datasets.push({
          label: `${COUNTRIES[code].name} - ${SERIES_BY_ID[seriesId].short}`,
          countryCode: code,
          seriesId,
          data: transformSeries(points, state.chartTransform),
          borderColor: chartColor(index),
          backgroundColor: chartColor(index, 0.18),
          borderWidth: seriesId === state.chartSeries ? 2 : 1.5,
          borderDash: seriesId === state.chartSeries ? [] : [5, 4],
          pointRadius: 2,
          tension: 0.25
        });
      });
    });

    if (state.chart) state.chart.destroy();
    state.chart = new Chart(canvas, {
      type: "line",
      data: { datasets },
      options: {
        parsing: { xAxisKey: "x", yAxisKey: "y" },
        responsive: true,
        maintainAspectRatio: true,
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: { labels: { color: "#d9e1df", boxWidth: 10, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              afterBody: (items) => {
                const first = items[0];
                if (!first) return "";
                const dataset = first.chart.data.datasets[first.datasetIndex];
                const countryCode = dataset.countryCode;
                const item = state.loaded.get(countryCode)?.[dataset.seriesId];
                return item?.provenance ? `${item.def.activeSource} | release ${formatDate(item.provenance.releaseDate)}` : "";
              }
            }
          }
        },
        scales: {
          x: { type: "category", ticks: { color: "#9aa6a3", maxRotation: 0 }, grid: { color: "rgba(255,255,255,0.06)" } },
          y: { ticks: { color: "#9aa6a3" }, grid: { color: "rgba(255,255,255,0.06)" }, title: { display: true, text: chartAxisLabel(def), color: "#9aa6a3" } }
        }
      },
      plugins: [eventMarkerPlugin(), chartBrandPlugin()]
    });
  }

  function chartAxisLabel(def) {
    if (state.chartSecondarySeries) return "Transformed values; compare direction and z/relative moves";
    if (state.chartTransform === "indexed") return "Index, first observation = 100";
    if (state.chartTransform === "yoy") return "YoY change (%)";
    if (state.chartTransform === "zscore") return "Z-score";
    return `${def.label}${def.unit ? ` (${def.unit})` : ""}`;
  }

  function chartColor(index, alpha = 1) {
    const colors = [
      [182, 138, 46],
      [72, 190, 166],
      [226, 95, 76],
      [129, 154, 211],
      [232, 184, 86],
      [171, 114, 191]
    ];
    const [r, g, b] = colors[index % colors.length];
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function eventMarkerPlugin() {
    return {
      id: "gmeEventMarkers",
      afterDatasetsDraw(chart) {
        const annotations = eventAnnotationsForChart();
        if (!annotations.length) return;
        const { ctx, chartArea, scales } = chart;
        const labels = chart.data.datasets.flatMap((dataset) => dataset.data.map((point) => point.x));
        annotations.forEach((event) => {
          if (!labels.includes(String(event.year))) return;
          const x = scales.x.getPixelForValue(String(event.year));
          ctx.save();
          ctx.strokeStyle = "rgba(182, 138, 46, 0.5)";
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(x, chartArea.top);
          ctx.lineTo(x, chartArea.bottom);
          ctx.stroke();
          ctx.fillStyle = "rgba(232, 220, 184, 0.95)";
          ctx.font = "10px Arial";
          ctx.fillText(event.label.slice(0, 26), x + 4, chartArea.top + 12);
          ctx.restore();
        });
      }
    };
  }

  function chartBrandPlugin() {
    return {
      id: "gmeChartBrand",
      afterDraw(chart) {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;
        ctx.save();
        ctx.globalAlpha = 0.58;
        ctx.fillStyle = "#b68a2e";
        ctx.font = "10px Arial";
        ctx.textAlign = "right";
        ctx.fillText("Cordoba Research Group | GME", chartArea.right - 4, chartArea.bottom - 6);
        ctx.restore();
      }
    };
  }

  function eventAnnotationsForChart() {
    const events = [];
    state.chartCountries.forEach((code) => {
      events.push(...(EVENT_LIBRARY[code] || EVENT_LIBRARY.default));
    });
    const unique = new Map();
    events.forEach((event) => unique.set(`${event.year}_${event.label}`, event));
    return Array.from(unique.values()).slice(0, 8);
  }

  function renderChartAnnotations() {
    const items = eventAnnotationsForChart().map((event) => ({
      label: String(event.year),
      value: event.tags.join(", "),
      text: event.label,
      source: "Cordoba curated event layer",
      tone: "neutral"
    }));
    setHtml(el("chart-annotations"), items.map(renderMiniItem).join(""));
  }

  function renderChartTemplates() {
    const templates = [
      { name: "Inflation peer overlay", series: "inflation", transform: "level", countries: ["KZ", "UZ", "PL"] },
      { name: "Credit depth stress", series: "private_credit", transform: "zscore", countries: ["KZ", "UZ", "TR"] },
      { name: "External buffer screen", series: "reserves_months", transform: "level", countries: ["KZ", "ID", "MY"] }
    ];
    setHtml(el("chart-templates"), templates.map((template) => `
      <button type="button" data-template="${escapeHtml(template.name)}" data-series="${escapeHtml(template.series)}" data-transform="${escapeHtml(template.transform)}" data-countries="${escapeHtml(template.countries.join(","))}">
        <strong>${escapeHtml(template.name)}</strong>
        <small>${escapeHtml(SERIES_BY_ID[template.series].label)} | ${escapeHtml(template.transform)}</small>
      </button>
    `).join(""));
  }

  async function renderAlerts() {
    await ensureCountryData(state.currentCountry, SERIES_GROUPS.country.concat(SERIES_GROUPS.bank));
    renderSavedMonitors();
    const data = state.loaded.get(state.currentCountry) || {};
    const alertItems = buildLocalAlerts(data);
    setHtml(el("local-alerts"), alertItems.map(renderMiniItem).join(""));
  }

  function defaultMonitors() {
    return [
      { id: "inflation_watch", name: "Inflation watchlist", countries: ["KZ", "UZ", "PL", "TR"], series: ["inflation", "real_interest"] },
      { id: "em_bank_stress", name: "EM banking stress board", countries: ["KZ", "UZ", "TR", "ID", "MY"], series: ["bank_npl", "bank_capital_assets", "bank_liquid_reserves"] },
      { id: "central_asia", name: "Central Asia monitor", countries: ["KZ", "UZ", "KG", "TJ", "TM"], series: ["gdp_growth", "inflation", "current_account", "bank_npl"] }
    ];
  }

  function getSavedMonitors() {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}saved_monitors`);
      if (!raw) return defaultMonitors();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length ? parsed : defaultMonitors();
    } catch (err) {
      return defaultMonitors();
    }
  }

  function saveMonitors(monitors) {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}saved_monitors`, JSON.stringify(monitors));
    } catch (err) {
      showToast("Local storage is unavailable; monitor was not saved.");
    }
  }

  function renderSavedMonitors() {
    const monitors = getSavedMonitors();
    setHtml(el("saved-monitors"), monitors.map((monitor) => `
      <div class="saved-monitor">
        <div>
          <strong>${escapeHtml(monitor.name)}</strong>
          <small>${escapeHtml(monitor.countries.map((code) => COUNTRIES[code]?.name || code).join(", "))}</small>
          <small>${escapeHtml(monitor.series.map((id) => SERIES_BY_ID[id]?.short || id).join(" | "))}</small>
        </div>
        <button type="button" data-load-monitor="${escapeHtml(monitor.id)}">Open</button>
      </div>
    `).join(""));
  }

  function buildLocalAlerts(data) {
    const checks = [
      { id: "inflation", label: "Inflation surprise", trigger: (item) => item?.stats && item.stats.z > 1, text: "Inflation is more than one standard deviation above recent history." },
      { id: "reserves_months", label: "Reserve buffer deterioration", trigger: (item) => item?.stats && item.stats.z < -1, text: "Reserve coverage is materially below recent history." },
      { id: "private_credit", label: "Credit gap widening", trigger: (item) => item?.stats && item.stats.z > 1, text: "Private credit depth is high vs its own history. Treat this as vulnerability, not strength." },
      { id: "bank_npl", label: "NPL spike", trigger: (item) => item?.stats && item.stats.z > 1, text: "NPL ratio is high vs recent history." },
      { id: "bank_liquid_reserves", label: "Liquidity deterioration", trigger: (item) => item?.stats && item.stats.z < -1, text: "Bank liquid reserves are low vs recent history." }
    ];
    const fired = checks.filter((check) => check.trigger(data[check.id]));
    if (!fired.length) {
      return [{ label: "No local rule fired", value: "Clean", text: "Rules are evaluated only when this static page is open; there is no server-side alerting.", source: "Local browser", tone: "good" }];
    }
    return fired.map((check) => ({
      label: check.label,
      value: data[check.id].stats.formatted,
      text: `${check.text} This is a local screen, not a push alert.`,
      source: data[check.id].def.activeSource,
      tone: "bad"
    }));
  }

  async function renderReleaseBoard() {
    await ensureCountryData(state.currentCountry, SERIES.map((s) => s.id));
    const data = state.loaded.get(state.currentCountry) || {};
    const rows = SERIES.map((def) => {
      const item = data[def.id];
      const stats = item?.stats;
      const fresh = freshnessLabel(stats, def);
      return `
        <tr class="${stats ? "" : "data-gap"}">
          <td>${escapeHtml(def.label)}</td>
          <td><a href="${escapeHtml(def.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(def.activeSource)}</a><small>Best: ${escapeHtml(def.bestSource)}</small></td>
          <td>${escapeHtml(def.tier)}</td>
          <td>${escapeHtml(def.frequency)}</td>
          <td>${escapeHtml(stats?.latest?.year || "No observation")}</td>
          <td>${escapeHtml(formatDate(item?.provenance?.releaseDate))}</td>
          <td><span class="source-badge tone-${escapeHtml(fresh.tone)}">${escapeHtml(fresh.label)}</span></td>
        </tr>
      `;
    });
    setHtml(el("release-rows"), rows.join(""));
  }

  async function renderNote() {
    await ensureCountryData(state.currentCountry, SERIES_GROUPS.country.concat(SERIES_GROUPS.bank));
    await ensureCountryData(state.compareB, [state.compareSeries]);
    const data = state.loaded.get(state.currentCountry) || {};
    const engines = enginesFor(data);
    const country = COUNTRIES[state.currentCountry];
    const note = buildNoteDraft(country, data, engines);
    if (el("note-draft")) el("note-draft").value = note;
    setHtml(el("note-questions"), nextQuestions(data, engines).map(renderMiniItem).join(""));
  }

  function buildNoteDraft(country, data, engines) {
    const bank = bankingScore(data);
    const channels = marketChannels(engines).sort((a, b) => b.score - a.score);
    const pressures = pressureItems(data, engines).slice(0, 4);
    const breaks = stressLanes(data, engines).slice(0, 3);
    const analogues = collectAnalogueYears(data).slice(0, 5);
    const peerLine = buildPeerLine(data);
    const lines = [];
    lines.push(`${country.name} - CRG macro handoff`);
    lines.push("");
    lines.push("Summary");
    lines.push(`- Regime: ${regimeLabel(engines)}.`);
    lines.push(`- Dominant return driver: ${channels[0]?.name || "Mixed"} (${channels[0]?.score ?? "--"}/100).`);
    lines.push(`- Banking read: ${bank.stabilityScore}/100 stability score; ${bank.coverage}% macroprudential coverage in the current source stack.`);
    if (peerLine) lines.push(`- Peer context: ${peerLine}`);
    lines.push("");
    lines.push("What changed versus history");
    pressures.forEach((item) => lines.push(`- ${item.label}: ${item.value}; ${item.text}`));
    lines.push("");
    lines.push("What matters for allocators");
    channels.slice(0, 4).forEach((channel) => lines.push(`- ${channel.name}: ${channel.text}`));
    lines.push("");
    lines.push("Risks and break points");
    breaks.forEach((item) => lines.push(`- ${item.label}: ${item.text}`));
    lines.push("");
    lines.push("Analogues");
    lines.push(`- Closest recent episodes to test against: ${analogues.length ? analogues.join(", ") : "insufficient cross-series history"}.`);
    lines.push("");
    lines.push("Monitor next");
    nextQuestions(data, engines).slice(0, 4).forEach((item) => lines.push(`- ${item.text}`));
    lines.push("");
    lines.push("Potential Cordoba View setup");
    lines.push(`- The note should decide whether ${country.name}'s current regime is a pricing opportunity, a funding-risk warning, or a wait-for-confirmation setup.`);
    lines.push(`- The hardest judgement is whether ${channels[0]?.name || "the dominant channel"} is already priced or still under-owned by allocators.`);
    lines.push("");
    lines.push("Provenance discipline");
    lines.push("- Use the source rail before publication. Where market feeds are absent in static mode, state the limitation and avoid live-pricing language.");
    return lines.join("\n");
  }

  function collectAnalogueYears(data) {
    const counts = new Map();
    Object.values(data).forEach((item) => {
      (item.stats?.analogueYears || []).forEach((year) => counts.set(year, (counts.get(year) || 0) + 1));
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([year]) => year);
  }

  function buildPeerLine(data) {
    const peer = state.loaded.get(state.compareB);
    const seriesId = state.compareSeries;
    const own = data[seriesId]?.stats;
    const other = peer?.[seriesId]?.stats;
    if (!own || !other) return "";
    const def = SERIES_BY_ID[seriesId];
    const diff = own.latest.value - other.latest.value;
    return `${SERIES_BY_ID[seriesId].short} is ${fmt(Math.abs(diff), def.decimals, def.unit)} ${diff >= 0 ? "above" : "below"} ${COUNTRIES[state.compareB].name}.`;
  }

  function nextQuestions(data, engines) {
    const q = [];
    if (engines.external.z < -0.6) q.push({ label: "External", value: "Funding", text: "Is the external deterioration cyclical, commodity-driven or financing-driven?", source: "External engine", tone: "warn" });
    if (engines.banking.z < -0.6) q.push({ label: "Banking", value: "Fragility", text: "Is asset-quality pressure large enough to impair credit creation or policy transmission?", source: "Bank module", tone: "bad" });
    if (engines.inflation.z < -0.6) q.push({ label: "Rates", value: "Duration", text: "Does current inflation pressure justify the market's policy path?", source: "Inflation module", tone: "warn" });
    q.push({ label: "Export", value: "Chart", text: "Which single chart best explains the regime to an allocator?", source: "Workflow", tone: "neutral" });
    return q.slice(0, 4);
  }

  function researchMatches(countryCode, domain, engines) {
    return CORDOBA_RESEARCH.map((note) => {
      let score = 0;
      if (note.countries.includes(countryCode)) score += 5;
      if (note.domains.includes(domain)) score += 3;
      const dominant = Object.values(engines).sort((a, b) => Math.abs(b.z) - Math.abs(a.z))[0];
      if (dominant && note.domains.includes(dominant.label.toLowerCase())) score += 2;
      if (note.countries.some((code) => COUNTRIES[code]?.region === COUNTRIES[countryCode]?.region)) score += 1;
      return { note, score };
    })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((entry) => entry.note);
  }

  function researchCard(note) {
    return `
      <a class="research-card" href="${escapeHtml(note.url)}" target="_blank" rel="noopener noreferrer">
        <strong>${escapeHtml(note.title)}</strong>
        <span>${escapeHtml(note.domains.join(" | "))}</span>
        <small>${escapeHtml(note.tags.join(", "))}</small>
      </a>
    `;
  }

  async function renderContextPanel() {
    await ensureCountryData(state.currentCountry, SERIES_GROUPS.core);
    const data = state.loaded.get(state.currentCountry) || {};
    const country = COUNTRIES[state.currentCountry];
    const engines = enginesFor(data);
    const attention = attentionSummary(data, engines);
    setText(el("context-title"), country.name);
    setHtml(el("context-meta"), `
      <div><span>Region</span><b>${escapeHtml(country.region)}</b></div>
      <div><span>Active screen</span><b>${escapeHtml(state.activeModule)}</b></div>
      <div><span>Regime</span><b>${escapeHtml(regimeLabel(engines))}</b></div>
      <div><span>First market</span><b>${escapeHtml(firstMarket(engines))}</b></div>
      <div><span>Attention</span><b class="${escapeHtml(attention.className)}">${escapeHtml(attention.label)}</b></div>
    `);
    setText(el("status-right"), `${country.name} | ${attention.label}`);

    const provItems = Object.values(data)
      .filter((item) => item.stats)
      .slice(0, 8)
      .map((item) => provenanceItem(item));
    setHtml(el("provenance-list"), provItems.join("") || `<div class="provenance-item">No series loaded yet.</div>`);

    const queue = [
      { label: "Monitor", cmd: `${state.currentCountry} monitor`, module: "CTRY" },
      { label: "Compare", cmd: `compare ${state.compareA} vs ${state.compareB} ${state.compareSeries}`, module: "COMP" },
      { label: "Diagnose banks", cmd: `${state.currentCountry} banking system`, module: "BANK" },
      { label: "Export chart", cmd: `chart ${state.chartSeries} ${state.currentCountry}`, module: "CHRT" },
      { label: "Write note", cmd: `${state.currentCountry} note`, module: "NOTE" }
    ];
    setHtml(el("workflow-queue"), queue.map((item) => `
      <button type="button" data-module="${escapeHtml(item.module)}">
        <span>${escapeHtml(item.label)}</span>
        <small>${escapeHtml(item.cmd)}</small>
      </button>
    `).join(""));
  }

  function provenanceItem(item) {
    const fresh = freshnessLabel(item.stats, item.def);
    return `
      <div class="provenance-item">
        <strong>${escapeHtml(item.def.short)}: ${escapeHtml(item.stats.formatted)}</strong>
        <span>${escapeHtml(item.def.activeSource)}</span>
        <small>Period ${escapeHtml(item.stats.latest.year)} | release ${escapeHtml(formatDate(item.provenance.releaseDate))} | ${escapeHtml(fresh.label)} | ${escapeHtml(item.provenance.officialStatus)} | interpolated: no</small>
      </div>
    `;
  }

  function attentionSummary(data, engines) {
    const items = Object.values(data).filter((item) => item.stats);
    const critical = items.filter((item) => attentionClass(item).includes("attention-critical")).length;
    const stale = items.filter((item) => freshnessLabel(item.stats, item.def).tone === "bad").length;
    const engineStress = Math.max(
      100 - engines.inflation.score,
      100 - engines.external.score,
      100 - engines.banking.score,
      100 - engines.liquidity.score
    );
    if (critical || engineStress >= 76) return { label: `${critical || 1} critical`, className: "attention-text-critical" };
    if (stale) return { label: `${stale} stale`, className: "attention-text-stale" };
    if (engineStress >= 62) return { label: "watch", className: "attention-text-watch" };
    return { label: "normal", className: "attention-text-normal" };
  }

  function parseCommand(input) {
    const raw = String(input || "").trim();
    if (!raw) return;
    const lower = raw.toLowerCase();
    const countries = findCountries(lower);
    const requestedPeerSet = findPeerSet(lower);
    const seriesId = findSeries(lower);

    state.lastWarning = "";
    if (requestedPeerSet) state.peerSet = requestedPeerSet;

    if (!lower.includes("chart") && (lower.includes("compare") || lower.includes(" vs ") || lower.includes(" versus "))) {
      state.compareA = countries[0] || state.currentCountry;
      state.compareB = countries[1] || defaultPeerFor(state.compareA);
      state.compareSeries = seriesId || state.compareSeries;
      state.currentCountry = state.compareA;
      setModule("COMP", false);
      return renderActiveModule();
    }

    if (lower.includes("bank") || lower.includes("fsi") || lower.includes("stress")) {
      if (countries[0]) state.currentCountry = countries[0];
      setModule("BANK", false);
      return renderActiveModule();
    }

    if (lower.includes("chart")) {
      if (countries.length) state.chartCountries = countries.slice(0, 4);
      if (!state.chartCountries.length) state.chartCountries = [state.currentCountry];
      state.chartSeries = seriesId || state.chartSeries;
      state.chartSecondarySeries = "";
      if (lower.includes("bis") || lower.includes("credit gap")) {
        state.chartSeries = "private_credit";
        state.lastWarning = "BIS credit gap is not live in this static build; showing World Bank private credit/GDP proxy with clear provenance.";
      }
      if (lower.includes("fx")) {
        state.lastWarning = "Live FX is a market feed and is not fabricated in static mode; charting reserves as the official external-buffer series.";
        if (lower.includes("reserve")) state.chartSeries = "reserves_months";
      }
      setModule("CHRT", false);
      return renderActiveModule();
    }

    if (countries[0]) state.currentCountry = countries[0];
    if (requestedPeerSet && lower.includes("board")) {
      state.domain = lower.includes("liquidity") || lower.includes("money") ? "liquidity" : state.domain;
      setModule("MONITOR", false);
      return renderActiveModule();
    }
    if (lower.includes("credit gap")) {
      state.lastWarning = "BIS credit gap is not live in this static build; showing private credit/GDP as the transparent static proxy.";
      setModule("LIQD", false);
      return renderActiveModule();
    }
    if (lower.includes("external")) setModule("EXTL", false);
    else if (lower.includes("liquidity") || lower.includes("money")) setModule("LIQD", false);
    else if (lower.includes("inflation") || lower.includes("cpi") || lower.includes("policy")) setModule("INFL", false);
    else if (lower.includes("note") || lower.includes("write")) setModule("NOTE", false);
    else if (lower.includes("alert") || lower.includes("watchlist")) setModule("ALRT", false);
    else if (lower.includes("release") || lower.includes("fresh")) setModule("RLS", false);
    else setModule(countries[0] ? "CTRY" : "MONITOR", false);
    return renderActiveModule();
  }

  function findCountries(text) {
    const matches = [];
    const padded = ` ${text.replace(/[^a-z0-9]+/g, " ")} `;
    COUNTRY_ORDER.forEach((code) => {
      const aliases = COUNTRIES[code].aliases || [];
      aliases.forEach((alias) => {
        const index = padded.indexOf(` ${alias.toLowerCase()} `);
        if (index >= 0) matches.push({ code, index, length: alias.length });
      });
    });
    return matches
      .sort((a, b) => a.index - b.index || b.length - a.length)
      .reduce((acc, match) => {
        if (!acc.includes(match.code)) acc.push(match.code);
        return acc;
      }, []);
  }

  function findPeerSet(text) {
    if (text.includes("central asia")) return "central_asia";
    if (text.includes("south east asia") || text.includes("southeast asia") || text.includes("asean")) return "south_east_asia";
    if (text.includes("g20 em") || text.includes("g-20 em")) return "g20_em";
    if (text.includes("europe em")) return "europe_em";
    return null;
  }

  function findSeries(text) {
    const keywordMap = [
      ["npl", "bank_npl"],
      ["nonperforming", "bank_npl"],
      ["capital", "bank_capital_assets"],
      ["car", "bank_reg_capital_rwa"],
      ["z-score", "bank_zscore"],
      ["zscore", "bank_zscore"],
      ["liquid reserves", "bank_liquid_reserves"],
      ["credit gap", "private_credit"],
      ["private credit", "private_credit"],
      ["credit", "private_credit"],
      ["inflation", "inflation"],
      ["cpi", "inflation"],
      ["gdp", "gdp_growth"],
      ["growth", "gdp_growth"],
      ["current account", "current_account"],
      ["reserves", "reserves_months"],
      ["money", "broad_money_growth"],
      ["m2", "broad_money_growth"],
      ["real rate", "real_interest"]
    ];
    const match = keywordMap.find(([keyword]) => text.includes(keyword));
    return match ? match[1] : null;
  }

  function defaultPeerFor(code) {
    const peerSet = Object.values(PEER_SETS).find((set) => set.countries.includes(code));
    return peerSet?.countries.find((c) => c !== code) || "US";
  }

  function setModule(code, render = true) {
    state.activeModule = code;
    if (code === "EXTL") state.domain = "external";
    if (code === "LIQD") state.domain = "liquidity";
    if (code === "INFL") state.domain = "inflation";
    if (code === "BANK") state.domain = "banking";
    if (code === "CTRY" || code === "MONITOR") state.domain = "macro";
    syncControls();
    if (render) renderActiveModule();
  }

  function syncControls() {
    if (el("country-select")) el("country-select").value = state.currentCountry;
    if (el("peer-set-select")) el("peer-set-select").value = state.peerSet;
    if (el("domain-select")) el("domain-select").value = state.domain;
    if (el("compare-a")) el("compare-a").value = state.compareA;
    if (el("compare-b")) el("compare-b").value = state.compareB;
    if (el("compare-series")) el("compare-series").value = state.compareSeries;
    if (el("chart-series")) el("chart-series").value = state.chartSeries;
    if (el("chart-secondary-series")) el("chart-secondary-series").value = state.chartSecondarySeries;
    if (el("chart-transform")) el("chart-transform").value = state.chartTransform;
  }

  function populateControls() {
    const countryOptions = COUNTRY_ORDER.map((code) => `<option value="${escapeHtml(code)}">${escapeHtml(COUNTRIES[code].name)} (${escapeHtml(COUNTRIES[code].wb)})</option>`).join("");
    ["country-select", "compare-a", "compare-b"].forEach((id) => setHtml(el(id), countryOptions));

    const peerOptions = Object.entries(PEER_SETS).map(([id, set]) => `<option value="${escapeHtml(id)}">${escapeHtml(set.label)}</option>`).join("");
    setHtml(el("peer-set-select"), peerOptions);

    const seriesOptions = SERIES.filter((s) => SERIES_GROUPS.chart.includes(s.id) || ["inflation", "gdp_growth", "private_credit", "current_account"].includes(s.id))
      .map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.label)}</option>`)
      .join("");
    setHtml(el("compare-series"), seriesOptions);
    setHtml(el("chart-series"), seriesOptions);
    setHtml(el("chart-secondary-series"), `<option value="">No overlay</option>${seriesOptions}`);
    syncControls();
  }

  function attachEvents() {
    el("command-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = el("command-input");
      parseCommand(input?.value || "");
      if (input) input.select();
    });

    document.addEventListener("click", (event) => {
      const moduleButton = event.target.closest("[data-module]");
      if (moduleButton && moduleButton.dataset.module) {
        setModule(moduleButton.dataset.module);
        return;
      }
      const countryButton = event.target.closest("[data-open-country]");
      if (countryButton) {
        state.currentCountry = countryButton.dataset.openCountry;
        setModule("CTRY");
        return;
      }
      const commandButton = event.target.closest("[data-command]");
      if (commandButton) {
        if (el("command-input")) el("command-input").value = commandButton.dataset.command;
        parseCommand(commandButton.dataset.command);
        return;
      }
      const templateButton = event.target.closest("[data-template]");
      if (templateButton) {
        state.chartSeries = templateButton.dataset.series;
        state.chartSecondarySeries = "";
        state.chartTransform = templateButton.dataset.transform;
        state.chartCountries = templateButton.dataset.countries.split(",").filter(Boolean);
        syncControls();
        renderActiveModule();
        return;
      }
      const monitorButton = event.target.closest("[data-load-monitor]");
      if (monitorButton) {
        const monitor = getSavedMonitors().find((item) => item.id === monitorButton.dataset.loadMonitor);
        if (monitor) {
          state.chartCountries = monitor.countries.slice(0, 6);
          state.chartSeries = monitor.series[0] || state.chartSeries;
          state.currentCountry = monitor.countries[0] || state.currentCountry;
          setModule("MONITOR", false);
          showToast(`${monitor.name} loaded locally.`);
          renderActiveModule();
        }
        return;
      }
      if (event.target.closest("[data-action='export']")) {
        exportCountrySummary();
      }
    });

    el("country-select")?.addEventListener("change", (event) => {
      state.currentCountry = event.target.value;
      renderActiveModule();
    });
    el("peer-set-select")?.addEventListener("change", (event) => {
      state.peerSet = event.target.value;
      renderActiveModule();
    });
    el("domain-select")?.addEventListener("change", (event) => {
      state.domain = event.target.value;
      if (state.domain === "external") setModule("EXTL");
      else if (state.domain === "liquidity") setModule("LIQD");
      else if (state.domain === "inflation") setModule("INFL");
      else if (state.domain === "banking") setModule("BANK");
      else setModule("CTRY");
    });
    el("compare-a")?.addEventListener("change", (event) => {
      state.compareA = event.target.value;
      renderActiveModule();
    });
    el("compare-b")?.addEventListener("change", (event) => {
      state.compareB = event.target.value;
      renderActiveModule();
    });
    el("compare-series")?.addEventListener("change", (event) => {
      state.compareSeries = event.target.value;
      renderActiveModule();
    });
    el("chart-series")?.addEventListener("change", (event) => {
      state.chartSeries = event.target.value;
      renderActiveModule();
    });
    el("chart-secondary-series")?.addEventListener("change", (event) => {
      state.chartSecondarySeries = event.target.value;
      renderActiveModule();
    });
    el("chart-add-country")?.addEventListener("click", () => {
      if (!state.chartCountries.includes(state.currentCountry)) {
        state.chartCountries = [state.currentCountry, ...state.chartCountries].slice(0, 6);
        renderActiveModule();
        showToast(`${COUNTRIES[state.currentCountry].name} added to chart.`);
      } else {
        showToast(`${COUNTRIES[state.currentCountry].name} is already in the chart.`);
      }
    });
    el("chart-transform")?.addEventListener("change", (event) => {
      state.chartTransform = event.target.value;
      renderActiveModule();
    });
    el("chart-country-picks")?.addEventListener("change", (event) => {
      if (!event.target.matches("[data-chart-country]")) return;
      const checked = all("[data-chart-country]:checked", el("chart-country-picks")).map((input) => input.value);
      state.chartCountries = checked.length ? checked.slice(0, 6) : [state.currentCountry];
      renderActiveModule();
    });
    el("save-workspace-btn")?.addEventListener("click", () => saveCurrentWorkspace());
    el("export-workstation-btn")?.addEventListener("click", () => exportCountrySummary());
    el("export-summary-btn")?.addEventListener("click", () => exportCountrySummary());
    el("chart-export-png")?.addEventListener("click", () => exportChartPng());
    el("chart-export-pdf")?.addEventListener("click", () => exportChartPdf());
    el("chart-export-svg")?.addEventListener("click", () => exportChartSvg());
    el("chart-copy-image")?.addEventListener("click", () => copyChartImage());
    el("copy-note-btn")?.addEventListener("click", () => copyText(el("note-draft")?.value || "", "Note copied."));
    el("copy-questions-btn")?.addEventListener("click", () => {
      const text = all("#note-questions .mini-item").map((node) => node.innerText.trim()).join("\n\n");
      copyText(text, "Questions copied.");
    });
    el("create-monitor-btn")?.addEventListener("click", () => createMonitor());

    document.addEventListener("click", (event) => {
      const filter = event.target.closest("[data-indicator-filter]");
      if (!filter) return;
      all("[data-indicator-filter]").forEach((button) => button.classList.toggle("active", button === filter));
      const data = state.loaded.get(state.currentCountry) || {};
      renderIndicatorRows(data, filter.dataset.indicatorFilter);
    });
  }

  function saveCurrentWorkspace() {
    const monitors = getSavedMonitors();
    const id = `monitor_${Date.now()}`;
    monitors.push({
      id,
      name: `${COUNTRIES[state.currentCountry].name} ${state.activeModule} workspace`,
      countries: Array.from(new Set([state.currentCountry, ...state.chartCountries, state.compareA, state.compareB])).slice(0, 8),
      series: Array.from(new Set([state.chartSeries, state.compareSeries, "inflation", "current_account", "bank_npl"])).slice(0, 8)
    });
    saveMonitors(monitors);
    showToast("Workspace saved locally in this browser.");
    if (state.activeModule === "ALRT") renderAlerts();
  }

  function createMonitor() {
    const input = el("monitor-name-input");
    const name = input?.value?.trim() || `${COUNTRIES[state.currentCountry].name} monitor`;
    const monitors = getSavedMonitors();
    monitors.push({
      id: `custom_${Date.now()}`,
      name,
      countries: [state.currentCountry, state.compareA, state.compareB].filter((value, index, arr) => arr.indexOf(value) === index),
      series: [state.compareSeries, state.chartSeries, "bank_npl", "current_account"].filter((value, index, arr) => arr.indexOf(value) === index)
    });
    saveMonitors(monitors);
    if (input) input.value = "";
    renderSavedMonitors();
    showToast("Monitor saved locally. No server-side alerting is implied.");
  }

  async function copyText(text, successMessage) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage);
    } catch (err) {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
      showToast(successMessage);
    }
  }

  async function exportCountrySummary() {
    if (!window.jspdf) {
      showToast("PDF library is not available.");
      return;
    }
    setLoadingStatus("Generating country summary export...");
    await ensureCountryData(state.currentCountry, Array.from(new Set(SERIES_GROUPS.country.concat(SERIES_GROUPS.bank))));
    const data = state.loaded.get(state.currentCountry) || {};
    const engines = enginesFor(data);
    const country = COUNTRIES[state.currentCountry];
    const model = buildCountrySummaryModel(country, data, engines);
    const markdown = renderCountrySummaryMarkdown(model);
    const slug = country.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

    await renderCountrySummaryPdf(model, `gme_${slug}_country_summary.pdf`);
    if (el("note-draft")) el("note-draft").value = markdown;
    setLoadingStatus(`Country summary exported for ${country.name}`);
    showToast("Country summary PDF exported.");
  }

  function buildCountrySummaryModel(country, data, engines) {
    const bank = bankingScore(data);
    const points = pressureItems(data, engines).slice(0, 5);
    const channels = marketChannels(engines).sort((a, b) => b.score - a.score);
    const vulnerabilities = stressLanes(data, engines).slice(0, 4);
    const questions = nextQuestions(data, engines).slice(0, 4);
    const metrics = [
      "gdp_growth",
      "inflation",
      "current_account",
      "reserves_months",
      "broad_money_growth",
      "private_credit",
      "bank_npl",
      "bank_capital_assets",
      "bank_liquid_reserves"
    ]
      .map((id) => data[id])
      .filter(Boolean);

    const takeawayLines = [
      `${country.name} screens as ${regimeLabel(engines).toLowerCase()}.`,
      `The dominant investor channel is ${channels[0]?.name || "mixed"}, with a pressure score of ${channels[0]?.score ?? "--"}/100.`,
      `Banking stability is ${bank.stabilityScore}/100 with ${bank.coverage}% macroprudential coverage in the current static adapter.`,
      `The main monitor-next item is ${vulnerabilities[0]?.label || "data freshness"}: ${vulnerabilities[0]?.text || "verify releases and source coverage before investment use."}`
    ];

    return {
      country,
      date: formatLongDate(CURRENT_DATE),
      title: `${country.name} Macro And Banking Snapshot`,
      subtitle: "Allocator-ready country summary generated from the Global Macro Engine",
      regime: regimeLabel(engines),
      engines,
      bank,
      points,
      channels,
      vulnerabilities,
      questions,
      metrics,
      takeaways: takeawayLines,
      provenance: metrics.map((item) => ({
        series: item.def.label,
        value: item.stats ? item.stats.formatted : "No observation",
        period: item.stats?.latest?.year || "No observation",
        source: item.def.activeSource,
        bestSource: item.def.bestSource,
        frequency: item.def.frequency,
        releaseDate: formatDate(item.provenance?.releaseDate),
        status: item.def.status,
        freshness: freshnessLabel(item.stats, item.def).label,
        interpolated: "No"
      }))
    };
  }

  async function renderCountrySummaryPdf(model, filename) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "pt", "a4");
    const page = {
      width: pdf.internal.pageSize.getWidth(),
      height: pdf.internal.pageSize.getHeight(),
      margin: 42,
      y: 42
    };
    const olive = [125, 100, 31];
    const muted = [88, 88, 88];
    const light = [245, 241, 230];
    const line = [205, 205, 205];
    const logo = await loadImageDataUrl(CORDOBA_LOGO_PATH);

    function header() {
      pdf.setFillColor(252, 250, 245);
      pdf.rect(page.margin, 28, page.width - page.margin * 2, 54, "F");
      pdf.setFillColor(229, 222, 203);
      pdf.triangle(page.width - 205, 28, page.width - 172, 28, page.width - 118, 82, "F");
      pdf.setFillColor(218, 210, 188);
      pdf.triangle(page.width - 170, 28, page.width - 139, 28, page.width - 85, 82, "F");
      if (logo) {
        pdf.addImage(logo, "PNG", page.margin + 6, 34, 94, 38);
      } else {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(30, 30, 30);
        pdf.text("Cordoba", page.margin + 8, 48);
        pdf.text("Research Group", page.margin + 8, 62);
      }
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...muted);
      pdf.text("Global Markets Research", page.width - page.margin - 125, 55);
      pdf.setFontSize(11);
      pdf.text(model.date, page.width - page.margin - 80, 69);
      pdf.setFillColor(...olive);
      pdf.rect(page.margin, 88, page.width - page.margin * 2, 8, "F");
      page.y = 116;
    }

    function ensureSpace(height) {
      if (page.y + height < page.height - 54) return;
      pdf.addPage();
      header();
    }

    function sectionTitle(title) {
      ensureSpace(26);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...olive);
      pdf.text(title, page.margin, page.y);
      page.y += 13;
    }

    function wrapped(text, x, y, width, options = {}) {
      pdf.setFont("helvetica", options.bold ? "bold" : "normal");
      pdf.setFontSize(options.size || 9);
      pdf.setTextColor(...(options.color || [30, 30, 30]));
      const lines = pdf.splitTextToSize(text, width);
      pdf.text(lines, x, y);
      return lines.length * ((options.size || 9) + 2);
    }

    function bullets(lines, x, width) {
      lines.forEach((line) => {
        ensureSpace(20);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(30, 30, 30);
        pdf.text("-", x, page.y);
        const used = wrapped(line, x + 10, page.y, width - 10, { size: 9 });
        page.y += Math.max(13, used + 2);
      });
    }

    function simpleTable(headers, rows, widths) {
      const x0 = page.margin;
      const rowH = 18;
      ensureSpace(rowH * (Math.min(rows.length, 8) + 2));
      pdf.setFillColor(238, 238, 238);
      pdf.rect(x0, page.y, widths.reduce((a, b) => a + b, 0), rowH, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(45, 45, 45);
      let x = x0;
      headers.forEach((h, idx) => {
        pdf.text(h, x + 4, page.y + 12);
        x += widths[idx];
      });
      page.y += rowH;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      rows.forEach((row) => {
        ensureSpace(rowH + 6);
        x = x0;
        pdf.setDrawColor(...line);
        pdf.line(x0, page.y, x0 + widths.reduce((a, b) => a + b, 0), page.y);
        row.forEach((cell, idx) => {
          const text = pdf.splitTextToSize(String(cell ?? ""), widths[idx] - 8).slice(0, 2);
          pdf.text(text, x + 4, page.y + 11);
          x += widths[idx];
        });
        page.y += rowH;
      });
      page.y += 8;
    }

    header();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(20, 20, 20);
    pdf.text("Global Macro Strategy", page.margin, page.y);
    page.y += 24;
    pdf.setFontSize(20);
    pdf.text(model.title, page.margin, page.y);
    page.y += 15;
    wrapped(model.subtitle, page.margin, page.y, 360, { size: 9, color: muted });
    page.y += 22;

    const metaW = (page.width - page.margin * 2) / 4;
    const meta = [
      ["Country", model.country.name],
      ["Region", model.country.region],
      ["Regime", model.regime],
      ["First Market", model.channels[0]?.name || "Mixed"]
    ];
    pdf.setDrawColor(...line);
    pdf.setFillColor(250, 250, 250);
    meta.forEach((m, idx) => {
      const x = page.margin + idx * metaW;
      pdf.rect(x, page.y, metaW, 38, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(...muted);
      pdf.text(m[0].toUpperCase(), x + 6, page.y + 12);
      pdf.setFontSize(8);
      pdf.setTextColor(25, 25, 25);
      pdf.text(pdf.splitTextToSize(m[1], metaW - 12).slice(0, 2), x + 6, page.y + 25);
    });
    page.y += 54;

    sectionTitle("Key Takeaways");
    pdf.setFillColor(...light);
    pdf.setDrawColor(217, 201, 164);
    const boxTop = page.y - 4;
    const startY = page.y;
    page.y += 7;
    bullets(model.takeaways, page.margin + 10, page.width - page.margin * 2 - 20);
    pdf.rect(page.margin, boxTop, page.width - page.margin * 2, page.y - boxTop + 2, "S");
    page.y += 12;

    sectionTitle("Macro And Banking Scoreboard");
    simpleTable(
      ["Metric", "Latest", "Period", "Z", "Source", "Freshness"],
      model.metrics.map((item) => [
        item.def.short,
        item.stats ? item.stats.formatted : "No observation",
        item.stats?.latest?.year || "-",
        item.stats ? compact(item.stats.z, 2) : "-",
        item.def.activeSource,
        freshnessLabel(item.stats, item.def).label
      ]),
      [92, 62, 44, 34, 142, 130]
    );

    sectionTitle("Markets That Care First");
    bullets(model.channels.slice(0, 4).map((c) => `${c.name} (${c.score}/100): ${c.text}`), page.margin, page.width - page.margin * 2);

    sectionTitle("Break Points And Watch Items");
    bullets(model.vulnerabilities.map((v) => `${v.label}: ${v.text}`), page.margin, page.width - page.margin * 2);

    sectionTitle("Cordoba View Setup");
    bullets([
      `Decide whether ${model.country.name}'s current regime is a pricing opportunity, a funding-risk warning, or a wait-for-confirmation setup.`,
      `Test whether ${model.channels[0]?.name || "the dominant channel"} is already priced or still under-owned by allocators.`,
      "Use the provenance table before publication; avoid live-pricing language where static mode has no market feed."
    ], page.margin, page.width - page.margin * 2);

    sectionTitle("Provenance");
    simpleTable(
      ["Series", "Source", "Freq", "Release", "Status", "Freshness"],
      model.provenance.map((row) => [row.series, row.source, row.frequency, row.releaseDate, row.status, row.freshness]),
      [110, 125, 42, 64, 60, 103]
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...muted);
    pdf.text("Generated by Cordoba Research Group Global Macro Engine. Screening and research handoff document, not investment advice.", page.margin, page.height - 30);
    pdf.save(filename);
  }

  function renderCountrySummaryMarkdown(model) {
    const lines = [];
    lines.push(`# ${model.title}`);
    lines.push(`Cordoba Research Group | Global Macro Engine | ${model.date}`);
    lines.push("");
    lines.push(`**Regime:** ${model.regime}`);
    lines.push(`**First market:** ${model.channels[0]?.name || "Mixed"}`);
    lines.push("");
    lines.push("## Key Takeaways");
    model.takeaways.forEach((line) => lines.push(`- ${line}`));
    lines.push("");
    lines.push("## Markets That Care First");
    model.channels.slice(0, 4).forEach((channel) => lines.push(`- ${channel.name} (${channel.score}/100): ${channel.text}`));
    lines.push("");
    lines.push("## Vulnerabilities");
    model.vulnerabilities.forEach((item) => lines.push(`- ${item.label}: ${item.text}`));
    lines.push("");
    lines.push("## Metrics And Provenance");
    lines.push("| Series | Latest | Period | Source | Frequency | Freshness |");
    lines.push("|---|---:|---:|---|---|---|");
    model.provenance.forEach((row) => lines.push(`| ${row.series} | ${row.value} | ${row.period} | ${row.source} | ${row.frequency} | ${row.freshness} |`));
    lines.push("");
    lines.push("## Monitor Next");
    model.questions.forEach((item) => lines.push(`- ${item.text}`));
    lines.push("");
    lines.push("Static-site note: live market prices, CDS, curves and server-side push alerts are not fabricated in this GitHub Pages build.");
    return lines.join("\n");
  }

  function downloadText(filename, mimeType, text) {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function loadImageDataUrl(src) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(image, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (err) {
          resolve("");
        }
      };
      image.onerror = () => resolve("");
      image.src = src;
    });
  }

  function formatLongDate(date) {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Europe/London"
    });
  }

  function exportChartPng() {
    if (!state.chart) {
      showToast("Chart is not ready.");
      return;
    }
    const url = state.chart.toBase64Image("image/png", 1);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gme_chart_${state.chartSeries}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Chart PNG exported.");
  }

  function exportChartPdf() {
    if (!state.chart || !window.jspdf) {
      showToast("Chart or PDF library is not ready.");
      return;
    }
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("l", "pt", "a4");
    const img = state.chart.toBase64Image("image/png", 1);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.setFillColor(13, 17, 19);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");
    pdf.setTextColor(231, 236, 234);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(`${SERIES_BY_ID[state.chartSeries].label}`, 34, 34);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(182, 138, 46);
    pdf.text("Cordoba Research Group | Global Macro Engine", pageWidth - 210, 34);
    pdf.addImage(img, "PNG", 34, 52, pageWidth - 68, pageHeight - 88);
    pdf.save(`gme_chart_${state.chartSeries}.pdf`);
    showToast("Chart PDF exported.");
  }

  function exportChartSvg() {
    const svg = buildChartSvg();
    if (!svg) {
      showToast("Chart SVG is not available.");
      return;
    }
    downloadText(`gme_chart_${state.chartSeries}.svg`, "image/svg+xml;charset=utf-8", svg);
    showToast("Chart SVG exported.");
  }

  async function copyChartImage() {
    if (!state.chart || !navigator.clipboard || !window.ClipboardItem) {
      showToast("Clipboard image copy is not supported by this browser.");
      return;
    }
    const canvas = state.chart.canvas;
    canvas.toBlob(async (blob) => {
      if (!blob) {
        showToast("Chart image copy failed.");
        return;
      }
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        showToast("Chart image copied.");
      } catch (err) {
        showToast("Chart image copy failed.");
      }
    }, "image/png");
  }

  function buildChartSvg() {
    const seriesIds = Array.from(new Set([state.chartSeries, state.chartSecondarySeries].filter(Boolean)));
    const width = 960;
    const height = 540;
    const margin = { top: 54, right: 34, bottom: 58, left: 62 };
    const allSeries = [];
    state.chartCountries.forEach((code) => {
      seriesIds.forEach((seriesId) => {
        const item = state.loaded.get(code)?.[seriesId];
        const data = transformSeries(item?.series || [], state.chartTransform).filter((p) => Number.isFinite(p.y));
        if (data.length) allSeries.push({ code, seriesId, data });
      });
    });
    if (!allSeries.length) return "";
    const labels = Array.from(new Set(allSeries.flatMap((s) => s.data.map((p) => p.x)))).sort();
    const values = allSeries.flatMap((s) => s.data.map((p) => p.y));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = max === min ? 1 : (max - min) * 0.08;
    const yMin = min - pad;
    const yMax = max + pad;
    const xScale = (x) => {
      const idx = labels.indexOf(x);
      return margin.left + (idx / Math.max(labels.length - 1, 1)) * (width - margin.left - margin.right);
    };
    const yScale = (y) => margin.top + ((yMax - y) / (yMax - yMin || 1)) * (height - margin.top - margin.bottom);
    const paths = allSeries.map((s, idx) => {
      const d = s.data.map((p, i) => `${i === 0 ? "M" : "L"}${xScale(p.x).toFixed(1)},${yScale(p.y).toFixed(1)}`).join(" ");
      return `<path d="${d}" fill="none" stroke="${svgColor(idx)}" stroke-width="${s.seriesId === state.chartSeries ? 2.2 : 1.6}" ${s.seriesId === state.chartSeries ? "" : "stroke-dasharray=\"6 5\""}><title>${escapeHtml(COUNTRIES[s.code].name)} - ${escapeHtml(SERIES_BY_ID[s.seriesId].short)}</title></path>`;
    }).join("");
    const grid = [0, 0.25, 0.5, 0.75, 1].map((t) => {
      const y = margin.top + t * (height - margin.top - margin.bottom);
      const val = yMax - t * (yMax - yMin);
      return `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="rgba(255,255,255,.12)"/><text x="${margin.left - 8}" y="${y + 3}" text-anchor="end" fill="#9aa6a3" font-size="11">${val.toFixed(1)}</text>`;
    }).join("");
    const legend = allSeries.map((s, idx) => `<text x="${margin.left + idx * 150}" y="${height - 20}" fill="${svgColor(idx)}" font-size="11">${escapeHtml(COUNTRIES[s.code].name)} ${escapeHtml(SERIES_BY_ID[s.seriesId].short)}</text>`).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#0d1113"/>
      <text x="${margin.left}" y="30" fill="#e7ecea" font-family="Arial" font-size="18" font-weight="700">${escapeHtml(SERIES_BY_ID[state.chartSeries].label)}</text>
      <text x="${width - margin.right}" y="30" text-anchor="end" fill="#b68a2e" font-family="Arial" font-size="11">Cordoba Research Group | GME</text>
      ${grid}
      <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#2a3435"/>
      ${paths}
      ${legend}
      <text x="${width - margin.right}" y="${height - 8}" text-anchor="end" fill="#687471" font-family="Arial" font-size="10">Source: active GME series provenance</text>
    </svg>`;
  }

  function svgColor(index) {
    return ["#b68a2e", "#48bea6", "#e25f4c", "#819ad3", "#e8b856", "#ab72bf"][index % 6];
  }

  function showToast(message) {
    const toast = el("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    window.setTimeout(() => toast.classList.remove("visible"), 2600);
  }

  function updateStatusClock() {
    const center = el("status-center");
    if (!center) return;
    const label = new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
      timeZone: "Europe/London"
    }).format(new Date());
    center.textContent = label;
  }

  function init() {
    populateControls();
    attachEvents();
    updateStatusClock();
    window.setInterval(updateStatusClock, 1000);
    renderActiveModule();
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
