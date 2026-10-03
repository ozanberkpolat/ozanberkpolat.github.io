// Chirpy/kramdown leftovers in the posts:
//   > text
//   {: .prompt-info }        -> <blockquote class="prompt-info">
// The IAL line is a lazy continuation, so it ends up inside the blockquote's last paragraph.
// A leading GitHub alert marker ("> [!WARNING]") is dropped (and used when no IAL is given).
// Any other IAL ({: .noshadow }, {: style="..." }) is removed.
const IAL_END = /\s*\{:\s*([^}]*)\}\s*$/;
const IAL_ANY = /\{:[^}]*\}/g;
const ALERT = { NOTE: 'info', IMPORTANT: 'info', TIP: 'tip', WARNING: 'warning', CAUTION: 'danger' };

function setPrompt(node, ial) {
  const m = /\.prompt-(info|tip|warning|danger)/.exec(ial);
  if (m) node.data = { ...node.data, hProperties: { className: [`prompt-${m[1]}`] } };
}

function blockquote(bq) {
  const first = bq.children[0];
  const head = first?.type === 'paragraph' && first.children[0]?.type === 'text' ? first.children[0] : null;
  if (head) {
    const a = /^\[!(\w+)\]\s*\n?/.exec(head.value);
    if (a) {
      head.value = head.value.slice(a[0].length);
      if (ALERT[a[1].toUpperCase()]) setPrompt(bq, `.prompt-${ALERT[a[1].toUpperCase()]}`);
    }
  }
  const last = bq.children.at(-1);
  const tail = last?.type === 'paragraph' ? last.children.at(-1) : null;
  if (tail?.type === 'text') {
    const m = IAL_END.exec(tail.value);
    if (m) { tail.value = tail.value.slice(0, m.index); setPrompt(bq, m[1]); }
  }
}

function walk(node) {
  if (!node.children) return;
  for (let i = node.children.length - 1; i >= 0; i--) {
    const c = node.children[i];
    if (c.type === 'paragraph') {
      const only = c.children.length === 1 && c.children[0].type === 'text' ? c.children[0].value.trim() : '';
      if (/^\{:[^}]*\}$/.test(only)) {                       // IAL on its own line after a blank line
        if (node.children[i - 1]?.type === 'blockquote') setPrompt(node.children[i - 1], only);
        node.children.splice(i, 1);
        continue;
      }
    }
    if (c.type === 'blockquote') blockquote(c);
    if (c.type === 'text') c.value = c.value.replace(IAL_ANY, '');
    walk(c);
  }
}

export default function remarkKramdown() {
  return tree => walk(tree);
}
