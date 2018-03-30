import { ReactTester } from '@stackstorm/module-test-utils';

export class TestComponent {
  constructor(component) {
    this._instance = ReactTester.create(component);
  }

  field() {
    try {
      return this._instance.find((instance) => {
        if (!instance.props.className) {
          return false;
        }

        return instance.props.className.split(' ').includes('st2-auto-form__field');
      });
    }
    catch (e) {
      return this._instance.find((instance) => {
        if (!instance.props.className) {
          return false;
        }

        return instance.props.className.split(' ').includes('st2-auto-form__checkbox');
      });
    }
  }

  makeChange(value, name) {
    const event = {
      stopPropagation: () => {},
      target: { value },
    };
    if (name) {
      event.target[name] = value;
    }

    const field = this.field();
    field.props.onChange(event);
  }

  fieldType() {
    return this.field()._instance.type;
  }

  fieldValue(name) {
    return this.field().props[name || 'value'];
  }

  fieldClass() {
    return this.field().props.className;
  }

  value() {
    const instance = this._instance._instance.instance;
    return instance.fromStateValue(instance.state.value);
  }
}
