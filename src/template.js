function percentifyLanguages(langs) {
  const total = Object.values(langs || {}).reduce((a, b) => a + b, 0);
  const entries = Object.entries(langs || {});
  if (!total || !entries.length) return 'Unknown';
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${(v * 100 / total).toFixed(1)}%`)
    .join(', ');
}

function buildReadme({ repo, metadata, sections, projectStructure }) {
  const title = repo.name || 'Project';
  const homepage = repo.homepage ? `\n\n> Live / Docs: ${repo.homepage}` : '';
  const licenseLine = metadata.license
    ? `This project is licensed under the **${metadata.license}** license. See \`LICENSE\` for details.`
    : `No license detected. Consider adding a LICENSE (MIT, Apache-2.0, GPL-3.0, etc.).`;

  const techStack = (sections.techStack || []).join(', ');
  const languages = percentifyLanguages(metadata.languages);

  return `# ${title}\n\n${sections.description || metadata.description || ''}${homepage}\n\n` +
`---\n\n` +
`## Features\n${(sections.features || []).map(f => `- ${f}`).join('\n') || '- ...'}\n\n` +
`## Tech Stack\n- ${techStack || languages}\n\n` +
`## Installation\n${(sections.installation || []).map((s, i) => `${i+1}. ${s}`).join('\n') || '1. Clone the repo\n2. Install dependencies\n3. Run the app'}\n\n` +
`## Usage\n${sections.usage || 'Add usage examples here.'}\n\n` +
`## Project Structure\n\n\`\`\`text\n${projectStructure}\n\`\`\`\n\n` +
`## License\n${licenseLine}\n\n` +
`---\n\n` +
`> Generated with a README Generator (Node.js + GitHub API + Google Gemini).`;
}

module.exports = { buildReadme };