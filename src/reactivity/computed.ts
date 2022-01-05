import { ReactiveEffect } from "./effect";

class ComputedRefImpl {
  private _dirty: boolean;
  private _value: any;
  private _effect: any;

  constructor(getter) {
    this._dirty = true;
    // 派发更新时没有立即进行依赖收集
    // 而是打开了一个开关，等下次读取时再重新进行依赖收集
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
      }
    });
  }
  get value() {
    // 如果没有更新时，那么只是拿取缓存值
    if (this._dirty) {
      this._dirty = false;
      this._value = this._effect.run(); // 进行依赖收集
    }
    return this._value; // 拿取缓存
  }
}

// 初始化时调用一次，之后如果没有发生更新，那么拿的就是缓存的值
// 如果更新了，不会立即触发getter函数，而是等到下一次读取值的时候再进行触发
export function computed(getter) {
  return new ComputedRefImpl(getter);
}
