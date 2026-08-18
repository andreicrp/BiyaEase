import 'react';
import 'react-native';

declare global {
  namespace React {
    namespace JSX {
      interface ElementClass {
        render?: any;
        context?: any;
        setState?: any;
        forceUpdate?: any;
      }
    }
  }
  namespace JSX {
    interface ElementClass {
      render?: any;
      context?: any;
      setState?: any;
      forceUpdate?: any;
    }
  }
}
