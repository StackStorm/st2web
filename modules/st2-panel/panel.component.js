// Copyright 2019 Extreme Networks, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import scrollIntoView from '@stackstorm/module-scroll-into-view';
import Label from '@stackstorm/module-label';

import './style.css';

export class Panel extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    detailed: PropTypes.bool,
    children: PropTypes.node,
  }

  render() {
    const { className, children, detailed = false, ...props } = this.props;

    return (
      <main {...props} className={cx('st2-panel', detailed && 'st2-panel--detailed', className)}>
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
    hidden: PropTypes.bool,
    onChange: PropTypes.func,
    onToggle: PropTypes.func,
  }

  render() {
    const { className, title, value, onChange, onToggle, hidden, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-panel__toolbar-search', className)}>
        <form>
          <input
            type='search'
            className={cx('st2-panel__search-bar', { 'st2-panel__search-bar--hidden': hidden })}
            data-test='filter'
            placeholder={title}
            value={value}
            onChange={(e) => onChange && onChange(e)}
          />
          <i
            className={cx('icon-lens', className)}
            onClick={(e) => onToggle && onToggle(e)}
          />
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
        <div className='st2-panel__scroller' ref={(ref) => this._scroller = ref}>
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
        <div className='st2-details__header-name'>
          { status ? (
            <Label className='st2-details__header-label' status={status} short data-test='status' />
          ) : null }
          <div data-test='header_name'>
            { title }
          </div>
        </div>
        <div className='st2-details__header-description' data-test='header_description'>
          { subtitle }
        </div>
        { children }
      </div>
    );
  }
}

export class DetailsSwitch extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    sections: PropTypes.arrayOf(PropTypes.shape({
      path: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })).isRequired,
    current: PropTypes.string.isRequired,
    onChange: PropTypes.func,
  }

  render() {
    const { className, sections, current, onChange, ...props } = this.props;

    return (
      <div
        {...props}
        className={cx(
          'st2-details__switch',
          className,
        )}
      >
        { sections.map((section) => (
          <div
            key={section.path}
            className={cx(
              'st2-details__switch-item',
              section.path === current && 'st2-details__switch-item--active',
              section.className
            )}
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
        <div className='st2-panel__scroller'>
          { children }
        </div>
      </div>
    );
  }
}

export class DetailsCriteriaLine extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    pattern: PropTypes.any,
    condition: PropTypes.string,
  }

  render() {
    const { name, type, pattern, condition } = this.props;

    const search = type !== 'search' ? null : {
      condition,
      patterns: Object.entries(pattern).map(([ key, value ]) => (
        {key, pattern: value.pattern, type: value.type}
      )),
    };

    return (
      <div className='st2-details__line'>
        <div className='st2-details__line-key'>
          { name }
        </div>
        <div className='st2-details__line-type'>
          { type }
        </div>
        <div className='st2-details__line-value'>
          { search ? (
            <>
              Condition: <strong>{search.condition}</strong>
              <br />
              Pattern:
              <ul className='st2-details__line-search-patterns-list'>
                {search.patterns.map(patternItem => (
                  <li key={patternItem.key}>
                    <strong>{patternItem.key}:</strong>
                    <div className='st2-details__line-search-patterns-list-details'>
                      <p>Type: {patternItem.type}</p>
                      <p>Pattern: {patternItem.pattern}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : pattern }
        </div>
      </div>
    );
  }
}

export class DetailsFormLine extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    value: PropTypes.any,
  }

  render() {
    const { name } = this.props;
    let { value } = this.props;

    if (name === undefined || value === undefined) {
      return false;
    }

    if (typeof value === 'boolean') {
      value = value ? 'yes' : 'no';
    }

    if (typeof value === 'object' || Array.isArray(value)) {
      value = JSON.stringify(value, null, '  ');
    }

    return <DetailsLine name={name} value={value} />;
  }
}

export class DetailsLine extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    value: PropTypes.any,
  }

  render() {
    const { name, value } = this.props;

    if (name === undefined || value === undefined) {
      return false;
    }

    return (
      <div className='st2-details__line'>
        <div className='st2-details__line-name'>
          { name }
        </div>
        <div className='st2-details__line-value'>
          { value }
        </div>
      </div>
    );
  }
}

export class DetailsLineNote extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  }

  render() {
    return (
      <div className='st2-details__line-note'>
        { this.props.children }
      </div>
    );
  }
}

export class DetailsPanel extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    title: PropTypes.string,
    children: PropTypes.node,
    stick: PropTypes.bool,
  }

  render() {
    const { className, title, children, stick, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-details__panel', stick && 'st2-details__panel--stick', className)}>
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
    children: PropTypes.node,
  }

  render() {
    const { className, title, children, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-details__panel-heading', className)}>
        <h2 className='st2-details__panel-title'>{ title }</h2>
        <div>{ children }</div>
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
        <dt className='st2-details__panel-body-label'>{ label }</dt>
        <dd className='st2-details__panel-body-value'>{ children }</dd>
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
        data-test='toggle-all'
      />
    );
  }
}
