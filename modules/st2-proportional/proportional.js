export default function() {
  let debounced = null;

  return function(ref) {
    if (!ref) {
      window.removeEventListener('resize', debounced, false);
      debounced = null;
      return;
    }

    debounced = _.debounce(makeProportional.bind(null, ref), 200);
    window.addEventListener('resize', debounced, false);
  };
}

function makeProportional(container) {
  const children = Array.prototype.slice.call(container.children);
  const childrenByWidth = children.map((child) => {
    if (child.style.width) {
      child.style.width = null;
    }

    return {
      element: child,
      width: child.offsetWidth,
    };
  });
  childrenByWidth.sort(({ width: a }, { width: b }) => b - a);
  let childrenWidth = childrenByWidth.reduce((width, child) => width + child.width, 0);

  const containerStyle = getComputedStyle(container);
  const containerWidth = container.clientWidth
    - parseInt(containerStyle.getPropertyValue('padding-left'), 10)
    - parseInt(containerStyle.getPropertyValue('padding-right'), 10);

  if (childrenWidth <= containerWidth) {
    return;
  }

  const childrenToShrink = [];
  while (childrenToShrink.length < children.length && childrenWidth > containerWidth) {
    childrenToShrink.push(childrenByWidth[childrenToShrink.length]);

    const nextChild = childrenByWidth[childrenToShrink.length];
    const newWidth = nextChild ? nextChild.width : containerWidth / children.length;

    childrenToShrink.forEach((child) => child.width = newWidth);
    childrenWidth = childrenByWidth.reduce((width, child) => width + child.width, 0);
  }

  const extraSpace = (containerWidth - childrenWidth) / childrenToShrink.length;
  childrenToShrink.forEach((child) => {
    // Note: Currently only works with box-sizing: border-box
    child.element.style.width = `${child.width + extraSpace}px`;
  });
}
