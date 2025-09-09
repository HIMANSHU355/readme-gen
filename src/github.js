const axios = require('axios');

const api = axios.create({
  baseURL: 'https://api.github.com',
  headers: { 'Accept': 'application/vnd.github+json' }
});

if (process.env.GITHUB_TOKEN) {
  api.defaults.headers.common['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
}

async function fetchRepo(owner, repo) {
  const { data } = await api.get(`/repos/${owner}/${repo}`);
  return data;
}

async function fetchReadme(owner, repo) {
  const { data } = await api.get(`/repos/${owner}/${repo}/readme`);
  const buff = Buffer.from(data.content, 'base64');
  return buff.toString('utf8');
}

async function fetchLanguages(owner, repo) {
  const { data } = await api.get(`/repos/${owner}/${repo}/languages`);
  return data; // { JS: bytes, ... }
}

async function fetchTopics(owner, repo) {
  const { data } = await api.get(`/repos/${owner}/${repo}/topics`);
  return data.names || [];
}

async function fetchPackageJson(owner, repo, ref) {
  try {
    const { data } = await api.get(`/repos/${owner}/${repo}/contents/package.json`, { params: { ref } });
    const buff = Buffer.from(data.content, 'base64');
    return JSON.parse(buff.toString('utf8'));
  } catch (e) {
    return null; // not a JS project (no package.json)
  }
}

async function fetchTree(owner, repo, ref) {
  // You can use the branch name as tree SHA here
  const { data } = await api.get(`/repos/${owner}/${repo}/git/trees/${ref}`, { params: { recursive: 1 } });
  return data; // { tree: [ { path, type, mode, sha, size } ], truncated }
}

module.exports = {
  fetchRepo,
  fetchReadme,
  fetchLanguages,
  fetchTopics,
  fetchPackageJson,
  fetchTree
};