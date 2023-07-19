ARG	DIST=alpine
ARG	REL=latest


#
#
# target: mini
#
# asterisk, minimal
#
#

FROM	$DIST:$REL AS mini
LABEL	maintainer=mlan


#
# Facilitate persistent storage and install asterisk
#

RUN apk --no-cache --update add \
    asterisk-srtp \
    asterisk-opus \
	asterisk


CMD	["asterisk", "-fpvvvv"]
