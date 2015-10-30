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
