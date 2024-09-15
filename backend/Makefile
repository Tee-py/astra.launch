LINT_PATHS = config.py helpers.py infra.py server.py tasks.py

ifneq (,$(wildcard ./.env.local))
    include .env.local
    export
endif

dev:
	@uv run fastapi dev server.py

start:
	@uv run gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker --enable-stdio-inheritance --daemon

lint:
	@uv run ruff check

lint-fix:
	@uv run ruff check $(LINT_PATHS) --fix

format:
	@uv run ruff format $(LINT_PATHS)

consumer:
	@uv run huey_consumer.py tasks.huey
