export function iFrameListen (){
  window.addEventListener("message", (event) => {
    try{
      const message = JSON.parse(event.data);
      if(message.function){
        if(message.function === "getSize" && message.identifier){
          console.log("gotRequest", message.identifier);
          window.parent.postMessage(JSON.stringify({
            identifier: message.identifier,
            size: {
              x: document.body.scrollWidth,
              y: document.body.scrollHeight
            }
          }), '*');
        }
      }
    } catch (error) {
        //console.warn("Couldn't evaluate message:", event, error);
    }
  }, false);
}

export function resizeiFrames(iFrameNodes, callback){

  window.addEventListener("message", (event) => {
    try{
      const message = JSON.parse(event.data);
      if(message.size && message.identifier){
          console.log("gotSize", message.identifier, message.size.y);
          document.querySelectorAll(`iframe[data-identifier="${message.identifier}"]`).forEach((iframe) => {
              iframe.style.height = message.size.y + 4 + 'px'; // add a bit more height to prevent scrollbar from appearing
          });
          if(callback){
            callback();
          }
        }
    } catch (error) {
        //console.warn("Couldn't evaluate message:", event, error);
    }
  }, false);

  // iFrame full height
  let iframes = iFrameNodes;
  if(!iframes || iframes.length === 0){
    iframes = document.querySelectorAll("iframe");
  }
  iframes.forEach((iframe, index)=>{
    const identifier = "iframe-"+index;
    iframe.dataset.identifier = identifier;
    iframe.addEventListener("load", (event) => {
        iframe.contentWindow.postMessage(JSON.stringify({
            function: "getSize",
            identifier: identifier
        }), '*');
    });
  });
}