import fs from "fs";
import path from "path";
import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  TestError,
} from "@playwright/test/reporter";

type JsonError = {
  message?: string;
  stack?: string;
  value?: string;
  location?: { file: string; line: number; column: number };
  snippet?: string;
};

type JsonStd = { text: string };

type JsonAttachment = {
  name: string;
  contentType: string;
  path?: string;
};

type JsonResult = {
  status: string;
  duration: number;
  startTime?: string;
  retry: number;
  workerIndex?: number;
  parallelIndex?: number;

  error?: JsonError;
  errors?: JsonError[];

  stdout: JsonStd[];
  stderr: JsonStd[];
  attachments: JsonAttachment[];
};

type JsonTest = {
  title: string;
  titlePath: string[];
  location: { file: string; line: number; column: number };

  expectedStatus?: string;
  timeout?: number;
  annotations?: { type: string; description?: string }[];

  results: JsonResult[];
};

type ProjectPayload = {
  generatedAt: string;
  projectName: string;
  testedUrl?: string;

  stats: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    other: number;
    durationMs: number;
  };

  tests: JsonTest[];
};

function toJsonError(err?: TestError): JsonError | undefined {
  if (!err) return undefined;
  const anyErr = err as any;
  return {
    message: anyErr.message,
    stack: anyErr.stack,
    value: anyErr.value,
    location: anyErr.location,
    snippet: anyErr.snippet,
  };
}

function toJsonErrors(errs?: TestError[]): JsonError[] | undefined {
  if (!errs || !errs.length) return undefined;
  return errs.map(e => toJsonError(e)!).filter(Boolean);
}

class MultiJsonReporter implements Reporter {
  private outDir: string;

  // maps for robust project resolution
  private projectIdToName = new Map<string, string>();
  private projectNameToTestedUrl = new Map<string, string | undefined>();

  private testsByProject = new Map<string, JsonTest[]>();
  private startMsByProject = new Map<string, number>();
  private endMsByProject = new Map<string, number>();

  constructor(options?: { outputDir?: string }) {
    this.outDir = options?.outputDir ?? "tests-results";
  }

  onBegin(config: FullConfig, _suite: Suite) {
    for (const p of config.projects as any[]) {
      // Playwright hat oft p.id (wie in results.json "projectId")
      const pid = (p.id ?? p.name) as string;
      const pname = (p.name ?? pid) as string;

      this.projectIdToName.set(String(pid), pname);

      const testedUrl = (p.metadata as any)?.testedUrl as string | undefined;
      this.projectNameToTestedUrl.set(pname, testedUrl);

      this.testsByProject.set(pname, []);
      this.startMsByProject.set(pname, Date.now());
    }
  }

  private resolveProjectName(test: TestCase, result: TestResult): string {
    const anyTest = test as any;
    const anyResult = result as any;

    // 1) Best: projectId/_projectId → Name aus Map
    const pid =
      anyTest.projectId ??
      anyTest._projectId ??
      anyResult.projectId ??
      anyResult._projectId;

    if (pid != null) {
      const mapped = this.projectIdToName.get(String(pid));
      if (mapped) return mapped;
      // falls id schon ein Name ist:
      if (typeof pid === "string") return pid;
    }

    // 2) Fallbacks: projectName (Runtime existiert oft, TS nicht)
    const pname =
      anyTest.projectName ??
      anyResult.projectName ??
      (anyTest.parent as any)?.project?.()?.name ??
      (anyTest.parent as any)?.parent?.project?.()?.name;

    return pname ?? "unknown";
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const projectName = this.resolveProjectName(test, result);

    if (!this.testsByProject.has(projectName)) {
      this.testsByProject.set(projectName, []);
      this.startMsByProject.set(projectName, Date.now());
    }
    const bucket = this.testsByProject.get(projectName)!;

    const titlePath = test.titlePath();
    const location = {
      file: test.location.file,
      line: test.location.line,
      column: test.location.column,
    };

    let t = bucket.find(
      x =>
        x.location.file === location.file &&
        x.location.line === location.line &&
        x.location.column === location.column &&
        JSON.stringify(x.titlePath) === JSON.stringify(titlePath)
    );

    if (!t) {
      const anyTest = test as any;
      t = {
        title: test.title,
        titlePath,
        location,
        expectedStatus: anyTest.expectedStatus,
        timeout: anyTest.timeout,
        annotations: Array.isArray(anyTest.annotations)
          ? anyTest.annotations.map((a: any) => ({
              type: a.type,
              description: a.description,
            }))
          : undefined,
        results: [],
      };
      bucket.push(t);
    }

    const anyResult = result as any;

    const jr: JsonResult = {
      status: result.status,
      duration: result.duration,
      startTime: result.startTime ? new Date(result.startTime).toISOString() : undefined,
      retry: result.retry,
      workerIndex: anyResult.workerIndex,
      parallelIndex: anyResult.parallelIndex,

      error: toJsonError(result.error),
      errors: toJsonErrors(anyResult.errors),

      stdout: (result.stdout || []).map(s => ({ text: String(s) })),
      stderr: (result.stderr || []).map(s => ({ text: String(s) })),

      attachments: (result.attachments || []).map(a => ({
        name: a.name,
        contentType: a.contentType,
        path: a.path,
      })),
    };

    t.results.push(jr);
    this.endMsByProject.set(projectName, Date.now());
  }

  async onEnd() {
    fs.mkdirSync(this.outDir, { recursive: true });

    for (const [projectName, tests] of this.testsByProject.entries()) {
      // nur url-* Projekte schreiben (wie bei dir)
      if (!projectName.startsWith("url-")) continue;

      const start = this.startMsByProject.get(projectName) ?? Date.now();
      const end = this.endMsByProject.get(projectName) ?? Date.now();
      const durationMs = Math.max(0, end - start);

      let total = 0, passed = 0, failed = 0, skipped = 0, other = 0;
      for (const t of tests) {
        for (const r of t.results) {
          total++;
          if (r.status === "passed") passed++;
          else if (r.status === "failed") failed++;
          else if (r.status === "skipped") skipped++;
          else other++;
        }
      }

      const payload: ProjectPayload = {
        generatedAt: new Date().toISOString(),
        projectName,
        testedUrl: this.projectNameToTestedUrl.get(projectName),
        stats: { total, passed, failed, skipped, other, durationMs },
        tests,
      };

      const safe = projectName.replace(/[^\w.-]+/g, "_");
      const filePath = path.join(this.outDir, `results-${safe}.json`);
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
    }
  }
}

export default MultiJsonReporter;
