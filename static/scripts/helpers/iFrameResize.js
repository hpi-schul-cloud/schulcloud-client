// COMMUNICATION FUNCTIONS

function initializeFrames(iFrames) {
  iFrames.forEach((iFrame, index)=>{
    const identifier = "iframe-"+index;
    iFrame.dataset.identifier = identifier;
  });
}

function requestSize(iFrame){
  iFrame.contentWindow.postMessage(JSON.stringify({
    function: "getSize",
    identifier: iFrame.dataset.identifier
  }), '*');
}

function postSize(identifier) {
  window.parent.postMessage(JSON.stringify({
    identifier: identifier,
    size: {
      x: document.body.scrollWidth,
      y: document.body.scrollHeight
    }
  }), '*');
}

function messageReceiver(messageCallback) {
  window.addEventListener("message", (event) => {
    try{
      const message = JSON.parse(event.data);
      messageCallback(message);
    } catch (error) {
        //console.warn("Couldn't evaluate message:", event, error);
    }
  }, false);
}



// RECEIVER (embeded iFrame) EVENTLISTENER

export function iFrameListen (){
  messageReceiver((message) => {
    if(message.function
      && message.function === "getSize"
      && message.identifier
    ){
      postSize(message.identifier);
    }
  });
}



// SENDER EVENTLISTENER

export function resizeIframes(iFrameNodes, callback){

  // use all iFrames if none is specified
  let iFrames = iFrameNodes;
  if(!iFrames || iFrames.length === 0){
    iFrames = document.querySelectorAll("iframe");
  }

  // add listener for size response
  messageReceiver((message) => {
    if(message.size && message.identifier){
      document.querySelectorAll(`iframe[data-identifier="${message.identifier}"]`).forEach((iframe) => {
        iframe.style.height = message.size.y + 16 + 'px'; // add a bit more height to prevent scrollbar from appearing
      });
      if(callback){
        callback();
      }
    }
  });

  // give each iFrame a unique identifier
  initializeFrames(iFrames);

  // listen for load events from the iFrame
  iFrames.forEach((iFrame)=>{
    requestSize(iFrame);
    iFrame.addEventListener("load", (event) => {
      requestSize(iFrame);
    });
  });

  // listen for browser resize (debounced)
  const actualResizeHandler = () => {
    iFrames.forEach((iFrame)=>{
      requestSize(iFrame);
    });
  };

  var resizeTimeout;
  function resizeThrottler(resizeCallback) {
    return () => {
      if(resizeTimeout){
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(() => {
        resizeTimeout = null;
        resizeCallback();
      }, 200);
    };
  }

  window.addEventListener("resize", resizeThrottler(actualResizeHandler), false);
}
