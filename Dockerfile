FROM node:carbon

RUN git clone https://github.com/ChrFr/db_webfrontend.git /home/prognosen
WORKDIR /home/prognosen

