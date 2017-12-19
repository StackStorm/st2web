import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

export default class PacksFlexCard extends React.Component {
  static propTypes = {
    pack: PropTypes.object.isRequired,
    selected: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
  }

  static defaultProps = {
    selected: false,
  }

  static contextTypes = {
    scrollIntoView: PropTypes.func,
  }

  render() {
    const { pack, selected, onClick } = this.props;

    const { version, installedVersion } = pack;

    const versionProps = {
      className: 'st2-flex-card__column st2-flex-card__header-version',
    };

    if (installedVersion && version !== installedVersion) {
      versionProps.className += ' st2-flex-card__header-version--outdated';
    }

    return (
      <div
        className={cx('st2-flex-card', {
          'st2-flex-card--active': selected,
        })}
        onClick={onClick}
        data-test={`pack pack:${pack.ref}`}
        ref={selected ? this.context.scrollIntoView : null}
      >
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
