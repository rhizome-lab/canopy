export const JSON_TREE_CSS = `
.json-value { font-family: monospace; font-size: 13px; }
.json-null   { color: #808080; }
.json-bool   { color: #569cd6; }
.json-number { color: #b5cea8; }
.json-string { color: #ce9178; }
.json-key    { color: #9cdcfe; }
.json-array, .json-object { font-family: monospace; font-size: 13px; }
details > summary { cursor: pointer; list-style: none; user-select: none; }
details > summary::before { content: '▶ '; font-size: 10px; }
details[open] > summary::before { content: '▼ '; font-size: 10px; }
details > ul { margin: 0 0 0 20px; padding: 0; list-style: none; }
details > ul > li { padding: 1px 0; }
`;
