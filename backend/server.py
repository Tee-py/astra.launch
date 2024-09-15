import time
from typing import Annotated

from bson import ObjectId
from slugify import slugify
from pydantic import BaseModel

from fastapi import Header, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from tasks import deploy_node_task, destroy_node_task
from config import settings
from helpers import get_database, verify_message, get_instance_specs

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
    allow_credentials=True,
)

db = get_database(
    db_name='astra-launch',
    url=settings.mongodb_uri.unicode_string(),
)


class Node(BaseModel):
    name: str
    instance_type: str
    is_validator: bool = False


class AccountSettings(BaseModel):
    aws_access_key: str = ''
    aws_secret_key: str = ''
    notification_email: str = ''
    send_email_notification: bool = False


def get_or_create_user(authorization: str = Header(...)):
    try:
        address, signature = authorization.split(':')
        if not verify_message(address=address, signature=signature):
            raise HTTPException(status_code=401, detail='Invalid credentials')

        user = db.accounts.find_one({'address': address})
        if not user:
            new_account = {
                'settings': {},
                'address': address,
                'created_at': int(time.time()),
                'updated_at': int(time.time()),
            }
            result = db.accounts.insert_one(new_account)
            user = db.accounts.find_one({'_id': result.inserted_id})

        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail=' authentication credentials') from e


@app.get('/')
def index():
    return {'success': True, 'data': 'up & grateful'}


@app.get('/accounts/info')
def user_info(current_user: Annotated[dict, Depends(get_or_create_user)]):
    return {
        'address': current_user['address'],
        'created_at': current_user['created_at'],
        'updated_at': current_user['updated_at'],
        'settings': current_user.get('settings', {}),
    }


@app.post('/nodes')
def create_node(
    node: Node,
    current_user: Annotated[dict, Depends(get_or_create_user)],
):
    # Get AWS credentials from user settings
    user_settings = current_user.get('settings', {})
    aws_access_key = user_settings.get('aws_access_key')
    aws_secret_key = user_settings.get('aws_secret_key')

    if not aws_access_key or not aws_secret_key:
        raise HTTPException(400, 'AWS credentials are not set in your account settings')

    new_node = node.model_dump()
    new_node['name'] = slugify(node.name)
    new_node['status'] = 'Provisioning'
    new_node['created_at'] = int(time.time())
    new_node['updated_at'] = int(time.time())
    new_node['owner'] = current_user['address']
    new_node['logs'] = []

    if get_instance_specs(node.instance_type) is None:
        raise HTTPException(422, 'Instance type is not supported at the moment')

    result = db.nodes.insert_one(new_node)
    node_id = str(result.inserted_id)

    deploy_node_task(
        node_id=node_id,
        access_key=aws_access_key,
        secret_key=aws_secret_key,
        instance_type=node.instance_type,
    )

    new_node.pop('_id')
    return {'id': node_id, **new_node}


@app.get('/nodes')
def list_nodes(current_user: Annotated[dict, Depends(get_or_create_user)]):
    nodes = list(db.nodes.find({'owner': current_user['address']}))
    for node in nodes:
        node['_id'] = str(node['_id'])
        node['instance_info'] = get_instance_specs(node['instance_type'])

    return nodes


@app.get('/nodes/{node_id}')
def retrieve_node(node_id: str, current_user: Annotated[dict, Depends(get_or_create_user)]):
    node = db.nodes.find_one({'_id': ObjectId(node_id), 'owner': current_user['address']})
    if not node:
        raise HTTPException(status_code=404, detail='Node not found')

    node['_id'] = str(node['_id'])
    node['instance_info'] = get_instance_specs(node['instance_type'])
    return node


@app.delete('/nodes/{node_id}')
def delete_node(
    node_id: str,
    current_user: Annotated[dict, Depends(get_or_create_user)],
):
    result = db.nodes.find_one_and_delete(
        {
            '_id': ObjectId(node_id),
            'owner': current_user['address'],
        }
    )

    destroy_node_task(
        node_id=str(result['_id']),
        access_key=current_user['settings']['aws_access_key'],
        secret_key=current_user['settings']['aws_secret_key'],
    )

    return {'success': True, 'message': 'Node deleted successfully'}


@app.put('/accounts/settings')
def update_account_settings(
    settings: AccountSettings,
    current_user: Annotated[dict, Depends(get_or_create_user)],
):
    update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
    result = db.accounts.update_one(
        {'address': current_user['address']}, {'$set': {'settings': update_data, 'updated_at': int(time.time())}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail='Account not found')

    return {'success': True, 'message': 'Account settings updated successfully'}
