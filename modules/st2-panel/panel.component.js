import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import scrollIntoView from '@stackstorm/module-scroll-into-view';
import Label from '@stackstorm/module-label';

import './style.less';

export class Panel extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { className, children, ...props } = this.props;

    return (
      <main {...props} className={cx('st2-panel', className)}>
        { children }
      </main>
    );
  }
}

export class PanelView extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { className, children, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-panel__view', className)}>
        { children }
      </div>
    );
  }
}

export class PanelDetails extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { className, children, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-panel__details', 'st2-details', className)}>
        { children }
      </div>
    );
  }
}

export class PanelNavigation extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { className, children, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-panel__navigation', className)}>
        { children }
      </div>
    );
  }
}

export class Toolbar extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
  }

  render() {
    const { className, title, children, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-panel__toolbar', className)}>
        <ToolbarTitle>{ title }</ToolbarTitle>
        { children }
      </div>
    );
  }
}

export class ToolbarActions extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { className, children, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-panel__toolbar-actions', className)}>
        { children }
      </div>
    );
  }
}

export class ToolbarButton extends React.Component {
  static propTypes = {
    className: PropTypes.string,
  }

  render() {
    const { className, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-panel__toolbar-button', className)} />
    );
  }
}

export class ToolbarTitle extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { className, children, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-panel__toolbar-title', className)}>
        { children }
      </div>
    );
  }
}

export class ToolbarSearch extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    title: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
  }

  render() {
    const { className, title, value, onChange, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-panel__toolbar-search', className)}>
        <form>
          <input
            type="search"
            className="st2-panel__search-bar"
            data-test="filter"
            placeholder={title}
            value={value}
            onChange={(e) => onChange(e)}
          />
          <i className={cx('icon-lens', className)} />
        </form>
      </div>
    );
  }
}

export class ToolbarFilters extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { className, children, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-panel__toolbar-filters', className)}>
        { children }
      </div>
    );
  }
}

export class ToolbarView extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { className, children, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-panel__toolbar-view', className)}>
        { children }
      </div>
    );
  }
}

export class Content extends React.Component {
  static propTypes = {
    className: PropTypes.string,
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
    const { className, children, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-panel__content', className)}>
        <div className="st2-panel__scroller" ref={(ref) => this._scroller = ref}>
          { children }
        </div>
      </div>
    );
  }
}

export class ContentEmpty extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { className, children, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-panel__content-empty', className)}>
        { children || 'No results were found for your current filter.' }
      </div>
    );
  }
}

export class DetailsHeader extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    status: PropTypes.string,
    title: PropTypes.node.isRequired,
    subtitle: PropTypes.node,
    children: PropTypes.node,
  }

  render() {
    const { className, status, title, subtitle, children, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-details__header', className)}>
        <div className="st2-details__header-name">
          { status ? (
            <Label status={status} short={true} data-test="status" />
          ) : null }
          <div data-test="header_name">
            { title }
          </div>
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
    className: PropTypes.string,
    sections: PropTypes.arrayOf(PropTypes.shape({
      path: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })).isRequired,
    current: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
  }

  render() {
    const { className, sections, current, onChange, ...props } = this.props;
    const active = sections.findIndex(({ path }) => path === current);

    return (
      <div
        {...props}
        className={cx(
          'st2-details__switch',
          'st2-details__switch--of-two',
          `st2-details__switch--${SWITCH_COUNT[active < 0 ? 0 : active]}`,
          className,
        )}
      >
        { sections.map((section) => (
          <div
            key={section.path}
            className="st2-details__switch-item"
            onClick={() => onChange(section)}
            data-test={`switch:${section.path}`}
          >
            { section.label }
          </div>
        )) }
      </div>
    );
  }
}

export class DetailsBody extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { className, children, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-details__body', 'st2-details__body--active', className)}>
        <div className="st2-panel__scroller">
          { children }
        </div>
      </div>
    );
  }
}

export class DetailsPanel extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    title: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { className, title, children, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-details__panel', className)}>
        { title ? (
          <DetailsPanelHeading title={title} />
        ) : null }
        { children }
      </div>
    );
  }
}

export class DetailsPanelEmpty extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { className, children, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-details__panel-empty', className)}>
        { children }
      </div>
    );
  }
}

export class DetailsPanelHeading extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    title: PropTypes.string.isRequired,
  }

  render() {
    const { className, title, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-details__panel-heading', className)}>
        <h2 className="st2-details__panel-title">{ title }</h2>
      </div>
    );
  }
}

export class DetailsPanelBody extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { className, children, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-details__panel-body', className)}>
        { children }
      </div>
    );
  }
}

export class DetailsPanelBodyLine extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    label: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
  }

  render() {
    const { className, label, children, ...props } = this.props;

    return (
      <dl {...props} className={cx('st2-details__panel-body-line', className)}>
        <dt className="st2-details__panel-body-label">{ label }:</dt>
        <dd className="st2-details__panel-body-value">{ children }</dd>
      </dl>
    );
  }
}

export class DetailsButtonsPanel extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { className, children, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-forms__buttons-panel', className)}>
        { children }
      </div>
    );
  }
}

export class DetailsToolbar extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { className, children, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-details__toolbar', className)}>
        { children }
      </div>
    );
  }
}

export class DetailsToolbarSeparator extends React.Component {
  static propTypes = {
    className: PropTypes.string,
  }

  render() {
    const { className, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-details__toolbar-separator', className)} />
    );
  }
}

export class ToggleButton extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    collapsed: PropTypes.bool.isRequired,
    onClick: PropTypes.func,
  }

  static defaultProps = {
    collapsed: false,
  }

  render() {
    const { className, collapsed, onClick, ...props } = this.props;

    return (
      <div
        {...props}
        className={cx('st2-panel__toolbar-toggle-all', className, {
          'st2-panel__toolbar-toggle-all--collapsed': collapsed,
        })}
        onClick={(e) => onClick(e)}
        data-test="toggle-all"
      />
    );
  }
}
