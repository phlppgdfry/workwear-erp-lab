import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Use the immutable ID returned by upload-pages-artifact. The deploy action's
// separate artifact-service listing can return zero even when REST sees it.
// API contract: https://docs.github.com/en/rest/pages/pages
export async function deployPages({ env = process.env, fetcher = fetch,
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), now = Date.now,
  output = value => appendFileSync(env.GITHUB_OUTPUT, value) } = {}) {
  for (const key of ['GH_TOKEN', 'GITHUB_REPOSITORY', 'GITHUB_RUN_ID', 'GITHUB_SHA',
    'PAGES_ARTIFACT_ID', 'ACTIONS_ID_TOKEN_REQUEST_URL', 'ACTIONS_ID_TOKEN_REQUEST_TOKEN']) {
    if (!env[key]) throw new Error(`Missing deployment input: ${key}`);
  }
  if (!/^\d+$/.test(env.PAGES_ARTIFACT_ID)) throw new Error('Invalid artifact ID');
  const base = `${env.GITHUB_API_URL || 'https://api.github.com'}/repos/${env.GITHUB_REPOSITORY}`;
  async function request(path, method = 'GET', body) {
    const response = await fetcher(base + path, {
      method, signal: AbortSignal.timeout(30000),
      headers: { Authorization: `Bearer ${env.GH_TOKEN}`, Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    if (!response.ok) throw Object.assign(new Error(`Pages ${method} ${path} failed (HTTP ${response.status})`), { status: response.status });
    return response.status === 204 ? null : response.json();
  }
  let artifact;
  // The upload ID is immediate; the REST metadata can take time to propagate.
  // Retry only reads for this exact ID, never a deployment POST.
  for (let attempt = 0; attempt < 12; attempt++) {
    try { artifact = await request(`/actions/artifacts/${env.PAGES_ARTIFACT_ID}`); break; }
    catch (error) {
      if (attempt === 11 || ![404, 429, 500, 502, 503, 504].includes(error.status)) throw error;
      await sleep(5000);
    }
  }
  if (artifact.expired || artifact.name !== 'github-pages' ||
      String(artifact.workflow_run?.id) !== String(env.GITHUB_RUN_ID) ||
      artifact.workflow_run?.head_sha !== env.GITHUB_SHA) {
    throw new Error('Artifact is expired or does not belong to this workflow and commit');
  }
  const identity = await fetcher(env.ACTIONS_ID_TOKEN_REQUEST_URL, {
    signal: AbortSignal.timeout(30000),
    headers: { Authorization: `Bearer ${env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}` }
  });
  if (!identity.ok) throw new Error(`OIDC identity request failed (HTTP ${identity.status})`);
  const { value: idToken } = await identity.json();
  if (!idToken) throw new Error('OIDC identity token is missing');
  // Never log credentials, identity tokens or deployment payloads.
  const deployment = await request('/pages/deployments', 'POST', {
    artifact_id: Number(env.PAGES_ARTIFACT_ID), pages_build_version: env.GITHUB_SHA, oidc_token: idToken
  });
  const statusPath = `/pages/deployments/${encodeURIComponent(deployment.id || env.GITHUB_SHA)}`;
  const deadline = now() + 600000;
  let failures = 0;
  try {
    while (now() < deadline) {
      let status;
      try { status = await request(statusPath); failures = 0; }
      catch (error) { if (++failures >= 5) throw error; await sleep(5000); continue; }
      if (status.status === 'succeed') {
        const pageUrl = new URL(deployment.page_url);
        if (pageUrl.protocol !== 'https:') throw new Error('Invalid deployed page URL');
        output(`page_url=${pageUrl.href}\n`);
        console.log(`Pages deployment succeeded: ${pageUrl.href}`);
        return;
      }
      if (['deployment_cancelled', 'deployment_failed', 'deployment_content_failed'].includes(status.status)) {
        throw new Error(`Pages deployment failed: ${status.status}`);
      }
      await sleep(5000);
    }
    throw new Error('Pages deployment timed out after ten minutes');
  } catch (error) {
    try { await request(statusPath + '/cancel', 'POST'); } catch { /* Preserve original error. */ }
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  deployPages().catch(error => { console.error(error.message); process.exitCode = 1; });
}
