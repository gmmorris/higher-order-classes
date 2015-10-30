
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
