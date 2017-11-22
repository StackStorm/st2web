import React from 'react';
import { PropTypes } from 'prop-types';


export class Label extends React.Component {
  static propTypes = {
    spec: PropTypes.shape({
      required: PropTypes.bool
    }),
    className: PropTypes.string,
    children: PropTypes.node.isRequired
  }

  render() {
    const { spec, className, children } = this.props;

    return <label className={`st2-auto-form__label ${ className || '' } ${ spec && spec.required ? ' st2-auto-form--required' : '' }`}>
      { children }
    </label>;
  }
}

export class Title extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    spec: PropTypes.shape({
      required: PropTypes.bool
    }),
    className: PropTypes.string
  }

  render() {
    const { name, spec, className } = this.props;

    return <div className={`st2-auto-form__title ${ className || '' }`}>
      { spec && spec.name || name }{ spec && spec.required ? ' *' : '' }
    </div>;
  }
}

export class ErrorMessage extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node
  }

  render() {
    const { className, children } = this.props;

    if (!children) {
      return null;
    }

    return <span className={`st2-auto-form__error ${ className || '' }`}>
      { children }
    </span>;
  }
}

export class Icon extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    title: PropTypes.string,
    onClick: PropTypes.func,
    className: PropTypes.string
  }

  onClick(e) {
    e.preventDefault();
    return this.props.onClick && this.props.onClick(e);
  }

  render() {
    const { name, title, className } = this.props;

    return <span
      className={`st2-auto-form__type ${ className || '' } icon-${ name }`}
      title={ title }
      onClick={ (e) => this.onClick(e) }
    />;
  }
}

export class Button extends React.Component {
  static propTypes = {
    icon: PropTypes.string.isRequired,
    title: PropTypes.string,
    onClick: PropTypes.func,
    className: PropTypes.string
  }

  onClick(e) {
    e.preventDefault();
    return this.props.onClick && this.props.onClick(e);
  }

  render() {
    const { icon, title, className } = this.props;

    return <span
      className={`st2-auto-form__button ${ className || '' } icon-${ icon }`}
      title={ title }
      onClick={ (e) => this.onClick(e) }
    />;
  }
}

export class Description extends React.Component {
  static propTypes = {
    spec: PropTypes.shape({
      description: PropTypes.string
    }),
    className: PropTypes.string
  }

  render() {
    const { spec, className } = this.props;

    if (!spec || !spec.description) {
      return null;
    }

    return <p className={`st2-auto-form__description ${ className || '' }`}>
      { spec.description }
    </p>;
  }
}

export class TextFieldWrapper extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    spec: PropTypes.object,
    value: PropTypes.any,
    invalid: PropTypes.string,
    disabled: PropTypes.bool,
    children: PropTypes.element.isRequired,
    icon: PropTypes.string,
    labelClass: PropTypes.string
  }

  render() {
    const line = <div className='st2-auto-form__line'>
      <Label className={this.props.labelClass || 'st2-auto-form__text-field'} >
        <Icon name={ this.props.icon } />
        <Title {...this.props} />
        { this.props.children }
        <ErrorMessage>{ this.props.invalid }</ErrorMessage>
      </Label>
      <Description {...this.props} />
    </div>;

    return line;
  }
}

export class BooleanFieldWrapper extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    spec: PropTypes.object,
    value: PropTypes.any,
    disabled: PropTypes.bool,
    children: PropTypes.element.isRequired,
    onReset: PropTypes.func
  }

  handleReset() {
    return this.props.onReset && this.props.onReset();
  }

  render() {
    const { name, spec } = this.props;

    const blockProps = {
      className: 'st2-auto-form__checkbox-block',
    };

    const buttonProps = {
      icon: 'cross',
      title: 'reset default',
      onClick: () => this.handleReset()
    };

    const labelProps = {
      className: 'st2-auto-form__checkbox-label',
    };

    const line = <div className='st2-auto-form__line'>
      <Label>
        <div {...blockProps} >
          { !this.props.disabled && <Button {...buttonProps} /> }
          { this.props.children }
          <span {...labelProps} >{ spec.name || name }</span>
        </div>
      </Label>
      <Description {...this.props} />
    </div>;

    return line;
  }
}
