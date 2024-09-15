#!/usr/bin/env sh

echo "Starting up web server in daemon mode..."
uv run gunicorn -w 4 -k uvicorn.workers.UvicornWorker server:app --capture-output --log-level info --enable-stdio-inheritance --daemon


echo "Starting up Huey..."
uv run huey_consumer.py tasks.huey
