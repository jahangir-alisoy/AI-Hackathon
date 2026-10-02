export const sourceTag = (sources) => (sources?.length ? ` [${[...new Set(sources)].join('] [')}]` : '');

export const bulletList = (lines) => lines.map((line) => `- ${line}`).join('\n');
