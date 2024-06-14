/* eslint-disable no-undef */
if (crossOriginIsolated) {
  postMessage(crossOriginIsolated);
} else {
  postMessage("false");
}
