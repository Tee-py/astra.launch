from pymongo import MongoClient
from web3.auto import w3
from eth_account.messages import encode_defunct


def get_database(url: str, db_name: str):
    client = MongoClient(url)
    return client[db_name]


def verify_message(*, address: str, signature: str):
    msg = encode_defunct(text='Welcome to astra.launch! Please sign this message to continue')
    gotten_address = w3.eth.account.recover_message(msg, signature=signature)
    return address == gotten_address


EC2_BLOCKCHAIN_INSTANCE_SPECS = {
    't3.micro': {
        'vcpu': 2,
        'memory': 1,  # GB
        'storage': 100,
        'network_performance': 'Up to 5 Gigabit',
        'description': 'Burstable general purpose (1 GiB RAM)',
    },
    't3.small': {
        'vcpu': 2,
        'memory': 2,  # GB
        'storage': 100,
        'network_performance': 'Up to 5 Gigabit',
        'description': 'Burstable general purpose (2 GiB RAM)',
    },
    't3.medium': {
        'vcpu': 2,
        'memory': 4,  # GB
        'storage': 100,
        'network_performance': 'Up to 5 Gigabit',
        'description': 'Burstable general purpose',
    },
    't3.large': {
        'vcpu': 2,
        'memory': 8,  # GB
        'storage': 100,
        'network_performance': 'Up to 5 Gigabit',
        'description': 'Burstable general purpose',
    },
    'c5.large': {
        'vcpu': 2,
        'memory': 4,  # GB
        'storage': 100,
        'network_performance': 'Up to 10 Gigabit',
        'description': 'Compute optimized',
    },
    'c5.xlarge': {
        'vcpu': 4,
        'memory': 8,  # GB
        'storage': 100,
        'network_performance': 'Up to 10 Gigabit',
        'description': 'Compute optimized',
    },
    'c5.2xlarge': {
        'vcpu': 8,
        'memory': 16,  # GB
        'storage': 100,
        'network_performance': 'Up to 10 Gigabit',
        'description': 'Compute optimized',
    },
    'r5.large': {
        'vcpu': 2,
        'memory': 16,  # GB
        'storage': 100,
        'network_performance': 'Up to 10 Gigabit',
        'description': 'Memory optimized',
    },
    'r5.xlarge': {
        'vcpu': 4,
        'memory': 32,  # GB
        'storage': 100,
        'network_performance': 'Up to 10 Gigabit',
        'description': 'Memory optimized',
    },
    'r5.2xlarge': {
        'vcpu': 8,
        'memory': 64,  # GB
        'storage': 100,
        'network_performance': 'Up to 10 Gigabit',
        'description': 'Memory optimized',
    },
    'm5.large': {
        'vcpu': 2,
        'memory': 8,  # GB
        'storage': 100,
        'network_performance': 'Up to 10 Gigabit',
        'description': 'General purpose',
    },
    'm5.xlarge': {
        'vcpu': 4,
        'memory': 16,  # GB
        'storage': 100,
        'network_performance': 'Up to 10 Gigabit',
        'description': 'General purpose',
    },
    'm5.2xlarge': {
        'vcpu': 8,
        'memory': 32,  # GB
        'storage': 100,
        'network_performance': 'Up to 10 Gigabit',
        'description': 'General purpose',
    },
    'i3.large': {
        'vcpu': 2,
        'memory': 15.25,  # GB
        'storage': '1 x 475 NVMe SSD',
        'network_performance': 'Up to 10 Gigabit',
        'description': 'Storage optimized',
    },
    'i3.xlarge': {
        'vcpu': 4,
        'memory': 30.5,  # GB
        'storage': '1 x 950 NVMe SSD',
        'network_performance': 'Up to 10 Gigabit',
        'description': 'Storage optimized',
    },
    'i3.2xlarge': {
        'vcpu': 8,
        'memory': 61,  # GB
        'storage': '1 x 1900 NVMe SSD',
        'network_performance': 'Up to 10 Gigabit',
        'description': 'Storage optimized',
    },
}


def get_instance_specs(instance_type):
    return EC2_BLOCKCHAIN_INSTANCE_SPECS.get(instance_type)
