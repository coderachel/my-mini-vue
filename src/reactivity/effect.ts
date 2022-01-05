import { extend } from "../shared";

let activeEffect;
let shouldTrack = false;
export class ReactiveEffect {
  private _fn: any;
  deps = [];
  active = true;
  onStop?: () => void;
  public scheduler: Function | undefined;
  constructor(fn, scheduler?: Function) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    if (!this.active) {
      return this._fn();
    }

    // 打开收集依赖的开关
    shouldTrack = true;
    // 指向当前活跃的观察者
    activeEffect = this;
    // 这个过程会涉及到对响应式数据操作
    const r = this._fn();

    // 重置
    shouldTrack = false;

    return r;
  }
  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });

  // 把 effect.deps 清空
  effect.deps.length = 0;
}

const targetMap = new Map();

// 依赖收集实现的原理
export function track(target, key) {
  if (!isTracking()) return;
  // target -> key -> dep
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  // 看看 dep 之前有没有添加过，添加过的话 那么就不添加了
  if (dep.has(activeEffect)) return;
  trackEffects(dep);
}

export function trackEffects(dep) {
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);

  triggerEffects(dep);
}

export function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

// 返回一个runner函数
export function effect(fn, options: any = {}) {
  // fn
  const _effect = new ReactiveEffect(fn, options.scheduler);
  extend(_effect, options);
  // 依赖收集的入口
  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;

  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}
