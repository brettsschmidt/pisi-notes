// Shared plumbing for the software factory: state files, git worktrees, the
// quality gate, and metric snapshots. No AI in here — the Claude jobs do the
// thinking and call this through factory.mjs so state changes stay consistent.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

// Always resolve to the main checkout, even if this file is run from a copy
// inside a factory worktree — there is exactly one ledger.
function resolveRoot() {
  const root = path.resolve(here, "..", "..");
  try {
    if (fs.statSync(path.join(root, ".git")).isFile()) {
      const common = execFileSync(
        "git",
        ["rev-parse", "--path-format=absolute", "--git-common-dir"],
        { cwd: root, encoding: "utf8" },
      ).trim();
      return path.dirname(common);
    }
  } catch {
    // not a git checkout; fall through
  }
  return root;
}

export const ROOT = resolveRoot();
export const FACTORY_DIR = path.join(ROOT, "factory");
let stateDir = process.env.FACTORY_STATE_DIR
  ? path.resolve(process.env.FACTORY_STATE_DIR)
  : path.join(FACTORY_DIR, "state");

export function setStateDir(dir) {
  stateDir = path.resolve(dir);
}

export const JOBS = ["scout", "builder", "reviewer", "auditor"];
export const STATUSES = [
  "proposed",
  "ready",
  "building",
  "review",
  "changes_requested",
  "approved",
  "shipped",
  "needs_human",
  "rejected",
];

// ---------------------------------------------------------------- state io

const file = (name) => path.join(stateDir, name);
const now = () => new Date().toISOString();

function readJson(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file(name), "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(name, value) {
  fs.mkdirSync(stateDir, { recursive: true });
  const tmp = `${file(name)}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tmp, file(name));
}

function appendJsonl(name, value) {
  fs.mkdirSync(stateDir, { recursive: true });
  fs.appendFileSync(file(name), `${JSON.stringify(value)}\n`);
}

function readJsonl(name) {
  try {
    return fs
      .readFileSync(file(name), "utf8")
      .split("\n")
      .filter(Boolean)
      .flatMap((line) => {
        try {
          return [JSON.parse(line)];
        } catch {
          return [];
        }
      });
  } catch {
    return [];
  }
}

export function loadConfig() {
  return JSON.parse(
    fs.readFileSync(path.join(FACTORY_DIR, "factory.config.json"), "utf8"),
  );
}

const loadItems = () => readJson("items.json", { seq: 0, items: [] });
const saveItems = (store) => writeJson("items.json", store);

export function getControl() {
  return readJson("control.json", { paused: false });
}

export function setPaused(paused, reason, by = "human") {
  const control = { paused, reason: reason || null, at: now(), by };
  writeJson("control.json", control);
  logEvent({
    job: by,
    type: paused ? "paused" : "resumed",
    message: paused
      ? `Factory paused${reason ? `: ${reason}` : ""}`
      : "Factory resumed",
  });
  return control;
}

export function logEvent({ job, type = "note", message, itemId, runId }) {
  const event = { at: now(), job: job || "factory", type, message };
  if (itemId) event.itemId = itemId;
  if (runId) event.runId = runId;
  appendJsonl("events.jsonl", event);
  return event;
}

// --------------------------------------------------------------------- git

function git(args, cwd = ROOT) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function gitOk(args, cwd = ROOT) {
  return spawnSync("git", args, { cwd, stdio: "ignore" }).status === 0;
}

export function gitInfo() {
  try {
    return {
      branch: git(["rev-parse", "--abbrev-ref", "HEAD"]),
      sha: git(["rev-parse", "--short", "HEAD"]),
      dirtyFiles: git(["status", "--porcelain"]).split("\n").filter(Boolean)
        .length,
    };
  } catch {
    return { branch: null, sha: null, dirtyFiles: 0 };
  }
}

// ------------------------------------------------------------------- items

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");

const byPriority = (a, b) =>
  (a.priority ?? 3) - (b.priority ?? 3) ||
  a.createdAt.localeCompare(b.createdAt);

function setStatus(item, status, by, note) {
  if (!STATUSES.includes(status)) throw new Error(`Unknown status: ${status}`);
  const from = item.status;
  item.status = status;
  item.updatedAt = now();
  item.history = item.history || [];
  item.history.push({ at: item.updatedAt, status, by, note: note || null });
  if (status === "shipped") item.shippedAt = item.updatedAt;
  logEvent({
    job: by,
    type: `item_${status}`,
    itemId: item.id,
    message: `${item.id} ${from ? `${from} → ` : ""}${status}${note ? ` — ${note}` : ""}`,
  });
}

function findItem(store, id) {
  const item = store.items.find(
    (i) => i.id.toLowerCase() === String(id).toLowerCase(),
  );
  if (!item) throw new Error(`No item ${id}`);
  return item;
}

export function listItems(status) {
  const { items } = loadItems();
  return status ? items.filter((i) => i.status === status) : items;
}

export function getItem(id) {
  return findItem(loadItems(), id);
}

export function addItem(input, by = "scout") {
  const cfg = loadConfig();
  const store = loadItems();
  const title = String(input.title || "").trim();
  if (!title) throw new Error("An item needs a title");
  const duplicate = store.items.find(
    (i) =>
      !["shipped", "rejected"].includes(i.status) &&
      slugify(i.title) === slugify(title),
  );
  if (duplicate) throw new Error(`Duplicate of ${duplicate.id}: ${title}`);

  const human = by === "human";
  if (!human) {
    const queued = store.items.filter((i) =>
      ["proposed", "ready"].includes(i.status),
    ).length;
    if (queued >= cfg.autonomy.maxBacklog) {
      throw new Error(
        `Backlog is full (${queued}/${cfg.autonomy.maxBacklog}). Not adding more.`,
      );
    }
  }

  const risk = ["low", "medium", "high"].includes(input.risk)
    ? input.risk
    : "medium";
  const size = ["S", "M", "L"].includes(input.size) ? input.size : "M";
  const autoReady =
    human || (cfg.autonomy.autoApproveLowRisk && risk === "low" && size !== "L");

  store.seq += 1;
  const item = {
    id: `F-${String(store.seq).padStart(3, "0")}`,
    title,
    description: String(input.description || "").trim(),
    acceptance: [].concat(input.acceptance || []).map(String).filter(Boolean),
    kind: input.kind || "feature",
    size,
    risk,
    impact: String(input.impact || "").trim(),
    priority: Number(input.priority) || (human ? 1 : 3),
    source: by,
    createdAt: now(),
    attempts: 0,
    history: [],
  };
  setStatus(
    item,
    autoReady ? "ready" : "proposed",
    by,
    autoReady ? null : "needs your approval before it is built",
  );
  store.items.push(item);
  saveItems(store);
  return item;
}

const HUMAN_MOVES = {
  ready: ["proposed", "needs_human", "rejected"],
  rejected: STATUSES.filter((s) => s !== "shipped" && s !== "rejected"),
  shipped: ["approved"],
};

export function setItemStatus(id, status, { by = "human", note } = {}) {
  const store = loadItems();
  const item = findItem(store, id);
  if (by === "human") {
    const allowedFrom = HUMAN_MOVES[status];
    if (!allowedFrom || !allowedFrom.includes(item.status)) {
      throw new Error(`Cannot move ${item.id} from ${item.status} to ${status}`);
    }
  }
  setStatus(item, status, by, note);
  saveItems(store);
  return item;
}

// --------------------------------------------------------------- worktrees

function ensureWorktree(item, cfg) {
  item.branch ||= `${cfg.target.branchPrefix}${item.id.toLowerCase()}-${slugify(item.title)}`;
  item.worktree ||= path.join(
    cfg.target.worktreeDir,
    `factory-${item.id.toLowerCase()}`,
  );
  const abs = path.join(ROOT, item.worktree);
  if (fs.existsSync(abs)) return abs;

  fs.mkdirSync(path.dirname(abs), { recursive: true });
  if (gitOk(["rev-parse", "--verify", "--quiet", `refs/heads/${item.branch}`])) {
    git(["worktree", "add", abs, item.branch]);
  } else {
    item.baseSha = git(["rev-parse", cfg.target.baseBranch]);
    git(["worktree", "add", "-b", item.branch, abs, item.baseSha]);
  }
  // Reuse the main checkout's dependencies and generated Next types; both are
  // gitignored, so neither can end up in a commit.
  const modules = path.join(ROOT, "node_modules");
  if (fs.existsSync(modules) && !fs.existsSync(path.join(abs, "node_modules"))) {
    fs.symlinkSync(modules, path.join(abs, "node_modules"), "dir");
  }
  const nextEnv = path.join(ROOT, "next-env.d.ts");
  if (fs.existsSync(nextEnv)) {
    fs.copyFileSync(nextEnv, path.join(abs, "next-env.d.ts"));
  }
  return abs;
}

function removeWorktree(item) {
  if (!item.worktree) return false;
  const abs = path.join(ROOT, item.worktree);
  if (!fs.existsSync(abs)) return false;
  return gitOk(["worktree", "remove", "--force", abs]);
}

// ----------------------------------------------------------------- metrics

const SOURCE_EXT = /\.(ts|tsx|js|jsx|mjs|css|sql)$/;
const NOT_PRODUCT = /^(factory\/|types\/supabase\.ts$|public\/)/;

function run(cmd, args, cwd, timeoutMs = 10 * 60 * 1000) {
  const started = Date.now();
  const res = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
    timeout: timeoutMs,
    env: { ...process.env, CI: "1", FORCE_COLOR: "0" },
  });
  return {
    status: res.status,
    stdout: res.stdout || "",
    stderr: res.stderr || "",
    ms: Date.now() - started,
  };
}

// One snapshot of code health for a checkout. Everything here is cheap and
// deterministic so before/after pairs are comparable.
export function measureDir(dir) {
  const metrics = {};

  const lint = run("npx", ["--no-install", "eslint", ".", "-f", "json"], dir);
  try {
    const report = JSON.parse(lint.stdout);
    metrics.lintErrors = report.reduce((n, f) => n + f.errorCount, 0);
    metrics.lintWarnings = report.reduce((n, f) => n + f.warningCount, 0);
  } catch {
    metrics.lintErrors = null;
    metrics.lintWarnings = null;
  }

  const tsc = run(
    "npx",
    ["--no-install", "tsc", "--noEmit", "--incremental", "false", "--pretty", "false"],
    dir,
  );
  metrics.typeErrors =
    tsc.status === null
      ? null
      : (tsc.stdout.match(/error TS\d+/g) || []).length;

  let files = [];
  try {
    files = git(["ls-files", "-co", "--exclude-standard"], dir)
      .split("\n")
      .filter((f) => SOURCE_EXT.test(f) && !NOT_PRODUCT.test(f));
  } catch {
    // leave empty
  }
  let lines = 0;
  let todos = 0;
  let e2eTests = 0;
  for (const rel of files) {
    let text;
    try {
      text = fs.readFileSync(path.join(dir, rel), "utf8");
    } catch {
      continue;
    }
    lines += text.split("\n").length;
    todos += (text.match(/\b(TODO|FIXME|HACK)\b/g) || []).length;
    if (/^e2e\/.*\.spec\.ts$/.test(rel)) {
      e2eTests += (text.match(/^\s*test(\.only|\.skip)?\(/gm) || []).length;
    }
  }
  metrics.sourceFiles = files.length;
  metrics.sourceLines = lines;
  metrics.todos = todos;
  metrics.e2eTests = e2eTests;
  metrics.routes = files.filter((f) =>
    /^app\/.*\/?(page\.tsx|route\.ts)$/.test(f),
  ).length;

  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
    metrics.dependencies =
      Object.keys(pkg.dependencies || {}).length +
      Object.keys(pkg.devDependencies || {}).length;
  } catch {
    metrics.dependencies = null;
  }
  return metrics;
}

// Clean checkouts are cached by commit, so a worktree's "before" is free when
// main has not moved.
function measureCommit(dir) {
  const sha = git(["rev-parse", "HEAD"], dir);
  const clean = git(["status", "--porcelain"], dir) === "";
  const cache = readJson("metrics-cache.json", {});
  if (clean && cache[sha]) return cache[sha];
  const metrics = measureDir(dir);
  if (clean) {
    cache[sha] = metrics;
    const keys = Object.keys(cache);
    for (const old of keys.slice(0, Math.max(0, keys.length - 40))) delete cache[old];
    writeJson("metrics-cache.json", cache);
  }
  return metrics;
}

export function snapshotMain(label, by = "auditor") {
  const info = gitInfo();
  const snapshot = {
    at: now(),
    label: label || null,
    sha: info.sha,
    branch: info.branch,
    dirtyFiles: info.dirtyFiles,
    metrics: measureDir(ROOT),
  };
  appendJsonl("metrics.jsonl", snapshot);
  logEvent({
    job: by,
    type: "snapshot",
    message: `Measured ${info.branch}@${info.sha}: ${snapshot.metrics.typeErrors ?? "?"} type errors, ${snapshot.metrics.lintErrors ?? "?"} lint errors, ${snapshot.metrics.sourceLines} lines`,
  });
  return snapshot;
}

// ------------------------------------------------------------ build + gate

export function claim(by = "builder") {
  const cfg = loadConfig();
  const store = loadItems();
  let item = store.items.find((i) => i.status === "building");
  const resumed = Boolean(item);
  if (!item) {
    item = store.items
      .filter((i) => i.status === "changes_requested")
      .sort(byPriority)[0];
  }
  if (!item) {
    const open = store.items.filter((i) =>
      ["review", "approved"].includes(i.status),
    ).length;
    if (open >= cfg.autonomy.maxOpenChanges) {
      return {
        item: null,
        reason: `${open} changes are already waiting on review or merge (limit ${cfg.autonomy.maxOpenChanges}). Not starting new work until some are merged or rejected.`,
      };
    }
    item = store.items.filter((i) => i.status === "ready").sort(byPriority)[0];
  }
  if (!item) return { item: null, reason: "Nothing is ready to build." };

  const retry = item.status === "changes_requested";
  const abs = ensureWorktree(item, cfg);
  item.effects ||= {};
  if (!item.effects.before) item.effects.before = measureCommit(abs);
  if (!resumed) {
    setStatus(
      item,
      "building",
      by,
      retry ? `attempt ${item.attempts + 1}, addressing review` : null,
    );
  }
  saveItems(store);
  return {
    item,
    resumed,
    retry,
    worktree: abs,
    branch: item.branch,
    baseSha: item.baseSha,
    protectedPaths: cfg.protectedPaths,
    maxDiffLines: cfg.autonomy.maxDiffLines,
  };
}

function globToRegExp(glob) {
  const body = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*\//g, "\u0000")
    .replace(/\*\*/g, "\u0001")
    .replace(/\*/g, "[^/]*")
    .replace(/\u0000/g, "(?:.*/)?")
    .replace(/\u0001/g, ".*");
  return new RegExp(`^${body}$`);
}

function diffStats(baseSha, headSha) {
  const out = git(["diff", "--numstat", baseSha, headSha]);
  return out
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [ins, del, ...rest] = line.split("\t");
      return {
        path: rest.join("\t"),
        insertions: ins === "-" ? 0 : Number(ins),
        deletions: del === "-" ? 0 : Number(del),
      };
    });
}

// The quality gate. A change only reaches review when it is committed, stays
// out of protected paths, fits the size budget, and does not make lint or
// type errors worse than the commit it started from.
export function submit(id, summary, by = "builder") {
  const cfg = loadConfig();
  const store = loadItems();
  const item = findItem(store, id);
  if (item.status !== "building") {
    throw new Error(`${item.id} is ${item.status}, not building`);
  }
  const abs = path.join(ROOT, item.worktree);
  const reasons = [];

  if (git(["status", "--porcelain"], abs) !== "") {
    reasons.push("The worktree has uncommitted changes — commit them on the factory branch first.");
  }
  const headSha = git(["rev-parse", "HEAD"], abs);
  const commits = Number(git(["rev-list", "--count", `${item.baseSha}..${headSha}`]));
  if (commits === 0) reasons.push("No commits on the factory branch yet.");

  const files = diffStats(item.baseSha, headSha);
  const protectedRes = cfg.protectedPaths.map(globToRegExp);
  const touched = files
    .map((f) => f.path)
    .filter((p) => protectedRes.some((re) => re.test(p)));
  if (touched.length) {
    reasons.push(`Touches protected paths: ${touched.join(", ")}. Revert those edits, or mark the item needs_human.`);
  }
  const insertions = files.reduce((n, f) => n + f.insertions, 0);
  const deletions = files.reduce((n, f) => n + f.deletions, 0);
  if (insertions + deletions > cfg.autonomy.maxDiffLines) {
    reasons.push(`Diff is ${insertions + deletions} lines; the budget is ${cfg.autonomy.maxDiffLines}. Narrow the change.`);
  }

  const before = item.effects?.before || {};
  const after = measureDir(abs);
  for (const [key, label] of [
    ["typeErrors", "type errors"],
    ["lintErrors", "lint errors"],
  ]) {
    if (after[key] == null) {
      reasons.push(`Could not measure ${label} in the worktree.`);
    } else if (before[key] != null && after[key] > before[key]) {
      reasons.push(`${label} went from ${before[key]} to ${after[key]}. Fix the new ones.`);
    }
  }

  const checks = [];
  for (const check of cfg.extraChecks || []) {
    const res = run("sh", ["-c", check.command], abs);
    const ok = res.status === 0;
    checks.push({ name: check.name, ok, ms: res.ms });
    if (!ok) {
      reasons.push(`Check "${check.name}" failed:\n${(res.stdout + res.stderr).slice(-1500)}`);
    }
  }

  if (reasons.length) {
    logEvent({
      job: by,
      type: "gate_failed",
      itemId: item.id,
      message: `${item.id} did not pass the gate: ${reasons[0].split("\n")[0]}`,
    });
    return { ok: false, reasons, after };
  }

  item.change = {
    summary: String(summary || "").trim(),
    headSha,
    commits,
    files,
    insertions,
    deletions,
    checks,
    submittedAt: now(),
  };
  item.effects.after = after;
  setStatus(item, "review", by, `+${insertions} −${deletions} in ${files.length} files`);
  saveItems(store);
  return { ok: true, item };
}

export function nextReview() {
  const item = listItems("review").sort(byPriority)[0];
  if (!item) return { item: null, reason: "Nothing is waiting for review." };
  return {
    item,
    worktree: path.join(ROOT, item.worktree),
    diffCommand: `git diff ${item.baseSha} ${item.change.headSha}`,
  };
}

export function review(id, verdict, notes, by = "reviewer") {
  const cfg = loadConfig();
  const store = loadItems();
  const item = findItem(store, id);
  if (item.status !== "review") {
    throw new Error(`${item.id} is ${item.status}, not in review`);
  }
  if (!["approved", "changes_requested", "needs_human"].includes(verdict)) {
    throw new Error("Verdict must be approved, changes_requested or needs_human");
  }
  let status = verdict;
  if (verdict === "changes_requested") {
    item.attempts += 1;
    if (item.attempts >= cfg.autonomy.maxAttempts) status = "needs_human";
  }
  item.review = { verdict, notes: String(notes || "").trim(), at: now(), by };
  item.reviews = [...(item.reviews || []), item.review];
  setStatus(
    item,
    status,
    by,
    status === "needs_human" && verdict === "changes_requested"
      ? `still not right after ${item.attempts} attempts`
      : null,
  );
  saveItems(store);
  // Approval is the last gate: with autoMerge on, the reviewed commit goes
  // straight into the base branch.
  if (status === "approved" && cfg.autonomy.autoMerge) {
    mergeApproved(item, cfg, by);
    saveItems(store);
  }
  return item;
}

// ------------------------------------------------------------------- merge

// Merge exactly the commit that was reviewed into the base branch, in the
// main checkout. Refuses rather than guesses: wrong branch checked out, a
// branch that moved after review, or a merge git cannot do cleanly all leave
// main untouched. If main's lint or type errors get worse, the merge is
// reverted with a normal revert commit. Never pushes.
function tryMerge(item, cfg) {
  const base = cfg.target.baseBranch;
  const fail = (reason) => ({ ok: false, reason });
  const head = item.change?.headSha;
  if (!head) return fail("nothing was submitted for it");
  if (gitOk(["merge-base", "--is-ancestor", head, base])) {
    return { ok: true, mergeSha: git(["rev-parse", base]), already: true };
  }
  const info = gitInfo();
  if (info.branch !== base) {
    return fail(`the main checkout is on ${info.branch}, not ${base}`);
  }
  if (fs.existsSync(path.join(ROOT, ".git", "MERGE_HEAD"))) {
    return fail("another merge is in progress in the main checkout");
  }
  let branchHead = null;
  try {
    branchHead = git(["rev-parse", `refs/heads/${item.branch}`]);
  } catch {
    // branch is gone
  }
  if (branchHead !== head) {
    return fail("the branch changed after it was reviewed");
  }

  const before = measureDir(ROOT);
  const merged = spawnSync(
    "git",
    ["merge", "--no-ff", "--no-edit", "-m", `Merge ${item.id}: ${item.title}\n\nFactory-Item: ${item.id}`, head],
    { cwd: ROOT, encoding: "utf8" },
  );
  if (merged.status !== 0) {
    if (fs.existsSync(path.join(ROOT, ".git", "MERGE_HEAD"))) gitOk(["merge", "--abort"]);
    const why = `${merged.stdout}\n${merged.stderr}`
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => /conflict|overwritten|error|fatal/i.test(l))[0];
    return fail(`git could not merge it cleanly${why ? ` (${why})` : ""}`);
  }
  const mergeSha = git(["rev-parse", "HEAD"]);
  const after = measureDir(ROOT);
  const worse = [
    ["typeErrors", "type errors"],
    ["lintErrors", "lint errors"],
  ].filter(([k]) => before[k] != null && (after[k] == null || after[k] > before[k]));
  if (worse.length) {
    const detail = worse
      .map(([k, label]) => `${label} ${before[k]} → ${after[k] ?? "unmeasurable"}`)
      .join(", ");
    const reverted = gitOk(["revert", "-m", "1", "--no-edit", mergeSha]);
    return fail(
      `${base} got worse after merging (${detail}); ${reverted ? "the merge was reverted" : `THE REVERT FAILED — ${base} needs attention`}`,
    );
  }
  return { ok: true, mergeSha, after };
}

function mergeApproved(item, cfg, by) {
  const res = tryMerge(item, cfg);
  if (!res.ok) {
    setStatus(item, "needs_human", by, `approved but not merged — ${res.reason}`);
    return res;
  }
  item.merge = { sha: res.mergeSha, at: now(), by };
  setStatus(
    item,
    "shipped",
    by,
    res.already
      ? `already in ${cfg.target.baseBranch}`
      : `merged into ${cfg.target.baseBranch} as ${res.mergeSha.slice(0, 7)}`,
  );
  if (res.after) {
    const info = gitInfo();
    appendJsonl("metrics.jsonl", {
      at: now(),
      label: `after ${item.id}`,
      sha: info.sha,
      branch: info.branch,
      dirtyFiles: info.dirtyFiles,
      metrics: res.after,
    });
  }
  if (removeWorktree(item)) gitOk(["branch", "-d", item.branch]);
  return res;
}

export function merge(id, by = "human") {
  const cfg = loadConfig();
  const store = loadItems();
  const item = findItem(store, id);
  if (item.status !== "approved") {
    throw new Error(`${item.id} is ${item.status}; only an approved change can be merged`);
  }
  const res = mergeApproved(item, cfg, by);
  saveItems(store);
  return { ...res, item };
}

// Notice merges the human made, and tidy up after finished work.
export function sync(by = "auditor") {
  const cfg = loadConfig();
  const store = loadItems();
  const shipped = [];
  const cleaned = [];
  const merged = [];
  for (const item of store.items) {
    const head = item.change?.headSha;
    if (
      head &&
      ["approved", "review", "needs_human"].includes(item.status) &&
      gitOk(["merge-base", "--is-ancestor", head, cfg.target.baseBranch])
    ) {
      setStatus(item, "shipped", by, `merged into ${cfg.target.baseBranch}`);
      shipped.push(item.id);
    }
    // Anything approved while auto-merge was off (or interrupted) goes in now.
    if (item.status === "approved" && cfg.autonomy.autoMerge) {
      if (mergeApproved(item, cfg, by).ok) merged.push(item.id);
    }
    if (["shipped", "rejected"].includes(item.status) && removeWorktree(item)) {
      cleaned.push(item.id);
      if (item.status === "shipped") gitOk(["branch", "-d", item.branch]);
    }
  }
  saveItems(store);
  if (shipped.length) snapshotMain(`after ${shipped.join(", ")}`, by);
  return { shipped, merged, cleaned };
}

// -------------------------------------------------------------------- runs

function foldRuns() {
  const runs = new Map();
  for (const rec of readJsonl("runs.jsonl")) {
    runs.set(rec.id, { ...(runs.get(rec.id) || {}), ...rec });
  }
  return [...runs.values()];
}

export function runStart(job) {
  if (!JOBS.includes(job)) throw new Error(`Unknown job: ${job}`);
  const control = getControl();
  if (control.paused) {
    logEvent({ job, type: "skipped", message: `${job} skipped — factory is paused` });
    return { paused: true, reason: control.reason };
  }
  const active = foldRuns().find(
    (r) =>
      r.job === job &&
      !r.endedAt &&
      Date.now() - Date.parse(r.startedAt) < 90 * 60 * 1000,
  );
  if (active) return { busy: true, runId: active.id };
  const id = `${job}-${now().replace(/[-:TZ.]/g, "").slice(0, 14)}`;
  appendJsonl("runs.jsonl", { id, job, startedAt: now() });
  logEvent({ job, type: "run_started", runId: id, message: `${job} run started` });
  return { runId: id };
}

export function runEnd(id, { outcome = "ok", summary = "", itemId } = {}) {
  const existing = foldRuns().find((r) => r.id === id);
  if (!existing) throw new Error(`No run ${id}`);
  if (!["ok", "noop", "failed"].includes(outcome)) {
    throw new Error("Outcome must be ok, noop or failed");
  }
  const rec = { id, endedAt: now(), outcome, summary: String(summary).trim() };
  if (itemId) rec.itemId = itemId;
  appendJsonl("runs.jsonl", rec);
  logEvent({
    job: existing.job,
    type: `run_${outcome}`,
    runId: id,
    itemId,
    message: rec.summary || `${existing.job} run finished (${outcome})`,
  });
  return { ...existing, ...rec };
}

export function addDigest({ title, body }, by = "auditor") {
  const digest = { at: now(), title: String(title || "Digest"), body: String(body || "") };
  appendJsonl("digests.jsonl", digest);
  logEvent({ job: by, type: "digest", message: `Digest: ${digest.title}` });
  return digest;
}

// ------------------------------------------------------------------- views

export function summary() {
  const items = listItems();
  const counts = Object.fromEntries(
    STATUSES.map((s) => [s, items.filter((i) => i.status === s).length]),
  );
  const brief = (i) => ({ id: i.id, title: i.title, status: i.status, branch: i.branch });
  return {
    paused: getControl().paused,
    git: gitInfo(),
    counts,
    queue: items
      .filter((i) => ["building", "changes_requested", "ready"].includes(i.status))
      .sort(byPriority)
      .map(brief),
    inReview: items.filter((i) => i.status === "review").map(brief),
    awaitingMerge: items.filter((i) => i.status === "approved").map(brief),
    needsHuman: items
      .filter((i) => ["needs_human", "proposed"].includes(i.status))
      .map(brief),
    titles: items.map((i) => `${i.id} [${i.status}] ${i.title}`),
  };
}

export function dashboardState() {
  const cfg = loadConfig();
  return {
    now: now(),
    config: {
      name: cfg.name,
      focus: cfg.focus,
      baseBranch: cfg.target.baseBranch,
      autonomy: cfg.autonomy,
      schedule: cfg.schedule,
      protectedPaths: cfg.protectedPaths,
    },
    control: getControl(),
    git: gitInfo(),
    items: listItems(),
    events: readJsonl("events.jsonl").slice(-400),
    runs: foldRuns().slice(-200),
    metrics: readJsonl("metrics.jsonl"),
    digests: readJsonl("digests.jsonl").slice(-5),
  };
}

export function itemDiff(id) {
  const item = getItem(id);
  if (!item.baseSha || !item.change?.headSha) return "";
  const diff = git(["diff", item.baseSha, item.change.headSha]);
  const limit = 400 * 1024;
  return diff.length > limit
    ? `${diff.slice(0, limit)}\n… diff truncated (${diff.length} bytes)`
    : diff;
}
