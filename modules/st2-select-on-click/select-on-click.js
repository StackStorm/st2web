export default function(element) {
  if (!element) {
    return;
  }

  element.addEventListener('click', () => {
    const range = document.createRange();
    range.selectNodeContents(element);

    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }, true);
}
