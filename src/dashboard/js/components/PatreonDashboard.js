/**
 * BambiSleep™ Church MCP Control Tower
 * Patreon Dashboard Component
 */


/**
 * Render Patreon identity card
 * @param {Object} identity - Identity data
 * @returns {string} HTML
 */
export function renderPatreonIdentity(identity) {
  if (!identity || !identity.data) {
    return `<div class="empty-state">
      <span class="empty-icon">🎨</span>
      <h3>No Identity Data</h3>
      <p>Connect to Patreon to view your identity.</p>
    </div>`;
  }

  const user = identity.data.attributes;
  return `
    <div class="patreon-identity glass-card">
      <div class="identity-header">
        <img src="${user.image_url || '/avatar-placeholder.png'}" alt="${user.full_name}" class="identity-avatar" />
        <div class="identity-info">
          <h3 class="identity-name">${user.full_name || 'Unknown'}</h3>
          <p class="identity-email">${user.email || 'No email'}</p>
          <span class="identity-type badge">${user.is_creator ? 'Creator' : 'Patron'}</span>
        </div>
      </div>
      <div class="identity-stats">
        <div class="stat-item">
          <span class="stat-label">Created</span>
          <span class="stat-value">${new Date(user.created).toLocaleDateString()}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Patron Status</span>
          <span class="stat-value">${user.patron_status || 'none'}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Patreon campaigns list
 * @param {Object} campaigns - Campaigns data
 * @returns {string} HTML
 */
export function renderPatreonCampaigns(campaigns) {
  if (!campaigns || !campaigns.data || campaigns.data.length === 0) {
    return `<div class="empty-state">
      <span class="empty-icon">📊</span>
      <h3>No Campaigns</h3>
      <p>You don't have any active campaigns.</p>
    </div>`;
  }

  return `
    <div class="campaigns-grid">
      ${campaigns.data.map(campaign => {
        const attrs = campaign.attributes;
        return `
          <div class="campaign-card glass-card" data-campaign-id="${campaign.id}">
            <div class="campaign-header">
              ${attrs.image_url ? `<img src="${attrs.image_url}" alt="${attrs.name}" class="campaign-image" />` : ''}
              <h3 class="campaign-title">${attrs.name || 'Untitled Campaign'}</h3>
            </div>
            <div class="campaign-stats">
              <div class="stat-item">
                <span class="stat-icon">👥</span>
                <span class="stat-value">${attrs.patron_count || 0}</span>
                <span class="stat-label">Patrons</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">💰</span>
                <span class="stat-value">$${((attrs.pledge_sum || 0) / 100).toFixed(2)}</span>
                <span class="stat-label">Monthly</span>
              </div>
            </div>
            <div class="campaign-actions">
              <button class="btn btn-small btn-outline" onclick="window.Dashboard.serverAction('patreon', 'members', '${campaign.id}')">
                View Members
              </button>
              <button class="btn btn-small btn-primary" onclick="window.Dashboard.serverAction('patreon', 'posts', '${campaign.id}')">
                View Posts
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Render Patreon members list
 * @param {Object} members - Members data
 * @returns {string} HTML
 */
export function renderPatreonMembers(members) {
  if (!members || !members.data || members.data.length === 0) {
    return `<div class="empty-state">
      <span class="empty-icon">👥</span>
      <h3>No Members</h3>
      <p>This campaign has no members yet.</p>
    </div>`;
  }

  return `
    <div class="members-table">
      <table class="data-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Status</th>
            <th>Tier</th>
            <th>Since</th>
            <th>Lifetime</th>
          </tr>
        </thead>
        <tbody>
          ${members.data.map(member => {
            const attrs = member.attributes;
            const user = member.relationships?.user?.data || {};
            return `
              <tr>
                <td>${user.full_name || attrs.email || 'Unknown'}</td>
                <td><span class="badge ${attrs.patron_status === 'active_patron' ? 'success' : 'secondary'}">${attrs.patron_status || 'unknown'}</span></td>
                <td>${attrs.currently_entitled_amount_cents ? `$${(attrs.currently_entitled_amount_cents / 100).toFixed(2)}` : 'N/A'}</td>
                <td>${attrs.pledge_relationship_start ? new Date(attrs.pledge_relationship_start).toLocaleDateString() : 'N/A'}</td>
                <td>$${((attrs.lifetime_support_cents || 0) / 100).toFixed(2)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Render Patreon posts list
 * @param {Object} posts - Posts data
 * @returns {string} HTML
 */
export function renderPatreonPosts(posts) {
  if (!posts || !posts.data || posts.data.length === 0) {
    return `<div class="empty-state">
      <span class="empty-icon">📝</span>
      <h3>No Posts</h3>
      <p>No posts found for this campaign.</p>
    </div>`;
  }

  return `
    <div class="posts-list">
      ${posts.data.map(post => {
        const attrs = post.attributes;
        return `
          <div class="post-card glass-card">
            <div class="post-header">
              <h3 class="post-title">${attrs.title || 'Untitled Post'}</h3>
              <span class="post-date">${new Date(attrs.published_at || attrs.created_at).toLocaleDateString()}</span>
            </div>
            ${attrs.content ? `<div class="post-excerpt">${attrs.content.substring(0, 200)}...</div>` : ''}
            <div class="post-meta">
              <span class="post-type badge">${attrs.post_type || 'post'}</span>
              <span class="post-tier">${attrs.min_cents_pledged_to_view ? `$${(attrs.min_cents_pledged_to_view / 100).toFixed(2)}+ tier` : 'Public'}</span>
              ${attrs.like_count ? `<span class="post-likes">❤️ ${attrs.like_count}</span>` : ''}
              ${attrs.comment_count ? `<span class="post-comments">💬 ${attrs.comment_count}</span>` : ''}
            </div>
            ${attrs.url ? `<a href="${attrs.url}" target="_blank" class="btn btn-small btn-outline">View on Patreon</a>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Initialize Patreon dashboard
 */
export function initPatreonDashboard() {
  console.log('✅ Patreon dashboard initialized');
}
