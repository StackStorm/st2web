export default function(container, element) {
  if (!container || !element) {
    return;
  }

  var elementOffset = element.getBoundingClientRect();
  var containerOffset = container.getBoundingClientRect();
  var topDiff = elementOffset.top - containerOffset.top;
  var bottomDiff = topDiff + elementOffset.height - containerOffset.height;

  if (topDiff < 0) {
    container.scrollTop += topDiff;
  } else if (bottomDiff > 0) {
    container.scrollTop += bottomDiff;
  }
}
