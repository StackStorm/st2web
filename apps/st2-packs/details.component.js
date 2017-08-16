import React from 'react';

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
