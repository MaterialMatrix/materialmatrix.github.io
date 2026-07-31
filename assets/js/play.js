(() => {
  const gameRoot = document.querySelector("[data-game]");
  if (!gameRoot) return;

  const SAVE_KEY = "materialmatrix-print-shop-v3";
  const TICK_MS = 500;
  const DAY_SECONDS = 75;
  const BUSINESS_OPEN = 8;
  const BUSINESS_CLOSE = 18;
  const BILLING_CYCLE_DAYS = 30;
  const BANKRUPTCY_LIMIT = -300;
  const MAX_PRINTERS = 6;

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
      wearPerDay: 14,
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
      wearPerDay: 12,
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
      wearPerDay: 10,
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
      wearPerDay: 8,
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
    { name: "Flexi Dragon Batch", materials: ["PLA", "PETG"], kg: 0.48, hours: 7.2, payout: 96, color: "#b17cff" },
    { name: "Cosplay Helmet", materials: ["PLA", "PETG"], kg: 0.82, hours: 11.5, payout: 168, color: "#ff796f" },
    { name: "Outdoor Sensor Mount", materials: ["ASA"], kg: 0.42, hours: 6.8, payout: 142, color: "#b17cff" },
    { name: "Automotive Air Duct", materials: ["ABS", "ASA"], kg: 0.68, hours: 9.8, payout: 188, color: "#ff9a62" },
    { name: "Flexible Seal Kit", materials: ["TPU"], kg: 0.3, hours: 5.6, payout: 126, color: "#ff7ca8" },
    { name: "Gearbox Prototype", materials: ["PETG", "ABS"], kg: 0.62, hours: 9.4, payout: 158, color: "#72a7ff" },
    { name: "Custom Keychains", materials: ["PLA"], kg: 0.22, hours: 3.2, payout: 48, color: "#ffbd59" },
    { name: "Controller Stand", materials: ["PLA", "PETG"], kg: 0.31, hours: 4.4, payout: 64, color: "#63d2dd" },
    { name: "Robot Arm Bracket", materials: ["PETG", "ABS"], kg: 0.55, hours: 8.1, payout: 138, color: "#ec7da8" },
    { name: "Weatherproof Junction Box", materials: ["ASA"], kg: 0.58, hours: 8.8, payout: 176, color: "#8796e8" },
    { name: "Vibration Damper Set", materials: ["TPU"], kg: 0.26, hours: 4.9, payout: 112, color: "#dd7cb3" },
    { name: "Lithophane Lamp", materials: ["PLA", "PETG"], kg: 0.7, hours: 10.3, payout: 154, color: "#e8df79" },
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
  });

  const initialPrices = () =>
    Object.fromEntries(
      Object.entries(MATERIALS).map(([id, material]) => [id, material.basePrice])
    );

  const freshState = () => ({
    cash: 650,
    day: 1,
    dayProgress: 2 / 24,
    reputation: 0,
    revenue: 0,
    expenses: 0,
    monthlyElectric: 0,
    dailyElectric: 0,
    electricHistory: [],
    materials: { PLA: 1.5, PETG: 0.5, ABS: 0, ASA: 0, TPU: 0 },
    materialPrices: initialPrices(),
    printers: [createPrinter("maker_mini", 1)],
    queue: [],
    orders: [],
    nextOrderAt: 0,
    totalCompleted: 0,
    completedToday: 0,
    paused: false,
    speed: 1,
    gameOver: false,
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
        materials: { ...base.materials, ...saved.materials },
        materialPrices: { ...initialPrices(), ...saved.materialPrices },
        electricHistory: Array.isArray(saved.electricHistory)
          ? saved.electricHistory
          : [],
        printers: (saved.printers || base.printers).map((printer) => ({
          speedLevel: 0,
          durabilityLevel: 0,
          efficiencyLevel: 0,
          ...printer,
        })),
        paused: false,
      };
    } catch {
      return freshState();
    }
  };

  let state = readSave();
  let toastTimeout;
  let printerShopView = "buy";
  let operationsView = "queue";
  const $ = (selector) => document.querySelector(selector);
  const nodes = {
    cash: $("[data-cash]"),
    day: $("[data-day]"),
    reputation: $("[data-reputation]"),
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
    toast: $("[data-toast]"),
  };

  const money = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: value < 10 ? 2 : 0,
    }).format(value);
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
  const effectiveSpeed = (printer) =>
    PRINTER_TYPES[printer.typeId].speed * (1 + printer.speedLevel * 0.12);
  const effectiveWear = (printer) =>
    PRINTER_TYPES[printer.typeId].wearPerDay *
    Math.max(0.4, 1 - printer.durabilityLevel * 0.15);
  const effectivePower = (printer) =>
    PRINTER_TYPES[printer.typeId].powerPerDay *
    Math.max(0.4, 1 - printer.efficiencyLevel * 0.15);
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
  const printerStatus = (printer) => {
    if (printer.health <= 0) return "Broken down";
    const job = state.queue.find((candidate) => candidate.id === printer.jobId);
    return job ? `Printing ${job.name}` : "Idle";
  };
  const healthColor = (health) =>
    health <= 0
      ? "var(--game-red)"
      : health < 35
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

  const notify = (message) => {
    nodes.toast.textContent = message;
    nodes.toast.classList.add("is-visible");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => nodes.toast.classList.remove("is-visible"), 2600);
  };

  const activity = (message) => {
    nodes.activity.textContent = message;
  };

  const save = () => {
    try {
      state.lastSaved = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      // The game remains playable if browser storage is unavailable.
    }
  };

  const randomOrder = (rare = false, forceFleetMatch = false) => {
    const supportedMaterials = new Set(
      state.printers.flatMap((printer) => PRINTER_TYPES[printer.typeId].materials)
    );
    const fleetFriendlyTemplates = ORDER_TEMPLATES.filter((template) =>
      template.materials.some((materialId) => supportedMaterials.has(materialId))
    );
    const favorFleet =
      forceFleetMatch || Math.random() < (rare ? 0.92 : 0.84);
    const templatePool =
      favorFleet && fleetFriendlyTemplates.length
        ? fleetFriendlyTemplates
        : ORDER_TEMPLATES;
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
    const reputationBonus = 1 + Math.min(state.reputation, 120) / 700;
    const materialPremium =
      1 + (MATERIALS[materialId].basePrice - MATERIALS.PLA.basePrice) / 75;
    const hours = round(template.hours * demand, 1);
    const printDays = hours / 24;
    const deadlineDays = round(
      printDays + (rare ? 0.08 + Math.random() * 0.1 : 0.18 + Math.random() * 0.28),
      2
    );
    return {
      id: `order-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: template.name,
      materialId,
      material: round(template.kg * demand, 2),
      hours,
      payout: Math.round(
        template.payout * demand * reputationBonus * materialPremium * (rare ? 1.7 : 1)
      ),
      color: rare ? "#ff6d76" : template.color,
      deadlineDays,
      rare,
      offerExpiresAt: gameTime() + (rare ? 0.16 : 0.42),
    };
  };

  const addOrder = (rare = false, silent = false, forceFleetMatch = false) => {
    if (state.orders.length >= 6) return;
    const order = randomOrder(rare, forceFleetMatch);
    state.orders.push(order);
    if (!silent) {
      activity(
        rare
          ? `After-hours rush request: ${order.name} in ${order.materialId}.`
          : `A new ${order.materialId} order arrived: ${order.name}.`
      );
      if (rare) notify("Rare after-hours rush job");
    }
  };

  const seedOrders = () => {
    state.orders = [];
    addOrder(false, true, true);
    addOrder(false, true, true);
    addOrder(false, true, true);
    state.nextOrderAt = gameTime() + 0.045;
  };

  const maybeGenerateOrders = () => {
    const now = gameTime();
    const beforeCount = state.orders.length;
    state.orders = state.orders.filter((order) => order.offerExpiresAt > now);
    if (state.orders.length < beforeCount) {
      activity("An unclaimed quote request expired.");
    }
    if (now < state.nextOrderAt) return;

    if (isBusinessHours()) {
      addOrder(false);
      state.nextOrderAt = now + 0.045 + Math.random() * 0.055;
    } else {
      if (Math.random() < 0.045) addOrder(true);
      state.nextOrderAt = now + 0.12;
    }
  };

  const assignJobs = () => {
    state.queue
      .filter((job) => !job.printerId)
      .forEach((job) => {
        const printer = state.printers.find(
          (candidate) =>
            !candidate.jobId &&
            candidate.health > 0 &&
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
    if (
      !window.confirm(
        `Sell ${printer.name} for ${money(value)}?${warning}`
      )
    ) {
      return;
    }
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
  };

  const repairPrinter = (printerId) => {
    const printer = state.printers.find((candidate) => candidate.id === printerId);
    if (!printer || printer.health >= 100) return;
    const type = PRINTER_TYPES[printer.typeId];
    spend(type.repair, `${printer.name} repaired to 100% health.`, () => {
      printer.health = 100;
      assignJobs();
    });
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
      state.reputation = late
        ? Math.max(0, state.reputation - 3)
        : state.reputation + Math.max(1, Math.round(payment / 85));
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
    $("[data-final-days]").textContent = `${state.day} day${state.day === 1 ? "" : "s"}`;
    $("[data-final-jobs]").textContent =
      `${state.totalCompleted} job${state.totalCompleted === 1 ? "" : "s"}`;
    $("[data-final-revenue]").textContent = money(state.revenue);
    save();
    if (!nodes.bankruptcyDialog.open) nodes.bankruptcyDialog.showModal();
  };

  const collectMonthlyBills = () => {
    const rent = monthlyRent();
    const electricity = state.monthlyElectric;
    const total = round(rent + electricity, 2);
    state.cash = round(state.cash - total, 2);
    state.expenses = round(state.expenses + total, 2);
    state.monthlyElectric = 0;
    updateMaterialMarket();
    activity(
      `Monthly bills paid: ${money(rent)} rent and ${money(electricity)} electricity.`
    );
    notify(`30-day bills paid · −${money(total)}`);
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
    if (closingDay % BILLING_CYCLE_DAYS === 0) collectMonthlyBills();
    save();
  };

  const handleBreakdown = (printer, job) => {
    printer.health = 0;
    printer.jobId = null;
    if (job) job.printerId = null;
    state.reputation = Math.max(0, state.reputation - 1);
    activity(`${printer.name} broke down. Its job is paused until a repair is made.`);
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

    assignJobs();
    state.printers.forEach((printer) => {
      if (!printer.jobId || printer.health <= 0) return;
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
        ? "<strong>No open requests</strong><span>Another customer may arrive soon.</span>"
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
      headingWrap.append(category, title);
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
      card.append(head, visual, meta, actions);
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
        `${printer.health <= 0 ? " is-broken" : ""}`;
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
        printer.health <= 0
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
    Object.entries(MATERIALS).forEach(([id, material]) => {
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
      const type = PRINTER_TYPES[printer.typeId];
      const row = document.createElement("div");
      row.className = `fleet-row${printer.health <= 0 ? " is-broken" : ""}`;
      const head = document.createElement("div");
      head.className = "fleet-row-head";
      const name = document.createElement("strong");
      name.textContent = printer.name;
      const status = document.createElement("small");
      status.textContent =
        `${printerStatus(printer)} · ${effectiveSpeed(printer).toFixed(2)}× speed · ` +
        `${printer.speedLevel + printer.durabilityLevel + printer.efficiencyLevel}/9 upgrades`;
      head.append(name, status);
      const button = document.createElement("button");
      button.type = "button";
      button.textContent =
        printer.health >= 100 ? "Healthy" : `Repair ${money(type.repair)}`;
      button.disabled = printer.health >= 100 || state.gameOver;
      button.addEventListener("click", () => repairPrinter(printer.id));
      const health = document.createElement("div");
      health.className = "fleet-health";
      const track = document.createElement("span");
      track.style.setProperty("--health", `${printer.health}%`);
      track.style.setProperty("--health-color", healthColor(printer.health));
      track.append(document.createElement("i"));
      const value = document.createElement("b");
      value.textContent = `${Math.round(printer.health)}% maint.`;
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
    const broken = state.printers.filter((printer) => printer.health <= 0).length;
    nodes.operationsQueue.append(
      createOperationsSummary([
        { label: "Active jobs", value: String(active), note: "Printing now" },
        { label: "Waiting jobs", value: String(waiting), note: "Awaiting a machine" },
        { label: "Queue use", value: `${state.queue.length}/${queueCapacity()}`, note: "Accepted work" },
        { label: "Broken printers", value: String(broken), note: "Require repair" },
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
      row.className = `operations-list-row${printer.health <= 0 ? " is-blocked" : ""}`;
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = printer.name;
      const detail = document.createElement("span");
      detail.textContent =
        printer.health <= 0
          ? "Broken down · repair required"
          : job
            ? `${job.name} · ${job.materialId} · ${Math.round(job.progress * 100)}%`
            : `Idle · accepts ${type.materials.join(", ")}`;
      copy.append(title, detail);
      const status = document.createElement("b");
      status.textContent =
        printer.health <= 0
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
      .filter((printer) => printer.jobId && printer.health > 0)
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
        { label: "Cash after bill", value: money(state.cash - rent - electricity), note: "If paid now" },
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

  const renderGoal = () => {
    const compatibleMaterials = new Set(
      state.printers.flatMap((printer) => PRINTER_TYPES[printer.typeId].materials)
    ).size;
    const goals = [
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
    const broken = state.printers.filter((printer) => printer.health <= 0).length;

    nodes.cash.textContent = money(state.cash);
    nodes.cash.style.color = state.cash < 0 ? "var(--game-red)" : "";
    nodes.day.textContent = state.day;
    nodes.reputation.textContent = state.reputation;
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
    setPrinterShopView(printerShopView);
    renderGoal();
  };

  $("[data-quick-order]").addEventListener("click", () => {
    const available = state.orders
      .filter(
        (order) =>
          compatiblePrinterOwned(order.materialId) &&
          state.materials[order.materialId] >= order.material
      )
      .sort((a, b) => b.payout / b.hours - a.payout / a.hours);
    if (!available.length) {
      notify("No available order matches your printers and material inventory.");
      return;
    }
    acceptOrder(available[0].id);
  });

  nodes.pause.addEventListener("click", () => {
    if (state.gameOver) return;
    state.paused = !state.paused;
    activity(state.paused ? "Production paused." : "Production resumed.");
    render();
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

  const startNewGame = () => {
    state = freshState();
    seedOrders();
    activity("New shop opened. Business hours are 8 AM–6 PM.");
    if (nodes.bankruptcyDialog.open) nodes.bankruptcyDialog.close();
    render();
    save();
  };

  $("[data-reset]").addEventListener("click", () => {
    if (!window.confirm("Start a new print shop? Your current progress will be erased.")) return;
    startNewGame();
  });
  $("[data-restart]").addEventListener("click", startNewGame);

  if (!state.orders.length && !state.gameOver) seedOrders();
  assignJobs();
  render();

  if (state.gameOver) {
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
