from huey import RedisHuey

from infra import deploy_node, destroy_node
from config import settings
from helpers import get_database

huey = RedisHuey(url=settings.redis_url.unicode_string())
db = get_database(
    db_name='astra-launch',
    url=settings.mongodb_uri.unicode_string(),
)


@huey.task()
def deploy_node_task(node_id: str, node_name: str, access_key: str, secret_key: str, instance_type: str):
    deploy_node(
        db=db,
        node_id=node_id,
        node_name=node_name,
        access_key=access_key,
        secret_key=secret_key,
        instance_type=instance_type,
    )


@huey.task()
def destroy_node_task(node_id: str, node_name: str, access_key: str, secret_key: str):
    destroy_node(
        node_id=node_id,
        node_name=node_name,
        access_key=access_key,
        secret_key=secret_key,
    )
