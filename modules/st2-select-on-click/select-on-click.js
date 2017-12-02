export default function(element) {
  if (!element) {
    return;
  }

  element.addEventListener('click', () => {
    var range = document.createRange();
    range.selectNodeContents(element);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }, true);
}
