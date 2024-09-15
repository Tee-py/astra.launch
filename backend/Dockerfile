FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN curl -fsSL https://get.pulumi.com | sh

ADD . /app

RUN uv sync --frozen --no-dev

ENV PATH="/app/.venv/bin:/root/.pulumi/bin:$PATH"

RUN pulumi login file:///app/pulumi-data

# Reset the entrypoint, don't invoke `uv`
ENTRYPOINT []

CMD ["sh", "deploy.sh"]
