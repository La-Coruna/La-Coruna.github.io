// Keep the original source readable if the diagram renderer is unavailable.
const diagrams = [...document.querySelectorAll('.page__content code.language-mermaid, .page__content .language-mermaid code')];
if (diagrams.length) {
  try {
    const { default: mermaid } = await import('https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs');
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral' });
    for (const [index, source] of diagrams.entries()) {
      try {
        const { svg } = await mermaid.render(`portfolio-diagram-${index}`, source.textContent);
        const figure = document.createElement('figure');
        figure.className = 'portfolio-diagram';
        figure.setAttribute('aria-label', '프로젝트 아키텍처 흐름도');
        figure.innerHTML = svg;
        (source.closest('.highlighter-rouge') || source.closest('pre')).replaceWith(figure);
      } catch (error) {
        console.warn('Portfolio diagram could not be rendered.', error);
      }
    }
  } catch (error) {
    console.warn('Portfolio diagram renderer unavailable; showing source.', error);
  }
}
