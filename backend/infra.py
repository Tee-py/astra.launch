import time

import pulumi
import pulumi_aws as aws
from bson import ObjectId
from pulumi import automation
from pymongo.database import Database


def create_node_deploy_program(instance: str, node_name: str):
    ami_id = 'ami-05723dfdeb8acd366'  # Ubuntu 20.04 LTS in us-east-1, change as needed

    # Create a VPC and security group
    vpc = aws.ec2.get_vpc(default=True)

    # create a security group
    security_group = aws.ec2.SecurityGroup(
        f'{node_name}-sg',
        description='Allowing incoming http and ssh traffic for kiichain node',
        vpc_id=vpc.id,
        ingress=[
            {
                'protocol': 'tcp',
                'from_port': 22,
                'to_port': 22,
                'cidr_blocks': ['0.0.0.0/0'],
            },
            {
                'protocol': 'tcp',
                'from_port': 26657,
                'to_port': 26657,
                'cidr_blocks': ['0.0.0.0/0'],
            },
            {
                'protocol': 'tcp',
                'from_port': 8645,
                'to_port': 8645,
                'cidr_blocks': ['0.0.0.0/0'],
            },
        ],
        egress=[
            {
                'protocol': '-1',
                'from_port': 0,
                'to_port': 0,
                'cidr_blocks': ['0.0.0.0/0'],
            }
        ],
    )

    # Define user data script
    user_data = """#!/bin/bash
    set -euo pipefail

    # Set HOME if it's not already set
    export HOME="/root"
    FOUNDRY_DIR="$HOME/.foundry"

    log() {
        echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')]: $*" | tee -a /var/log/user-data.log
    }

    log "HOME DIRECTORY: $HOME"
    log "FOUNDRY DIRECTORY: $FOUNDRY_DIR"

    install_foundry() {
        log "Starting Foundry installation"

        # Download the Foundry installation script
        log "Downloading and running foundry installation script"
        if ! curl -L https://foundry.paradigm.xyz | bash -s -- -y; then
            log "Error: Failed to download and run foundry installation script"
            return 1
        fi

        # Check if Foundry was installed in the root directory and move it if necessary
        if [ -d "/.foundry" ] && [ ! -d "$FOUNDRY_DIR" ]; then
            log "Moving Foundry installation from / to $FOUNDRY_DIR"
            cp -R /.foundry "$FOUNDRY_DIR"
        fi
        log "Foundry installation script completed"

        # Update PATH
        echo 'export PATH="$PATH:$HOME/.foundry/bin"' >> "$HOME/.bashrc"
        export PATH="$PATH:$HOME/.foundry/bin"

        # Verify installation
        log "Verifying Foundry installation"
        if ! command -v foundryup &> /dev/null; then
            log "Error: foundryup command not found after installation"
            return 1
        fi

        # Run foundryup to complete installation
        log "Running foundryup"
        if ! foundryup; then
            log "Error: foundryup command failed"
            return 1
        fi

        log "Foundry installation completed successfully"
    }

    log "Starting user data script execution"

    # Update and install dependencies
    log "Updating system and installing dependencies"
    apt-get update
    apt-get install -y git curl wget jq make gcc g++ bc

    # Install Go
    GO_VERSION="1.22.7"
    log "Installing Go version ${GO_VERSION}"
    wget "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz"
    tar -C /usr/local -xzf "go${GO_VERSION}.linux-amd64.tar.gz"
    rm "go${GO_VERSION}.linux-amd64.tar.gz"
    echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile
    export PATH=$PATH:/usr/local/go/bin
    if ! command -v go &> /dev/null; then
        log "Error: Go installation failed"
        exit 1
    fi
    log "Go installed successfully"

    # Install Foundry
    log "Installing Foundry"
    if ! install_foundry; then
        log "Foundry installation failed. Check logs for details."
        exit 1
    fi

    # Clone and build KiiChain
    log "Cloning and building KiiChain"
    mkdir -p /opt/kiichain
    if ! git clone https://github.com/KiiBlockchain/kiichain.git /opt/kiichain; then
        log "Error: Failed to clone KiiChain repository"
        exit 1
    fi
    cd /opt/kiichain
    if ! make build-clean; then
        log "Error: Failed to build KiiChain"
        exit 1
    fi
    log "KiiChain built successfully"

    # Set up KiiChain as a service instead of running directly
    log "Setting up KiiChain as a service"
    cat << EOF > /etc/systemd/system/kiichain.service
[Unit]
Description=KiiChain Node
After=network.target

[Service]
WorkingDirectory=/opt/kiichain
Environment="PATH=/usr/local/go/bin:/root/go/bin:$PATH"
Environment="GOROOT=/usr/local/go"
Environment="GOPATH=/root/go"
ExecStart=make start
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable kiichain.service
    systemctl start kiichain.service

    log "User data script execution completed"
    """

    # Create the EC2 instance
    instance = aws.ec2.Instance(
        f'{node_name}-ec2',
        instance_type=instance,
        ami=ami_id,
        vpc_security_group_ids=[security_group.id],
        associate_public_ip_address=True,
        user_data=user_data,
        root_block_device={
            'volume_type': 'gp3',
            'volume_size': 100,  # Size in GiB
            'delete_on_termination': True,
        },
        tags={
            'Name': f'{node_name}-kiichain-node',
        },
    )

    # Export the public IP and DNS name of the instance
    pulumi.export('instance_id', instance.id)
    pulumi.export('public_ip', instance.public_ip)
    pulumi.export('public_dns', instance.public_dns)


def deploy_node(
    db: Database,
    node_id: str,
    access_key: str,
    secret_key: str,
    instance_type: str,
):
    def pulumi_program():
        return create_node_deploy_program(instance_type, node_id)

    def handle_event(event: automation.events.EngineEvent):
        log_entry = {'sequence': event.sequence, 'timestamp': event.timestamp}

        if event.stdout_event:
            log_entry['type'] = 'stdout'
            log_entry['message'] = event.stdout_event.message
            add_to_database(log_entry)

        elif event.diagnostic_event:
            log_entry['type'] = 'diagnostic'
            log_entry['severity'] = event.diagnostic_event.severity
            log_entry['message'] = event.diagnostic_event.message
            add_to_database(log_entry)

        elif event.resource_pre_event:
            log_entry['type'] = 'resource_pre'
            log_entry['resource_urn'] = event.resource_pre_event.metadata.urn
            log_entry['operation'] = event.resource_pre_event.metadata.op
            add_to_database(log_entry)

        elif event.res_op_failed_event:
            log_entry['type'] = 'resource_op_failed'
            log_entry['resource_urn'] = event.res_op_failed_event.metadata.urn
            log_entry['operation'] = event.res_op_failed_event.metadata.op
            log_entry['error'] = event.res_op_failed_event.error
            add_to_database(log_entry)

    def add_to_database(log_entry):
        db.nodes.update_one(
            {'_id': ObjectId(node_id)},
            {
                '$push': {'logs': log_entry},
                '$set': {
                    'updated_at': int(time.time()),
                },
            },
        )

    stack = automation.create_or_select_stack(stack_name=node_id, project_name=node_id, program=pulumi_program)
    stack.set_config('aws:region', automation.ConfigValue('us-east-1'))
    stack.set_config('aws:accessKey', automation.ConfigValue(access_key, secret=True))
    stack.set_config('aws:secretKey', automation.ConfigValue(secret_key, secret=True))

    try:
        up_result = stack.up(on_event=handle_event)

        # Check if deployment was successful
        if up_result.summary.result == 'succeeded':
            stack_outputs = up_result.outputs
            instance_id = stack_outputs.get('instance_id').value
            public_ip = stack_outputs.get('public_ip').value
            public_dns = stack_outputs.get('public_dns').value
            db.nodes.update_one(
                {'_id': ObjectId(node_id)},
                {
                    '$set': {
                        'status': 'Running',
                        'updated_at': int(time.time()),
                        'instance_id': instance_id,
                        'public_ip': public_ip,
                        'public_dns': public_dns,
                    }
                },
            )
        else:
            db.nodes.update_one(
                {'_id': ObjectId(node_id)},
                {'$set': {'status': 'Error', 'error': 'Deployment failed', 'updated_at': int(time.time())}},
            )
    except Exception as e:
        db.nodes.update_one(
            {'_id': ObjectId(node_id)}, {'$set': {'status': 'Error', 'error': str(e), 'updated_at': int(time.time())}}
        )


def destroy_node(node_id: str, access_key: str, secret_key: str):
    # Create or select the stack
    stack = automation.select_stack(
        program=lambda: None,
        stack_name=node_id,
        project_name=node_id,
    )

    # Set AWS credentials
    stack.set_config('aws:region', automation.ConfigValue('us-east-1'))
    stack.set_config('aws:accessKey', automation.ConfigValue(access_key, secret=True))
    stack.set_config('aws:secretKey', automation.ConfigValue(secret_key, secret=True))

    # Destroy the stack
    destroy_result = stack.destroy(on_output=print)

    if destroy_result.summary.result != 'succeeded':
        msg = 'Stack destroy failed'
        raise Exception(msg)

    # Remove the stack
    stack.workspace.remove_stack(node_id)
