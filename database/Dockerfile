FROM mongo:6.0

# Copy initialization scripts (will run on first container start)
COPY ./init /docker-entrypoint-initdb.d/

# Expose default MongoDB port
EXPOSE 27017

CMD ["mongod"]
