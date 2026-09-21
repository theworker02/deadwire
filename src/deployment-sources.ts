import type { DeploymentSignal } from "./contracts.js";

export class GitHubDeploymentSource {
  constructor(private readonly token: string, private readonly owner: string, private readonly repo: string) {}
  async compare(tenantId: string, baseSha: string, headSha: string, environment: string): Promise<DeploymentSignal> {
    const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/compare/${encodeURIComponent(baseSha)}...${encodeURIComponent(headSha)}`, { headers: { authorization: `Bearer ${this.token}`, accept: "application/vnd.github+json" } });
    if (!response.ok) throw new Error(`GitHub comparison failed (${response.status}).`);
    const payload = await response.json() as { files?: Array<{ filename?: string }>; commits?: Array<{ sha?: string }> };
    const files = (payload.files ?? []).flatMap((file) => file.filename ? [file.filename] : []);
    return { tenantId, provider: "github", sha: payload.commits?.at(-1)?.sha ?? headSha, deployedAt: new Date().toISOString(), environment, changedFiles: files, changedPackages: files.filter((file) => /(^|\/)(package(-lock)?\.json|pnpm-lock\.yaml|yarn\.lock)$/.test(file)) };
  }
}

/** Normalizes a Vercel deployment webhook after the hosting layer verifies its signature. */
export function normalizeVercelDeployment(tenantId: string, event: Record<string, unknown>): DeploymentSignal {
  const deployment = (event.deployment ?? event) as Record<string, unknown>;
  const meta = (deployment.meta ?? {}) as Record<string, unknown>;
  const sha = string(meta.githubCommitSha ?? meta.githubCommitRef ?? deployment.uid, "unknown");
  return { tenantId, provider: "vercel", sha, deployedAt: string(deployment.createdAt, new Date().toISOString()), environment: string(deployment.target, "production"), changedFiles: [], changedPackages: [] };
}
function string(value: unknown, fallback: string): string { return typeof value === "string" && value.length > 0 ? value : fallback; }
