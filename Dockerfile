############################################################
# Dockerfile to run an OrientDB (Graph) Container
############################################################

FROM java:openjdk-8-jdk-alpine

MAINTAINER OrientDB LTD (info@orientdb.com)

ENV ORIENTDB_VERSION 2.2.1-SNAPSHOT

ENV ORIENTDB_DOWNLOAD_URL https://oss.sonatype.org/service/local/artifact/maven/content?r=snapshots&g=com.orientechnologies&a=orientdb-community&v=$ORIENTDB_VERSION&e=tar.gz

RUN apk add --update \
        tar \
    && rm -rf /var/cache/apk/*

#download distribution tar, untar and delete databases
RUN mkdir /orientdb \
  && wget  $ORIENTDB_DOWNLOAD_URL -O orientdb-community-$ORIENTDB_VERSION.tar.gz \
  && tar -xvzf orientdb-community-$ORIENTDB_VERSION.tar.gz -C /orientdb --strip-components=1 \
  && rm orientdb-community-$ORIENTDB_VERSION.tar.gz \
  && rm -rf /orientdb/databases/* \
  && rm /orientdb/plugins/studio*


ENV PATH /orientdb/bin:$PATH

VOLUME ["/orientdb/backup", "/orientdb/databases", "/orientdb/config"]

WORKDIR /orientdb

ADD config/orientdb-server-config.xml  /orientdb/config

ADD www  /orientdb/www

ADD databases/ /orientdb/databases
#OrientDb binary
EXPOSE 2424

#OrientDb http
EXPOSE 2480

# Default command start the server
CMD ["server.sh"]
