import 'react';
import 'react-native';

declare global {
  namespace JSX {
    interface ElementClass {
      props?: any;
      state?: any;
      context?: any;
      setState?: any;
      forceUpdate?: any;
      render?: any;
    }
  }
  namespace React {
    namespace JSX {
      interface ElementClass {
        props?: any;
        state?: any;
        context?: any;
        setState?: any;
        forceUpdate?: any;
        render?: any;
      }
    }
  }
}

declare module 'react-native' {
  interface ViewComponent {
    props: any;
    state: any;
    context: any;
    setState: any;
    forceUpdate: any;
    render(): any;
  }
  interface TextComponent {
    props: any;
    state: any;
    context: any;
    setState: any;
    forceUpdate: any;
    render(): any;
  }
  interface ImageComponent {
    props: any;
    state: any;
    context: any;
    setState: any;
    forceUpdate: any;
    render(): any;
  }
  interface ScrollViewComponent {
    props: any;
    state: any;
    context: any;
    setState: any;
    forceUpdate: any;
    render(): any;
  }
  interface ActivityIndicatorComponent {
    props: any;
    state: any;
    context: any;
    setState: any;
    forceUpdate: any;
    render(): any;
  }
  interface TouchableOpacityComponent {
    props: any;
    state: any;
    context: any;
    setState: any;
    forceUpdate: any;
    render(): any;
  }
}
