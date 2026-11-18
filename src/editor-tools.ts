import { compareTextLines, compareTextWords, compareTextCharacters, findAndReplace, analyzeReadability } from './editor-utils';

function byId<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error('Missing editor element: ' + id);
  return node as T;
}
function show(id: string, text: string) { byId<HTMLElement>(id).textContent = text; }
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    show('copy-status', 'Copied.');
  } catch {
    show('copy-status', 'Clipboard unavailable. Select the output and copy manually.');
  }
}
const activeTool = document.body.dataset.editorTool;

if (activeTool === 'diff') {
  const original = byId<HTMLTextAreaElement>('diff-original');
  const revised = byId<HTMLTextAreaElement>('diff-revised');
  const mode = byId<HTMLSelectElement>('diff-mode');
  const view = byId<HTMLSelectElement>('diff-view');
  const ignoreCase = byId<HTMLInputElement>('diff-ignore-case');
  const ignoreWhitespace = byId<HTMLInputElement>('diff-ignore-whitespace');
  const output = byId<HTMLElement>('diff-output');
  let annotated = '';
  let changedNodes: HTMLElement[] = [];
  let currentChange = -1;
  const navigate = (direction:number) => {
    if(!changedNodes.length){show('diff-location','No differences to navigate.');return;}
    if(currentChange>=0)changedNodes[currentChange]?.classList.remove('editor-diff-active');
    currentChange=(currentChange+direction+changedNodes.length)%changedNodes.length;
    const target=changedNodes[currentChange];
    target.classList.add('editor-diff-active');target.scrollIntoView({block:'nearest',behavior:'smooth'});
    show('diff-location','Change '+(currentChange+1)+' of '+changedNodes.length);
  };
  const compare = () => {
    changedNodes=[];currentChange=-1;show('diff-location','No change selected');
    output.replaceChildren();
    if (mode.value !== 'lines' && view.value === 'side-by-side') view.value = 'unified';
    const unit = mode.value === 'characters' ? 'characters' : mode.value === 'words' ? 'words' : 'lines';
    show('diff-added-label', 'Added ' + unit);
    show('diff-removed-label', 'Removed ' + unit);
    show('diff-unchanged-label', 'Unchanged ' + unit);
    try {
      const result = mode.value === 'words'
        ? compareTextWords(original.value, revised.value, { ignoreCase: ignoreCase.checked })
        : mode.value === 'characters'
        ? compareTextCharacters(original.value, revised.value, { ignoreCase: ignoreCase.checked })
        : compareTextLines(original.value, revised.value, { ignoreCase: ignoreCase.checked, ignoreWhitespace: ignoreWhitespace.checked });
      show('diff-added', String(result.added));
      show('diff-removed', String(result.removed));
      show('diff-unchanged', String(result.unchanged));
      annotated = mode.value === 'characters'
        ? result.lines.map((line) => line.kind === 'added' ? '[+' + line.value + ']' : line.kind === 'removed' ? '[-' + line.value + ']' : line.value).join('')
        : result.lines.map((line) => (line.kind === 'added' ? '+ ' : line.kind === 'removed' ? '- ' : '  ') + line.value).join(mode.value === 'words' ? ' ' : '\n');
      if (!result.lines.length) {
        show('diff-status', 'Enter an original version and a revised version to compare.');
        output.textContent = 'The highlighted line comparison will appear here.';
        return;
      }
      show('diff-status', result.added || result.removed
        ? 'Changed ' + unit + ' are highlighted. Changes are local; source drafts remain unchanged.'
        : 'No differences under the selected comparison settings.');
      if (mode.value === 'lines' && view.value === 'side-by-side') {
        const columns = document.createElement('div');
        columns.className = 'editor-diff-columns';
        for (const [label, kinds] of [
          ['Original', ['equal', 'removed']],
          ['Revised', ['equal', 'added']]
        ] as const) {
          const column = document.createElement('div');
          column.className = 'editor-diff-column';
          const heading = document.createElement('strong');
          heading.textContent = label;
          column.appendChild(heading);
          for (const line of result.lines.filter(item => kinds.includes(item.kind as never))) {
            const row = document.createElement('div');
            row.className = 'editor-diff-line editor-diff-' + line.kind;
            row.textContent = line.value || ' ';
            if (line.kind !== 'equal') changedNodes.push(row);
            column.appendChild(row);
          }
          columns.appendChild(column);
        }
        output.appendChild(columns);
      } else {
        const fragment = document.createDocumentFragment();
        for (const line of result.lines) {
          const tokenMode = mode.value === 'words' || mode.value === 'characters';
          const row = document.createElement(tokenMode ? 'span' : 'div');
          row.className = (mode.value === 'words' ? 'editor-diff-token ' : mode.value === 'characters' ? 'editor-diff-character ' : 'editor-diff-line ') + 'editor-diff-' + line.kind;
          const prefix = line.kind === 'added' ? '+ ' : line.kind === 'removed' ? '− ' : '  ';
          row.textContent = mode.value === 'words' ? line.value + ' ' : mode.value === 'characters' ? line.value : prefix + line.value;
          if (line.kind !== 'equal') changedNodes.push(row);
          fragment.appendChild(row);
        }
        output.appendChild(fragment);
      }
    } catch (error) {
      annotated = '';
      show('diff-status', error instanceof Error ? error.message : 'Unable to compare these inputs.');
      show('diff-added', '—'); show('diff-removed', '—'); show('diff-unchanged', '—');
    }
  };
  byId<HTMLButtonElement>('diff-prev').addEventListener('click',()=>navigate(-1));
  byId<HTMLButtonElement>('diff-next').addEventListener('click',()=>navigate(1));
  byId<HTMLButtonElement>('compare-button').addEventListener('click', compare);
  byId<HTMLButtonElement>('sample-button').addEventListener('click', () => {
    original.value = 'Project update\nRelease date: Monday\nBudget: $50\nReview required';
    revised.value = 'Project update\nRelease date: Tuesday\nBudget: $50\nReview complete';
    compare();
  });
  byId<HTMLButtonElement>('copy-button').addEventListener('click', () => void copyText(annotated));
  [mode, view, ignoreCase, ignoreWhitespace].forEach((control) => control.addEventListener('change', compare));
  const importLocal = (id: string, destination: HTMLTextAreaElement) => {
    byId<HTMLInputElement>(id).addEventListener('change', async (event) => {
      const file = (event.currentTarget as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 256 * 1024) { show('diff-status', 'File is over 256 KB. Choose a smaller local text file.'); return; }
      try {
        const text = await file.text();
        if (text.includes('\0') || text.length > 100_000) {
          show('diff-status', 'Unsupported binary input or over 100,000 characters.'); return;
        }
        destination.value = text;
        compare();
      } catch {
        show('diff-status', 'Could not read the selected local file.');
      }
    });
  };
  importLocal('diff-original-file', original);
  importLocal('diff-revised-file', revised);
  compare();
}

if (activeTool === 'replace') {
  const original = byId<HTMLTextAreaElement>('replace-original');
  const query = byId<HTMLInputElement>('replace-query');
  const replacement = byId<HTMLInputElement>('replace-with');
  const caseSensitive = byId<HTMLInputElement>('replace-case');
  const wholeWords = byId<HTMLInputElement>('replace-words');
  const output = byId<HTMLTextAreaElement>('replace-output');
  let mode: 'first' | 'all' = 'all';
  const update = () => {
    const result = findAndReplace(original.value, query.value, replacement.value, mode, {
      caseSensitive: caseSensitive.checked, wholeWords: wholeWords.checked
    });
    output.value = result.output;
    show('replace-matches', String(result.matches));
    show('replace-applied', String(result.replaced));
    show('replace-status', !query.value ? 'Enter a literal word or phrase to search.'
      : result.matches ? 'Preview ready. Original text is unchanged until you select Use as input.'
      : 'No matches under the selected options.');
  };
  byId<HTMLButtonElement>('replace-first').addEventListener('click', () => { mode = 'first'; update(); });
  byId<HTMLButtonElement>('replace-all').addEventListener('click', () => { mode = 'all'; update(); });
  [original, query, replacement].forEach((input) => input.addEventListener('input', update));
  [caseSensitive, wholeWords].forEach((input) => input.addEventListener('change', update));
  byId<HTMLButtonElement>('sample-button').addEventListener('click', () => {
    original.value = 'Color the color blocks. A colorful color scheme needs care.';
    query.value = 'color';
    replacement.value = 'shade';
    caseSensitive.checked = false; wholeWords.checked = true; mode = 'all'; update();
  });
  byId<HTMLButtonElement>('copy-button').addEventListener('click', () => void copyText(output.value));
  byId<HTMLButtonElement>('use-output-button').addEventListener('click', () => {
    original.value = output.value; update(); original.focus();
  });
  update();
}

if (activeTool === 'readability') {
  const input = byId<HTMLTextAreaElement>('readability-input');
  const update = () => {
    const result = analyzeReadability(input.value);
    show('readability-words', String(result.words));
    show('readability-sentences', String(result.sentences));
    show('readability-ease', result.readingEase === null ? '—' : result.readingEase.toFixed(1));
    show('readability-grade', result.gradeLevel === null ? '—' : Math.max(0, result.gradeLevel).toFixed(1));
    show('readability-avg', result.averageWordsPerSentence.toFixed(1));
    show('readability-long', String(result.longSentences));
    show('readability-time', result.words ? Math.max(1, Math.ceil(result.readingMinutes)) + ' min' : '—');
    show('readability-syllables', String(result.syllables));
    if (!result.words) {
      show('readability-status', 'Enter English text to estimate readability.');
    } else if (result.isShortSample) {
      show('readability-status', 'Short sample: fewer than 30 English words. Treat the score as highly unstable.');
    } else if (result.readingEase !== null && result.readingEase >= 60) {
      show('readability-status', 'The estimate suggests comparatively accessible English prose. Review clarity with real readers.');
    } else {
      show('readability-status', 'The estimate suggests denser English prose. Review sentence length, jargon and unfamiliar words.');
    }
  };
  input.addEventListener('input', update);
  byId<HTMLButtonElement>('sample-button').addEventListener('click', () => {
    input.value = 'We built a simple tool that helps people write clearer messages. ' +
      'You can paste a paragraph and see the word count. The tool also estimates reading time and highlights long sentences. ' +
      'These numbers can help you edit, but they cannot tell you whether a reader will understand every idea.';
    update();
  });
  byId<HTMLButtonElement>('copy-button').addEventListener('click', () => void copyText(input.value));
  update();
}
