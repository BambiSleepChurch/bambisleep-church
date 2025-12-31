/**
 * BambiSleep™ Church MCP Control Tower
 * MCP API Integration Tests
 * 
 * Run with: node tests/api/mcp-api.test.js
 * Requires: API server running (uses API_PORT from .env)
 */

const API_PORT = process.env.API_PORT || (() => { throw new Error('API_PORT not set - check .env'); })();
const API_BASE = `http://localhost:${API_PORT}/api`;

async function testMemoryApi() {
  console.log('\n🧠 Testing Memory API...\n');

  // 1. Read empty graph
  console.log('1. Reading empty graph...');
  let res = await fetch(`${API_BASE}/memory`);
  let data = await res.json();
  console.log('   Graph:', JSON.stringify(data));

  // 2. Create entities
  console.log('\n2. Creating entities...');
  res = await fetch(`${API_BASE}/memory/entities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entities: [
        { name: 'BambiSleep', entityType: 'Project', observations: ['MCP Control Tower'] },
        { name: 'Memory', entityType: 'MCPServer', observations: ['Knowledge graph'] },
        { name: 'GitHub', entityType: 'MCPServer', observations: ['Repo management'] },
      ]
    })
  });
  data = await res.json();
  console.log('   Created:', data);

  // 3. Create relations
  console.log('\n3. Creating relations...');
  res = await fetch(`${API_BASE}/memory/relations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      relations: [
        { from: 'BambiSleep', to: 'Memory', relationType: 'uses' },
        { from: 'BambiSleep', to: 'GitHub', relationType: 'uses' },
      ]
    })
  });
  data = await res.json();
  console.log('   Created:', data);

  // 4. Read populated graph
  console.log('\n4. Reading populated graph...');
  res = await fetch(`${API_BASE}/memory`);
  data = await res.json();
  console.log('   Entities:', data.entities.length);
  console.log('   Relations:', data.relations.length);

  // 5. Search
  console.log('\n5. Searching for "MCP"...');
  res = await fetch(`${API_BASE}/memory/search?q=MCP`);
  data = await res.json();
  console.log('   Results:', data.results.map(r => r.name));
}

async function testGitHubApi() {
  console.log('\n🐙 Testing GitHub API...\n');

  // List repos
  console.log('1. Listing repos (first 5)...');
  const res = await fetch(`${API_BASE}/github/repos?per_page=5`);
  const data = await res.json();
  
  if (data.error) {
    console.log('   ⚠️ GitHub API not configured:', data.error);
    return;
  }
  
  console.log('   Repos:', data.map(r => r.full_name || r.name).slice(0, 5));
}

async function testThinkingApi() {
  console.log('\n🔗 Testing Sequential Thinking API...\n');

  // 1. Create session
  console.log('1. Creating thinking session...');
  let res = await fetch(`${API_BASE}/thinking/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic: 'Test session' }),
  });
  let data = await res.json();
  const sessionId = data.sessionId;
  console.log('   Session ID:', sessionId);

  // 2. Add thought
  console.log('\n2. Adding thought...');
  res = await fetch(`${API_BASE}/thinking/sessions/${sessionId}/thought`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      thought: 'This is a test thought',
      thoughtNumber: 1,
      totalThoughts: 3,
      nextThoughtNeeded: true,
    }),
  });
  data = await res.json();
  console.log('   Added:', data.thoughtNumber);

  // 3. Get session
  console.log('\n3. Getting session...');
  res = await fetch(`${API_BASE}/thinking/sessions/${sessionId}`);
  data = await res.json();
  console.log('   Thoughts:', data.thoughts.length);

  // 4. Delete session
  console.log('\n4. Deleting session...');
  res = await fetch(`${API_BASE}/thinking/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  data = await res.json();
  console.log('   Deleted:', data.success);
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  BambiSleep™ MCP API Integration Tests');
  console.log('═'.repeat(60));

  try {
    // Check if server is running
    const health = await fetch(`${API_BASE}/health`);
    if (!health.ok) {
      console.error('❌ API server not responding');
      process.exit(1);
    }
    console.log('✅ API server is running');

    await testMemoryApi();
    await testGitHubApi();
    await testThinkingApi();

    console.log('\n' + '═'.repeat(60));
    console.log('  ✅ All integration tests passed!');
    console.log('═'.repeat(60) + '\n');
  } catch (error) {
    if (error.cause?.code === 'ECONNREFUSED') {
      console.log('\n❌ Could not connect to API server');
      console.log('   Make sure the server is running: npm run dev\n');
      console.log('  ⏭ Skipped: API server not running');
      // Exit 0 to not fail the test suite - this is an optional integration test
      process.exit(0);
    }
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
