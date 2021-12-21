import { hasChanged, isObject } from "../shared";
import { trackEffects, triggerEffects, isTracking } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
  private _value: any;
  public dep: any;
  private _rawValue: any;
  public _v_isRef = true;
  constructor(value) {
    this._rawValue = value;
    this._value = convert(value);
    this.dep = new Set();
  }
  get value() {
    trackRefValue(this.dep);
    return this._value;
  }
  set value(newVal) {
    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal;
      this._value = convert(newVal);
      triggerEffects(this.dep);
    }
  }
}

export function ref(value) {
  return new RefImpl(value);
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

function trackRefValue(dep) {
  if (isTracking()) {
    trackEffects(dep);
  }
}

export function isRef(ref) {
  return !!ref._v_isRef;
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },
    set(target, key, value) {
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value);
      } else {
        return Reflect.set(target, key, value);
      }
    },
  });
}
