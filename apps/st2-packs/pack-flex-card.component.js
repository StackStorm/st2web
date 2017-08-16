import React from 'react';

export default class PackFlexCard extends React.Component {
  static propTypes = {
    pack: React.PropTypes.object,
    selected: React.PropTypes.bool,
    onClick: React.PropTypes.func
  }

  render() {
    const { pack, selected, onClick } = this.props;

    const props = {
      className: 'st2-flex-card',
      'data-test': `pack pack:${pack.ref}`,
      onClick
    };

    if (selected) {
      props.className += ' st2-flex-card--active';
    }

    const { version, installedVersion } = pack;

    const versionProps = {
      className: 'st2-flex-card__column st2-flex-card__header-version',
    };

    if (installedVersion && version !== installedVersion) {
      versionProps.className += ' st2-flex-card__header-version--outdated';
    }

    return <div {...props}>
      <div className="st2-flex-card__header">
        <div className="st2-flex-card__column">
          <div className="st2-flex-card__header-primary" title={pack.name} ng-if="view.action.value">{ pack.name }</div>
          <div className="st2-flex-card__header-secondary" ng-if="view.description.value">{ pack.description }</div>
        </div>
        <div title={installedVersion || version} ng-if="view.runner.value" {...versionProps}>
          { installedVersion || version }
        </div>
      </div>
    </div>;
  }
}
