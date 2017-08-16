import React from 'react';

export default class Content extends React.Component {
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
