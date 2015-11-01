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
