import React from 'react';
import { PropTypes } from 'prop-types';

import Label from '@stackstorm/module-label';
import scrollIntoView from '@stackstorm/module-scroll-into-view';

import './style.less';

export class Panel extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
  }

  render() {
    const { children, className, ...restProps } = this.props;

    return (
      <main className={`st2-panel ${className}`} {...restProps}>
        { children }
      </main>
    );
  }
}

export class PanelView extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
  }

  render() {
    const { children, className, ...restProps } = this.props;

    return (
      <div className={`st2-panel__view ${className}`} {...restProps}>
        { children }
      </div>
    );
  }
}

export class PanelDetails extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
  }

  render() {
    const { children, className, ...restProps } = this.props;

    return (
      <div className={`st2-panel__details st2-details ${className}`} {...restProps}>
        { children }
      </div>
    );
  }
}

// TODO: PanelNavigation

export class Toolbar extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    return (
      <div className="st2-panel__toolbar">
        <div className="st2-panel__toolbar-title"> { this.props.title } </div>
        { this.props.children }
      </div>
    );
  }
}

// TODO: ToolbarTitle

export class ToolbarSearch extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
  }

  render() {
    return (
      <div className="st2-panel__toolbar-search">
        <form>
          <input
            type="search"
            className="st2-panel__search-bar"
            data-test="filter"
            placeholder={this.props.title}
            value={this.props.value}
            onChange={e => this.props.onChange(e)}
          />
          <i className="icon-lens" />
        </form>
      </div>
    );
  }
}

// TODO: ToolbarFilters

// TODO: ToolbarView

export class Content extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  }

  static childContextTypes = {
    scrollIntoView: PropTypes.func,
  }

  getChildContext() {
    return {
      scrollIntoView: (ref) => {
        setTimeout(() => {
          scrollIntoView(this._scroller, ref);
        });
      },
    };
  }

  render() {
    return (
      <div className='st2-panel__content'>
        <div className="st2-panel__scroller" ref={(ref) => this._scroller = ref}>
          { this.props.children }
        </div>
      </div>
    );
  }
}

export class DetailsHeader extends React.Component {
  static propTypes = {
    status: PropTypes.string,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { status, title, subtitle, children } = this.props;

    return (
      <div className="st2-details__header">
        <div className="st2-details__header-name" data-test="header_name">
          { status ?
            <Label status={status} short={true} />
            : null }
          <a href="#/actions/core.announcement/general">{ title }</a>
        </div>
        <div className="st2-details__header-description" data-test="header_description">
          { subtitle }
        </div>
        { children }
      </div>
    );
  }
}

const SWITCH_COUNT = [ 'first', 'second' ];
export class DetailsSwitch extends React.Component {
  static propTypes = {
    sections: PropTypes.arrayOf(PropTypes.shape({
      path: PropTypes.string,
      label: PropTypes.string,
    })),
    current: PropTypes.string,
    onChange: PropTypes.func,
  }

  render() {
    const { sections, current, onChange } = this.props;
    const active = sections.findIndex(({ path }) => path === current);

    return (
      <div className={`st2-details__switch st2-details__switch--of-two st2-details__switch--${ SWITCH_COUNT[active < 0 ? 0 : active] }`}>
        {
          sections.map((section) => {
            return (
              <div
                key={section.path} className="st2-details__switch-item"
                onClick={() => onChange(section)}
              >{ section.label }
              </div>
            );
          })
        }
      </div>
    );
  }
}

export class DetailsBody extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  }

  render() {
    const { children } = this.props;

    return (
      <div className="st2-details__body st2-details__body--active">
        <div className="st2-panel__scroller">
          { children }
        </div>
      </div>
    );
  }
}

export class DetailsPanel extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  }

  render() {
    const { children } = this.props;

    return (
      <div className="st2-details__panel">
        { children }
      </div>
    );
  }
}

export class DetailsPanelHeading extends React.Component {
  static propTypes = {
    title: PropTypes.string,
  }

  render() {
    const { title } = this.props;

    return (
      <div className="st2-details__panel-heading">
        <h2 className="st2-details__panel-title">{ title }</h2>
      </div>
    );
  }
}

export class DetailsPanelBody extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  }

  render() {
    const { children } = this.props;

    return (
      <div className="st2-details__panel-body">
        { children }
      </div>
    );
  }
}

export class DetailsPanelBodyLine extends React.Component {
  static propTypes = {
    label: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { label, children } = this.props;

    return (
      <dl className="st2-details__panel-body-line">
        <dt className="st2-details__panel-body-label">{ label }:</dt>
        <dd className="st2-details__panel-body-value">{ children }</dd>
      </dl>
    );
  }
}

export class DetailsButtonsPanel extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  }

  render() {
    const { children } = this.props;

    return (
      <div className="st2-forms__buttons-panel">
        { children }
      </div>
    );
  }
}

export class DetailsToolbar extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  }

  render() {
    return (
      <div className="st2-details__toolbar">
        { this.props.children }
      </div>
    );
  }
}

export class DetailsToolbarSeparator extends React.Component {
  render() {
    return <div className="st2-details__toolbar-separator" />;
  }
}

export class ToggleButton extends React.Component {
  static propTypes = {
    collapsed: PropTypes.bool,
    onClick: PropTypes.func,
  }

  render() {
    const props = {
      className: 'st2-panel__toolbar-toggle-all',
      onClick: (e) => this.props.onClick(e),
    };

    if (this.props.collapsed) {
      props.className += ' st2-panel__toolbar-toggle-all--collapsed';
    }

    return <div {...props} />;
  }
}
