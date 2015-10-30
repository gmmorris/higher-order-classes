
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
          // touching the constructor won't help us here, as we're modifying an existing instance
          method !== ClassToCompose) {
        ComposedClass.prototype[prop] = methodComposer(baseProto[prop], prop);
      }
    }
    return ComposedClass;
  };
}
