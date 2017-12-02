import React from 'react';
import { PropTypes } from 'prop-types';

export default class PackFlexCard extends React.Component {
  static propTypes = {
    pack: PropTypes.object,
    selected: PropTypes.bool,
    onClick: PropTypes.func,
  }

  static contextTypes = {
    scrollIntoView: PropTypes.func,
  }

  render() {
    const { pack, selected, onClick } = this.props;

    const props = {
      className: 'st2-flex-card',
      'data-test': `pack pack:${pack.ref}`,
      onClick,
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

    return (
      <div {...props} ref={selected ? this.context.scrollIntoView : null}>
        <div className="st2-flex-card__header">
          <div className="st2-flex-card__column">
            <div className="st2-flex-card__header-primary" title={pack.name}>{ pack.name }</div>
            <div className="st2-flex-card__header-secondary">{ pack.description }</div>
          </div>
          <div title={installedVersion || version} {...versionProps}>
            { installedVersion || version }
          </div>
        </div>
      </div>
    );
  }
}
