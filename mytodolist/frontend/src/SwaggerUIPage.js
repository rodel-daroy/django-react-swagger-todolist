import React from 'react';
import SwaggerUI from 'swagger-ui';
import { addCSRFTokenToUnsafeRequests } from './request-interceptors';
import 'swagger-ui/dist/swagger-ui.css';

export default function SwaggerUIPage(){
  const domRef = React.useRef(null);
  React.useEffect(() => {
    if(domRef.current){
      SwaggerUI({
        domNode: domRef.current,
        url: '/openapi',
        displayOperationId: true,
        filter: true,
        requestInterceptor: addCSRFTokenToUnsafeRequests
      });
    }
  });
  return <div ref={domRef} />;
}

