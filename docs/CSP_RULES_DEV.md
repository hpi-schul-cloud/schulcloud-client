# Please check the code for these rules.

## Rules to be observed in the future for the content security policy to avoid problems:

- No more on-events (OnClick, OnError, OnMouseover etc.) in HTML tags
- No more \<style> tags in the HTML unless it is absolutely necessary because they contain dynamic values. Please provide this with a

  `nonce="{{nonceValue}}"`

HTML attribute

- No more \<script> tags in the HTML unless it is absolutely necessary because they contain dynamic values ​​or include JS files. Please provide this with a

  `nonce="{{nonceValue}}"`

HTML attribute

- Generally no inline CSS and especially no JS in HTML tags, please outsource them. (Currently, inline CSS is still used in HTML tags in some places, if possible later outsource otherwise the rule 'unsafe-inline' for CSS remains in place)

### Information:

The nonce attribute contains a dynamically generated value that changes each time the page is called up, and the above-mentioned items are put on a whitelist that is used in the content security policy in connection with the 'dynamic-strict' attribute thus ensuring a high level of security as to what can be used.
