require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');





const { parseRepoUrl, makeProjectTree } = require('./src/utils');
const {
  fetchRepo,
  fetchReadme,
  fetchLanguages,
  fetchTopics,
  fetchPackageJson,
  fetchTree
} = require('./src/github');
const { generateSections } = require('./src/gemini');
const { buildReadme } = require('./src/template');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(helmet());
app.use(morgan('dev'));

// Serve the simple frontend
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/generate-readme', async (req, res) => {
  try {
    const { repoUrl } = req.body || {};
    if (!repoUrl) {
      return res.status(400).json({ ok: false, error: 'repoUrl is required' });
    }

    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      return res.status(400).json({ ok: false, error: 'Provide a valid GitHub repo URL like https://github.com/owner/repo' });
    }

    const { owner, repo } = parsed;

    // 1) Basic repo info
    const repoData = await fetchRepo(owner, repo);

    // 2) Fetch in parallel: readme text, languages, topics, package.json, full tree
    const [readmeRaw, languages, topics, pkg, tree] = await Promise.all([
      fetchReadme(owner, repo).catch(() => null),
      fetchLanguages(owner, repo).catch(() => ({})),
      fetchTopics(owner, repo).catch(() => []),
      fetchPackageJson(owner, repo, repoData.default_branch).catch(() => null),
      fetchTree(owner, repo, repoData.default_branch).catch(() => null)
    ]);

    const projectStructure = tree ? makeProjectTree(tree, { maxDepth: 2, maxLines: 120 }) : 'Not available';

    // 3) Build a compact metadata object Gemini can reason about
    const metadata = {
      name: repoData.name,
      full_name: repoData.full_name,
      description: repoData.description,
      homepage: repoData.homepage,
      topics,
      languages,
      license: repoData.license ? repoData.license.spdx_id || repoData.license.name : null,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      open_issues: repoData.open_issues_count,
      default_branch: repoData.default_branch,
      package_json: pkg,
      has_readme: Boolean(readmeRaw),
    };

    // 4) Ask Gemini to draft sections
    const sections = await generateSections(metadata, readmeRaw);

    // 5) Compose a professional README markdown
    const markdown = buildReadme({
      repo: repoData,
      metadata,
      sections,
      projectStructure
    });

    return res.json({ ok: true, markdown });
  } catch (err) {
    console.error(err);
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || err.message || 'Server error';
    res.status(status).json({ ok: false, error: message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));