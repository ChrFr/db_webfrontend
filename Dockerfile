FROM node:carbon

RUN git clone https://github.com/ChrFr/db_webfrontend.git $HOME/prognosen
WORKDIR $HOME/prognosen

