import React from 'react';

export class Panel extends React.Component {
  static propTypes = {
    children: React.PropTypes.node,
    className: React.PropTypes.string
  }

  render() {
    const { children, className, ...restProps } = this.props;

    return <main className="st2-panel ${className}" {...restProps}>
      { children }
    </main>;
  }
}

export class PanelView extends React.Component {
  static propTypes = {
    children: React.PropTypes.node,
    className: React.PropTypes.string
  }

  render() {
    const { children, className, ...restProps } = this.props;

    return <div className="st2-panel__view ${className}" {...restProps}>
      { children }
    </div>;
  }
}

export class PanelDetails extends React.Component {
  static propTypes = {
    children: React.PropTypes.node,
    className: React.PropTypes.string
  }

  render() {
    const { children, className, ...restProps } = this.props;

    return <div className="st2-panel__details st2-details ${className}" {...restProps}>
      { children }
    </div>;
  }
}

export class Toolbar extends React.Component {
  static propTypes = {
    title: React.PropTypes.string,
    children: React.PropTypes.node
  }

  render() {
    return <div className="st2-panel__toolbar">
      <div className="st2-panel__toolbar-title"> { this.props.title } </div>
      { this.props.children }
    </div>;
  }
}

export class ToolbarSearch extends React.Component {
  static propTypes = {
    title: React.PropTypes.string,
    value: React.PropTypes.string,
    onChange: React.PropTypes.func
  }

  render() {
    return <div className="st2-panel__toolbar-search">
      <form>
        <input type="search"
          className="st2-panel__search-bar"
          data-test="filter"
          placeholder={this.props.title}
          value={this.props.value}
          onChange={e => this.props.onChange(e)}
        />
        <i className="icon-lens"></i>
      </form>
    </div>;
  }
}

export class Content extends React.Component {
  static propTypes = {
    children: React.PropTypes.node
  }

  render() {
    return <div className='st2-panel__content'>
      <div className="st2-panel__scroller">
        { this.props.children }
      </div>
    </div>;
  }
}

export class DetailsHeader extends React.Component {
  static propTypes = {
    title: React.PropTypes.string,
    subtitle: React.PropTypes.string
  }

  render() {
    const { title, subtitle } = this.props;

    return <div className="st2-details__header">
      <div className="st2-details__header-name" data-test="header_name">
        <a href="#/actions/core.announcement/general">{ title }</a>
      </div>
      <div className="st2-details__header-description ng-binding" data-test="header_description">
        { subtitle }
      </div>
    </div>;
  }
}

export class DetailsBody extends React.Component {
  static propTypes = {
    children: React.PropTypes.node
  }

  render() {
    const { children } = this.props;

    return <div className="st2-details__body st2-details__body--active">
      <div className="st2-panel__scroller">
        { children }
      </div>
    </div>;
  }
}

export class DetailsPanel extends React.Component {
  static propTypes = {
    children: React.PropTypes.node
  }

  render() {
    const { children } = this.props;

    return <div className="st2-details__panel">
      { children }
    </div>;
  }
}

export class DetailsButtonsPanel extends React.Component {
  static propTypes = {
    children: React.PropTypes.node
  }

  render() {
    const { children } = this.props;

    return <div className="st2-forms__buttons-panel">
      { children }
    </div>;
  }
}

export class DetailsToolbar extends React.Component {
  static propTypes = {
    children: React.PropTypes.node
  }

  render() {
    return <div className="st2-details__toolbar">
      { this.props.children }
    </div>;
  }
}

export class DetailsToolbarSeparator extends React.Component {
  render() {
    return <div className="st2-details__toolbar-separator"></div>;
  }
}

export class ToggleButton extends React.Component {
  static propTypes = {
    collapsed: React.PropTypes.bool,
    onClick: React.PropTypes.func
  }

  render() {
    const props = {
      className: 'st2-panel__toolbar-toggle-all',
      onClick: (e) => this.props.onClick(e)
    };

    if (this.props.collapsed) {
      props.className += ' st2-panel__toolbar-toggle-all--collapsed';
    }

    return <div {...props} />;
  }
}
