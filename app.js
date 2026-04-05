const SPRINTS = [
  { label: "Sprint 1", quarter: "Q1" },
  { label: "Sprint 2", quarter: "Q1" },
  { label: "Sprint 3", quarter: "Q2" },
  { label: "Sprint 4", quarter: "Q2" },
  { label: "Sprint 5", quarter: "Q3" },
  { label: "Sprint 6", quarter: "Q3" },
  { label: "Sprint 7", quarter: "Q4" },
  { label: "Sprint 8", quarter: "Q4" },
];

const SPRINT_CAPACITY = 10;

const state = {
  items: [
    {
      id: "req-1",
      title: "Add approval workflows",
      type: "feature",
      businessValue: 33.6,
      effort: 8,
      reach: 8,
      impact: 4.2,
      confidence: 0.8,
      dependencies: ["req-4", "req-5"],
    },
    {
      id: "req-2",
      title: "Fix stale dashboard metrics",
      type: "bug",
      businessValue: 19,
      effort: 3,
      reach: 7,
      impact: 4.5,
      confidence: 0.92,
      dependencies: [],
    },
    {
      id: "req-3",
      title: "Refactor permissions service",
      type: "tech debt",
      businessValue: 14,
      effort: 5,
      reach: 5,
      impact: 3.4,
      confidence: 0.72,
      dependencies: ["req-5"],
    },
    {
      id: "req-4",
      title: "RBAC policy templates",
      type: "feature",
      businessValue: 18,
      effort: 5,
      reach: 6,
      impact: 3.8,
      confidence: 0.85,
      dependencies: [],
    },
    {
      id: "req-5",
      title: "Audit log hardening",
      type: "tech debt",
      businessValue: 16,
      effort: 4,
      reach: 5,
      impact: 3.7,
      confidence: 0.88,
      dependencies: [],
    },
    {
      id: "req-6",
      title: "Vendor SLA alerts",
      type: "feature",
      businessValue: 21,
      effort: 6,
      reach: 7,
      impact: 3.9,
      confidence: 0.74,
      dependencies: ["req-2"],
    },
  ],
  selectedId: "req-1",
  scenario: {
    itemId: "",
    delay: 0,
  },
  currentSchedule: null,
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  render();
});

function cacheElements() {
  elements.requestForm = document.getElementById("requestForm");
  elements.dependencies = document.getElementById("dependencies");
  elements.backlogTable = document.getElementById("backlogTable");
  elements.portfolioSummary = document.getElementById("portfolioSummary");
  elements.highlightCard = document.getElementById("highlightCard");
  elements.riceMatrix = document.getElementById("riceMatrix");
  elements.scenarioItem = document.getElementById("scenarioItem");
  elements.scenarioDelay = document.getElementById("scenarioDelay");
  elements.scenarioImpact = document.getElementById("scenarioImpact");
  elements.roadmap = document.getElementById("roadmap");
  elements.storiesSummary = document.getElementById("storiesSummary");
  elements.storyList = document.getElementById("storyList");
  elements.exportOutput = document.getElementById("exportOutput");
  elements.copyExport = document.getElementById("copyExport");
  elements.downloadExport = document.getElementById("downloadExport");
}

function bindEvents() {
  elements.requestForm.addEventListener("submit", handleAddRequest);
  elements.scenarioItem.addEventListener("change", handleScenarioChange);
  elements.scenarioDelay.addEventListener("change", handleScenarioChange);
  document.querySelectorAll("[data-export]").forEach((button) => {
    button.addEventListener("click", () => {
      renderExport(button.dataset.export, state.currentSchedule || schedulePortfolio(state.items).schedule);
    });
  });
  elements.copyExport.addEventListener("click", copyExportText);
  elements.downloadExport.addEventListener("click", downloadExportText);
  document.getElementById("resetScenario").addEventListener("click", () => {
    state.scenario = { itemId: "", delay: 0 };
    render();
  });
}

function handleAddRequest(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const title = String(formData.get("title") || "").trim();
  if (!title) {
    return;
  }

  const item = {
    id: `req-${Date.now()}`,
    title,
    type: String(formData.get("type")),
    businessValue: Number(formData.get("businessValue")),
    effort: Number(formData.get("effort")),
    reach: Number(formData.get("reach")),
    impact: Number(formData.get("impact")),
    confidence: Number(formData.get("confidence")),
    dependencies: Array.from(elements.dependencies.selectedOptions).map((option) => option.value),
  };

  state.items.push(item);
  state.selectedId = item.id;
  event.currentTarget.reset();
  document.getElementById("businessValue").value = 24;
  document.getElementById("effort").value = 5;
  document.getElementById("reach").value = 6;
  document.getElementById("impact").value = 3.8;
  document.getElementById("confidence").value = 0.8;
  render();
}

function handleScenarioChange() {
  state.scenario = {
    itemId: elements.scenarioItem.value,
    delay: Number(elements.scenarioDelay.value),
  };
  render();
}

function render() {
  updateDependencyOptions();

  const scenarioMap = state.scenario.itemId && state.scenario.delay > 0
    ? { [state.scenario.itemId]: state.scenario.delay }
    : {};

  const baseline = schedulePortfolio(state.items);
  const scenario = schedulePortfolio(state.items, scenarioMap);
  state.currentSchedule = scenario.schedule;

  renderBacklogTable(scenario.schedule);
  renderPortfolioSummary(scenario.schedule);
  renderHighlightCard(scenario.schedule);
  renderMatrix(scenario.schedule);
  renderScenarioOptions();
  renderScenarioImpact(baseline.schedule, scenario.schedule);
  renderRoadmap(scenario.schedule);
  renderGeneratedArtifacts(scenario.schedule);
  renderExport(elements.exportOutput.dataset.format || "jira", scenario.schedule);
}

function updateDependencyOptions() {
  const options = state.items
    .filter((item) => item.id !== state.selectedId)
    .map(
      (item) => `<option value="${item.id}">${item.title}</option>`
    )
    .join("");

  elements.dependencies.innerHTML = options;
}

function renderScenarioOptions() {
  const itemOptions = ['<option value="">Select a backlog item</option>']
    .concat(
      state.items.map(
        (item) => `<option value="${item.id}" ${item.id === state.scenario.itemId ? "selected" : ""}>${item.title}</option>`
      )
    )
    .join("");

  elements.scenarioItem.innerHTML = itemOptions;
  elements.scenarioDelay.value = String(state.scenario.delay);
}

function renderBacklogTable(schedule) {
  const rows = [...state.items]
    .sort((left, right) => getRiceScore(right) - getRiceScore(left))
    .map((item) => {
      const placement = schedule[item.id];
      const isActive = item.id === state.selectedId ? "active-row" : "";
      return `
        <tr class="${isActive}" data-id="${item.id}">
          <td>${item.title}</td>
          <td><span class="tag ${cssType(item.type)}">${item.type}</span></td>
          <td>${item.dependencies.length}</td>
          <td>${getRiceScore(item).toFixed(1)}</td>
          <td>${getROI(item).toFixed(1)}x</td>
          <td>${placement.deliveryQuarter}</td>
          <td>${getRisk(item)}</td>
        </tr>
      `;
    })
    .join("");

  elements.backlogTable.innerHTML = rows;
  elements.backlogTable.querySelectorAll("tr").forEach((row) => {
    row.addEventListener("click", () => {
      state.selectedId = row.dataset.id;
      render();
    });
  });
}

function renderPortfolioSummary(schedule) {
  const topItems = [...state.items]
    .sort((left, right) => getRiceScore(right) - getRiceScore(left))
    .slice(0, 3);
  const topDelivery = [...new Set(topItems.map((item) => schedule[item.id].deliveryQuarter))].join(", ");
  elements.portfolioSummary.textContent = `${state.items.length} requests · top delivery ${topDelivery}`;
}

function renderHighlightCard(schedule) {
  const selected = state.items.find((item) => item.id === state.selectedId) || state.items[0];
  const placement = schedule[selected.id];

  elements.highlightCard.innerHTML = `
    <h3>${selected.title}</h3>
    <p class="hero-copy">
      Recommended for ${placement.deliveryQuarter} delivery based on value, effort, and dependency readiness.
    </p>
    <div class="metric-grid">
      <div class="metric">
        <span class="label">Delivery</span>
        <strong>${placement.deliveryQuarter}</strong>
      </div>
      <div class="metric">
        <span class="label">ROI</span>
        <strong>${getROI(selected).toFixed(1)}x</strong>
      </div>
      <div class="metric">
        <span class="label">Risk</span>
        <strong>${getRisk(selected)}</strong>
      </div>
      <div class="metric">
        <span class="label">Dependencies</span>
        <strong>${selected.dependencies.length}</strong>
      </div>
    </div>
    <div class="highlight-note">
      <strong>Planner output:</strong> ${SPRINTS[placement.start].label} → ${SPRINTS[placement.end].label}<br />
      Estimated business value: ${formatCurrency(selected.businessValue)} · RICE ${getRiceScore(selected).toFixed(1)}
    </div>
  `;
}

function renderMatrix(schedule) {
  const maxEffort = Math.max(...state.items.map((item) => item.effort), 10);
  elements.riceMatrix.innerHTML = '<div class="axis-label x">Higher effort →</div><div class="axis-label y">↑ Higher impact</div>';

  state.items.forEach((item) => {
    const placement = schedule[item.id];
    const bubble = document.createElement("button");
    bubble.type = "button";
    bubble.className = `bubble ${getRisk(item).toLowerCase()}`;
    bubble.style.left = `${8 + (item.effort / maxEffort) * 74}%`;
    bubble.style.bottom = `${8 + (item.impact / 5) * 72}%`;
    const size = 28 + item.reach * 4;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.title = `${item.title} · RICE ${getRiceScore(item).toFixed(1)} · ${placement.deliveryQuarter}`;
    bubble.textContent = getAbbreviation(item.title);
    bubble.addEventListener("click", () => {
      state.selectedId = item.id;
      render();
    });
    elements.riceMatrix.appendChild(bubble);
  });
}

function renderScenarioImpact(baselineSchedule, scenarioSchedule) {
  if (!state.scenario.itemId || state.scenario.delay === 0) {
    elements.scenarioImpact.innerHTML = `
      <strong>Try a delivery delay.</strong>
      <p class="hero-copy">Pick a request and add a sprint delay to see which dependent items slip on the roadmap.</p>
    `;
    return;
  }

  const selected = state.items.find((item) => item.id === state.scenario.itemId);
  const impacted = state.items.filter((item) => scenarioSchedule[item.id].end > baselineSchedule[item.id].end);

  const itemsMarkup = impacted.length
    ? impacted
        .map((item) => {
          const before = baselineSchedule[item.id];
          const after = scenarioSchedule[item.id];
          return `<li><strong>${item.title}</strong>: ${before.deliveryQuarter} → ${after.deliveryQuarter} (${SPRINTS[after.start].label})</li>`;
        })
        .join("")
    : "<li>No downstream impact detected.</li>";

  elements.scenarioImpact.innerHTML = `
    <strong>Scenario result</strong>
    <p class="hero-copy">
      Delaying <strong>${selected.title}</strong> by ${state.scenario.delay} sprint(s) impacts ${impacted.length} backlog item(s).
    </p>
    <ul class="impact-list">${itemsMarkup}</ul>
  `;
}

function renderRoadmap(schedule) {
  const ordered = [...state.items].sort((left, right) => getRiceScore(right) - getRiceScore(left));
  const sprintHeaders = SPRINTS.map(
    (sprint) => `<div>${sprint.label}<br /><small>${sprint.quarter}</small></div>`
  ).join("");

  const rows = ordered
    .map((item) => {
      const placement = schedule[item.id];
      const duration = placement.end - placement.start + 1;
      const slots = Array.from({ length: SPRINTS.length }, (_, index) => {
        if (index === placement.start) {
          return `<div class="roadmap-bar ${cssType(item.type)}" style="grid-column: ${placement.start + 1} / span ${duration};">${placement.deliveryQuarter}</div>`;
        }
        return placement.start < index && index <= placement.end ? "" : '<div class="roadmap-slot"></div>';
      }).join("");

      return `
        <div class="roadmap-row">
          <div class="roadmap-item-title">
            ${item.title}
            <span>${item.type} · ${getROI(item).toFixed(1)}x ROI</span>
          </div>
          <div class="roadmap-lane">${slots}</div>
        </div>
      `;
    })
    .join("");

  elements.roadmap.innerHTML = `
    <div class="roadmap-header">
      <div>Backlog item</div>
      <div class="roadmap-sprints">${sprintHeaders}</div>
    </div>
    ${rows}
  `;
}

function renderGeneratedArtifacts(schedule) {
  const topItems = [...state.items]
    .sort((left, right) => getRiceScore(right) - getRiceScore(left))
    .slice(0, 4);

  const stories = topItems.flatMap((item) => generateStories(item, schedule[item.id]));
  elements.storiesSummary.innerHTML = `
    <strong>${stories.length} generated user stories</strong><br />
    Acceptance criteria, sprint assignments, and outcome framing for the top four roadmap candidates.
  `;

  elements.storyList.innerHTML = stories
    .map(
      (story) => `
        <article class="story-card">
          <h4>${story.summary}</h4>
          <p><strong>Sprint:</strong> ${story.sprint}</p>
          <p>${story.description}</p>
          <ul>${story.acceptanceCriteria.map((criterion) => `<li>${criterion}</li>`).join("")}</ul>
        </article>
      `
    )
    .join("");
}

function renderExport(format = "jira", schedule = schedulePortfolio(state.items).schedule) {
  elements.exportOutput.dataset.format = format;
  const exportText = format === "jira"
    ? buildJiraExport(schedule)
    : buildConfluenceExport(schedule);
  elements.exportOutput.textContent = exportText;
}

async function copyExportText() {
  const text = elements.exportOutput.textContent;
  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    elements.exportOutput.textContent = `${text}\n\n[Copied to clipboard]`;
  } catch {
    elements.exportOutput.textContent = `${text}\n\n[Clipboard access unavailable in this browser context.]`;
  }
}

function downloadExportText() {
  const format = elements.exportOutput.dataset.format || "jira";
  const blob = new Blob([elements.exportOutput.textContent], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `backlog-export-${format}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function schedulePortfolio(items, delays = {}) {
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const sprintLoad = Array(SPRINTS.length).fill(0);
  const schedule = {};
  const visiting = new Set();
  const ordered = [...items].sort((left, right) => getRiceScore(right) - getRiceScore(left));

  function placeItem(item) {
    if (!item) {
      return { start: 0, end: 0, deliveryQuarter: "Q1" };
    }
    if (schedule[item.id]) {
      return schedule[item.id];
    }
    if (visiting.has(item.id)) {
      return schedule[item.id] || { start: 0, end: 0, deliveryQuarter: "Q1" };
    }

    visiting.add(item.id);

    const dependencyPlacements = item.dependencies.map((dependencyId) => placeItem(itemMap.get(dependencyId)));
    let earliestStart = dependencyPlacements.length
      ? Math.max(...dependencyPlacements.map((placement) => placement.end + 1))
      : 0;

    earliestStart += Number(delays[item.id] || 0);

    const duration = Math.max(1, Math.ceil(item.effort / 5));
    let start = earliestStart;
    const loadPerSprint = item.effort / duration;

    while (start + duration <= SPRINTS.length) {
      let fits = true;
      for (let sprintIndex = start; sprintIndex < start + duration; sprintIndex += 1) {
        if (sprintLoad[sprintIndex] + loadPerSprint > SPRINT_CAPACITY) {
          fits = false;
          start = sprintIndex + 1;
          break;
        }
      }
      if (fits) {
        break;
      }
    }

    if (start + duration > SPRINTS.length) {
      start = Math.max(0, SPRINTS.length - duration);
    }

    for (let sprintIndex = start; sprintIndex < start + duration; sprintIndex += 1) {
      sprintLoad[sprintIndex] += loadPerSprint;
    }

    const end = Math.min(SPRINTS.length - 1, start + duration - 1);
    const placement = {
      start,
      end,
      deliveryQuarter: SPRINTS[end].quarter,
    };
    schedule[item.id] = placement;
    visiting.delete(item.id);
    return placement;
  }

  ordered.forEach((item) => placeItem(item));
  return { schedule, sprintLoad };
}

function generateStories(item, placement) {
  const sprintLabel = `${SPRINTS[placement.start].label}${placement.end > placement.start ? `–${SPRINTS[placement.end].label}` : ""}`;
  return [
    {
      summary: `${item.title} · Configuration story`,
      sprint: sprintLabel,
      description: `As a product owner, I want ${item.title.toLowerCase()} configurable so that teams can adopt it without engineering support.`,
      acceptanceCriteria: [
        `${item.title} can be enabled through an admin setting.`,
        `Changes are validated before publish and logged for audit review.`,
        `Success metrics are visible for the owning stakeholder.`
      ],
    },
    {
      summary: `${item.title} · User workflow story`,
      sprint: sprintLabel,
      description: `As an end user, I want ${item.title.toLowerCase()} integrated into my normal journey so that delivery friction is reduced.`,
      acceptanceCriteria: [
        `Primary journey is available within two clicks from the core flow.`,
        `Edge cases present clear error or fallback messaging.`,
        `The experience meets the baseline accessibility checklist.`
      ],
    },
    {
      summary: `${item.title} · Reporting story`,
      sprint: sprintLabel,
      description: `As an operations lead, I want reporting for ${item.title.toLowerCase()} so that rollout risk stays visible sprint by sprint.`,
      acceptanceCriteria: [
        `Key outcome metrics are reported by sprint.`,
        `Exceptions trigger a follow-up action or alert.`,
        `The team can review adoption and incident trends in the sprint demo.`
      ],
    },
  ];
}

function buildJiraExport(schedule) {
  const topItems = [...state.items]
    .sort((left, right) => getRiceScore(right) - getRiceScore(left))
    .slice(0, 4);
  const stories = topItems.flatMap((item) => generateStories(item, schedule[item.id]));

  const lines = [
    "EPIC: Stakeholder-Aligned Feature Delivery Simulator",
    "Summary: Delivery-ready backlog export with RICE ranking, dependencies, and sprint assignment.",
    "",
  ];

  stories.forEach((story, index) => {
    lines.push(`STORY-${index + 1}: ${story.summary}`);
    lines.push(`Sprint: ${story.sprint}`);
    lines.push(`Description: ${story.description}`);
    lines.push(`Acceptance Criteria:`);
    story.acceptanceCriteria.forEach((criterion) => lines.push(`- ${criterion}`));
    lines.push("");
  });

  return lines.join("\n");
}

function buildConfluenceExport(schedule) {
  const topItems = [...state.items]
    .sort((left, right) => getRiceScore(right) - getRiceScore(left))
    .slice(0, 4);

  const lines = [
    "h1. Stakeholder-Aligned Feature Delivery Simulator",
    "",
    "|| Request || Type || RICE || ROI || Delivery || Risk ||",
  ];

  topItems.forEach((item) => {
    const placement = schedule[item.id];
    lines.push(`| ${item.title} | ${item.type} | ${getRiceScore(item).toFixed(1)} | ${getROI(item).toFixed(1)}x | ${placement.deliveryQuarter} | ${getRisk(item)} |`);
  });

  lines.push("");
  lines.push("h2. Planning notes");
  lines.push("* RICE score favors high-impact, high-confidence items with manageable effort.");
  lines.push("* Dependencies are respected before start sprint assignment.");
  lines.push("* What-if delays automatically surface downstream slips.");

  return lines.join("\n");
}

function getRiceScore(item) {
  return (item.reach * item.impact * item.confidence) / item.effort;
}

function getROI(item) {
  return item.businessValue / item.effort;
}

function getRisk(item) {
  if (item.confidence >= 0.8 && item.dependencies.length <= 2) {
    return "Low";
  }
  if (item.confidence >= 0.65 && item.dependencies.length <= 3) {
    return "Medium";
  }
  return "High";
}

function getAbbreviation(title) {
  return title
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function formatCurrency(value) {
  return `$${value.toFixed(1)}k`;
}

function cssType(type) {
  return type.replace(/\s+/g, "-");
}
