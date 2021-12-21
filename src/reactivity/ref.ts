import { hasChanged, isObject } from "../shared";
import { trackEffect, triggerEffect, isTracking } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
  private _value: any;
  public dep: any;
  private _rawValue: any;

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
      triggerEffect(this.dep);
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
    trackEffect(dep);
  }
}
