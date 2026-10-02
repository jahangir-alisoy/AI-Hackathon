const ARTICLE_HEADER = /^---\s*(\d+)\.\s*(.*?)\s*---$/;

export class ReadingBacklogParser {
  parse(text, ref) {
    const articles = [];
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      const header = line.match(ARTICLE_HEADER);
      if (header) {
        articles.push({ id: `article-${header[1]}`, ref: `${ref} #${header[1]}`, title: header[2], meta: '', text: '', metaOpen: false });
        continue;
      }
      const current = articles[articles.length - 1];
      if (!current || !line) continue;
      if (!current.meta && line.startsWith('(')) current.metaOpen = true;
      if (current.metaOpen) {
        current.meta = `${current.meta} ${line}`.trim();
        current.metaOpen = !line.endsWith(')');
      } else {
        current.text = `${current.text} ${line}`.trim();
      }
    }
    return articles.map(({ metaOpen, ...article }) => ({ ...article, meta: article.meta.replace(/^\(|\)$/g, '') }));
  }
}
