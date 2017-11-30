import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

import FlexTableTitle from '../flex-table-title.component.js';

function render(component) {
  const renderer = new ShallowRenderer();
  renderer.render(component);
  return renderer.getRenderOutput();
}

describe('FlexTableTitle component', () => {
  it('renders an element', () => {
    const props = {
      icon: 'icon.png',
      onToggle: sinon.spy(),
    };

    const c = render(<FlexTableTitle {...props}>some child node</FlexTableTitle>);

    expect(c.props.className).to.be.equal('st2-flex-table__caption st2-flex-table__caption--pack');

    c.props.onClick();
    expect(props.onToggle).to.be.calledOnce;

    const [ imgComponent, headingComponent ] = c.props.children;
    expect(imgComponent.props.src).to.be.equal(props.icon);

    expect(headingComponent.props.className).to.be.equal('st2-flex-table__caption-title');
    expect(headingComponent.props.children).to.be.equal('some child node');
  });

  it('renders an element without icon', () => {
    const props = {
      onToggle: sinon.spy(),
    };

    const c = render(<FlexTableTitle {...props}>some child node</FlexTableTitle>);

    expect(c.props.className).to.be.equal('st2-flex-table__caption');

    c.props.onClick();
    expect(props.onToggle).to.be.calledOnce;

    const [ imgComponent, headingComponent ] = c.props.children;
    expect(imgComponent).to.be.false;

    expect(headingComponent.props.className).to.be.equal('st2-flex-table__caption-title');
    expect(headingComponent.props.children).to.be.equal('some child node');
  });
});
