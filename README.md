# How to Grok Higher Order Classes
Code examples for my How To Grok Higher Order Classes article, exploring how to approach applying higher order function paradigms against class definitions.

Originaly published on Medium: https://medium.com/p/69452ba6d095/edit

One does not simply make up an idiom, so I’ll make it clear, I’m not trying to do that. In fact, in many ways, the goal of this article is to make it clear that there is no such thing as a Higher Order Class, that term is total gibberish, but with the mixture of classical OO terms with functional programming paradigms, I’m now finding that the Javascript ecosystem and it’s accompanying idioms can be a little disorientating for those who don’t have a solid grasp in the language’s fundamentals.

I’m hoping I can help with that a little.

## What do you mean by Higher Order Class?
One of the paradigms of functional programming that is very commonly used in Javascript is that of a **Higher Order Function**, that is, *a function which receives a function as input and returns a function as output*.

### Higher Order Functions
A good example of this would be a generic formatting function, where you wish to provide a comfortable way to reformat the output of other functions. All you have to do is wrap your functionality in a **Higher Order Function** and anyone else can take your implementation and use it with their own functions.
For Example:

``` js
// Our higher order function which converts pennies to pounds (£) (or cents to dollars, for that matter)
function convertPenniesToPounds(priceFunction) {
  return function() {
    return priceFunction.apply(this, arguments)/100;
  }
}

// we have component which fetches a price in pennies
const PriceFetcher = {
  getPriceInPence : function(productId) {
    // fetch price from API
  }
};

// we add a function to get the price in pounds
PriceFetcher.getPriceInPounds = convertPenniesToPounds(PriceFetcher.getPriceInPence);

// we can now call getPriceInPounds and it'll return the price in pounds (or the price in pennied times 100)
assert(PriceFetcher.getPriceInPounds('7376481') === 100*PriceFetcher.getPriceInPence('7376481'));
```
Above you can see an example of the use of a **Higher Order Function**.
Granted, its a slightly contrived example, but a simple one which expresses the power you can get out of a HOF, for creating generic and reusable code.
One of the common implementations of this paradigm in Javascript has been one I call the Composing **Higher Order Function**\*.

This implementation is a comfortable way to approach applying HOFs to your components, without having to provide different implementations for function based components (such as a constructor function) .
The simple idea is that the **CHOF** will identify the input it receives and provide suitable wrapper behaviour — a function will be treated as any input to a **HOF**, while an object will have it’s properties cycled through and each function property (in other words, each method) will have the HOF applied to it, essentially recomposing the object with the required functionality.

``` js
// Our higher order function which logs all returned values to the function properties on an object
function attachLogger(objectOrFunction) {
  if(typeof objectOrFunction === 'function'){
    return function() {
      let ret = objectOrFunction.apply(this, arguments);
      console.log(ret);
      return ret;
    }
  }
  
  for (name in objectOrFunction){
      let method = objectOrFunction[name];
      if (typeof method === "function"){
          objectOrFunction[name] = attachLogger(objectOrFunction[name]);
      }
  }
  return objectOrFunction;
}

// we have component which fetches a price in pennies
const PriceFetcher = {
  getPriceInPence : function(productId) {
    // .. fetch price from API
  }
};
const performSomeAction = function() {
  // ...
};

// attach logging functionality
PriceFetcher = attachLogger(PriceFetcher);
performSomeAction = attachLogger(performSomeAction);
```
\* *Yet again, I stress, this is not an attempt to define a new idiom, this is just me naming something I don’t know any other name for. If anyone wishes to educate me on the right naming for this, I’m all ears.*

## Higher Order Classes
This is where **Higher Order Classes** come into the picture.
Just like a Higher Order Function means *a function which receives a function and returns a function*, a **Higher Order Class** would mean a class which receives a class and returns a class. But as I noted above — thats total gibberish. Classes don’t receive anything (if anything, their constructor function receives arguments, but thats a function, not the class), nor do they return anything (if anything, an object, AKA an instance, but thats not the same as returning it), ***so how could a Higher Order Class even exist?***

Well, like you so astutely point out, it can’t. What I mean by a the term then, is this:*a function which receives a class and returns a class in it’s place.* Now, I know what you’re thinking — isn’t that just what a we have inheritance and a dozen different design patterns for? The answer is sort of.
I’m not claiming to invent, nor reinvent, the wheel here. What I have found though is that as Javascript classes are not your run-of-the-mill *blueprint* classes, but rather a new form of hybrid between *classic classes* and *constructor functions with prototypal inheritance*, quite a few of the classic OOP design patterns become a little murkier, especially if you’re coming from a language like Java or C++.

Specifically what I’d like to focus on in this article is how to approach the concept of a **Composing Higher Order Class**, which is how to add support for ES6's class syntax (and by extension, ES7's decorators) into your existing implementations of **Composing Higher Order Functions**.

## Building a Higher Order Class
The moment I hit the wall of my current understanding of the mix between functional paradigms and ES6's class syntax was when I tried to rewrite an open source project of mine — my [Birdwatcher](https://github.com/gmmorris/birdwatcherjs).
Birdwatcher is a nifty little utility I wrote several years ago for use in a startup I was involved in and which I have since carried over with me into almost every project I’ve been a part of.
Birdwatcher is very simple utility which allows me to separate my error handling logic from my core component logic. It does so by applying the simple construct of a HOF to each component at the definition stage and that way, it saves me time and code repetition while still allowing me to make sure each and every component in my stack has proper error tracking.

Recently I found a need for Birdwatcher in a new environment, which was Node.js using ES6, and I realised that Birdwatcher no longer provided me with what I needed.
It would have to be rewritten in ES6 and it would have to have support added for ES6 classes. Both these changes weren’t going to be major tasks, as Birdwatcher’s codebase is very small, but what I did find is that wrapping my brain around the addition of class support was a little less intuitive than I initially thought.

To aid in explaining the final implementation, I have broken down the thought process into four steps. I believe these steps are simple enough to not only help you understand the final implementation but also to help you understand how ES6 classes slightly differ from classical class definitions, if you haven’t yet noticed these slight nuances.

## Step I: The Factory
The initial instinct of someone coming from a classical OOP ecosystem might be to solve this problem by creating a generic factory.
The factory implementation would receive the class definition as an argument and whenever someone used the generic implementation a unique factory would be returned, geared to creating instances of the specific class definition. The instance would be extended by applying the Higher Order Function to the instance’s methods before being returned by the factory.
This is a common design pattern in other languages, often implemented using Generics.

Lets take a look at some code:
``` js
const FactorySentinal = Symbol('ClassFactory');
export function isFactory(SupposedFactory) {
  return SupposedFactory && SupposedFactory[FactorySentinal];
}

export default function(methodComposer) {
  return ClassToCompose => {
    const proto = ClassToCompose.prototype;
    function factory() {
      const instance = new ClassToCompose(...arguments);
      for (const prop of Object.getOwnPropertyNames(proto)) {
        const method = proto[prop];
        const {configurable, writable} = Object.getOwnPropertyDescriptor(proto, prop);
        if (method instanceof Function &&
            // we can't change non configurable or writable methods
            configurable && writable &&
            // touching the constructor won't help us here, as we're modifying an existing instance
            method !== ClassToCompose) {
          instance[prop] = methodComposer(proto[prop], prop);
        }
      }
      return instance;
    }
    factory[FactorySentinal] = true;
    return factory;
  };
}
```

``` js
import factoryComposer from './composers_factory';

// This is the base class we wish to compose
class ComposableBaseClass {
  // ... methods
}

// This is the functionality we wish to add to our class - we want to wrap each Method
// on the composable class in our little 'verbose' function which 'console.log's the name
// of the method being called.
function verbosify(func, funcName) {
  return function() {
    // ... add verbosity to this function's execution
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
```

The implementation is simple and straight forward, but it fails on several points.
1. It isn’t a particularly readable piece of code. Which might seem a little nit-picky, but I think we all find writing nice readable code a virtue and a goal.
2. This implementation doesn’t answer the definition of a Higher Order Class, does it? As you have probably noticed, what we have here is a *function which receives a class and returns a function*, while our definition was that a class should be returned.
This is important because it allows us to support inheritance of the class even after having the HOC applied to it.

These two issues leave a lot to be desired, and to be honest, when searching for my implementation I actually skipped even trying to implement this one, but I felt it would give a good starting point, as it highlights a couple of things you might not have thought about in regard to ES6 in general and ES6 classes specifically.

The first point to note is that we in fact have **three** Higher Order Functions in this implementation.
The first one receives the *methodComposer*, the second one is the factory we return to the caller and the third is the *methodComposer* itself, which is the actual implementation which we use to “wrap” the methods of our class.
What we’re in fact doing is creating a generic function for any specific *methodComposer*, which can then receive any number of class definitions and it will create a factory for each and every one of them.

The second point to note is a little piece of logic you may have noticed in this implementation which is that when cycling through the class’s methods we make sure not to touch the one which is:

``` js
method === ClassToCompose
```

That means that when cycling through our class’s methods one of them might actually be equal to the class definition itself.
*What does that even mean?* Well, this is the place where ES6's classes meet the prototypal inheritance paradigm.
What you need to understand about ES6 classes is that they aren’t actually classes. We haven’t added a new type to Javascript called Class. What we have in fact done is just provided a new syntax around our trusted Constructor Functions, and in fact, our classes are just new points of view on constructor functions.

But that doesn’t explain why we’re seeing a method which points to the same place in memory (remember the equality is checking the reference, not the value of the objects) as our class definition, does it?
One of the differences between ES6 classes and our good old Constructor Functions, is that Constructor Functions can be executed as regular functions. Meaning, both of these syntaxes could be used:

``` js
function MyConstructor() {
}

// meant to be called this way:
var myInstance = new MyConstructor();

// but could also be called, usually incorrectly, this way
var myInstance = MyConstructor();
```

This misuse of Constructor Functions was the bane of our existence for a long time, as it would result in misuse of our classes and often filled the global scope with garbage due to the global object being used as context in the function.
To prevent this in ES6 classes, we are no longer allowed to call a Class constructor without the **new** keyword (this throws a **TypeError: Classes can’t be function-called** error).The implementation then is that an ES6 Class definition is in fact just a Constructor Function, but it isn’t the “Constructor()” function we defined when writing our class, but rather, another function, on the prototype of our constructor function, which encapsulates logic meant to perform the above type checking (among other things).
This is why the Class Definition variable returned to us by the class keyword in fact points to a method on the Constructor Function’s prototype.
This is the kind of thing you figure out when you debug Babel’s source code, and its a great learning resource, I highly recommend it. ^_^

OK, we’ve digressed enough, lets get back to our Higher Order Class implementation.

## Step II: Constructor Composer
Lets skip problem #1 and make our next step the one of solving problem #2 which the factory implementation left us with: the fact that our HOC wasn’t really a HOC.

We’ll create *a function which receives a class and returns a class* as expected.
This builds on the factory solution, but moves the *method composition* step into the class’s actual constructor, instead of sitting outside in the factory.

``` js
export default function(methodComposer) {
  return ClassToCompose => {
    const proto = ClassToCompose.prototype;
    return class extends ClassToCompose {
      constructor() {
        super(...arguments);
        for (const prop of Object.getOwnPropertyNames(proto)) {
          const method = proto[prop];
          const {configurable, writable} = Object.getOwnPropertyDescriptor(proto, prop);
          if (method instanceof Function &&
              // we can't change non configurable or writable methods
              configurable && writable &&
              // touching the constructor won't help us here, as we're modifying an existing instance
              method !== ClassToCompose) {
            this[prop] = methodComposer(proto[prop], prop);
          }
        }
      }
    };
  };
}
```
``` js
import constructorComposer from './extend_constructor_composer';

/**
* We'll use the same ComposableBaseClass class and verbosify function from before
*/


/**
* Constructor Composite Example
*/

// create verbosified factory creator - this would only be done once per function, so it would only be used once for the 'verbosify' function in your codebase
const createVerbosifiedConstructorClass = constructorComposer(verbosify);
// create verbosified factory of the composable class - this would be used per class you wish to attach the verbose beahviour to
const VerbosifiedConstructorComposedClass = createVerbosifiedConstructorClass(ComposableBaseClass);

// usage of factory every time you want a verbose instance of ComposableBaseClass
myVerboseInstance = new VerbosifiedConstructorComposedClass();
```
This implementation solves the HOC problem by returning a class, and also makes the code a little cleaner and elegant, but it still leaves us a little sour.

The reason i’m still not pleased is that there are a few things here I still don’t like.
For one, I don’t like the fact that we’re extending our instance **after** the super() method is called, because it means that a whole set of functionality might execute before our composed behavior is attached to the instance.
Secondly this means that every instance we create will have this logic applied to it over and over, which means that we’re performing a complex operation multiple times instead of doing so once at a Class Definition level, which isn’t great for performance.

It also means that if we have two instances, their methods won’t actually be the same functions in memory, which can break various duck-typing paradigms we often use in functional programming.
This isn’t optimal to say the least.

Onwards!

## Step III: Constructor Prototype Composer
The third, and almost final, step builds on the previous implementation to solve some of the problems we highlighted.
The approach is very similar, except we’ll move the method composition step to an earlier point in the execution — we’ll do so in the HOC itself.

``` js
export default function(methodComposer) {
  return ClassToCompose => {
    class ComposedClass extends ClassToCompose {
      constructor() {
        super(...arguments);
      }
    }

    const baseProto = ClassToCompose.prototype;
    for (const prop of Object.getOwnPropertyNames(baseProto)) {
      const method = baseProto[prop];
      const {configurable, writable} = Object.getOwnPropertyDescriptor(baseProto, prop);
      if (method instanceof Function &&
          // we can't change non configurable or writable methods
          configurable && writable &&
          // touching the constructor won't work here
          method !== ClassToCompose) {
        ComposedClass.prototype[prop] = methodComposer(baseProto[prop], prop);
      }
    }
    return ComposedClass;
  };
}
```
``` js
import allMethodComposer from './extend_all_method_composer';

/**
* We'll use the same ComposableBaseClass class and verbosify function from before
*/


/**
* Composite Example
*/

// create verbosified factory creator - this would only be done once per function, so it would only be used once for the 'verbosify' function in your codebase
const createVerbosifiedClass = allMethodComposer(verbosify);
// create verbosified factory of the composable class - this would be used per class you wish to attach the verbose beahviour to
const VerbosifiedComposedClass = createVerbosifiedClass(ComposableBaseClass);

// usage of factory every time you want a verbose instance of ComposableBaseClass
myVerboseInstance = new VerbosifiedComposedClass();
```
This way, we can apply the method composition to the actual prototype of our class. This means that when a new instance of the class is created, the composited methods will be on that instance’s prototype object, which means it will be shared between all instances of the class.

This also leaves us with a relatively clean implementation, with clear imperative code.
We’re really almost there, right at the edge, but there is still something bugging me. I think we can improve this slightly.

## Step IV: Functional Refactoring
Seeing as we’re speaking in functional programming paradigms, shouldn’t our implementation be a little bit more functional and declarative?
Let see if we can refactor this slightly.

``` js
/*
 * A Higher Order Function which takes a Class definition and returns a new function.
 *
 * @param  {Function} ClassToCompose  The class definition we wish to analyze
 * @return {Function} A function which takes a property name and return a boolean specifying whether
 *                    the class has a method with that name which is composable
*/
function isComposablePropertyOf(ClassToCompose) {
  const proto = ClassToCompose.prototype;
  return propertyName => {
    if (proto.hasOwnProperty(propertyName)) {
      const method = proto[propertyName];
      const {configurable, writable} = Object.getOwnPropertyDescriptor(proto, propertyName) || {};
      if (method instanceof Function &&
          // we can't change non configurable or writable methods
          configurable && writable &&
          // touching the constructor won't help us here
          method !== ClassToCompose) {
          // granted, this syntax is kind of ugly
        return true;
      }
    }
    return false;
  };
}

export default function(methodComposer) {
  return ClassToCompose => {
    class ComposedClass extends ClassToCompose {
      constructor() {
        super(...arguments);
      }
    }

    Object
      .getOwnPropertyNames(ClassToCompose.prototype)
      .filter(isComposablePropertyOf(ClassToCompose))
      .forEach(prop => {
        ComposedClass.prototype[prop] = methodComposer(ClassToCompose.prototype[prop], prop);
      });

    return ComposedClass;
  };
}
```
``` js
import functionalComposer from './functional_higher_order_class.js';

@functionalComposer(verbosify)
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
```

There, I prefer that. I think we’re done.
Note how we can use this Higher Order Class as a decorator using Babel’s ES7 support, which is pretty cool.

Thats it.
I hope you found this article informative, I sure found writing it to be.
