import React from 'react';

export default class PackFlexCard extends React.Component {
  static propTypes = {
    pack: React.PropTypes.object,
    onClick: React.PropTypes.func
  }

  render() {
    const { pack, onClick } = this.props;

    const props = {
      className: 'st2-flex-card',
      onClick
    };

    return <div {...props}>
      <div className="st2-flex-card__header">
        <div className="st2-flex-card__column">
          <div className="st2-flex-card__header-primary" title={pack.name} ng-if="view.action.value">{ pack.name }</div>
          <div className="st2-flex-card__header-secondary" ng-if="view.description.value">{ pack.description }</div>
        </div>
        <div className="st2-flex-card__column st2-flex-card__header-type" title={pack.version} ng-if="view.runner.value">{ pack.version }</div>
        <div className="st2-flex-card__column st2-flex-card__header-status" ng-if="view.type.value"> ! </div>
      </div>
    </div>;
  }
}
