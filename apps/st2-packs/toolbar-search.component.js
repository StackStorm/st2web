import React from 'react';

export default class ToolbarSearch extends React.Component {
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
