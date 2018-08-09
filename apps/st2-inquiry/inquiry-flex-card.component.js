import React from 'react';
import { PropTypes } from 'prop-types';

import cx from 'classnames';

import style from './style.css';
import flexStyle from '@stackstorm/module-flex-table/style.pcss';

export default class InquiryFlexCard extends React.Component {
  static propTypes = {
    inquiry: PropTypes.object.isRequired,
    selected: PropTypes.string,
    onSelect: PropTypes.func.isRequired,
  }

  static contextTypes = {
    scrollIntoView: PropTypes.func.isRequired,
  }

  static defaultProps = {
    isChild: false,
    displayUTC: false,
  }

  handleSelect(e) {
    e && e.preventDefault();
    e && e.stopPropagation();

    const { onSelect, inquiry } = this.props;
    onSelect(inquiry.id);
  }

  render() {
    const {
      inquiry,
      selected,
    } = this.props;

    return (
      <div
        key={`${inquiry.id}-card`}
        className={cx(flexStyle.card, selected === inquiry.id && flexStyle.active)}
        onClick={(e) => this.handleSelect(e)}
        data-test={`inquiry inquiry:${inquiry.id}`}
      >
        <div className={flexStyle.row}>

          <div className={flexStyle.column} title={inquiry.id}>
            <span className={style.actionName}>
              { inquiry.id }
            </span>
          </div>

        </div>
      </div>
    );
  }
}
