import BaseCode from './base.component';

export default class UnknownCode extends BaseCode {
  async fetch({ type }) {
    return {
      warning: `Unknown type of code: ${type}`,
      code: '',
    };
  }
}
