import { createComponentInstance, setupComponent } from "./component";
import { ShapeFlags } from "../shared/ShapeFlags";
import { Fragment, Text } from "./vnode";
import { createAppAPI } from "./createApp";

export function createRenderer(options) {
  const { createElement, patchProp, instert } = options;

  function render(vnode, container) {
    patch(vnode, container, null);
  }

  function patch(vnode, container, parentComponent) {
    const { type, shapeFlag } = vnode;

    switch (type) {
      case Fragment:
        processFragment(vnode, container, parentComponent);
        break;
      case Text:
        processText(vnode, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(vnode, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(vnode, container, parentComponent);
        }
        break;
    }
  }

  function processText(vnode, container) {
    const { children } = vnode;
    const textVNode = (vnode.el = document.createTextNode(children));
    container.append(textVNode);
  }

  function processFragment(vnode, container, parentComponent) {
    mountChildren(vnode, container, parentComponent);
  }

  function processElement(vnode, container, parentComponent) {
    mountElement(vnode, container, parentComponent);
  }

  function processComponent(vnode: any, container: any, parentComponent: any) {
    mountComponent(vnode, container, parentComponent);
  }

  function mountElement(vnode, container, parentComponent) {
    // createElement
    const el = (vnode.el = createElement(vnode.type));

    const { children, shapeFlag } = vnode;
    // children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode, el, parentComponent);
    }

    // props
    const { props } = vnode;
    for (const key in props) {
      patchProp(el, key, props[key]);
    }

    instert(el, container);
  }

  function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach((v) => {
      patch(v, container, parentComponent);
    });
  }

  function mountComponent(
    initialVNode: any,
    container: any,
    parentComponent: any
  ) {
    const instance = createComponentInstance(initialVNode, parentComponent);

    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
  }

  function setupRenderEffect(instance: any, initialVNode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);

    patch(subTree, container, instance);

    initialVNode.el = subTree.el;
  }

  return {
    createApp: createAppAPI(render),
  };
}
