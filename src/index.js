import factoryComposer from './composers/factory';
import constructorComposer from './composers/extend_constructor';
import allMethodComposer from './composers/extend_all_methods';
import functionalComposer from './composers/extend_functionaly';

// This is the base class we wish to compose
// Our different "Higher Order Classes" will attempt to extend this class in different ways
// reminicent of the way we use Higher Order Functions to extend and componse our functional components
class ComposableBaseClass {
  constructor() {
  }
  doSomeCalculation(x, y) {
    return x * y;
  }
  doSomethingIllegal() {
    throw new Error('Oh no!');
  }
}

// This is the functionality we wish to add to our class - we want to wrap each Method
// on the composable class in our little 'verbose' function which 'console.log's the name
// of the method being called.
function verbosify(func, funcName) {
  return function() {
    const args = [...arguments].join(', ');
    console.log(`called ${funcName} with args: ${args}`);
    return func.apply(this, arguments);
  };
}

/**
* Factory Example
*/

// create verbosified factory creator - this would only be done once per function, so it would only be used once for the 'verbosify' function in your codebase
const createVerbosifiedFactory = factoryComposer(verbosify);
// create verbosified factory of the composable class - this would be used per class you wish to attach the verbose beahviour to
const vebosifiedComposedClassFactory = createVerbosifiedFactory(ComposableBaseClass);

// usage of factory every time you want a verbose instance of ComposableBaseClass
let myVerboseInstance = vebosifiedComposedClassFactory();
let ret = myVerboseInstance.doSomeCalculation(2, 5);
console.log(`doSomeCalculation() returned: ${ret}`);

/**
* Constructor Composite Example
*/

// create verbosified factory creator - this would only be done once per function, so it would only be used once for the 'verbosify' function in your codebase
const createVerbosifiedConstructorClass = constructorComposer(verbosify);
// create verbosified factory of the composable class - this would be used per class you wish to attach the verbose beahviour to
const VerbosifiedConstructorComposedClass = createVerbosifiedConstructorClass(ComposableBaseClass);

// usage of factory every time you want a verbose instance of ComposableBaseClass
myVerboseInstance = new VerbosifiedConstructorComposedClass();
ret = myVerboseInstance.doSomeCalculation(2, 5);
console.log(`doSomeCalculation() returned: ${ret}`);

/**
* Composite Example
*/

// create verbosified factory creator - this would only be done once per function, so it would only be used once for the 'verbosify' function in your codebase
const createVerbosifiedClass = allMethodComposer(verbosify);
// create verbosified factory of the composable class - this would be used per class you wish to attach the verbose beahviour to
const VerbosifiedComposedClass = createVerbosifiedClass(ComposableBaseClass);

// usage of factory every time you want a verbose instance of ComposableBaseClass
myVerboseInstance = new VerbosifiedComposedClass();
ret = myVerboseInstance.doSomeCalculation(2, 5);
console.log(`doSomeCalculation() returned: ${ret}`);

// which allows us to do the following:
@functionalComposer(verbosify)
@allMethodComposer(verbosify)
class ComposableBaseClassUsingDecorator {
  doSomeCalculation(x, y) {
    return x * y;
  }
  doSomethingIllegal() {
    throw new Error('Oh no!');
  }
}

myVerboseInstance = new ComposableBaseClassUsingDecorator();
ret = myVerboseInstance.doSomeCalculation(2, 5);
console.log(`doSomeCalculation() returned: ${ret}`);
