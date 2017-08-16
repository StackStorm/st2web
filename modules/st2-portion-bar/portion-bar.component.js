import React from 'react';

export default class PortionBar extends React.Component {
  static propTypes = {
    content: React.PropTypes.objectOf(React.PropTypes.node)
  }

  render() {
    const { content, ...restProps } = this.props;

    const portions = _.pick(content, v => !!v);

    const total = _.reduce(portions, (sum, num) => {
      return sum + num;
    });

    return <div className="st2-portion-bar" {...restProps} >
      <ul className="st2-portion-bar__bar">
        {
          _.map(portions, (value, key) => {
            const props = {
              key,
              className: `st2-portion-bar__bar-value st2-portion-bar__bar-value--${key}`,
              style: {
                width: `${(value / total * 100).toFixed(2)}%`
              }
            };

            return <li {...props} />;
          })
        }
      </ul>
      <ul className="st2-portion-bar__info">
        {
          _.map(portions, (value, key) => {
            const props = {
              key,
              className: 'st2-portion-bar__info-value'
            };

            return <li {...props} >{key}: {value}</li>;
          })
        }
      </ul>
    </div>;
  }
}
