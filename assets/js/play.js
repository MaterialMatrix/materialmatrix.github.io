(() => {
  const gameRoot = document.querySelector("[data-game]");
  if (!gameRoot) return;

  const SAVE_KEY = "materialmatrix-print-shop-v3";
  const PROFILE_KEY = "materialmatrix-print-shop-player-v1";
  const LEADERBOARD_KEY = "materialmatrix-print-shop-leaderboard-v1";
  const TICK_MS = 500;
  const DAY_SECONDS = 75;
  const BUSINESS_OPEN = 8;
  const BUSINESS_CLOSE = 18;
  const BILLING_CYCLE_DAYS = 30;
  const BANKRUPTCY_LIMIT = -300;
  const MAX_PRINTERS = 6;
  const USERNAME_MIN = 3;
  const USERNAME_MAX = 18;
  const BLOCKED_USERNAME_PARTS = [
    "fuck", "shit", "bitch", "asshole", "dick", "pussy", "cunt", "bastard",
    "whore", "slut", "porn", "nazi", "nigger", "nigga", "faggot", "retard",
  ];

  const MATERIALS = {
    PLA: { name: "PLA", basePrice: 24, color: "#77edb8" },
    PETG: { name: "PETG", basePrice: 31, color: "#72a7ff" },
    ABS: { name: "ABS", basePrice: 35, color: "#ffb15c" },
    ASA: { name: "ASA", basePrice: 39, color: "#b17cff" },
    TPU: { name: "TPU", basePrice: 46, color: "#ff7ca8" },
  };
  const MATERIAL_BULK_OPTIONS = [
    { kg: 1, discount: 0, label: "Single spool" },
    { kg: 5, discount: 0.08, label: "5 kg case" },
    { kg: 10, discount: 0.15, label: "10 kg bulk" },
  ];

  const PRINTER_TYPES = {
    maker_mini: {
      name: "Maker Mini",
      price: 390,
      speed: 0.82,
      materials: ["PLA", "PETG"],
      wearPerDay: 10.5,
      powerPerDay: 7,
      repair: 75,
      monthlyCost: 140,
      color: "#53636e",
      description: "Affordable starter machine for everyday rigid materials.",
    },
    flexforge: {
      name: "FlexForge Direct",
      price: 720,
      speed: 1.08,
      materials: ["PLA", "PETG", "TPU"],
      wearPerDay: 9,
      powerPerDay: 10,
      repair: 110,
      monthlyCost: 185,
      color: "#4f7a70",
      description: "Direct-drive workhorse built for flexible filament.",
    },
    chamber_pro: {
      name: "Chamber Pro",
      price: 1180,
      speed: 1.28,
      materials: ["PLA", "PETG", "ABS", "ASA"],
      wearPerDay: 7.5,
      powerPerDay: 15,
      repair: 165,
      monthlyCost: 240,
      color: "#596b8b",
      description: "Enclosed high-temperature system for engineering plastics.",
    },
    industrial_x: {
      name: "Industrial X",
      price: 2050,
      speed: 1.65,
      materials: ["PLA", "PETG", "ABS", "ASA", "TPU"],
      wearPerDay: 6,
      powerPerDay: 21,
      repair: 240,
      monthlyCost: 330,
      color: "#79665a",
      description: "Fast, reliable production machine with full material support.",
    },
  };
  const PRINTER_UPGRADES = {
    speedLevel: {
      name: "Motion tuning",
      description: "+12% print speed per level",
      costFactor: 0.22,
    },
    durabilityLevel: {
      name: "Hardened components",
      description: "−15% maintenance wear per level",
      costFactor: 0.18,
    },
    efficiencyLevel: {
      name: "Power optimization",
      description: "−15% electricity use per level",
      costFactor: 0.16,
    },
  };
  const MAX_UPGRADE_LEVEL = 3;

  const ORDER_TEMPLATES = [
    { name: "Flexi Dragon Batch", segment: "creator", materials: ["PLA", "PETG"], kg: 0.48, hours: 7.2, payout: 96, color: "#b17cff" },
    { name: "Cosplay Helmet", segment: "creator", materials: ["PLA", "PETG"], kg: 0.82, hours: 11.5, payout: 168, color: "#ff796f" },
    { name: "Outdoor Sensor Mount", segment: "business", materials: ["ASA"], kg: 0.42, hours: 6.8, payout: 142, color: "#b17cff" },
    { name: "Automotive Air Duct", segment: "automotive", materials: ["ABS", "ASA"], kg: 0.68, hours: 9.8, payout: 188, color: "#ff9a62" },
    { name: "Flexible Seal Kit", segment: "business", materials: ["TPU"], kg: 0.3, hours: 5.6, payout: 126, color: "#ff7ca8" },
    { name: "Gearbox Prototype", segment: "business", materials: ["PETG", "ABS"], kg: 0.62, hours: 9.4, payout: 158, color: "#72a7ff" },
    { name: "Custom Keychains", segment: "community", materials: ["PLA"], kg: 0.22, hours: 3.2, payout: 48, color: "#ffbd59" },
    { name: "Controller Stand", segment: "community", materials: ["PLA", "PETG"], kg: 0.31, hours: 4.4, payout: 64, color: "#63d2dd" },
    { name: "Robot Arm Bracket", segment: "business", materials: ["PETG", "ABS"], kg: 0.55, hours: 8.1, payout: 138, color: "#ec7da8" },
    { name: "Weatherproof Junction Box", segment: "business", materials: ["ASA"], kg: 0.58, hours: 8.8, payout: 176, color: "#8796e8" },
    { name: "Vibration Damper Set", segment: "automotive", materials: ["TPU"], kg: 0.26, hours: 4.9, payout: 112, color: "#dd7cb3" },
    { name: "Lithophane Lamp", segment: "creator", materials: ["PLA", "PETG"], kg: 0.7, hours: 10.3, payout: 154, color: "#e8df79" },
  ];

  const REPUTATION_TIERS = [
    { min: 0, name: "Unknown shop", organicRate: 0.18, payoutBonus: 0 },
    { min: 10, name: "Local maker", organicRate: 0.35, payoutBonus: 0.04 },
    { min: 25, name: "Trusted service", organicRate: 0.62, payoutBonus: 0.08 },
    { min: 50, name: "Production specialist", organicRate: 0.95, payoutBonus: 0.13 },
    { min: 75, name: "Industry partner", organicRate: 1.3, payoutBonus: 0.19 },
  ];

  const AD_CHANNELS = {
    flyers: {
      name: "Community flyers",
      cost: 35,
      duration: 4,
      leadRate: 0.7,
      minReputation: 0,
      payoutMultiplier: 0.9,
      deadlineMultiplier: 1.12,
      segments: ["community", "creator"],
      description: "Affordable neighborhood awareness with forgiving, lower-value work.",
    },
    social: {
      name: "Boosted social post",
      cost: 110,
      duration: 7,
      leadRate: 1.05,
      minReputation: 0,
      payoutMultiplier: 1,
      deadlineMultiplier: 1,
      segments: ["creator", "community"],
      description: "A steady stream of visual, hobby, and cosplay projects.",
    },
    marketplace: {
      name: "Online marketplace",
      cost: 180,
      duration: 14,
      leadRate: 1.35,
      minReputation: 10,
      payoutMultiplier: 0.94,
      deadlineMultiplier: 0.95,
      segments: ["community", "creator", "automotive"],
      description: "High lead volume, platform competition, and slightly tighter margins.",
    },
    search: {
      name: "Search advertising",
      cost: 260,
      duration: 7,
      leadRate: 0.9,
      minReputation: 25,
      payoutMultiplier: 1.2,
      deadlineMultiplier: 0.9,
      segments: ["business", "automotive"],
      description: "High-intent engineering customers with premium payouts and strict deadlines.",
    },
    outreach: {
      name: "Local business outreach",
      cost: 420,
      duration: 12,
      leadRate: 0.58,
      minReputation: 50,
      payoutMultiplier: 1.38,
      deadlineMultiplier: 0.86,
      segments: ["business", "automotive"],
      description: "Low-volume premium B2B leads with strong repeat-order potential.",
    },
  };

  const CUSTOMER_NAMES = [
    "Riley", "Jordan", "Morgan", "Casey", "Taylor", "Avery", "Cameron",
    "Skyler", "Quinn", "Parker", "Reese", "Dakota", "Emerson", "Finley",
  ];

  const createPrinter = (typeId, sequence = 1) => ({
    id: `${typeId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    typeId,
    name: `${PRINTER_TYPES[typeId].name} ${sequence}`,
    health: 100,
    jobId: null,
    speedLevel: 0,
    durabilityLevel: 0,
    efficiencyLevel: 0,
    maintenanceRemaining: 0,
  });

  const initialPrices = () =>
    Object.fromEntries(
      Object.entries(MATERIALS).map(([id, material]) => [id, material.basePrice])
    );

  const freshState = () => ({
    runId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    cash: 650,
    day: 1,
    dayProgress: 2 / 24,
    reputation: 0,
    revenue: 0,
    expenses: 0,
    monthlyElectric: 0,
    dailyElectric: 0,
    lastBill: null,
    electricHistory: [],
    materials: { PLA: 1.5, PETG: 0.5, ABS: 0, ASA: 0, TPU: 0 },
    materialPrices: initialPrices(),
    printers: [createPrinter("maker_mini", 1)],
    queue: [],
    orders: [],
    nextOrderAt: 0,
    initialOffersPending: true,
    demandVersion: 1,
    campaigns: [],
    autoRenewAds: {},
    customers: [],
    reputationHistory: [],
    onTimeStreak: 0,
    totalLeads: 0,
    organicLeads: 0,
    repeatLeads: 0,
    totalCompleted: 0,
    completedToday: 0,
    paused: true,
    speed: 1,
    gameOver: false,
    leaderboardRecorded: false,
    seenHelp: false,
    lastSaved: Date.now(),
  });

  const readSave = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!saved || typeof saved !== "object") return freshState();
      const base = freshState();
      return {
        ...base,
        ...saved,
        reputation: Math.max(0, Math.min(100, Number(saved.reputation) || 0)),
        initialOffersPending:
          typeof saved.initialOffersPending === "boolean"
            ? saved.initialOffersPending
            : !(
                (saved.orders || []).length ||
                saved.day > 1 ||
                saved.totalCompleted > 0 ||
                saved.revenue > 0 ||
                saved.expenses > 0
              ),
        materials: { ...base.materials, ...saved.materials },
        materialPrices: { ...initialPrices(), ...saved.materialPrices },
        electricHistory: Array.isArray(saved.electricHistory)
          ? saved.electricHistory
          : [],
        campaigns: Array.isArray(saved.campaigns) ? saved.campaigns : [],
        autoRenewAds: { ...base.autoRenewAds, ...saved.autoRenewAds },
        customers: Array.isArray(saved.customers) ? saved.customers : [],
        reputationHistory: Array.isArray(saved.reputationHistory)
          ? saved.reputationHistory
          : [],
        orders: Array.isArray(saved.orders)
          ? saved.orders.map((order, index) => ({
              customerId:
                order.customerId ||
                `legacy-lead-${saved.runId || "run"}-${index}`,
              customerName: order.customerName || "Local customer",
              sourceName: order.sourceName || "Organic discovery",
              segment: order.segment || "community",
              ...order,
            }))
          : [],
        printers: (saved.printers || base.printers).map((printer) => ({
          speedLevel: 0,
          durabilityLevel: 0,
          efficiencyLevel: 0,
          maintenanceRemaining: 0,
          ...printer,
        })),
        paused: true,
      };
    } catch {
      return freshState();
    }
  };

  const normalizeUsernameForFilter = (value) =>
    value
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[013457@$!]/g, (character) => ({
        "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t",
        "@": "a", "$": "s", "!": "i",
      })[character])
      .replace(/(.)\1{2,}/g, "$1")
      .replace(/[^a-z]/g, "");

  const validateUsername = (rawValue) => {
    const username = rawValue.trim().replace(/\s+/g, " ");
    if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
      return { error: `Use ${USERNAME_MIN}–${USERNAME_MAX} characters.` };
    }
    if (!/^[A-Za-z0-9 _-]+$/.test(username)) {
      return { error: "Use only letters, numbers, spaces, underscores, and hyphens." };
    }
    const filtered = normalizeUsernameForFilter(username);
    if (BLOCKED_USERNAME_PARTS.some((term) => filtered.includes(term))) {
      return { error: "That username is not allowed. Please choose another." };
    }
    return { username };
  };

  const readProfile = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_KEY));
      if (!saved || typeof saved.username !== "string") return null;
      const result = validateUsername(saved.username);
      return result.username ? { username: result.username, createdAt: saved.createdAt } : null;
    } catch {
      return null;
    }
  };

  const compareLeaderboardEntries = (a, b) =>
    b.score - a.score ||
    b.jobs - a.jobs ||
    b.day - a.day ||
    (a.recordedAt || 0) - (b.recordedAt || 0);

  const bestEntriesByPlayer = (entries) => {
    const bestByPlayer = new Map();
    entries.forEach((entry) => {
      const playerKey = entry.username.trim().toLocaleLowerCase();
      const existing = bestByPlayer.get(playerKey);
      if (!existing || compareLeaderboardEntries(entry, existing) < 0) {
        bestByPlayer.set(playerKey, entry);
      }
    });
    return [...bestByPlayer.values()].sort(compareLeaderboardEntries);
  };

  const readLeaderboard = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(LEADERBOARD_KEY));
      if (!Array.isArray(saved)) return [];
      return bestEntriesByPlayer(
        saved.filter((entry) =>
          entry &&
          typeof entry.username === "string" &&
          Number.isFinite(entry.score) &&
          Number.isFinite(entry.jobs) &&
          Number.isFinite(entry.day)
        )
      ).slice(0, 10);
    } catch {
      return [];
    }
  };

  let profile = readProfile();
  let leaderboard = readLeaderboard();
  let state = readSave();
  let toastTimeout;
  let printerShopView = "buy";
  let operationsView = "queue";
  const $ = (selector) => document.querySelector(selector);
  const nodes = {
    cash: $("[data-cash]"),
    day: $("[data-day]"),
    reputation: $("[data-reputation]"),
    reputationTier: $("[data-reputation-tier]"),
    demandRate: $("[data-demand-rate]"),
    activeCampaigns: $("[data-active-campaigns]"),
    profit: $("[data-profit]"),
    clock: $("[data-clock]"),
    status: $("[data-status]"),
    orders: $("[data-orders]"),
    orderCount: $("[data-order-count]"),
    printerFloor: $("[data-printer-floor]"),
    activePrinters: $("[data-active-printers]"),
    printerCount: $("[data-printer-count]"),
    jobsCompleted: $("[data-jobs-completed]"),
    productionFill: $("[data-production-fill]"),
    productionLabel: $("[data-production-label]"),
    materials: $("[data-materials]"),
    materialShop: $("[data-material-shop]"),
    materialShopDialog: $("[data-material-shop-dialog]"),
    operationsDialog: $("[data-operations-dialog]"),
    operationsQueue: $("[data-operations-queue]"),
    operationsElectric: $("[data-operations-electric]"),
    operationsBilling: $("[data-operations-billing]"),
    marketingDialog: $("[data-marketing-dialog]"),
    reputationOverview: $("[data-reputation-overview]"),
    marketingCatalog: $("[data-marketing-catalog]"),
    campaignList: $("[data-campaign-list]"),
    reputationLedger: $("[data-reputation-ledger]"),
    demandForecast: $("[data-demand-forecast]"),
    powerBill: $("[data-power-bill]"),
    overhead: $("[data-overhead]"),
    billDays: $("[data-bill-days]"),
    queueCount: $("[data-queue-count]"),
    queueCapacity: $("[data-queue-capacity]"),
    brokenCount: $("[data-broken-count]"),
    fleet: $("[data-fleet]"),
    window: $("[data-shop-window]"),
    printerShop: $("[data-printer-shop]"),
    printerUpgrades: $("[data-printer-upgrades]"),
    printerShopDialog: $("[data-printer-shop-dialog]"),
    pause: $("[data-pause]"),
    pauseIcon: $("[data-pause-icon]"),
    speed: $("[data-speed]"),
    fullscreen: $("[data-fullscreen]"),
    fullscreenIcon: $("[data-fullscreen-icon]"),
    activity: $("[data-activity]"),
    goalTitle: $("[data-goal-title]"),
    goalFill: $("[data-goal-fill]"),
    goalProgress: $("[data-goal-progress]"),
    helpDialog: $("[data-help-dialog]"),
    bankruptcyDialog: $("[data-bankruptcy-dialog]"),
    usernameDialog: $("[data-username-dialog]"),
    usernameForm: $("[data-username-form]"),
    usernameInput: $("[data-username-input]"),
    usernameError: $("[data-username-error]"),
    playerName: $("[data-player-name]"),
    leaderboardDialog: $("[data-leaderboard-dialog]"),
    leaderboardRows: $("[data-leaderboard-rows]"),
    confirmDialog: $("[data-confirm-dialog]"),
    confirmTitle: $("[data-confirm-title]"),
    confirmMessage: $("[data-confirm-message]"),
    confirmAccept: $("[data-confirm-accept]"),
    confirmCancel: $("[data-confirm-cancel]"),
    toast: $("[data-toast]"),
  };

  const money = (value) => {
    const numericValue = Number(value) || 0;
    const hasCents = Math.abs(numericValue - Math.round(numericValue)) > 0.001;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(numericValue);
  };
  const syncCashDisplay = () => {
    nodes.cash.textContent = money(state.cash);
    nodes.cash.style.color = state.cash < 0 ? "var(--game-red)" : "";
  };
  const round = (value, places = 2) => Number(value.toFixed(places));
  const gameTime = () => state.day - 1 + state.dayProgress;
  const currentHour = () => (state.dayProgress * 24 + 6) % 24;
  const isBusinessHours = () => {
    const hour = currentHour();
    return hour >= BUSINESS_OPEN && hour < BUSINESS_CLOSE;
  };
  const queueCapacity = () => state.printers.length * 2 + 1;
  const monthlyRent = () =>
    1150 +
    state.printers.reduce(
      (sum, printer) => sum + PRINTER_TYPES[printer.typeId].monthlyCost,
      0
    );
  const daysUntilBill = () =>
    BILLING_CYCLE_DAYS - ((state.day - 1) % BILLING_CYCLE_DAYS);
  const healthSpeedFactor = (printer) =>
    printer.health >= 35
      ? 1
      : 0.7 + (Math.max(0, printer.health) / 35) * 0.3;
  const healthPowerFactor = (printer) =>
    printer.health >= 50
      ? 1
      : 1 + ((50 - Math.max(0, printer.health)) / 50) * 0.25;
  const ratedSpeed = (printer) =>
    PRINTER_TYPES[printer.typeId].speed * (1 + printer.speedLevel * 0.12);
  const effectiveSpeed = (printer) =>
    ratedSpeed(printer) * healthSpeedFactor(printer);
  const effectiveWear = (printer) =>
    PRINTER_TYPES[printer.typeId].wearPerDay *
    Math.max(0.4, 1 - printer.durabilityLevel * 0.15);
  const ratedPower = (printer) =>
    PRINTER_TYPES[printer.typeId].powerPerDay *
    Math.max(0.4, 1 - printer.efficiencyLevel * 0.15);
  const effectivePower = (printer) =>
    ratedPower(printer) * healthPowerFactor(printer);
  const maintenanceQuote = (printer) => {
    const type = PRINTER_TYPES[printer.typeId];
    const wear = Math.max(0, Math.min(1, (100 - printer.health) / 100));
    const broken = printer.health <= 0;
    return {
      cost: Math.max(10, Math.round(type.repair * (broken ? 1 : 0.15 + wear * 0.75))),
      durationDays: round(broken ? 0.45 : 0.06 + wear * 0.2, 3),
    };
  };
  const upgradeCost = (printer, upgradeId) => {
    const type = PRINTER_TYPES[printer.typeId];
    const upgrade = PRINTER_UPGRADES[upgradeId];
    return Math.round(
      type.price * upgrade.costFactor * (printer[upgradeId] + 1)
    );
  };
  const printerResaleValue = (printer) => {
    const type = PRINTER_TYPES[printer.typeId];
    const totalUpgradeLevels =
      printer.speedLevel + printer.durabilityLevel + printer.efficiencyLevel;
    const valueFactor = Math.min(
      0.8,
      0.35 + (printer.health / 100) * 0.25 + totalUpgradeLevels * 0.03
    );
    return Math.round(type.price * valueFactor);
  };
  const deadlineText = (days) => {
    const hours = Math.ceil(Math.abs(days) * 24);
    return days < 0 ? `${hours}h late` : `${hours}h left`;
  };
  const compatiblePrinterOwned = (materialId) =>
    state.printers.some((printer) =>
      PRINTER_TYPES[printer.typeId].materials.includes(materialId)
    );
  const orderProjection = (order) => {
    const compatible = state.printers.filter(
      (printer) =>
        printer.health > 0 &&
        printer.maintenanceRemaining <= 0 &&
        PRINTER_TYPES[printer.typeId].materials.includes(order.materialId)
    );
    const fallback = state.printers.filter((printer) =>
      PRINTER_TYPES[printer.typeId].materials.includes(order.materialId)
    );
    const candidates = compatible.length ? compatible : fallback;
    if (!candidates.length) return null;

    const fastest = [...candidates].sort((a, b) => {
      const speedA = compatible.length ? effectiveSpeed(a) : ratedSpeed(a);
      const speedB = compatible.length ? effectiveSpeed(b) : ratedSpeed(b);
      return speedB - speedA;
    })[0];
    const availableSpeed = compatible.reduce(
      (sum, printer) => sum + effectiveSpeed(printer),
      0
    );
    const relevantBacklog = state.queue.reduce((sum, job) => {
      const canShareFleet = compatible.some((printer) =>
        PRINTER_TYPES[printer.typeId].materials.includes(job.materialId)
      );
      return canShareFleet ? sum + job.hours * (1 - job.progress) : sum;
    }, 0);
    const serviceDelayHours = compatible.length
      ? 0
      : Math.min(
          ...candidates.map((printer) =>
            printer.maintenanceRemaining > 0
              ? printer.maintenanceRemaining * 24
              : maintenanceQuote(printer).durationDays * 24
          )
        );
    const waitHours = availableSpeed > 0 ? relevantBacklog / availableSpeed : serviceDelayHours;
    const projectionSpeed = compatible.length
      ? effectiveSpeed(fastest)
      : ratedSpeed(fastest);
    const printHours = order.hours / Math.max(0.1, projectionSpeed);
    const completionHours = waitHours + printHours;
    const deadlineBufferHours = order.deadlineDays * 24 - completionHours;
    const materialCost = round(
      order.material * state.materialPrices[order.materialId],
      2
    );
    const electricCost = round(
      (compatible.length ? effectivePower(fastest) : ratedPower(fastest)) *
        (printHours / 24),
      2
    );
    const expectedPayout =
      deadlineBufferHours < 0 ? Math.round(order.payout * 0.55) : order.payout;
    const netProfit = round(expectedPayout - materialCost - electricCost, 2);
    return {
      materialCost,
      electricCost,
      expectedPayout,
      netProfit,
      completionHours,
      deadlineBufferHours,
      printerName: fastest.name,
    };
  };
  const reputationTier = (score = state.reputation) =>
    [...REPUTATION_TIERS].reverse().find((tier) => score >= tier.min) ||
    REPUTATION_TIERS[0];
  const nextReputationTier = () =>
    REPUTATION_TIERS.find((tier) => tier.min > state.reputation) || null;
  const activeCampaigns = () =>
    state.campaigns.filter(
      (campaign) => campaign.endAt > gameTime() && !campaign.cancelled
    );
  const repeatLeadRate = () =>
    Math.min(
      0.85,
      state.customers.reduce(
        (sum, customer) =>
          sum +
          (customer.completed > 0 && customer.loyalty > 0
            ? (0.025 + customer.loyalty * 0.012) *
              (1 + state.reputation / 100)
            : 0),
        0
      )
    );
  const totalDemandRate = () => {
    const campaignRate = activeCampaigns().reduce(
      (sum, campaign) => sum + AD_CHANNELS[campaign.channelId].leadRate,
      0
    );
    return round(
      reputationTier().organicRate + repeatLeadRate() + campaignRate,
      2
    );
  };
  const utilizationForecast = () => {
    const dailyPrintCapacity = state.printers.reduce(
      (sum, printer) =>
        sum +
        (printer.health > 0 && printer.maintenanceRemaining <= 0
          ? effectiveSpeed(printer) * 24
          : 0),
      0
    );
    const expectedHours = totalDemandRate() * 7.1;
    return dailyPrintCapacity > 0 ? expectedHours / dailyPrintCapacity : 2;
  };
  const demandForecast = () => {
    const load = utilizationForecast();
    if (load < 0.35) return { label: "Low demand", className: "is-low" };
    if (load < 0.8) return { label: "Balanced demand", className: "is-balanced" };
    return { label: "Over capacity risk", className: "is-high" };
  };
  const changeReputation = (amount, reason) => {
    const previous = state.reputation;
    state.reputation = Math.max(0, Math.min(100, previous + amount));
    const actual = state.reputation - previous;
    if (!actual) return;
    state.reputationHistory.unshift({
      id: `rep-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      day: state.day,
      amount: actual,
      reason,
    });
    state.reputationHistory = state.reputationHistory.slice(0, 12);
  };
  const randomCustomerName = (segment) => {
    const first =
      CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];
    const suffix = {
      community: "Local",
      creator: "Studio",
      automotive: "Garage",
      business: "Works",
    }[segment] || "Customer";
    return `${first} ${suffix}`;
  };
  const offerWindow = (segment, rare = false) => {
    if (rare) return { duration: 0.16, label: "Rush response" };
    const ranges = {
      community: { min: 0.75, max: 1.1, label: "Flexible response" },
      creator: { min: 0.55, max: 0.85, label: "Relaxed response" },
      business: { min: 0.38, max: 0.62, label: "Standard response" },
      automotive: { min: 0.32, max: 0.55, label: "Time-sensitive" },
    };
    const range = ranges[segment] || ranges.business;
    return {
      duration: round(range.min + Math.random() * (range.max - range.min), 3),
      label: range.label,
    };
  };
  const printerStatus = (printer) => {
    if (printer.maintenanceRemaining > 0) {
      return `In service · ${Math.ceil(printer.maintenanceRemaining * 24)}h remaining`;
    }
    if (printer.health <= 0) return "Broken down";
    const job = state.queue.find((candidate) => candidate.id === printer.jobId);
    return job ? `Printing ${job.name}` : "Idle";
  };
  const healthColor = (health) =>
    health <= 0
      ? "var(--game-red)"
      : health < 50
        ? "var(--game-orange)"
        : "var(--game-mint)";
  const fullscreenElement = () =>
    document.fullscreenElement || document.webkitFullscreenElement || null;

  const updateFullscreenControl = () => {
    const active = fullscreenElement() === gameRoot;
    nodes.fullscreenIcon.textContent = active ? "⊡" : "⛶";
    nodes.fullscreen.setAttribute(
      "aria-label",
      active ? "Exit fullscreen" : "Enter fullscreen"
    );
    nodes.fullscreen.classList.toggle("is-active", active);
  };

  const placeToastInFront = () => {
    const openDialogs = [...document.querySelectorAll(".game-dialog[open]")];
    const frontLayer = openDialogs.at(-1) || document.body;
    if (nodes.toast.parentElement !== frontLayer) {
      frontLayer.append(nodes.toast);
    }
  };

  const notify = (message, tone = "default") => {
    placeToastInFront();
    nodes.toast.textContent = message;
    const isAlert = tone === "alert";
    nodes.toast.classList.toggle("is-alert", isAlert);
    nodes.toast.setAttribute("role", isAlert ? "alert" : "status");
    nodes.toast.setAttribute("aria-live", isAlert ? "assertive" : "polite");
    nodes.toast.classList.add("is-visible");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => nodes.toast.classList.remove("is-visible"), 2600);
  };

  const activity = (message) => {
    nodes.activity.textContent = message;
  };

  let pendingConfirmation = null;
  let confirmationPreviousPause = true;

  const closeConfirmation = (confirmed = false) => {
    if (!nodes.confirmDialog.open) return;
    const action = pendingConfirmation;
    pendingConfirmation = null;
    nodes.confirmDialog.close();
    state.paused = confirmationPreviousPause;
    if (confirmed && action) action();
    render();
  };

  const openConfirmation = ({
    title,
    message,
    confirmLabel = "Confirm",
    onConfirm,
  }) => {
    confirmationPreviousPause = state.paused;
    pendingConfirmation = onConfirm;
    state.paused = true;
    nodes.confirmTitle.textContent = title;
    nodes.confirmMessage.textContent = message;
    nodes.confirmAccept.textContent = confirmLabel;
    render();
    nodes.confirmDialog.showModal();
    nodes.confirmCancel.focus();
  };

  const save = () => {
    try {
      state.lastSaved = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      // The game remains playable if browser storage is unavailable.
    }
  };

  const currentScore = () => Math.round(state.revenue - state.expenses);

  const archiveCurrentRun = () => {
    if (!profile || state.leaderboardRecorded) return;
    const hasProgress =
      state.totalCompleted > 0 || state.day > 1 || state.revenue > 0 || state.expenses > 0;
    if (!hasProgress) return;
    const entry = {
      id: state.runId,
      username: profile.username,
      score: currentScore(),
      jobs: state.totalCompleted,
      day: state.day,
      recordedAt: Date.now(),
    };
    leaderboard = bestEntriesByPlayer([
      ...leaderboard.filter((candidate) => candidate.id !== entry.id),
      entry,
    ]).slice(0, 10);
    state.leaderboardRecorded = true;
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
    } catch {
      // The current session can still show the score if storage is unavailable.
    }
  };

  const renderLeaderboard = () => {
    if (!nodes.leaderboardRows || !profile) return;
    const entries = state.gameOver
      ? [...leaderboard]
      : [
          ...leaderboard.filter((entry) => entry.id !== state.runId),
          {
            id: state.runId,
            username: profile.username,
            score: currentScore(),
            jobs: state.totalCompleted,
            day: state.day,
            recordedAt: Date.now(),
            live: true,
          },
        ];
    const ranked = bestEntriesByPlayer(entries).slice(0, 10);
    nodes.leaderboardRows.replaceChildren();
    ranked.forEach((entry, index) => {
      const row = document.createElement("tr");
      if (entry.live) row.classList.add("is-live");

      const rank = document.createElement("td");
      rank.className = "leaderboard-rank";
      rank.textContent = `#${index + 1}`;

      const player = document.createElement("td");
      const playerName = document.createElement("span");
      playerName.className = "leaderboard-player";
      playerName.textContent = entry.username;
      player.append(playerName);
      if (entry.live) {
        const live = document.createElement("span");
        live.className = "leaderboard-live";
        live.textContent = "Live";
        player.append(live);
      }

      const score = document.createElement("td");
      score.textContent = money(entry.score);
      const jobs = document.createElement("td");
      jobs.textContent = entry.jobs;
      const day = document.createElement("td");
      day.textContent = entry.day;
      row.append(rank, player, score, jobs, day);
      nodes.leaderboardRows.append(row);
    });
  };

  const randomOrder = ({
    rare = false,
    forceFleetMatch = false,
    channelId = null,
    customer = null,
    sourceName = "Organic discovery",
  } = {}) => {
    const supportedMaterials = new Set(
      state.printers.flatMap((printer) => PRINTER_TYPES[printer.typeId].materials)
    );
    const channel = channelId ? AD_CHANNELS[channelId] : null;
    const preferredSegments = customer
      ? [customer.segment]
      : channel?.segments || [];
    const segmentTemplates = preferredSegments.length
      ? ORDER_TEMPLATES.filter((template) =>
          preferredSegments.includes(template.segment)
        )
      : ORDER_TEMPLATES;
    const fleetFriendlyTemplates = segmentTemplates.filter((template) =>
      template.materials.some((materialId) => supportedMaterials.has(materialId))
    );
    const favorFleet =
      forceFleetMatch || Math.random() < (rare ? 0.92 : 0.84);
    const templatePool =
      favorFleet && fleetFriendlyTemplates.length
        ? fleetFriendlyTemplates
        : segmentTemplates;
    const template =
      templatePool[Math.floor(Math.random() * templatePool.length)];
    const demand = 0.88 + Math.random() * 0.34;
    const fleetMaterials = template.materials.filter((materialId) =>
      supportedMaterials.has(materialId)
    );
    const materialPool =
      favorFleet && fleetMaterials.length ? fleetMaterials : template.materials;
    const stockedMaterials = materialPool.filter(
      (materialId) => state.materials[materialId] >= template.kg * demand
    );
    const finalMaterialPool =
      stockedMaterials.length && Math.random() < 0.78
        ? stockedMaterials
        : materialPool;
    const materialId =
      finalMaterialPool[Math.floor(Math.random() * finalMaterialPool.length)];
    const reputationBonus = 1 + reputationTier().payoutBonus;
    const materialPremium =
      1 + (MATERIALS[materialId].basePrice - MATERIALS.PLA.basePrice) / 75;
    const channelPayout = channel?.payoutMultiplier || 1;
    const repeatBonus = customer ? 1 + Math.min(0.14, customer.loyalty * 0.02) : 1;
    const hours = round(template.hours * demand, 1);
    const printDays = hours / 24;
    const deadlineDays = round(
      (printDays +
        (rare ? 0.08 + Math.random() * 0.1 : 0.18 + Math.random() * 0.28)) *
        (channel?.deadlineMultiplier || 1),
      2
    );
    const responseWindow = offerWindow(template.segment, rare);
    const offerDuration = responseWindow.duration;
    const customerId =
      customer?.id || `customer-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const customerName = customer?.name || randomCustomerName(template.segment);
    return {
      id: `order-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: template.name,
      materialId,
      material: round(template.kg * demand, 2),
      hours,
      payout: Math.round(
        template.payout *
          demand *
          reputationBonus *
          materialPremium *
          channelPayout *
          repeatBonus *
          (rare ? 1.7 : 1)
      ),
      color: rare ? "#ff6d76" : template.color,
      deadlineDays,
      rare,
      offerDuration,
      offerWindowLabel: responseWindow.label,
      offerExpiresAt: gameTime() + offerDuration,
      segment: template.segment,
      customerId,
      customerName,
      sourceName,
      sourceCampaignId: channelId
        ? activeCampaigns().find((campaign) => campaign.channelId === channelId)?.id || null
        : null,
      repeatCustomer: Boolean(customer),
    };
  };

  const addOrder = (options = {}) => {
    if (state.paused || state.gameOver || state.orders.length >= 6) return false;
    const order = randomOrder(options);
    state.orders.push(order);
    state.totalLeads += 1;
    if (order.sourceCampaignId) {
      const campaign = state.campaigns.find(
        (candidate) => candidate.id === order.sourceCampaignId
      );
      if (campaign) campaign.leadsGenerated += 1;
    } else if (order.repeatCustomer) {
      state.repeatLeads += 1;
    } else {
      state.organicLeads += 1;
    }
    if (!options.silent) {
      activity(
        options.rare
          ? `After-hours rush request: ${order.name} in ${order.materialId}.`
          : `${order.customerName} requested a quote for ${order.name}.`
      );
      if (options.rare) notify("Rare after-hours rush job");
    }
    return true;
  };

  const seedOrders = () => {
    if (state.paused || state.gameOver || !state.initialOffersPending) return;
    state.orders = [];
    addOrder({
      silent: true,
      forceFleetMatch: true,
      sourceName: "Personal referral",
    });
    state.nextOrderAt = gameTime() + 0.5;
    state.initialOffersPending = false;
    save();
  };

  const chooseDemandSource = () => {
    const sources = [
      {
        type: "organic",
        rate: reputationTier().organicRate,
        sourceName:
          state.reputation >= 25 ? "Organic referral" : "Organic discovery",
      },
      ...activeCampaigns().map((campaign) => ({
        type: "campaign",
        rate: AD_CHANNELS[campaign.channelId].leadRate,
        channelId: campaign.channelId,
        sourceName: AD_CHANNELS[campaign.channelId].name,
      })),
    ];
    const repeatRate = repeatLeadRate();
    if (repeatRate > 0 && state.customers.length) {
      sources.push({ type: "repeat", rate: repeatRate, sourceName: "Repeat customer" });
    }
    let roll = Math.random() * sources.reduce((sum, source) => sum + source.rate, 0);
    return (
      sources.find((source) => {
        roll -= source.rate;
        return roll <= 0;
      }) || sources[0]
    );
  };

  const maybeGenerateOrders = () => {
    const now = gameTime();
    const beforeCount = state.orders.length;
    state.orders = state.orders.filter((order) => order.offerExpiresAt > now);
    if (state.orders.length < beforeCount) {
      activity("An unclaimed quote request expired.");
      save();
    }
    if (now < state.nextOrderAt) return;

    if (isBusinessHours()) {
      const source = chooseDemandSource();
      let customer = null;
      if (source.type === "repeat") {
        const eligible = state.customers.filter(
          (candidate) => candidate.completed > 0 && candidate.loyalty > 0
        );
        customer = eligible[Math.floor(Math.random() * eligible.length)] || null;
      }
      addOrder({
        channelId: source.channelId || null,
        customer,
        sourceName: source.sourceName,
      });
      const interval = (0.72 + Math.random() * 0.56) / Math.max(0.1, totalDemandRate());
      state.nextOrderAt = now + Math.max(0.055, interval);
    } else {
      if (Math.random() < 0.025 + state.reputation / 2500) {
        addOrder({ rare: true, sourceName: "After-hours referral" });
      }
      state.nextOrderAt = now + 0.12;
    }
    save();
  };

  const assignJobs = () => {
    state.queue.forEach((job) => {
      if (!job.printerId) return;
      const printer = state.printers.find(
        (candidate) => candidate.id === job.printerId
      );
      const unavailable =
        !printer ||
        printer.health <= 0 ||
        printer.maintenanceRemaining > 0 ||
        printer.jobId !== job.id;
      if (unavailable) job.printerId = null;
    });

    state.printers.forEach((printer) => {
      const job = state.queue.find((candidate) => candidate.id === printer.jobId);
      const unavailable =
        printer.health <= 0 || printer.maintenanceRemaining > 0;
      if (unavailable || !job || job.printerId !== printer.id) {
        printer.jobId = null;
      }
    });

    state.queue
      .filter((job) => !job.printerId)
      .forEach((job) => {
        const printer = state.printers.find(
          (candidate) =>
            !candidate.jobId &&
            candidate.health > 0 &&
            candidate.maintenanceRemaining <= 0 &&
            PRINTER_TYPES[candidate.typeId].materials.includes(job.materialId)
        );
        if (!printer) return;
        printer.jobId = job.id;
        job.printerId = printer.id;
      });
  };

  const acceptOrder = (orderId) => {
    if (state.gameOver) return;
    const order = state.orders.find((candidate) => candidate.id === orderId);
    if (!order) return;
    if (state.queue.length >= queueCapacity()) {
      notify("Your production queue is full.");
      return;
    }
    if (!compatiblePrinterOwned(order.materialId)) {
      notify(`No owned printer can process ${order.materialId}.`);
      return;
    }
    if ((state.materials[order.materialId] || 0) < order.material) {
      notify(`You need ${round(order.material - state.materials[order.materialId], 2)} kg more ${order.materialId}.`);
      return;
    }

    state.materials[order.materialId] = round(
      state.materials[order.materialId] - order.material,
      2
    );
    state.queue.push({
      ...order,
      progress: 0,
      printerId: null,
      deadlineRemaining: order.deadlineDays,
    });
    if (!state.customers.some((customer) => customer.id === order.customerId)) {
      state.customers.push({
        id: order.customerId,
        name: order.customerName,
        segment: order.segment || "community",
        completed: 0,
        loyalty: 0,
        lifetimeRevenue: 0,
        lastOrderDay: state.day,
      });
    }
    if (order.sourceCampaignId) {
      const campaign = state.campaigns.find(
        (candidate) => candidate.id === order.sourceCampaignId
      );
      if (campaign) campaign.ordersAccepted += 1;
    }
    state.orders = state.orders.filter((candidate) => candidate.id !== orderId);
    assignJobs();
    activity(`${order.name} accepted. ${order.material} kg ${order.materialId} allocated.`);
    render();
    save();
  };

  const spend = (price, successMessage, mutate) => {
    if (state.gameOver) return false;
    const availableCash = Number(state.cash) || 0;
    if (availableCash < price) {
      notify(`This costs ${money(price)}. You have ${money(availableCash)} cash.`);
      return false;
    }
    state.cash = round(availableCash - price, 2);
    state.expenses = round(state.expenses + price, 2);
    mutate();
    activity(successMessage);
    notify(successMessage);
    render();
    save();
    return true;
  };

  const createCampaign = (channelId) => {
    const channel = AD_CHANNELS[channelId];
    const now = gameTime();
    state.campaigns.unshift({
      id: `campaign-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      channelId,
      startAt: now,
      endAt: now + channel.duration,
      spend: channel.cost,
      leadsGenerated: 0,
      ordersAccepted: 0,
      revenue: 0,
      cancelled: false,
    });
    state.campaigns = state.campaigns.slice(0, 24);
    state.nextOrderAt = Math.min(
      state.nextOrderAt || now + 0.12,
      now + 0.08
    );
  };

  const startCampaign = (channelId) => {
    const channel = AD_CHANNELS[channelId];
    if (!channel || state.gameOver) return;
    if (state.reputation < channel.minReputation) {
      notify(`Reach ${channel.minReputation} reputation to unlock this channel.`);
      return;
    }
    if (
      activeCampaigns().some((campaign) => campaign.channelId === channelId)
    ) {
      notify(`${channel.name} is already running.`);
      return;
    }
    spend(channel.cost, `${channel.name} launched for ${channel.duration} days.`, () => {
      createCampaign(channelId);
    });
  };

  const toggleCampaignAutoRenew = (channelId) => {
    const enabled = !state.autoRenewAds[channelId];
    state.autoRenewAds[channelId] = enabled;
    activity(
      `${AD_CHANNELS[channelId].name} auto-renew ${enabled ? "enabled" : "disabled"}.`
    );
    notify(`Auto-renew ${enabled ? "on" : "off"} · ${AD_CHANNELS[channelId].name}`);
    render();
    save();
  };

  const stopCampaign = (campaignId) => {
    const campaign = state.campaigns.find(
      (candidate) => candidate.id === campaignId
    );
    if (!campaign || campaign.cancelled || campaign.endAt <= gameTime()) return;
    campaign.cancelled = true;
    activity(`${AD_CHANNELS[campaign.channelId].name} stopped. Unspent time is not refunded.`);
    notify("Campaign stopped");
    render();
    save();
  };

  const materialPurchasePrice = (materialId, quantity, discount = 0) =>
    Math.round(state.materialPrices[materialId] * quantity * (1 - discount));

  const buyMaterial = (materialId, quantity, discount = 0) => {
    const price = materialPurchasePrice(materialId, quantity, discount);
    spend(price, `${quantity} kg of ${materialId} added to inventory.`, () => {
      state.materials[materialId] = round(
        state.materials[materialId] + quantity,
        2
      );
    });
  };

  const buyPrinter = (typeId) => {
    const type = PRINTER_TYPES[typeId];
    if (state.printers.length >= MAX_PRINTERS) {
      notify("The shop floor is full.");
      return;
    }
    spend(type.price, `${type.name} installed and ready.`, () => {
      const sameTypeCount =
        state.printers.filter((printer) => printer.typeId === typeId).length + 1;
      state.printers.push(createPrinter(typeId, sameTypeCount));
      assignJobs();
    });
  };

  const upgradePrinter = (printerId, upgradeId) => {
    const printer = state.printers.find((candidate) => candidate.id === printerId);
    const upgrade = PRINTER_UPGRADES[upgradeId];
    if (!printer || !upgrade || printer[upgradeId] >= MAX_UPGRADE_LEVEL) return;
    const price = upgradeCost(printer, upgradeId);
    spend(price, `${printer.name}: ${upgrade.name} upgraded.`, () => {
      printer[upgradeId] += 1;
    });
  };

  const sellPrinter = (printerId) => {
    const printer = state.printers.find((candidate) => candidate.id === printerId);
    if (!printer || state.gameOver) return;
    if (state.printers.length <= 1) {
      notify("You must keep at least one production printer.");
      return;
    }
    const value = printerResaleValue(printer);
    const activeJob = state.queue.find((job) => job.printerId === printer.id);
    const warning = activeJob
      ? ` ${activeJob.name} will return to the waiting queue.`
      : "";
    openConfirmation({
      title: `Sell ${printer.name}?`,
      message: `You will receive ${money(value)}.${warning}`,
      confirmLabel: "Sell printer",
      onConfirm: () => {
        if (activeJob) activeJob.printerId = null;
        state.printers = state.printers.filter(
          (candidate) => candidate.id !== printer.id
        );
        state.cash = round(state.cash + value, 2);
        state.revenue = round(state.revenue + value, 2);
        assignJobs();
        activity(`${printer.name} sold for ${money(value)}.`);
        notify(`Printer sold · +${money(value)}`);
        render();
        save();
      },
    });
  };

  const servicePrinter = (printerId) => {
    const printer = state.printers.find((candidate) => candidate.id === printerId);
    if (
      !printer ||
      printer.health >= 100 ||
      printer.maintenanceRemaining > 0 ||
      state.gameOver
    ) return;
    const activeJob = state.queue.find((job) => job.printerId === printer.id);
    if (printer.jobId || activeJob) {
      notify(`${printer.name} must finish its current job before service can begin.`);
      return;
    }
    const quote = maintenanceQuote(printer);
    spend(
      quote.cost,
      `${printer.name} entered service for ${Math.ceil(quote.durationDays * 24)} hours.`,
      () => {
        printer.maintenanceRemaining = quote.durationDays;
        assignJobs();
      }
    );
  };

  const completeJobs = () => {
    const completed = state.queue.filter((job) => job.progress >= 1);
    if (!completed.length) return;

    completed.forEach((job) => {
      const printer = state.printers.find((candidate) => candidate.id === job.printerId);
      if (printer) printer.jobId = null;
      const late = job.deadlineRemaining < 0;
      const payment = late ? Math.round(job.payout * 0.55) : job.payout;
      state.cash = round(state.cash + payment, 2);
      state.revenue += payment;
      const customer = state.customers.find(
        (candidate) => candidate.id === job.customerId
      );
      if (customer) {
        customer.completed += 1;
        customer.lastOrderDay = state.day;
        customer.lifetimeRevenue = round(customer.lifetimeRevenue + payment, 2);
        customer.loyalty = Math.max(
          0,
          Math.min(10, customer.loyalty + (late ? -2 : job.repeatCustomer ? 2 : 1))
        );
      }
      if (job.sourceCampaignId) {
        const campaign = state.campaigns.find(
          (candidate) => candidate.id === job.sourceCampaignId
        );
        if (campaign) campaign.revenue = round(campaign.revenue + payment, 2);
      }
      if (late) {
        state.onTimeStreak = 0;
        changeReputation(-5, `Late delivery for ${job.customerName || "a customer"}`);
      } else {
        state.onTimeStreak += 1;
        const baseGain = Math.min(3, Math.max(1, Math.round(payment / 110)));
        const streakBonus = state.onTimeStreak % 5 === 0 ? 1 : 0;
        changeReputation(
          baseGain + streakBonus,
          streakBonus
            ? `On-time delivery and ${state.onTimeStreak}-job reliability streak`
            : `On-time delivery for ${job.customerName || "a customer"}`
        );
      }
      state.totalCompleted += 1;
      state.completedToday += 1;
      activity(
        late
          ? `${job.name} shipped late. The customer withheld ${money(job.payout - payment)}.`
          : `${job.name} shipped on time for ${money(payment)}.`
      );
      notify(late ? `Late delivery · +${money(payment)}` : `Order shipped · +${money(payment)}`);
    });
    state.queue = state.queue.filter((job) => job.progress < 1);
    assignJobs();
  };

  const updateMaterialMarket = () => {
    Object.entries(MATERIALS).forEach(([id, material]) => {
      const movement = 0.82 + Math.random() * 0.38;
      state.materialPrices[id] = Math.round(material.basePrice * movement);
    });
  };

  const endGame = () => {
    if (state.gameOver) return;
    state.gameOver = true;
    state.paused = true;
    archiveCurrentRun();
    $("[data-final-days]").textContent = `${state.day} day${state.day === 1 ? "" : "s"}`;
    $("[data-final-jobs]").textContent =
      `${state.totalCompleted} job${state.totalCompleted === 1 ? "" : "s"}`;
    $("[data-final-revenue]").textContent = money(state.revenue);
    save();
    if (!nodes.bankruptcyDialog.open) nodes.bankruptcyDialog.showModal();
  };

  const collectMonthlyBills = (billedThroughDay) => {
    const rent = monthlyRent();
    const electricity = state.monthlyElectric;
    const total = round(rent + electricity, 2);
    const balanceBefore = round(Number(state.cash) || 0, 2);
    state.cash = round(balanceBefore - total, 2);
    state.expenses = round(state.expenses + total, 2);
    state.lastBill = {
      day: billedThroughDay,
      rent,
      electricity,
      total,
      balanceBefore,
      balanceAfter: state.cash,
    };
    syncCashDisplay();
    state.monthlyElectric = 0;
    updateMaterialMarket();
    activity(
      `Monthly bills paid: ${money(rent)} rent and ${money(electricity)} electricity.`
    );
    notify(
      `Bills paid: ${money(balanceBefore)} − ${money(total)} = ${money(state.cash)} spendable cash`,
      "alert"
    );
    if (state.cash <= BANKRUPTCY_LIMIT) endGame();
  };

  const closeDay = () => {
    const closingDay = state.day;
    state.electricHistory.push({
      day: closingDay,
      cost: round(state.dailyElectric, 2),
    });
    state.electricHistory = state.electricHistory.slice(-60);
    state.dailyElectric = 0;
    state.day += 1;
    state.completedToday = 0;
    const endedCampaigns = [];
    state.campaigns.forEach((campaign) => {
      if (
        !campaign.endedReported &&
        !campaign.cancelled &&
        campaign.endAt <= gameTime()
      ) {
        campaign.endedReported = true;
        const channel = AD_CHANNELS[campaign.channelId];
        endedCampaigns.push({ channelId: campaign.channelId, name: channel.name });
        activity(
          `${channel.name} ended with ${campaign.leadsGenerated} leads and ${money(campaign.revenue)} attributed revenue.`
        );
      }
    });
    if (closingDay % BILLING_CYCLE_DAYS === 0) {
      collectMonthlyBills(closingDay);
    }
    if (endedCampaigns.length) {
      const renewed = [];
      const failed = [];
      if (!state.gameOver) {
        endedCampaigns.forEach(({ channelId, name }) => {
          if (!state.autoRenewAds[channelId]) return;
          const channel = AD_CHANNELS[channelId];
          if (state.cash < channel.cost) {
            state.autoRenewAds[channelId] = false;
            failed.push(name);
            return;
          }
          state.cash = round(state.cash - channel.cost, 2);
          state.expenses = round(state.expenses + channel.cost, 2);
          createCampaign(channelId);
          renewed.push(name);
        });
      }
      const endedNames = endedCampaigns.map(({ name }) => name).join(", ");
      const details = [
        renewed.length ? ` Auto-renewed: ${renewed.join(", ")}.` : "",
        failed.length
          ? ` Auto-renew disabled for insufficient cash: ${failed.join(", ")}.`
          : "",
      ].join("");
      notify(
        `${endedCampaigns.length === 1 ? "Ad campaign ended" : "Ad campaigns ended"}: ${endedNames}.${details}`,
        "alert"
      );
    }
    save();
  };

  const handleBreakdown = (printer, job) => {
    printer.health = 0;
    printer.jobId = null;
    if (job) job.printerId = null;
    assignJobs();
    state.onTimeStreak = 0;
    changeReputation(-2, `${printer.name} broke down during production`);
    const replacement = job
      ? state.printers.find((candidate) => candidate.id === job.printerId)
      : null;
    activity(
      replacement
        ? `${printer.name} broke down. ${job.name} moved to ${replacement.name}.`
        : `${printer.name} broke down. Its job returned to the waiting queue.`
    );
    notify(`${printer.name} broke down`);
  };

  const tick = (deltaSeconds) => {
    if (state.paused || state.gameOver) return;
    const scaled = deltaSeconds * state.speed;
    state.dayProgress += scaled / DAY_SECONDS;

    while (state.dayProgress >= 1) {
      state.dayProgress -= 1;
      closeDay();
    }

    state.queue.forEach((job) => {
      job.deadlineRemaining -= scaled / DAY_SECONDS;
    });

    state.printers.forEach((printer) => {
      if (printer.maintenanceRemaining <= 0) return;
      printer.maintenanceRemaining = round(
        Math.max(0, printer.maintenanceRemaining - scaled / DAY_SECONDS),
        4
      );
      if (printer.maintenanceRemaining <= 0) {
        printer.health = 100;
        activity(`${printer.name} completed service and returned at 100% health.`);
        notify(`${printer.name} is ready for production`);
      }
    });

    assignJobs();
    state.printers.forEach((printer) => {
      if (
        !printer.jobId ||
        printer.health <= 0 ||
        printer.maintenanceRemaining > 0
      ) return;
      const job = state.queue.find((candidate) => candidate.id === printer.jobId);
      if (!job) {
        printer.jobId = null;
        return;
      }
      const baseDuration = (job.hours / 24) * DAY_SECONDS;
      job.progress += (scaled / baseDuration) * effectiveSpeed(printer);
      printer.health = round(
        Math.max(0, printer.health - effectiveWear(printer) * (scaled / DAY_SECONDS)),
        2
      );
      state.monthlyElectric = round(
        state.monthlyElectric + effectivePower(printer) * (scaled / DAY_SECONDS),
        2
      );
      state.dailyElectric = round(
        state.dailyElectric + effectivePower(printer) * (scaled / DAY_SECONDS),
        2
      );
      if (printer.health <= 0) handleBreakdown(printer, job);
    });

    completeJobs();
    maybeGenerateOrders();
  };

  const renderWindow = () => {
    const hour = currentHour();
    const isDaylight = hour >= 6 && hour < 20;
    const phase =
      hour >= 6 && hour < 8
        ? "is-dawn"
        : hour >= 8 && hour < 17
          ? "is-day"
          : hour >= 17 && hour < 20
            ? "is-dusk"
            : "is-night";
    nodes.window.className = `shop-window ${phase}`;
    const progress = isDaylight ? (hour - 6) / 14 : ((hour + 4) % 24) / 10;
    const x = 8 + Math.min(1, Math.max(0, progress)) * 84;
    const y = 54 - Math.sin(Math.min(1, Math.max(0, progress)) * Math.PI) * 42;
    nodes.window.style.setProperty("--celestial-x", `${x}%`);
    nodes.window.style.setProperty("--celestial-y", `${y}%`);
    nodes.window.setAttribute(
      "aria-label",
      isDaylight ? "Daylight outside the workshop" : "Nighttime outside the workshop"
    );
  };

  const renderOrders = () => {
    nodes.orders.replaceChildren();
    if (!state.orders.length) {
      const empty = document.createElement("div");
      empty.className = "order-empty";
      empty.innerHTML = isBusinessHours()
        ? activeCampaigns().length
          ? "<strong>No open requests</strong><span>Your campaigns are working. A lead may arrive soon.</span>"
          : "<strong>No open requests</strong><span>Advertise or build reputation to attract more customers.</span>"
        : "<strong>Business hours are over</strong><span>Rush calls are possible, but rare.</span>";
      nodes.orders.append(empty);
    }

    state.orders.forEach((order) => {
      const enoughMaterial = state.materials[order.materialId] >= order.material;
      const compatible = compatiblePrinterOwned(order.materialId);
      const card = document.createElement("article");
      card.className = `order-card${order.rare ? " is-rush" : ""}`;
      card.style.setProperty("--order-color", order.color);

      const head = document.createElement("div");
      head.className = "order-card-head";
      const headingWrap = document.createElement("div");
      const category = document.createElement("span");
      category.textContent = order.rare ? "AFTER-HOURS RUSH" : `${order.materialId} ORDER`;
      const title = document.createElement("h3");
      title.textContent = order.name;
      const customer = document.createElement("small");
      customer.className = "order-customer";
      customer.textContent = `${order.customerName || "New customer"} · ${order.sourceName || "Organic lead"}`;
      headingWrap.append(category, title, customer);
      const payout = document.createElement("b");
      payout.textContent = money(order.payout);
      head.append(headingWrap, payout);

      const visual = document.createElement("div");
      visual.className = "order-visual";
      const object = document.createElement("div");
      object.className = "order-object";
      visual.append(object);

      const meta = document.createElement("div");
      meta.className = "order-meta";
      const material = document.createElement("span");
      material.textContent = `${order.material} kg ${order.materialId}`;
      const hours = document.createElement("span");
      hours.textContent = `${order.hours} base hrs`;
      const deadline = document.createElement("span");
      deadline.className = "order-deadline";
      deadline.textContent = `Due ${Math.ceil(order.deadlineDays * 24)}h after acceptance`;
      meta.append(material, hours, deadline);

      const projection = orderProjection(order);
      const estimate = document.createElement("div");
      estimate.className = "order-estimate";
      if (projection) {
        const buffer = Math.floor(projection.deadlineBufferHours);
        estimate.classList.toggle("is-risky", buffer < 0);
        estimate.innerHTML = `
          <div class="order-estimate-head">
            <span>Projected result</span>
            <strong>${money(projection.netProfit)} net</strong>
          </div>
          <div class="order-estimate-grid">
            <span><small>Material</small><b>−${money(projection.materialCost)}</b></span>
            <span><small>Electric</small><b>−${money(projection.electricCost)}</b></span>
            <span><small>Completion</small><b>~${Math.ceil(projection.completionHours)}h</b></span>
            <span><small>Deadline buffer</small><b>${buffer >= 0 ? "+" : ""}${buffer}h</b></span>
          </div>
          <small class="order-estimate-note">Estimate uses current queue, replacement material, ${projection.printerName}, and ${buffer < 0 ? "the 45% late-delivery penalty" : "full on-time payment"}.</small>
        `;
      } else {
        estimate.classList.add("is-risky");
        estimate.innerHTML = `<strong>No compatible production estimate</strong>`;
      }

      const offerDuration = order.offerDuration || (order.rare ? 0.16 : 0.42);
      const offerRemaining = Math.max(0, order.offerExpiresAt - gameTime());
      const offerRemainingHours = offerRemaining * 24;
      const offerRemainingRatio = Math.min(1, offerRemaining / offerDuration);
      const expiry = document.createElement("div");
      expiry.className =
        `order-expiry${offerRemainingRatio <= 0.25 ? " is-low" : ""}`;
      const expiryLabel = document.createElement("span");
      const urgencyLabel =
        order.offerWindowLabel ||
        (offerDuration >= 0.7
          ? "Flexible response"
          : offerDuration >= 0.5
            ? "Standard response"
            : order.rare
              ? "Rush response"
              : "Time-sensitive");
      expiryLabel.textContent = state.paused
        ? `${urgencyLabel} · paused · ${Math.max(1, Math.ceil(offerRemainingHours))}h remaining`
        : `${urgencyLabel} · ${Math.max(1, Math.ceil(offerRemainingHours))}h until expiry`;
      const expiryTrack = document.createElement("div");
      expiryTrack.className = "order-expiry-track";
      expiryTrack.setAttribute("role", "progressbar");
      expiryTrack.setAttribute("aria-label", `${order.name} offer time remaining`);
      expiryTrack.setAttribute("aria-valuemin", "0");
      expiryTrack.setAttribute("aria-valuemax", "100");
      expiryTrack.setAttribute(
        "aria-valuenow",
        String(Math.round(offerRemainingRatio * 100))
      );
      const expiryFill = document.createElement("i");
      expiryFill.style.width = `${offerRemainingRatio * 100}%`;
      expiryTrack.append(expiryFill);
      expiry.append(expiryLabel, expiryTrack);

      const actions = document.createElement("div");
      actions.className = "order-actions";
      const button = document.createElement("button");
      button.type = "button";
      button.textContent =
        state.queue.length >= queueCapacity()
          ? "Queue full"
          : !compatible
            ? `Need ${order.materialId} printer`
            : !enoughMaterial
              ? `Need ${order.materialId}`
              : "Accept order";
      button.disabled =
        state.queue.length >= queueCapacity() ||
        !compatible ||
        !enoughMaterial ||
        state.gameOver;
      button.addEventListener("click", () => acceptOrder(order.id));
      actions.append(button);
      card.append(head, visual, meta, estimate, expiry, actions);
      nodes.orders.append(card);
    });
    nodes.orderCount.textContent = state.orders.length;
  };

  const renderPrinters = () => {
    nodes.printerFloor.replaceChildren();
    nodes.printerFloor.classList.toggle("is-single", state.printers.length === 1);
    nodes.printerFloor.classList.toggle("is-dense", state.printers.length > 3);
    nodes.printerFloor.style.gridTemplateColumns =
      `repeat(${Math.min(state.printers.length, 3)}, minmax(4.5rem, 1fr))`;

    state.printers.forEach((printer, index) => {
      const type = PRINTER_TYPES[printer.typeId];
      const job = state.queue.find((candidate) => candidate.id === printer.jobId);
      const machine = document.createElement("div");
      machine.className =
        `printer-machine${job ? " is-printing" : ""}` +
        `${printer.health <= 0 ? " is-broken" : ""}` +
        `${printer.health > 0 && printer.health < 35 ? " needs-service" : ""}` +
        `${printer.maintenanceRemaining > 0 ? " is-servicing" : ""}`;
      machine.style.setProperty("--printer-color", job?.color || MATERIALS.PLA.color);
      machine.setAttribute(
        "aria-label",
        `${printer.name}, ${printerStatus(printer)}, ${Math.round(printer.health)}% maintenance`
      );

      const body = document.createElement("div");
      body.className = "printer-body";
      const gantry = document.createElement("div");
      gantry.className = "printer-gantry";
      const head = document.createElement("i");
      head.className = "printer-head";
      gantry.append(head);
      const bed = document.createElement("div");
      bed.className = "printer-bed";
      const part = document.createElement("div");
      part.className = "print-part";
      part.style.setProperty(
        "--print-progress",
        `${Math.max(4, Math.min((job?.progress || 0) * 42, 42))}%`
      );
      const light = document.createElement("i");
      light.className = "printer-light";
      body.append(gantry, bed, part, light);

      const health = document.createElement("div");
      health.className = "printer-health-track";
      health.style.setProperty("--health", `${printer.health}%`);
      health.style.setProperty("--health-color", healthColor(printer.health));
      health.append(document.createElement("i"));

      const label = document.createElement("span");
      label.className = "printer-label";
      label.textContent =
        printer.maintenanceRemaining > 0
          ? `${printer.name} · SERVICE ${Math.ceil(printer.maintenanceRemaining * 24)}h`
          : printer.health <= 0
          ? `${printer.name} · BROKEN`
          : job
            ? `${printer.name} · ${Math.round(job.progress * 100)}% · ${deadlineText(job.deadlineRemaining)}`
            : `${printer.name} · Idle`;
      machine.append(body, health, label);
      nodes.printerFloor.append(machine);
    });
  };

  const renderMaterials = () => {
    nodes.materials.replaceChildren();
    Object.entries(MATERIALS)
      .filter(([id]) => compatiblePrinterOwned(id))
      .forEach(([id, material]) => {
        const row = document.createElement("div");
        row.className = "material-row";
        row.style.setProperty("--material-color", material.color);
        const swatch = document.createElement("i");
        swatch.className = "material-swatch";
        const copy = document.createElement("span");
        const name = document.createElement("strong");
        name.textContent = material.name;
        const note = document.createElement("small");
        note.textContent = `${money(state.materialPrices[id])} per spool`;
        copy.append(name, note);
        const quantity = document.createElement("b");
        quantity.className = "material-quantity";
        quantity.textContent = `${state.materials[id].toFixed(2)} kg`;
        row.append(swatch, copy, quantity);
        nodes.materials.append(row);
      });
  };

  const renderMaterialShop = () => {
    nodes.materialShop.replaceChildren();
    Object.entries(MATERIALS).forEach(([id, material]) => {
      const supported = compatiblePrinterOwned(id);
      const card = document.createElement("article");
      card.className = "material-product";
      card.style.setProperty("--material-color", material.color);

      const visual = document.createElement("div");
      visual.className = "material-product-visual";
      const spool = document.createElement("i");
      visual.append(spool);

      const header = document.createElement("div");
      header.className = "material-product-header";
      const heading = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = material.name;
      const market = document.createElement("p");
      market.textContent = `${money(state.materialPrices[id])} market price per kg`;
      heading.append(title, market);
      const stock = document.createElement("b");
      stock.textContent = `${state.materials[id].toFixed(2)} kg owned`;
      header.append(heading, stock);

      const compatibility = document.createElement("span");
      compatibility.className =
        `material-compatibility${supported ? " is-supported" : ""}`;
      compatibility.textContent = supported
        ? "Compatible printer owned"
        : "No compatible printer owned yet";

      const options = document.createElement("div");
      options.className = "material-bulk-options";
      MATERIAL_BULK_OPTIONS.forEach((option) => {
        const price = materialPurchasePrice(id, option.kg, option.discount);
        const fullPrice = state.materialPrices[id] * option.kg;
        const button = document.createElement("button");
        button.type = "button";
        button.disabled = state.gameOver;
        const copy = document.createElement("span");
        const label = document.createElement("strong");
        label.textContent = option.label;
        const detail = document.createElement("small");
        detail.textContent =
          option.discount > 0
            ? `${Math.round(option.discount * 100)}% off · save ${money(fullPrice - price)}`
            : "1 kg";
        copy.append(label, detail);
        const cost = document.createElement("b");
        cost.textContent = money(price);
        button.append(copy, cost);
        button.addEventListener("click", () =>
          buyMaterial(id, option.kg, option.discount)
        );
        options.append(button);
      });

      card.append(visual, header, compatibility, options);
      nodes.materialShop.append(card);
    });
  };

  const renderFleet = () => {
    nodes.fleet.replaceChildren();
    state.printers.forEach((printer) => {
      const quote = maintenanceQuote(printer);
      const isPrinting = Boolean(
        printer.jobId &&
        state.queue.some((job) => job.id === printer.jobId && job.printerId === printer.id)
      );
      const row = document.createElement("div");
      row.className =
        `fleet-row${printer.health <= 0 ? " is-broken" : ""}` +
        `${printer.maintenanceRemaining > 0 ? " is-servicing" : ""}`;
      const head = document.createElement("div");
      head.className = "fleet-row-head";
      const name = document.createElement("strong");
      name.textContent = printer.name;
      const status = document.createElement("small");
      status.textContent =
        `${printerStatus(printer)} · ${effectiveSpeed(printer).toFixed(2)}× speed · ` +
        `${printer.speedLevel + printer.durabilityLevel + printer.efficiencyLevel}/9 upgrades` +
        `${printer.health < 50 && printer.maintenanceRemaining <= 0 ? ` · +${Math.round((healthPowerFactor(printer) - 1) * 100)}% power` : ""}`;
      head.append(name, status);
      const button = document.createElement("button");
      button.type = "button";
      button.textContent =
        printer.maintenanceRemaining > 0
          ? `${Math.ceil(printer.maintenanceRemaining * 24)}h remaining`
          : isPrinting
            ? "Finish current job"
            : printer.health >= 100
              ? "Healthy"
              : `${printer.health <= 0 ? "Repair" : "Service"} ${money(quote.cost)} · ${Math.ceil(quote.durationDays * 24)}h`;
      button.disabled =
        isPrinting ||
        printer.health >= 100 ||
        printer.maintenanceRemaining > 0 ||
        state.gameOver;
      button.addEventListener("click", () => servicePrinter(printer.id));
      const health = document.createElement("div");
      health.className = "fleet-health";
      const track = document.createElement("span");
      track.style.setProperty("--health", `${printer.health}%`);
      track.style.setProperty("--health-color", healthColor(printer.health));
      track.append(document.createElement("i"));
      const value = document.createElement("b");
      value.textContent =
        printer.health < 35 && printer.maintenanceRemaining <= 0
          ? `${Math.round(healthSpeedFactor(printer) * 100)}% output`
          : `${Math.round(printer.health)}% maint.`;
      health.append(track, value);
      row.append(head, button, health);
      nodes.fleet.append(row);
    });
  };

  const createOperationsSummary = (items) => {
    const grid = document.createElement("div");
    grid.className = "operations-summary-grid";
    items.forEach(({ label, value, note }) => {
      const card = document.createElement("div");
      card.className = "operations-summary-card";
      const labelNode = document.createElement("span");
      labelNode.textContent = label;
      const valueNode = document.createElement("strong");
      valueNode.textContent = value;
      card.append(labelNode, valueNode);
      if (note) {
        const noteNode = document.createElement("small");
        noteNode.textContent = note;
        card.append(noteNode);
      }
      grid.append(card);
    });
    return grid;
  };

  const renderQueueOperations = () => {
    nodes.operationsQueue.replaceChildren();
    const active = state.queue.filter((job) => job.printerId).length;
    const waiting = state.queue.length - active;
    const broken = state.printers.filter(
      (printer) => printer.health <= 0 && printer.maintenanceRemaining <= 0
    ).length;
    const servicing = state.printers.filter(
      (printer) => printer.maintenanceRemaining > 0
    ).length;
    nodes.operationsQueue.append(
      createOperationsSummary([
        { label: "Active jobs", value: String(active), note: "Printing now" },
        { label: "Waiting jobs", value: String(waiting), note: "Awaiting a machine" },
        { label: "Queue use", value: `${state.queue.length}/${queueCapacity()}`, note: "Accepted work" },
        { label: "Broken printers", value: String(broken), note: "Require repair" },
        { label: "In service", value: String(servicing), note: "Temporarily offline" },
      ])
    );

    const layout = document.createElement("div");
    layout.className = "operations-detail-grid";
    const printerSection = document.createElement("section");
    const printerTitle = document.createElement("h3");
    printerTitle.textContent = "Printer assignments";
    const printerList = document.createElement("div");
    printerList.className = "operations-list";
    state.printers.forEach((printer) => {
      const type = PRINTER_TYPES[printer.typeId];
      const job = state.queue.find((candidate) => candidate.id === printer.jobId);
      const row = document.createElement("article");
      row.className =
        `operations-list-row${printer.health <= 0 ? " is-blocked" : ""}` +
        `${printer.maintenanceRemaining > 0 ? " is-waiting" : ""}`;
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = printer.name;
      const detail = document.createElement("span");
      detail.textContent =
        printer.maintenanceRemaining > 0
          ? `Scheduled maintenance · ${Math.ceil(printer.maintenanceRemaining * 24)}h remaining`
          : printer.health <= 0
          ? "Broken down · repair required"
          : job
            ? `${job.name} · ${job.materialId} · ${Math.round(job.progress * 100)}%`
            : `Idle · accepts ${type.materials.join(", ")}`;
      copy.append(title, detail);
      const status = document.createElement("b");
      status.textContent =
        printer.maintenanceRemaining > 0
          ? "SERVICE"
          : printer.health <= 0
          ? "BLOCKED"
          : job
            ? `${round((job.hours * (1 - job.progress)) / effectiveSpeed(printer), 1)}h est.`
            : "READY";
      row.append(copy, status);
      printerList.append(row);
    });
    printerSection.append(printerTitle, printerList);

    const queueSection = document.createElement("section");
    const queueTitle = document.createElement("h3");
    queueTitle.textContent = "Accepted job queue";
    const queueList = document.createElement("div");
    queueList.className = "operations-list";
    if (!state.queue.length) {
      const empty = document.createElement("div");
      empty.className = "operations-empty";
      empty.textContent = "No accepted jobs are waiting or printing.";
      queueList.append(empty);
    }
    state.queue.forEach((job, index) => {
      const printer = state.printers.find(
        (candidate) => candidate.id === job.printerId
      );
      const compatible = state.printers.filter((candidate) =>
        PRINTER_TYPES[candidate.typeId].materials.includes(job.materialId)
      );
      const row = document.createElement("article");
      row.className =
        `operations-list-row${!printer ? " is-waiting" : ""}` +
        `${job.deadlineRemaining < 0 ? " is-blocked" : ""}`;
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = `${index + 1}. ${job.name}`;
      const detail = document.createElement("span");
      detail.textContent = printer
        ? `${printer.name} · ${Math.round(job.progress * 100)}% complete`
        : compatible.length
          ? "Waiting for a compatible printer to become available"
          : `Blocked · no owned printer supports ${job.materialId}`;
      copy.append(title, detail);
      const status = document.createElement("b");
      status.textContent = deadlineText(job.deadlineRemaining);
      row.append(copy, status);
      queueList.append(row);
    });
    queueSection.append(queueTitle, queueList);
    layout.append(printerSection, queueSection);
    nodes.operationsQueue.append(layout);
  };

  const renderElectricOperations = () => {
    nodes.operationsElectric.replaceChildren();
    const currentLoad = state.printers
      .filter(
        (printer) =>
          printer.jobId && printer.health > 0 && printer.maintenanceRemaining <= 0
      )
      .reduce((sum, printer) => sum + effectivePower(printer), 0);
    const history = [
      ...state.electricHistory.slice(-13),
      { day: state.day, cost: round(state.dailyElectric, 2), current: true },
    ];
    const completedValues = state.electricHistory.map((entry) => entry.cost);
    const average = completedValues.length
      ? completedValues.reduce((sum, value) => sum + value, 0) /
        completedValues.length
      : state.dailyElectric;
    const peak = Math.max(state.dailyElectric, ...completedValues, 0);
    nodes.operationsElectric.append(
      createOperationsSummary([
        { label: "Cycle accrued", value: money(state.monthlyElectric), note: "Due on billing day" },
        { label: "Today", value: money(state.dailyElectric), note: "Live total" },
        { label: "Daily average", value: money(average), note: "Recorded days" },
        { label: "Current load", value: money(currentLoad), note: "Per full print day" },
      ])
    );

    const chartCard = document.createElement("section");
    chartCard.className = "electric-chart-card";
    const chartHead = document.createElement("div");
    chartHead.className = "electric-chart-head";
    const heading = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = "Daily electricity cost";
    const subtitle = document.createElement("p");
    subtitle.textContent = history.length > 1
      ? `Last ${history.length} days · peak ${money(peak)}`
      : "Usage history will build as game days complete.";
    heading.append(title, subtitle);
    chartHead.append(heading);

    const chart = document.createElement("div");
    chart.className = "electric-bar-chart";
    const chartMax = Math.max(peak, 1);
    history.forEach((entry) => {
      const column = document.createElement("div");
      column.className = `electric-bar-column${entry.current ? " is-current" : ""}`;
      column.setAttribute(
        "aria-label",
        `Day ${entry.day}: ${money(entry.cost)} electricity`
      );
      const value = document.createElement("b");
      value.textContent = money(entry.cost);
      const track = document.createElement("span");
      const bar = document.createElement("i");
      bar.style.setProperty(
        "--bar-height",
        `${Math.max(3, (entry.cost / chartMax) * 100)}%`
      );
      track.append(bar);
      const day = document.createElement("small");
      day.textContent = entry.current ? "Now" : `D${entry.day}`;
      column.append(value, track, day);
      chart.append(column);
    });
    chartCard.append(chartHead, chart);
    nodes.operationsElectric.append(chartCard);
  };

  const renderBillingOperations = () => {
    nodes.operationsBilling.replaceChildren();
    const rent = monthlyRent();
    const electricity = state.monthlyElectric;
    nodes.operationsBilling.append(
      createOperationsSummary([
        { label: "Rent & insurance", value: money(rent), note: "Fixed cycle charge" },
        { label: "Electricity", value: money(electricity), note: "Accrued this cycle" },
        { label: "Total due", value: money(rent + electricity), note: `In ${daysUntilBill()} days` },
        { label: "Cash after upcoming bill", value: money(state.cash - rent - electricity), note: "Projection if paid now" },
      ])
    );
    const breakdown = document.createElement("section");
    breakdown.className = "billing-breakdown";
    const title = document.createElement("h3");
    title.textContent = "Equipment insurance breakdown";
    const list = document.createElement("div");
    list.className = "operations-list";
    const base = document.createElement("article");
    base.className = "operations-list-row";
    base.innerHTML = "<div><strong>Workshop base rent</strong><span>Space, software, and general insurance</span></div><b>$1,150</b>";
    list.append(base);
    state.printers.forEach((printer) => {
      const row = document.createElement("article");
      row.className = "operations-list-row";
      const copy = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = printer.name;
      const note = document.createElement("span");
      note.textContent = "Monthly equipment coverage";
      copy.append(name, note);
      const price = document.createElement("b");
      price.textContent = money(PRINTER_TYPES[printer.typeId].monthlyCost);
      row.append(copy, price);
      list.append(row);
    });
    breakdown.append(title, list);
    nodes.operationsBilling.append(breakdown);

    if (state.lastBill) {
      const lastBill = document.createElement("section");
      lastBill.className = "billing-breakdown";
      const lastTitle = document.createElement("h3");
      lastTitle.textContent = `Last bill paid · Day ${state.lastBill.day}`;
      const lastList = document.createElement("div");
      lastList.className = "operations-list";
      const transaction = document.createElement("article");
      transaction.className = "operations-list-row";
      const transactionCopy = document.createElement("div");
      const transactionTitle = document.createElement("strong");
      transactionTitle.textContent =
        `${money(state.lastBill.balanceBefore)} − ${money(state.lastBill.total)}`;
      const transactionDetail = document.createElement("span");
      transactionDetail.textContent =
        `${money(state.lastBill.rent)} rent & insurance + ${money(state.lastBill.electricity)} electricity`;
      transactionCopy.append(transactionTitle, transactionDetail);
      const result = document.createElement("b");
      result.textContent = money(state.lastBill.balanceAfter);
      transaction.append(transactionCopy, result);
      lastList.append(transaction);
      lastBill.append(lastTitle, lastList);
      nodes.operationsBilling.append(lastBill);
    }
  };

  const setOperationsView = (view) => {
    operationsView = ["queue", "electric", "billing"].includes(view)
      ? view
      : "queue";
    document.querySelectorAll("[data-operations-tab]").forEach((button) => {
      const active = button.dataset.operationsTab === operationsView;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll("[data-operations-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.operationsPanel !== operationsView;
    });
  };

  const renderOperationsDetails = () => {
    renderQueueOperations();
    renderElectricOperations();
    renderBillingOperations();
    setOperationsView(operationsView);
  };

  const renderPrinterShop = () => {
    nodes.printerShop.replaceChildren();
    Object.entries(PRINTER_TYPES).forEach(([id, type]) => {
      const card = document.createElement("article");
      card.className = "printer-product";
      const visual = document.createElement("div");
      visual.className = "printer-product-visual";
      visual.style.setProperty("--product-color", type.color);
      const title = document.createElement("h3");
      title.textContent = type.name;
      const description = document.createElement("p");
      description.textContent = type.description;
      const specs = document.createElement("div");
      specs.className = "printer-specs";
      specs.innerHTML = `
        <span>Print speed <b>${type.speed.toFixed(2)}×</b></span>
        <span>Wear rate <b>${type.wearPerDay}% / print day</b></span>
        <span>Electricity <b>${money(type.powerPerDay)} / print day</b></span>
        <span>Monthly cost <b>${money(type.monthlyCost)}</b></span>
      `;
      const tags = document.createElement("div");
      tags.className = "printer-material-tags";
      type.materials.forEach((materialId) => {
        const tag = document.createElement("i");
        tag.textContent = materialId;
        tags.append(tag);
      });
      const button = document.createElement("button");
      button.type = "button";
      button.textContent =
        state.printers.length >= MAX_PRINTERS
          ? "Shop floor full"
          : `Buy for ${money(type.price)}`;
      button.disabled =
        state.printers.length >= MAX_PRINTERS || state.gameOver;
      button.addEventListener("click", () => buyPrinter(id));
      card.append(visual, title, description, specs, tags, button);
      nodes.printerShop.append(card);
    });
  };

  const renderPrinterUpgrades = () => {
    nodes.printerUpgrades.replaceChildren();
    state.printers.forEach((printer) => {
      const type = PRINTER_TYPES[printer.typeId];
      const card = document.createElement("article");
      card.className = "printer-upgrade-card";

      const header = document.createElement("div");
      header.className = "printer-upgrade-header";
      const heading = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = printer.name;
      const subtitle = document.createElement("p");
      subtitle.textContent =
        `${printerStatus(printer)} · ${Math.round(printer.health)}% maintenance`;
      heading.append(title, subtitle);
      const headerActions = document.createElement("div");
      headerActions.className = "printer-upgrade-header-actions";
      const totalLevel = document.createElement("b");
      totalLevel.textContent =
        `${printer.speedLevel + printer.durabilityLevel + printer.efficiencyLevel}/9 installed`;
      const sellButton = document.createElement("button");
      sellButton.className = "printer-sell-button";
      sellButton.type = "button";
      sellButton.textContent =
        state.printers.length <= 1
          ? "Last printer"
          : `Sell · ${money(printerResaleValue(printer))}`;
      sellButton.disabled = state.printers.length <= 1 || state.gameOver;
      sellButton.addEventListener("click", () => sellPrinter(printer.id));
      headerActions.append(totalLevel, sellButton);
      header.append(heading, headerActions);

      const stats = document.createElement("div");
      stats.className = "printer-upgrade-stats";
      stats.innerHTML = `
        <span>Speed <b>${effectiveSpeed(printer).toFixed(2)}×</b></span>
        <span>Wear <b>${effectiveWear(printer).toFixed(1)}% / day</b></span>
        <span>Power <b>${money(effectivePower(printer))} / day</b></span>
        <span>Materials <b>${type.materials.join(", ")}</b></span>
      `;

      const actions = document.createElement("div");
      actions.className = "printer-upgrade-actions";
      Object.entries(PRINTER_UPGRADES).forEach(([upgradeId, upgrade]) => {
        const level = printer[upgradeId];
        const button = document.createElement("button");
        button.type = "button";
        button.disabled = level >= MAX_UPGRADE_LEVEL || state.gameOver;

        const copy = document.createElement("span");
        const name = document.createElement("strong");
        name.textContent = upgrade.name;
        const description = document.createElement("small");
        description.textContent = upgrade.description;
        copy.append(name, description);

        const price = document.createElement("b");
        price.textContent =
          level >= MAX_UPGRADE_LEVEL
            ? "MAX"
            : `L${level + 1} · ${money(upgradeCost(printer, upgradeId))}`;
        button.append(copy, price);
        button.addEventListener("click", () =>
          upgradePrinter(printer.id, upgradeId)
        );
        actions.append(button);
      });

      card.append(header, stats, actions);
      nodes.printerUpgrades.append(card);
    });
  };

  const setPrinterShopView = (view) => {
    printerShopView = view === "upgrade" ? "upgrade" : "buy";
    document.querySelectorAll("[data-shop-tab]").forEach((button) => {
      const active = button.dataset.shopTab === printerShopView;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll("[data-shop-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.shopPanel !== printerShopView;
    });
  };

  const renderMarketing = () => {
    if (!nodes.marketingCatalog) return;
    const tier = reputationTier();
    const nextTier = nextReputationTier();
    const tierProgress = nextTier
      ? ((state.reputation - tier.min) / (nextTier.min - tier.min)) * 100
      : 100;
    const loyalCustomers = state.customers.filter(
      (customer) => customer.completed > 0
    ).length;
    nodes.reputationOverview.innerHTML = `
      <div class="reputation-score">
        <span>Current standing</span>
        <strong>${state.reputation} <small>/ 100</small></strong>
        <b>${tier.name}</b>
      </div>
      <div class="reputation-progress">
        <div>
          <span>${nextTier ? `Next: ${nextTier.name}` : "Maximum trust level"}</span>
          <b>${nextTier ? `${nextTier.min - state.reputation} points to go` : "Top tier"}</b>
        </div>
        <div class="reputation-progress-track"><i style="width:${Math.max(0, Math.min(100, tierProgress))}%"></i></div>
        <small>Reputation improves organic demand, payouts, repeat business, and advertising access.</small>
      </div>
      <div class="reputation-kpis">
        <span><small>Organic</small><b>${tier.organicRate.toFixed(2)}/day</b></span>
        <span><small>Repeat</small><b>${repeatLeadRate().toFixed(2)}/day</b></span>
        <span><small>Customers</small><b>${loyalCustomers}</b></span>
        <span><small>On-time streak</small><b>${state.onTimeStreak}</b></span>
      </div>
    `;

    const forecast = demandForecast();
    nodes.demandForecast.textContent = forecast.label;
    nodes.demandForecast.className = forecast.className;

    nodes.marketingCatalog.replaceChildren();
    Object.entries(AD_CHANNELS).forEach(([channelId, channel]) => {
      const running = activeCampaigns().some(
        (campaign) => campaign.channelId === channelId
      );
      const locked = state.reputation < channel.minReputation;
      const card = document.createElement("article");
      card.className = `marketing-channel${locked ? " is-locked" : ""}`;
      const header = document.createElement("div");
      header.innerHTML = `
        <span>${channel.duration} game days</span>
        <strong>${channel.name}</strong>
        <small>${channel.description}</small>
      `;
      const stats = document.createElement("div");
      stats.className = "marketing-channel-stats";
      stats.innerHTML = `
        <span><small>Expected leads</small><b>${round(channel.leadRate * channel.duration, 1)}</b></span>
        <span><small>Lead pace</small><b>${channel.leadRate}/day</b></span>
        <span><small>Cost</small><b>${money(channel.cost)}</b></span>
      `;
      const button = document.createElement("button");
      button.type = "button";
      button.disabled = running || locked || state.gameOver;
      button.textContent = locked
        ? `Unlock at ${channel.minReputation} rep`
        : running
          ? "Campaign running"
          : `Launch · ${money(channel.cost)}`;
      button.addEventListener("click", () => startCampaign(channelId));
      card.append(header, stats, button);
      nodes.marketingCatalog.append(card);
    });

    nodes.campaignList.replaceChildren();
    if (!state.campaigns.length) {
      const empty = document.createElement("div");
      empty.className = "marketing-empty";
      empty.textContent = "No campaigns yet. Community flyers are a low-risk way to find your first customers.";
      nodes.campaignList.append(empty);
    }
    state.campaigns.slice(0, 8).forEach((campaign) => {
      const channel = AD_CHANNELS[campaign.channelId];
      if (!channel) return;
      const active =
        !campaign.cancelled && campaign.endAt > gameTime();
      const daysLeft = Math.max(0, campaign.endAt - gameTime());
      const row = document.createElement("article");
      row.className = `campaign-row${active ? " is-active" : ""}`;
      const copy = document.createElement("div");
      copy.innerHTML = `
        <span>${active ? `${round(daysLeft, 1)} days remaining` : campaign.cancelled ? "Stopped early" : "Completed"}</span>
        <strong>${channel.name}</strong>
        <small>${campaign.leadsGenerated} leads · ${campaign.ordersAccepted} accepted · ${money(campaign.revenue)} revenue</small>
      `;
      const performance = document.createElement("div");
      performance.className = "campaign-performance";
      const roas = campaign.spend > 0 ? campaign.revenue / campaign.spend : 0;
      performance.innerHTML = `<small>Return on ad spend</small><b>${roas.toFixed(1)}×</b>`;
      if (active) {
        const actions = document.createElement("div");
        actions.className = "campaign-actions";
        const autoRenew = document.createElement("button");
        const autoRenewEnabled = Boolean(state.autoRenewAds[campaign.channelId]);
        autoRenew.className =
          `campaign-auto-renew${autoRenewEnabled ? " is-active" : ""}`;
        autoRenew.type = "button";
        autoRenew.setAttribute("aria-pressed", String(autoRenewEnabled));
        autoRenew.textContent = `Auto-renew ${autoRenewEnabled ? "on" : "off"}`;
        autoRenew.addEventListener("click", () =>
          toggleCampaignAutoRenew(campaign.channelId)
        );
        const stop = document.createElement("button");
        stop.type = "button";
        stop.textContent = "Stop";
        stop.addEventListener("click", () =>
          openConfirmation({
            title: `Stop ${channel.name}?`,
            message: "The remaining campaign time will be lost and no refund will be issued.",
            confirmLabel: "Stop campaign",
            onConfirm: () => stopCampaign(campaign.id),
          })
        );
        actions.append(autoRenew, stop);
        performance.append(actions);
      }
      row.append(copy, performance);
      nodes.campaignList.append(row);
    });

    nodes.reputationLedger.replaceChildren();
    if (!state.reputationHistory.length) {
      const empty = document.createElement("div");
      empty.className = "marketing-empty";
      empty.textContent = "Complete work to begin building your trust record.";
      nodes.reputationLedger.append(empty);
    }
    state.reputationHistory.slice(0, 6).forEach((entry) => {
      const row = document.createElement("div");
      row.className = "reputation-entry";
      row.innerHTML = `
        <span><b>Day ${entry.day}</b>${entry.reason}</span>
        <strong class="${entry.amount > 0 ? "is-positive" : "is-negative"}">${entry.amount > 0 ? "+" : ""}${entry.amount}</strong>
      `;
      nodes.reputationLedger.append(row);
    });
  };

  const renderGoal = () => {
    const compatibleMaterials = new Set(
      state.printers.flatMap((printer) => PRINTER_TYPES[printer.typeId].materials)
    ).size;
    const goals = [
      { threshold: 1, title: "Launch your first ad campaign", current: state.campaigns.length, format: (v) => `${v} campaigns` },
      { threshold: 10, title: "Become a local maker", current: state.reputation, format: (v) => `${v} reputation` },
      { threshold: 3, title: "Unlock three materials", current: compatibleMaterials, format: (v) => `${v} materials` },
      { threshold: 3, title: "Build a 3-printer farm", current: state.printers.length, format: (v) => `${v} printers` },
      { threshold: 40, title: "Reach 40 reputation", current: state.reputation, format: (v) => `${v} reputation` },
      { threshold: 15000, title: "Build a $15,000 business", current: state.revenue, format: money },
    ];
    const goal = goals.find((item) => item.current < item.threshold) || goals.at(-1);
    nodes.goalTitle.textContent = goal.title;
    nodes.goalFill.style.width = `${Math.min(100, (goal.current / goal.threshold) * 100)}%`;
    nodes.goalProgress.textContent =
      `${goal.format(Math.max(0, goal.current))} / ${goal.format(goal.threshold)}`;
  };

  const render = () => {
    const activeJobs = state.queue.filter((job) => job.printerId);
    const averageProgress = activeJobs.length
      ? activeJobs.reduce((sum, job) => sum + job.progress, 0) / activeJobs.length
      : 0;
    const hourValue = currentHour();
    const hour = Math.floor(hourValue);
    const minute = Math.floor((hourValue - hour) * 60);
    const broken = state.printers.filter(
      (printer) => printer.health <= 0 && printer.maintenanceRemaining <= 0
    ).length;

    syncCashDisplay();
    nodes.playerName.textContent = profile?.username || "Player";
    nodes.day.textContent = state.day;
    nodes.reputation.textContent = state.reputation;
    nodes.reputationTier.textContent = reputationTier().name;
    nodes.demandRate.textContent = totalDemandRate().toFixed(2);
    nodes.activeCampaigns.textContent = activeCampaigns().length;
    nodes.profit.textContent = money(state.revenue - state.expenses);
    nodes.clock.textContent =
      `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    nodes.status.textContent = state.paused
      ? "Paused"
      : isBusinessHours()
        ? "Shop open"
        : "After hours";
    nodes.activePrinters.textContent = activeJobs.length;
    nodes.printerCount.textContent = state.printers.length;
    nodes.jobsCompleted.textContent =
      `${state.completedToday} job${state.completedToday === 1 ? "" : "s"}`;
    nodes.productionFill.style.width = `${averageProgress * 100}%`;
    nodes.productionLabel.textContent = activeJobs.length
      ? `${activeJobs.length} printing · ${Math.round(averageProgress * 100)}% average · earliest ${deadlineText(Math.min(...state.queue.map((job) => job.deadlineRemaining)))}`
      : state.queue.length
        ? "Jobs waiting for a compatible working printer"
        : "Waiting for an order";
    nodes.powerBill.textContent = money(state.monthlyElectric);
    nodes.overhead.textContent = money(monthlyRent());
    nodes.billDays.textContent = daysUntilBill();
    nodes.queueCount.textContent = state.queue.length;
    nodes.queueCapacity.textContent = queueCapacity();
    nodes.brokenCount.textContent = broken;
    nodes.pauseIcon.textContent = state.paused ? "▶" : "Ⅱ";
    nodes.pause.classList.toggle("is-active", !state.paused);
    nodes.pause.setAttribute("aria-label", state.paused ? "Resume game" : "Pause game");
    nodes.speed.textContent = `${state.speed}×`;
    updateFullscreenControl();

    renderWindow();
    renderOrders();
    renderPrinters();
    renderMaterials();
    renderMaterialShop();
    renderFleet();
    renderOperationsDetails();
    renderPrinterShop();
    renderPrinterUpgrades();
    renderMarketing();
    setPrinterShopView(printerShopView);
    renderGoal();
    renderLeaderboard();
  };

  $("[data-quick-order]").addEventListener("click", () => {
    const available = state.orders
      .filter(
        (order) =>
          compatiblePrinterOwned(order.materialId) &&
          state.materials[order.materialId] >= order.material
      )
      .sort((a, b) => {
        const projectionA = orderProjection(a);
        const projectionB = orderProjection(b);
        const scoreA = projectionA
          ? projectionA.netProfit / Math.max(1, projectionA.completionHours)
          : -Infinity;
        const scoreB = projectionB
          ? projectionB.netProfit / Math.max(1, projectionB.completionHours)
          : -Infinity;
        return scoreB - scoreA;
      });
    if (!available.length) {
      notify("No available order matches your printers and material inventory.");
      return;
    }
    acceptOrder(available[0].id);
  });

  nodes.pause.addEventListener("click", () => {
    if (state.gameOver) return;
    state.paused = !state.paused;
    if (!state.paused) seedOrders();
    activity(state.paused ? "Production paused." : "Production resumed.");
    render();
    save();
  });

  nodes.speed.addEventListener("click", () => {
    if (state.gameOver) return;
    state.speed = state.speed === 1 ? 2 : state.speed === 2 ? 4 : 1;
    activity(`Game speed set to ${state.speed}×.`);
    render();
  });

  nodes.fullscreen.addEventListener("click", async () => {
    try {
      if (fullscreenElement()) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) await exit.call(document);
      } else {
        const request = gameRoot.requestFullscreen || gameRoot.webkitRequestFullscreen;
        if (!request) {
          notify("Fullscreen is not supported by this browser.");
          return;
        }
        await request.call(gameRoot);
      }
      updateFullscreenControl();
    } catch {
      notify("The browser could not enter fullscreen.");
    }
  });

  document.addEventListener("fullscreenchange", updateFullscreenControl);
  document.addEventListener("webkitfullscreenchange", updateFullscreenControl);

  $("[data-help]").addEventListener("click", () => nodes.helpDialog.showModal());
  document.querySelectorAll("[data-close-help]").forEach((button) => {
    button.addEventListener("click", () => nodes.helpDialog.close());
  });
  document.querySelectorAll("[data-shop-tab]").forEach((button) => {
    button.addEventListener("click", () =>
      setPrinterShopView(button.dataset.shopTab)
    );
  });
  document.querySelectorAll("[data-open-operations]").forEach((button) => {
    button.addEventListener("click", () => {
      operationsView = button.dataset.openOperations;
      renderOperationsDetails();
      nodes.operationsDialog.showModal();
    });
  });
  document.querySelectorAll("[data-operations-tab]").forEach((button) => {
    button.addEventListener("click", () =>
      setOperationsView(button.dataset.operationsTab)
    );
  });
  $("[data-close-operations]").addEventListener("click", () =>
    nodes.operationsDialog.close()
  );
  $("[data-open-marketing]").addEventListener("click", () => {
    renderMarketing();
    nodes.marketingDialog.showModal();
  });
  $("[data-close-marketing]").addEventListener("click", () =>
    nodes.marketingDialog.close()
  );
  $("[data-open-material-shop]").addEventListener("click", () => {
    renderMaterialShop();
    nodes.materialShopDialog.showModal();
  });
  $("[data-close-material-shop]").addEventListener("click", () =>
    nodes.materialShopDialog.close()
  );
  $("[data-open-printer-shop]").addEventListener("click", () => {
    renderPrinterShop();
    renderPrinterUpgrades();
    setPrinterShopView(printerShopView);
    nodes.printerShopDialog.showModal();
  });
  $("[data-close-printer-shop]").addEventListener("click", () =>
    nodes.printerShopDialog.close()
  );
  $("[data-open-leaderboard]").addEventListener("click", () => {
    renderLeaderboard();
    nodes.leaderboardDialog.showModal();
  });
  $("[data-close-leaderboard]").addEventListener("click", () =>
    nodes.leaderboardDialog.close()
  );

  nodes.usernameDialog.addEventListener("cancel", (event) => event.preventDefault());
  document.querySelectorAll(".game-dialog").forEach((dialog) => {
    dialog.addEventListener("close", placeToastInFront);
  });
  nodes.confirmDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeConfirmation(false);
  });
  nodes.confirmCancel.addEventListener("click", () => closeConfirmation(false));
  nodes.confirmAccept.addEventListener("click", () => closeConfirmation(true));
  nodes.usernameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = validateUsername(nodes.usernameInput.value);
    if (!result.username) {
      nodes.usernameError.textContent = result.error;
      nodes.usernameInput.setAttribute("aria-invalid", "true");
      nodes.usernameInput.focus();
      return;
    }
    profile = { username: result.username, createdAt: Date.now() };
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // Keep the locked identity for the current session if storage is unavailable.
    }
    nodes.usernameError.textContent = "";
    nodes.usernameInput.removeAttribute("aria-invalid");
    nodes.usernameDialog.close();
    nodes.playerName.textContent = profile.username;
    state.seenHelp = true;
    save();
    render();
    nodes.helpDialog.showModal();
  });

  const startNewGame = () => {
    archiveCurrentRun();
    state = freshState();
    seedOrders();
    activity("New shop opened and paused. Press resume when you are ready.");
    if (nodes.bankruptcyDialog.open) nodes.bankruptcyDialog.close();
    render();
    save();
  };

  $("[data-reset]").addEventListener("click", () => {
    openConfirmation({
      title: "Start a new game?",
      message: "Your current progress will be erased. Your username and leaderboard history will stay.",
      confirmLabel: "Start new game",
      onConfirm: startNewGame,
    });
  });
  $("[data-restart]").addEventListener("click", startNewGame);

  assignJobs();
  render();

  if (!profile) {
    state.paused = true;
    render();
    nodes.usernameDialog.showModal();
    window.setTimeout(() => nodes.usernameInput.focus(), 0);
  } else if (state.gameOver) {
    archiveCurrentRun();
    $("[data-final-days]").textContent = `${state.day} day${state.day === 1 ? "" : "s"}`;
    $("[data-final-jobs]").textContent =
      `${state.totalCompleted} job${state.totalCompleted === 1 ? "" : "s"}`;
    $("[data-final-revenue]").textContent = money(state.revenue);
    nodes.bankruptcyDialog.showModal();
  } else if (!state.seenHelp) {
    state.seenHelp = true;
    save();
    nodes.helpDialog.showModal();
  }

  setInterval(save, 5000);
  setInterval(() => {
    tick(TICK_MS / 1000);
    render();
  }, TICK_MS);
})();
