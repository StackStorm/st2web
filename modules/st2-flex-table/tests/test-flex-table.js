import React from 'react';
import TestUtils from 'react-addons-test-utils';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

import FlexTable from '../flex-table.component.js';

function render(component) {
  const renderer = TestUtils.createRenderer();
  renderer.render(component);
  return renderer.getRenderOutput();
}

describe('FlexTable component', () => {
  it('renders an element', () => {
    const props = {
      title: 'Some title',
      collapsed: false,
      icon: 'icon.png',
      onToggle: sinon.spy()
    };

    const c = render(<FlexTable {...props}>some child node</FlexTable>);

    expect(c.props.className).to.be.equal('st2-flex-table');

    const [ titleComponent, ...restComponents ] = c.props.children;
    expect(titleComponent.props.icon).to.be.equal(props.icon);
    expect(titleComponent.props.children).to.be.equal(props.title);

    titleComponent.props.onToggle();
    expect(props.onToggle).to.be.calledOnce;

    expect(restComponents).to.have.length(1);
    expect(restComponents[0]).to.be.equal('some child node');
  });

  it('renders an element without icon', () => {
    const props = {
      title: 'Some title',
      collapsed: false,
      onToggle: sinon.spy()
    };

    const c = render(<FlexTable {...props}>some child node</FlexTable>);

    expect(c.props.className).to.be.equal('st2-flex-table');

    const [ titleComponent, ...restComponents ] = c.props.children;
    expect(titleComponent.props.icon).to.be.undefined;
    expect(titleComponent.props.children).to.be.equal(props.title);

    titleComponent.props.onToggle();
    expect(props.onToggle).to.be.calledOnce;

    expect(restComponents).to.have.length(1);
    expect(restComponents[0]).to.be.equal('some child node');
  });

  it('renders an element without title', () => {
    const props = {
      collapsed: false,
      icon: 'icon.png',
      onToggle: sinon.spy()
    };

    const c = render(<FlexTable {...props}>some child node</FlexTable>);

    expect(c.props.className).to.be.equal('st2-flex-table');

    const [ titleComponent, ...restComponents ] = c.props.children;
    expect(titleComponent).to.be.false;

    expect(restComponents).to.have.length(1);
    expect(restComponents[0]).to.be.equal('some child node');
  });

  it('renders an element collapsed', () => {
    const props = {
      title: 'Some title',
      collapsed: true,
      icon: 'icon.png',
      onToggle: sinon.spy()
    };

    const c = render(<FlexTable {...props}>some child node</FlexTable>);

    expect(c.props.className).to.be.equal('st2-flex-table st2-flex-table--collapsed');

    const [ titleComponent, ...restComponents ] = c.props.children;
    expect(titleComponent.props.icon).to.be.equal(props.icon);
    expect(titleComponent.props.children).to.be.equal(props.title);

    titleComponent.props.onToggle();
    expect(props.onToggle).to.be.calledOnce;

    expect(restComponents).to.have.length(1);
    expect(restComponents[0]).to.be.false;
  });
});
