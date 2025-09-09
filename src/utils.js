function parseRepoUrl(input) {
  // Accept forms: https://github.com/owner/repo, http://github.com/owner/repo, owner/repo
  try {
    let owner, repo;
    if (input.includes('github.com')) {
      const url = new URL(input);
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        [owner, repo] = parts;
      }
    } else {
      const parts = input.split('/').filter(Boolean);
      if (parts.length === 2) {
        [owner, repo] = parts;
      }
    }
    if (!owner || !repo) return null;
    // strip .git
    if (repo.endsWith('.git')) repo = repo.replace(/\.git$/, '');
    return { owner, repo };
  } catch (_) {
    return null;
  }
}

function makeProjectTree(treeResponse, opts = {}) {
  const { maxDepth = 2, maxLines = 120 } = opts;
  if (!treeResponse || !Array.isArray(treeResponse.tree)) return 'N/A';
  const nodes = treeResponse.tree;

  const parts = [];
  const sep = '  ';

  function addLine(depth, name) {
    parts.push(`${sep.repeat(depth)}- ${name}`);
  }

  // Build a simple map of paths => depth
  for (const n of nodes) {
    const depth = n.path.split('/').length - 1;
    if (depth > maxDepth) continue;
    addLine(depth, n.path + (n.type === 'tree' ? '/' : ''));
    if (parts.length >= maxLines) {
      parts.push('  …');
      break;
    }
  }
  return parts.join('\n');
}

module.exports = { parseRepoUrl, makeProjectTree };