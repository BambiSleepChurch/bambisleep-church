/**
 * MCP API Integration Tests
 * Run with: node src/api/mcp-api.test.js
 */

const API_BASE = 'http://localhost:8080/api';

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

async function testHuggingFaceApi() {
  console.log('\n\n🤗 Testing HuggingFace API...\n');

  // Search models
  console.log('1. Searching models for "llama"...');
  const res = await fetch(`${API_BASE}/huggingface/models?q=llama&limit=3`);
  const data = await res.json();
  
  if (Array.isArray(data)) {
    console.log('   Found:', data.length, 'models');
    data.slice(0, 3).forEach(m => {
      console.log(`   - ${m.id} (${m.downloads?.toLocaleString()} downloads)`);
    });
  } else {
    console.log('   Error:', data.error || 'Unknown error');
  }
}

async function testGitHubApi() {
  console.log('\n\n🐙 Testing GitHub API...\n');

  // Search repos (no auth required)
  console.log('1. Searching repos for "mcp server"...');
  const res = await fetch(`${API_BASE}/github/search/repos?q=mcp+server`);
  const data = await res.json();
  
  if (data.items) {
    console.log('   Found:', data.total_count, 'repos');
    data.items.slice(0, 3).forEach(r => {
      console.log(`   - ${r.full_name} ⭐${r.stargazers_count}`);
    });
  } else {
    console.log('   Error:', data.error || 'Unknown error');
  }
}

async function main() {
  console.log('🌸 MCP API Integration Tests 🌸');
  console.log('================================');

  try {
    await testMemoryApi();
    await testHuggingFaceApi();
    await testGitHubApi();
    console.log('\n\n✅ All tests completed!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
