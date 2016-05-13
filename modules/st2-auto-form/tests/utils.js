import TestUtils from 'react-addons-test-utils';

export class TestComponent {
  constructor(component) {
    this._renderer = TestUtils.createRenderer();
    this._renderer.render(component);
  }

  output() {
    return this._renderer.getRenderOutput();
  }

  field() {
    return this.output().props.children;
  }

  makeChange(value, name) {
    const event = { target: { value } };
    if (name) {
      event.target[name] = value;
    }
    const field = this.field();
    field.props.onChange(event);
  }

  fieldType() {
    return this.field().type;
  }

  fieldValue(name) {
    return this.field().props[name || 'value'];
  }

  fieldClass() {
    return this.field().props.className;
  }

  value() {
    return this._renderer._instance._instance.getValue();
  }
}
