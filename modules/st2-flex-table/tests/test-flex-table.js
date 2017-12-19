import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

import {
  FlexTable,
  FlexTableTitle,
} from '../flex-table.component.js';

function render(component) {
  return ReactTester.create(component).node;
}

describe('FlexTable component', () => {
  it('renders an element', () => {
    const props = {
      title: 'Some title',
      collapsed: false,
      icon: 'icon.png',
      onToggle: sinon.spy(),
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
      onToggle: sinon.spy(),
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
      onToggle: sinon.spy(),
    };

    const c = render(<FlexTable {...props}>some child node</FlexTable>);

    expect(c.props.className).to.be.equal('st2-flex-table');

    const [ titleComponent, ...restComponents ] = c.props.children;
    expect(titleComponent).to.be.null;

    expect(restComponents).to.have.length(1);
    expect(restComponents[0]).to.be.equal('some child node');
  });

  it('renders an element collapsed', () => {
    const props = {
      title: 'Some title',
      collapsed: true,
      icon: 'icon.png',
      onToggle: sinon.spy(),
    };

    const c = render(<FlexTable {...props}>some child node</FlexTable>);

    expect(c.props.className).to.be.equal('st2-flex-table st2-flex-table--collapsed');

    const [ titleComponent, ...restComponents ] = c.props.children;
    expect(titleComponent.props.icon).to.be.equal(props.icon);
    expect(titleComponent.props.children).to.be.equal(props.title);

    titleComponent.props.onToggle();
    expect(props.onToggle).to.be.calledOnce;

    expect(restComponents).to.have.length(1);
    expect(restComponents[0]).to.be.null;
  });
});

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
    expect(imgComponent).to.be.null;

    expect(headingComponent.props.className).to.be.equal('st2-flex-table__caption-title');
    expect(headingComponent.props.children).to.be.equal('some child node');
  });
});
