async function initTimeline(selector, url){
  const res = await fetch(url, {
    credentials: "same-origin"
  });
  const googleTimelineData = await res.json();
  const timeline = new TL.Timeline(selector, TL.ConfigFactory.googleFeedJSONtoTimelineJSON(googleTimelineData));
}
initTimeline('timeline-embed', '/about/timeline.json')