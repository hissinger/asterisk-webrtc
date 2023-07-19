FROM alpine:latest AS base

RUN apk --no-cache --update add \
    asterisk-srtp \
    asterisk-opus \
	asterisk

CMD	["asterisk", "-fpvvvvv"]
