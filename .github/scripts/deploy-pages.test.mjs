import test from 'node:test';
import assert from 'node:assert/strict';
import { deployPages } from './deploy-pages.mjs';

const env = { GH_TOKEN: 'synthetic-job-token', GITHUB_REPOSITORY: 'example/portfolio',
  GITHUB_RUN_ID: '42', GITHUB_SHA: 'test-commit', PAGES_ARTIFACT_ID: '123',
  ACTIONS_ID_TOKEN_REQUEST_URL: 'https://identity.example/token',
  ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'synthetic-runtime-token' };
function fixture({ wrongRun = false, status = 'succeed', unavailable = false } = {}) {
  const calls = [], outputs = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    if (url === env.ACTIONS_ID_TOKEN_REQUEST_URL) return Response.json({ value: 'synthetic-oidc-token' });
    if (url.endsWith('/actions/artifacts/123')) return Response.json({ name: 'github-pages', expired: false,
      workflow_run: { id: wrongRun ? 99 : 42, head_sha: env.GITHUB_SHA } });
    if (url.endsWith('/pages/deployments')) {
      const body = JSON.parse(options.body);
      assert.equal(body.artifact_id, 123); assert.equal(body.oidc_token, 'synthetic-oidc-token');
      assert.equal(body.pages_build_version, env.GITHUB_SHA);
      return Response.json({ id: 5, page_url: 'https://example.github.io/portfolio/' });
    }
    if (url.endsWith('/cancel')) return new Response(null, { status: 204 });
    if (unavailable) return new Response(null, { status: 503 });
    return Response.json({ status });
  };
  return { calls, outputs, options: { env, fetcher, sleep: async () => {}, output: value => outputs.push(value) } };
}
test('deploys the uploaded artifact and outputs URL only after reported success', async () => {
  const f = fixture(); await deployPages(f.options);
  assert.deepEqual(f.outputs, ['page_url=https://example.github.io/portfolio/\n']);
  assert.equal(f.calls.some(call => call.url.includes('ListArtifacts') || call.url.includes('/runs/')), false);
});
test('rejects another workflow artifact before requesting identity or deploying', async () => {
  const f = fixture({ wrongRun: true });
  await assert.rejects(deployPages(f.options), /does not belong/);
  assert.equal(f.calls.length, 1); assert.equal(f.outputs.length, 0);
});
test('deployment failure propagates and attempts cancellation without success output', async () => {
  const f = fixture({ status: 'deployment_failed' });
  await assert.rejects(deployPages(f.options), /deployment_failed/);
  assert.equal(f.calls.at(-1).url.endsWith('/cancel'), true); assert.equal(f.outputs.length, 0);
});
test('status outages stop after bounded retries without reporting success', async () => {
  const f = fixture({ unavailable: true });
  await assert.rejects(deployPages(f.options), /HTTP 503/);
  assert.equal(f.calls.length, 9); assert.equal(f.outputs.length, 0);
});
test('a stalled deployment times out and attempts cancellation', async () => {
  const f = fixture({ status: 'deployment_in_progress' }); let ticks = 0;
  await assert.rejects(deployPages({ ...f.options, now: () => ticks++ * 600001 }), /timed out/);
  assert.equal(f.calls.at(-1).url.endsWith('/cancel'), true); assert.equal(f.outputs.length, 0);
});
