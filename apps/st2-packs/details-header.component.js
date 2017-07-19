import React from 'react';
import { connect } from 'react-redux';

@connect(state => ({ pack: state.packs[state.selected] }))
export default class DetailsHeader extends React.Component {
  static propTypes = {
    pack: React.PropTypes.object
  }

  render() {
    const { pack = {} } = this.props;

    return <div className="st2-details__header">
      <div className="st2-details__header-name" data-test="header_name">
        <a href="#/actions/core.announcement/general">{ pack.ref }</a>
      </div>
      <div className="st2-details__header-description ng-binding" data-test="header_description">
        { pack.description }
      </div>
    </div>;
  }
}
