import { useMemo, useState } from 'react';

const SPRINTS = [
  { label: 'Sprint 1', quarter: 'Q1' },
  { label: 'Sprint 2', quarter: 'Q1' },
  { label: 'Sprint 3', quarter: 'Q2' },
  { label: 'Sprint 4', quarter: 'Q2' },
  { label: 'Sprint 5', quarter: 'Q3' },
  { label: 'Sprint 6', quarter: 'Q3' },
  { label: 'Sprint 7', quarter: 'Q4' },
  { label: 'Sprint 8', quarter: 'Q4' },
];

const SPRINT_CAPACITY = 10;

const initialItems = [
  {
    id: 'req-1',
    title: 'Add approval workflows',
    type: 'feature',
    businessValue: 33.6,
    effort: 8,
    reach: 8,
    impact: 4.2,
    confidence: 0.8,
    dependencies: ['req-4', 'req-5'],
  },
  {
    id: 'req-2',
    title: 'Fix stale dashboard metrics',
    type: 'bug',
    businessValue: 19,
    effort: 3,
    reach: 7,
    impact: 4.5,
    confidence: 0.92,
    dependencies: [],
  },
  {
    id: 'req-3',
    title: 'Refactor permissions service',
    type: 'tech debt',
    businessValue: 14,
    effort: 5,
    reach: 5,
    impact: 3.4,
    confidence: 0.72,
    dependencies: ['req-5'],
  },
  {
    id: 'req-4',
    title: 'RBAC policy templates',
    type: 'feature',
    businessValue: 18,
    effort: 5,
    reach: 6,
    impact: 3.8,
    confidence: 0.85,
    dependencies: [],
  },
  {
    id: 'req-5',
    title: 'Audit log hardening',
    type: 'tech debt',
    businessValue: 16,
    effort: 4,
    reach: 5,
    impact: 3.7,
    confidence: 0.88,
    dependencies: [],
  },
  {
    id: 'req-6',
    title: 'Vendor SLA alerts',
    type: 'feature',
    businessValue: 21,
    effort: 6,
    reach: 7,
    impact: 3.9,
    confidence: 0.74,
    dependencies: ['req-2'],
  },
];

const defaultForm = {
  title: '',
  type: 'feature',
  businessValue: 24,
  effort: 5,
  reach: 6,
  impact: 3.8,
  confidence: 0.8,
  dependencies: [],
};

export default function App() {
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState(initialItems[0].id);
  const [scenario, setScenario] = useState({ itemId: '', delay: 0 });
  const [exportFormat, setExportFormat] = useState('jira');
  const [form, setForm] = useState(defaultForm);
  const [notice, setNotice] = useState('');

  const rankedItems = useMemo(
    () => [...items].sort((left, right) => getRiceScore(right) - getRiceScore(left)),
    [items]
  );

  const baseline = useMemo(() => schedulePortfolio(items), [items]);
  const scenarioMap = useMemo(
    () => (scenario.itemId && scenario.delay > 0 ? { [scenario.itemId]: scenario.delay } : {}),
    [scenario]
  );
  const current = useMemo(() => schedulePortfolio(items, scenarioMap), [items, scenarioMap]);

  const selected = items.find((item) => item.id === selectedId) || rankedItems[0];
  const topItems = rankedItems.slice(0, 4);
  const stories = topItems.flatMap((item) => generateStories(item, current.schedule[item.id]));
  const exportText =
    exportFormat === 'jira'
      ? buildJiraExport(topItems, current.schedule)
      : buildConfluenceExport(topItems, current.schedule);

  const portfolioSummary = `${items.length} requests · top delivery ${[
    ...new Set(topItems.map((item) => current.schedule[item.id].deliveryQuarter)),
  ].join(', ')}`;

  const impactedItems = items.filter(
    (item) => current.schedule[item.id].end > baseline.schedule[item.id].end
  );

  function handleInputChange(event) {
    const { name, value, multiple, selectedOptions } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: multiple
        ? Array.from(selectedOptions, (option) => option.value)
        : ['businessValue', 'effort', 'reach', 'impact', 'confidence'].includes(name)
          ? Number(value)
          : value,
    }));
  }

  function handleAddRequest(event) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) {
      return;
    }

    const item = {
      id: `req-${Date.now()}`,
      title,
      type: form.type,
      businessValue: Number(form.businessValue),
      effort: Number(form.effort),
      reach: Number(form.reach),
      impact: Number(form.impact),
      confidence: Number(form.confidence),
      dependencies: form.dependencies,
    };

    setItems((currentItems) => [...currentItems, item]);
    setSelectedId(item.id);
    setForm(defaultForm);
    setNotice(`Added "${item.title}" to the backlog.`);
  }

  async function copyExportText() {
    try {
      await navigator.clipboard.writeText(exportText);
      setNotice('Export copied to clipboard.');
    } catch {
      setNotice('Clipboard access is unavailable in this browser context.');
    }
  }

  function downloadExportText() {
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backlog-export-${exportFormat}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`Downloaded ${exportFormat.toUpperCase()} export.`);
  }

  return (
    <>
      <header className="hero">
        <div>
          <p className="eyebrow">Project 2 · Product Backlog Prioritization Tool</p>
          <h1>Stakeholder-Aligned Feature Delivery Simulator</h1>
          <p className="hero-copy">
            Prioritize stakeholder requests with RICE scoring, delivery forecasting,
            dependency-aware planning, and ready-to-share Jira/Confluence exports.
          </p>
        </div>
        <div className="hero-badges">
          <span>⚖️ Interactive RICE matrix</span>
          <span>🗺️ Gantt-style roadmap</span>
          <span>📋 Auto-generated user stories</span>
        </div>
      </header>

      <main className="container">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Request intake</p>
              <h2>Add stakeholder request</h2>
            </div>
            <div className="pill">React + Vite version</div>
          </div>

          <form className="request-form" onSubmit={handleAddRequest}>
            <label>
              Feature / request title
              <input
                name="title"
                type="text"
                value={form.title}
                onChange={handleInputChange}
                placeholder="Add approval workflows"
                required
              />
            </label>

            <label>
              Work type
              <select name="type" value={form.type} onChange={handleInputChange}>
                <option value="feature">Feature</option>
                <option value="bug">Bug</option>
                <option value="tech debt">Tech debt</option>
              </select>
            </label>

            <label>
              Business value ($k)
              <input name="businessValue" type="number" min="1" step="0.1" value={form.businessValue} onChange={handleInputChange} />
            </label>

            <label>
              Effort (story points)
              <input name="effort" type="number" min="1" max="13" value={form.effort} onChange={handleInputChange} />
            </label>

            <label>
              Reach (1–10)
              <input name="reach" type="number" min="1" max="10" value={form.reach} onChange={handleInputChange} />
            </label>

            <label>
              Impact (1–5)
              <input name="impact" type="number" min="1" max="5" step="0.1" value={form.impact} onChange={handleInputChange} />
            </label>

            <label>
              Confidence (0.1–1.0)
              <input name="confidence" type="number" min="0.1" max="1" step="0.01" value={form.confidence} onChange={handleInputChange} />
            </label>

            <label className="full-span">
              Dependencies
              <select
                name="dependencies"
                multiple
                value={form.dependencies}
                onChange={handleInputChange}
              >
                {items
                  .filter((item) => item.id !== selectedId)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
              </select>
              <small>Hold Ctrl / Cmd to select multiple predecessor requests.</small>
            </label>

            <button className="primary-button" type="submit">
              Add to backlog
            </button>
          </form>
        </section>

        <section className="grid two-column">
          <div className="panel">
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">Portfolio view</p>
                <h2>Prioritized backlog</h2>
              </div>
              <div className="summary-chip">{portfolioSummary}</div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Type</th>
                    <th>Deps</th>
                    <th>RICE</th>
                    <th>ROI</th>
                    <th>Delivery</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedItems.map((item) => (
                    <tr
                      key={item.id}
                      className={item.id === selectedId ? 'active-row' : ''}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <td>{item.title}</td>
                      <td>
                        <span className={`tag ${cssType(item.type)}`}>{item.type}</span>
                      </td>
                      <td>{item.dependencies.length}</td>
                      <td>{getRiceScore(item).toFixed(1)}</td>
                      <td>{getROI(item).toFixed(1)}x</td>
                      <td>{current.schedule[item.id].deliveryQuarter}</td>
                      <td>{getRisk(item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel emphasis">
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">Recommended next bet</p>
                <h2>Executive summary</h2>
              </div>
            </div>

            {selected && (
              <div>
                <h3>{selected.title}</h3>
                <p className="hero-copy">
                  Recommended for {current.schedule[selected.id].deliveryQuarter} delivery based on value,
                  effort, and dependency readiness.
                </p>
                <div className="metric-grid">
                  <div className="metric">
                    <span className="label">Delivery</span>
                    <strong>{current.schedule[selected.id].deliveryQuarter}</strong>
                  </div>
                  <div className="metric">
                    <span className="label">ROI</span>
                    <strong>{getROI(selected).toFixed(1)}x</strong>
                  </div>
                  <div className="metric">
                    <span className="label">Risk</span>
                    <strong>{getRisk(selected)}</strong>
                  </div>
                  <div className="metric">
                    <span className="label">Dependencies</span>
                    <strong>{selected.dependencies.length}</strong>
                  </div>
                </div>
                <div className="highlight-note">
                  <strong>Planner output:</strong> {SPRINTS[current.schedule[selected.id].start].label} →{' '}
                  {SPRINTS[current.schedule[selected.id].end].label}
                  <br />
                  Estimated business value: {formatCurrency(selected.businessValue)} · RICE{' '}
                  {getRiceScore(selected).toFixed(1)}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="grid two-column">
          <div className="panel">
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">Scoring</p>
                <h2>RICE prioritization matrix</h2>
              </div>
            </div>
            <div className="matrix-legend">
              <span><strong>X:</strong> Effort</span>
              <span><strong>Y:</strong> Impact</span>
              <span><strong>Bubble size:</strong> Reach</span>
            </div>
            <div className="matrix">
              <div className="axis-label x">Higher effort →</div>
              <div className="axis-label y">↑ Higher impact</div>
              {items.map((item) => {
                const maxEffort = Math.max(...items.map((currentItem) => currentItem.effort), 10);
                const size = 28 + item.reach * 4;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`bubble ${getRisk(item).toLowerCase()}`}
                    style={{
                      left: `${8 + (item.effort / maxEffort) * 74}%`,
                      bottom: `${8 + (item.impact / 5) * 72}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                    }}
                    title={`${item.title} · RICE ${getRiceScore(item).toFixed(1)} · ${current.schedule[item.id].deliveryQuarter}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    {getAbbreviation(item.title)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">Scenario planning</p>
                <h2>What-if planner</h2>
              </div>
            </div>

            <div className="scenario-form">
              <label>
                Delay this request
                <select
                  value={scenario.itemId}
                  onChange={(event) => setScenario((currentScenario) => ({ ...currentScenario, itemId: event.target.value }))}
                >
                  <option value="">Select a backlog item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                By how many sprints?
                <select
                  value={scenario.delay}
                  onChange={(event) => setScenario((currentScenario) => ({ ...currentScenario, delay: Number(event.target.value) }))}
                >
                  <option value={0}>No delay</option>
                  <option value={1}>1 sprint</option>
                  <option value={2}>2 sprints</option>
                  <option value={3}>3 sprints</option>
                </select>
              </label>

              <button className="secondary-button" type="button" onClick={() => setScenario({ itemId: '', delay: 0 })}>
                Reset scenario
              </button>
            </div>

            <div className="scenario-impact">
              {!scenario.itemId || scenario.delay === 0 ? (
                <>
                  <strong>Try a delivery delay.</strong>
                  <p className="hero-copy">
                    Pick a request and add a sprint delay to see which dependent items slip on the roadmap.
                  </p>
                </>
              ) : (
                <>
                  <strong>Scenario result</strong>
                  <p className="hero-copy">
                    Delaying <strong>{items.find((item) => item.id === scenario.itemId)?.title}</strong> by{' '}
                    {scenario.delay} sprint(s) impacts {impactedItems.length} backlog item(s).
                  </p>
                  <ul className="impact-list">
                    {impactedItems.length === 0 ? (
                      <li>No downstream impact detected.</li>
                    ) : (
                      impactedItems.map((item) => (
                        <li key={item.id}>
                          <strong>{item.title}</strong>: {baseline.schedule[item.id].deliveryQuarter} →{' '}
                          {current.schedule[item.id].deliveryQuarter} ({SPRINTS[current.schedule[item.id].start].label})
                        </li>
                      ))
                    )}
                  </ul>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading compact">
            <div>
              <p className="section-kicker">Delivery plan</p>
              <h2>Gantt-style roadmap</h2>
            </div>
          </div>

          <div className="roadmap-header">
            <div>Backlog item</div>
            <div className="roadmap-sprints">
              {SPRINTS.map((sprint) => (
                <div key={sprint.label}>
                  {sprint.label}
                  <br />
                  <small>{sprint.quarter}</small>
                </div>
              ))}
            </div>
          </div>

          {rankedItems.map((item) => {
            const placement = current.schedule[item.id];
            const duration = placement.end - placement.start + 1;
            return (
              <div className="roadmap-row" key={item.id}>
                <div className="roadmap-item-title">
                  {item.title}
                  <span>
                    {item.type} · {getROI(item).toFixed(1)}x ROI
                  </span>
                </div>
                <div className="roadmap-lane">
                  {SPRINTS.map((sprint, index) => {
                    if (index === placement.start) {
                      return (
                        <div
                          key={`${item.id}-${sprint.label}`}
                          className={`roadmap-bar ${cssType(item.type)}`}
                          style={{ gridColumn: `${placement.start + 1} / span ${duration}` }}
                        >
                          {placement.deliveryQuarter}
                        </div>
                      );
                    }

                    if (placement.start < index && index <= placement.end) {
                      return null;
                    }

                    return <div key={`${item.id}-${sprint.label}`} className="roadmap-slot" />;
                  })}
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid two-column">
          <div className="panel">
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">Generated output</p>
                <h2>User stories & sprint assignments</h2>
              </div>
            </div>
            <div className="summary-card">
              <strong>{stories.length} generated user stories</strong>
              <br />
              Acceptance criteria, sprint assignments, and outcome framing for the top roadmap candidates.
            </div>
            <div className="story-list">
              {stories.map((story) => (
                <article className="story-card" key={`${story.summary}-${story.sprint}`}>
                  <h4>{story.summary}</h4>
                  <p>
                    <strong>Sprint:</strong> {story.sprint}
                  </p>
                  <p>{story.description}</p>
                  <ul>
                    {story.acceptanceCriteria.map((criterion) => (
                      <li key={criterion}>{criterion}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">Shareable artifacts</p>
                <h2>Export to Jira / Confluence</h2>
              </div>
            </div>

            <div className="export-controls">
              <button className="primary-button" type="button" onClick={() => setExportFormat('jira')}>
                Preview Jira format
              </button>
              <button className="secondary-button" type="button" onClick={() => setExportFormat('confluence')}>
                Preview Confluence format
              </button>
              <button className="secondary-button" type="button" onClick={copyExportText}>
                Copy export text
              </button>
              <button className="secondary-button" type="button" onClick={downloadExportText}>
                Download .txt
              </button>
            </div>

            <pre className="export-output">{exportText}</pre>
            {notice && <p className="status-note">{notice}</p>}
          </div>
        </section>
      </main>

      <footer className="footer">
        Built for roadmap planning, dependency forecasting, and stakeholder alignment.
      </footer>
    </>
  );
}

function schedulePortfolio(items, delays = {}) {
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const sprintLoad = Array(SPRINTS.length).fill(0);
  const schedule = {};
  const visiting = new Set();
  const ordered = [...items].sort((left, right) => getRiceScore(right) - getRiceScore(left));

  function placeItem(item) {
    if (!item) {
      return { start: 0, end: 0, deliveryQuarter: 'Q1' };
    }

    if (schedule[item.id]) {
      return schedule[item.id];
    }

    if (visiting.has(item.id)) {
      return schedule[item.id] || { start: 0, end: 0, deliveryQuarter: 'Q1' };
    }

    visiting.add(item.id);
    const dependencyPlacements = item.dependencies.map((dependencyId) => placeItem(itemMap.get(dependencyId)));

    let earliestStart = dependencyPlacements.length
      ? Math.max(...dependencyPlacements.map((placement) => placement.end + 1))
      : 0;

    earliestStart += Number(delays[item.id] || 0);

    const duration = Math.max(1, Math.ceil(item.effort / 5));
    const loadPerSprint = item.effort / duration;
    let start = earliestStart;

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
  const sprint = `${SPRINTS[placement.start].label}${placement.end > placement.start ? `–${SPRINTS[placement.end].label}` : ''}`;
  return [
    {
      summary: `${item.title} · Configuration story`,
      sprint,
      description: `As a product owner, I want ${item.title.toLowerCase()} configurable so that teams can adopt it without engineering support.`,
      acceptanceCriteria: [
        `${item.title} can be enabled through an admin setting.`,
        'Changes are validated before publish and logged for audit review.',
        'Success metrics are visible for the owning stakeholder.',
      ],
    },
    {
      summary: `${item.title} · User workflow story`,
      sprint,
      description: `As an end user, I want ${item.title.toLowerCase()} integrated into my normal journey so that delivery friction is reduced.`,
      acceptanceCriteria: [
        'Primary journey is available within two clicks from the core flow.',
        'Edge cases present clear error or fallback messaging.',
        'The experience meets the baseline accessibility checklist.',
      ],
    },
    {
      summary: `${item.title} · Reporting story`,
      sprint,
      description: `As an operations lead, I want reporting for ${item.title.toLowerCase()} so that rollout risk stays visible sprint by sprint.`,
      acceptanceCriteria: [
        'Key outcome metrics are reported by sprint.',
        'Exceptions trigger a follow-up action or alert.',
        'The team can review adoption and incident trends in the sprint demo.',
      ],
    },
  ];
}

function buildJiraExport(items, schedule) {
  const lines = [
    'EPIC: Stakeholder-Aligned Feature Delivery Simulator',
    'Summary: Delivery-ready backlog export with RICE ranking, dependencies, and sprint assignment.',
    '',
  ];

  items.flatMap((item) => generateStories(item, schedule[item.id])).forEach((story, index) => {
    lines.push(`STORY-${index + 1}: ${story.summary}`);
    lines.push(`Sprint: ${story.sprint}`);
    lines.push(`Description: ${story.description}`);
    lines.push('Acceptance Criteria:');
    story.acceptanceCriteria.forEach((criterion) => lines.push(`- ${criterion}`));
    lines.push('');
  });

  return lines.join('\n');
}

function buildConfluenceExport(items, schedule) {
  const lines = [
    'h1. Stakeholder-Aligned Feature Delivery Simulator',
    '',
    '|| Request || Type || RICE || ROI || Delivery || Risk ||',
  ];

  items.forEach((item) => {
    lines.push(
      `| ${item.title} | ${item.type} | ${getRiceScore(item).toFixed(1)} | ${getROI(item).toFixed(1)}x | ${schedule[item.id].deliveryQuarter} | ${getRisk(item)} |`
    );
  });

  lines.push('');
  lines.push('h2. Planning notes');
  lines.push('* RICE score favors high-impact, high-confidence items with manageable effort.');
  lines.push('* Dependencies are respected before start sprint assignment.');
  lines.push('* What-if delays automatically surface downstream slips.');

  return lines.join('\n');
}

function getRiceScore(item) {
  return (item.reach * item.impact * item.confidence) / item.effort;
}

function getROI(item) {
  return item.businessValue / item.effort;
}

function getRisk(item) {
  if (item.confidence >= 0.8 && item.dependencies.length <= 2) {
    return 'Low';
  }
  if (item.confidence >= 0.65 && item.dependencies.length <= 3) {
    return 'Medium';
  }
  return 'High';
}

function cssType(type) {
  return type.replace(/\s+/g, '-');
}

function getAbbreviation(title) {
  return title
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function formatCurrency(value) {
  return `$${value.toFixed(1)}k`;
}
