# Asterisk with WebRTC

This is a simple example of how to use WebRTC with Asterisk. It uses the SIPML5 client.

## Build and run the Asterisk image

Build the image

```bash
docker-compose build
```

Run the image

```bash
docker-compose up -d
```

## SIPML5

SIPML5 is a SIP client written in Javascript.

- project home page: https://www.doubango.org/sipml5/
- repository: https://github.com/DoubangoTelecom/sipml5

If your asterisk is on a public network, you can use https://www.doubango.org/sipml5/.
but if your asterisk is on a private network, you'll need to download and install it from the SIPML5 github repository.

### Configuration

6001 endpoint (You can use the same configuration for 6002 endpoint)

- Display Name: `6001`
- Private Identity: `6001`
- Public Identity: `sip:6001@your asterisk IP`
- Password: `6001`
- Realm: `your asterisk IP`

Expert mode

- Disable Video: `checked`
- Enable RTCWeb Breaker: `not checked`
- Websocket Server URL: `ws://your asterisk IP:8088/ws`
- SIP outbound proxy URL: `not configured`
- ICE servers: `[{url:"stun:stun.l.google.com:19302"}]`
- Max bandwidth: `not configured`
- Video size: `not configured`
- Disable 3GPP Early IMS: `checked`
- Disable debug messages: `not checked`
- Cache the media stream: `not checked`
- Disable Call button options: `not checked`

## Disable mDNS

If your asterisk and client are on the same machine, the audio may not work. This may be because Google uses mDNS to avoid exposing your local IP to the outside world. Disable it at `chrome://flags/#enable-webrtc-hide-local-ips-with-mdns`.
