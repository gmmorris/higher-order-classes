import constructorComposer from '../src/composers/extend_constructor';
import {expect} from 'chai';
import assert from 'simple-assert';
import sinon from 'sinon';
import {ComposableBaseClass, wrapperFunction} from './utils/testSubjects';

describe('Constructor Extention based HOC', () => {
  it('is a Higher Order Function', () => {
    expect(constructorComposer).to.be.a('function');
    const returnedFunction = constructorComposer(wrapperFunction);
    expect(returnedFunction).to.be.a('function');
  });

  it('returns a HOC', () => {
    const returnedFunction = constructorComposer(wrapperFunction);
    expect(returnedFunction).to.be.a('function');
    const ComposedClass = returnedFunction(ComposableBaseClass);

    // Classes in JS aren't anything other than functions, as this is still JS, but what we can check is
    // that it is infact a constructor function.. a sort of duck typing, in the loosest meaning of the term
    expect(ComposedClass).to.be.a('function');
    // a constructor function returns an instance which is idenfitied as an instance of that function
    assert((new ComposedClass()) instanceof ComposedClass);
  });

  describe('A HOC definition', () => {
    it('is a composed class extending the base class', () => {
      const ComposedClass = constructorComposer(wrapperFunction)(ComposableBaseClass);
      const testName = 'testArg';
      const instance = new ComposedClass(testName);
      assert(instance instanceof ComposableBaseClass);
      expect(instance.Name).to.equal(testName);
    });

    it('overrides each method on its base class using the specified method', () => {
      const spies = {};
      function watchedWrapperFunction(func, funcName) {
        const mySpy = spies[funcName] = sinon.spy();
        return () => {
          mySpy();
          return func.apply(this, arguments);
        };
      }
      const ComposedClass = constructorComposer(watchedWrapperFunction)(ComposableBaseClass);
      const instance = new ComposedClass();

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
