import factoryComposer, { isFactory } from '../src/composers/factory';
import {expect} from 'chai';
import assert from 'simple-assert';
import sinon from 'sinon';
import {ComposableBaseClass, wrapperFunction} from './utils/testSubjects';

describe('Factory based HOC', () => {
  it('is a Higher Order Function', () => {
    expect(factoryComposer).to.be.a('function');
    const returnedFunction = factoryComposer(wrapperFunction);
    expect(returnedFunction).to.be.a('function');
  });

  it('returns another HOF, our actual factory', () => {
    const returnedFunction = factoryComposer(wrapperFunction);
    expect(returnedFunction).to.be.a('function');
    const factory = returnedFunction(ComposableBaseClass);
    assert(isFactory(factory));
  });

  describe('A Factory Instance', () => {
    it('returns instances of the composed class type', () => {
      const factory = factoryComposer(wrapperFunction)(ComposableBaseClass);
      const testName = 'testArg';
      const instance = factory(testName);
      assert(instance instanceof ComposableBaseClass);
      expect(instance.Name).to.equal(testName);
    });

    it('wraps each property on its created instances in the specified method', () => {
      const spies = {};
      function watchedWrapperFunction(func, funcName) {
        const mySpy = spies[funcName] = sinon.spy();
        return () => {
          mySpy();
          return func.apply(this, arguments);
        };
      }
      const factory = factoryComposer(watchedWrapperFunction)(ComposableBaseClass);
      const instance = factory();

      instance.doSomeCalculation(1, 2);
      expect(spies.doSomeCalculation).to.be.a('function');
      expect(spies.doSomeCalculation.should.have.been.called);

      expect(() => {
        instance.doSomethingIllegal();
      }).to.throw(Error);
      expect(spies.doSomethingIllegal).to.be.a('function');
      expect(spies.doSomethingIllegal.should.have.been.called);

      assert(spies.Name === undefined);
    });
  });
});
