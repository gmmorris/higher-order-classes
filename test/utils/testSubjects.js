export class ComposableBaseClass {
  constructor(name = '') {
    this._name = name;
  }
  get Name() {
    return this._name;
  }
  doSomeCalculation(x, y) {
    return x * y;
  }
  doSomethingIllegal() {
    throw new Error('Oh no!');
  }
}

export function wrapperFunction(func) {
  return function() {
    return func.apply(this, arguments);
  };
}
