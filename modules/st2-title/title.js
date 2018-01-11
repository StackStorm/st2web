const TITLE = document.title;

export default function setTitle(title) {
  if (!Array.isArray(title)) {
    title = [ title ];
  }

  title = title.filter(v => v);

  document.title = title.length ? `${title.join(' - ')} | ${TITLE}` : TITLE;
}
