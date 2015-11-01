
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
