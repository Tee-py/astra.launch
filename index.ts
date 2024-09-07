import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import axios from "axios";
import * as awsSdk from "aws-sdk";
import * as fs from "fs";
import * as crypto from "crypto";
import * as child_process from "child_process";

const config = new pulumi.Config();
const instanceType = config.get("instanceType") || "t2.large";
const keyName = config.require("keyName");
const validatorName = config.require("validatorName");
const walletName = config.require("walletName");

// Function to fetch node ID
async function fetchNodeId(): Promise<string> {
  try {
    const response = await axios.get(
      "https://a.testnet.kiivalidator.com:26658/status"
    );
    return response.data.result.node_info.id;
  } catch (error) {
    throw new Error(`Failed to fetch node ID: ${error}`);
  }
}

function generateKeyPair() {
  return crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });
}

// Generate the key pair
const { privateKey, publicKey } = generateKeyPair();

// Save the private key to a file
const privateKeyPath = `${keyName}.pem`;
const publicKeyPath = `${keyName}.pub`;

fs.writeFileSync(privateKeyPath, privateKey);
fs.chmodSync(privateKeyPath, 0o600); // Set appropriate permissions
console.log(`Private key saved to: ${privateKeyPath}`);

// Save the public key to a temporary file
fs.writeFileSync(publicKeyPath, publicKey);

// Convert the public key to OpenSSH format
const sshKeygen = child_process.spawnSync("ssh-keygen", [
  "-f",
  publicKeyPath,
  "-i",
  "-m",
  "PKCS8",
]);

if (sshKeygen.error) {
  throw new Error(`Failed to convert public key: ${sshKeygen.error.message}`);
}

const openSshPublicKey = sshKeygen.stdout.toString().trim();

// Delete the temporary public key file
fs.unlinkSync(publicKeyPath);

// Create a new EC2 Key Pair
const keyPair = new aws.ec2.KeyPair("validator-key-pair", {
  keyName: keyName,
  publicKey: openSshPublicKey,
});

// Create a new VPC
const vpc = new aws.ec2.Vpc("validator-vpc", {
  cidrBlock: "10.0.0.0/16",
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    Name: "validator-vpc",
  },
});

// Create a public subnet
const publicSubnet = new aws.ec2.Subnet("public-subnet", {
  vpcId: vpc.id,
  cidrBlock: "10.0.1.0/24",
  mapPublicIpOnLaunch: true,
  tags: {
    Name: "validator-public-subnet",
  },
});

// Create an Internet Gateway
const internetGateway = new aws.ec2.InternetGateway("validator-igw", {
  vpcId: vpc.id,
  tags: {
    Name: "validator-igw",
  },
});

// Create a route table
const routeTable = new aws.ec2.RouteTable("validator-rt", {
  vpcId: vpc.id,
  routes: [
    {
      cidrBlock: "0.0.0.0/0",
      gatewayId: internetGateway.id,
    },
  ],
  tags: {
    Name: "validator-rt",
  },
});

// Associate the route table with the public subnet
const routeTableAssociation = new aws.ec2.RouteTableAssociation(
  "validator-rta",
  {
    subnetId: publicSubnet.id,
    routeTableId: routeTable.id,
  }
);

// Create a security group
const securityGroup = new aws.ec2.SecurityGroup("validator-sg", {
  description: "Security group for KII validator node",
  vpcId: vpc.id,
  ingress: [
    {
      protocol: "tcp",
      fromPort: 22,
      toPort: 22,
      cidrBlocks: ["0.0.0.0/0"],
    },
    {
      protocol: "tcp",
      fromPort: 26656,
      toPort: 26656,
      cidrBlocks: ["0.0.0.0/0"],
    },
    {
      protocol: "tcp",
      fromPort: 26657,
      toPort: 26657,
      cidrBlocks: ["0.0.0.0/0"],
    },
    {
      protocol: "tcp",
      fromPort: 1317,
      toPort: 1317,
      cidrBlocks: ["0.0.0.0/0"],
    },
  ],
  egress: [
    { protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] },
  ],
  tags: {
    Name: "validator-sg",
  },
});

// Create an IAM role for the EC2 instance
const role = new aws.iam.Role("validator-role", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Principal: {
          Service: "ec2.amazonaws.com",
        },
      },
    ],
  }),
});

// Attach the AmazonSSMManagedInstanceCore policy to the role
const rolePolicyAttachment = new aws.iam.RolePolicyAttachment(
  "validator-policy-attachment",
  {
    role: role.name,
    policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
  }
);

// Create an instance profile
const instanceProfile = new aws.iam.InstanceProfile(
  "validator-instance-profile",
  {
    role: role.name,
  }
);

// Create the EC2 instance
// Create the EC2 instance
const instance = new aws.ec2.Instance("validator-instance", {
  instanceType: instanceType,
  ami: aws.ec2
    .getAmiOutput({
      mostRecent: true,
      owners: ["099720109477"], // Canonical
      filters: [
        {
          name: "name",
          values: ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"],
        },
      ],
    })
    .apply((ami) => ami.id),
  keyName: keyPair.keyName,
  vpcSecurityGroupIds: [securityGroup.id],
  subnetId: publicSubnet.id,
  iamInstanceProfile: instanceProfile.name,
  tags: {
    Name: "kii-validator-node",
  },
  userData: pulumi.all([fetchNodeId()]).apply(
    ([nodeId]) =>
      `#!/bin/bash
set -e

# Update and install dependencies
sudo apt-get update
sudo apt-get install -y jq build-essential bison

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Go 1.19
wget https://go.dev/dl/go1.19.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.19.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' | sudo tee -a /etc/profile
source /etc/profile

# Install Ignite CLI v0.27.1
curl https://get.ignite.com/cli@v0.27.1! | sudo bash

# Set up KII in /home/ubuntu
cd /home/ubuntu
sudo -u ubuntu git clone https://github.com/KiiBlockchain/kii.git
cd kii

# Create config.yml
sudo -u ubuntu bash -c "cat > config.yml <<EOL
version: 1
accounts:
- name: ${walletName}
  coins: [ 100ukii ]
genesis:
  chain_id: kiiventador
  app_state:
    staking:
      params:
        bond_denom: ukii
validators:
- name: ${walletName}
  bonded: 100ukii
  app:
    pruning: \"nothing\"
  config:
    moniker: \"${validatorName}\"
  client:
    output: \"json\"
EOL"

# Initialize the chain and capture output
INIT_OUTPUT=$(sudo -u ubuntu ignite chain init)
echo "$INIT_OUTPUT" | sudo -u ubuntu tee /home/ubuntu/chain_init_output.txt

# Extract mnemonic and address (You might need to adjust these regex patterns)
MNEMONIC=$(echo $INIT_OUTPUT | grep -oP 'mnemonic: \K.*(?=🗃)' | sed 's/ and.*//')
ADDRESS=$(echo $INIT_OUTPUT | grep -oP 'address \K\S+')

echo "Mnemonic: $MNEMONIC" | sudo -u ubuntu tee -a /home/ubuntu/wallet_info.txt
echo "Address: $ADDRESS" | sudo -u ubuntu tee -a /home/ubuntu/wallet_info.txt

# Copy genesis file
sudo -u ubuntu cp genesis/genesis.json /home/ubuntu/.kiichain/config/genesis.json

# Update config.toml with fetched node ID
sudo -u ubuntu sed -i 's/persistent_peers = ""/persistent_peers = "${nodeId}@3.129.207.228:26656"/' /home/ubuntu/.kiichain/config/config.toml

# Build kiichainid
go build -o kiichaind ./cmd/kiichaind/
sudo mv kiichaind /usr/local/bin/

# Start the chain
sudo -u ubuntu nohup kiichaind start > /home/ubuntu/kiichaind.log 2>&1 &

echo "Validator setup complete. Check /home/ubuntu/kiichaind.log for node status."
echo "Mnemonic and address saved in /home/ubuntu/wallet_info.txt"
`
  ),
});

// Create an Elastic IP and associate it with the instance in one step
const eip = new aws.ec2.Eip("validator-eip", {
  instance: instance.id,
  domain: "vpc",
  tags: {
    Name: "validator-eip",
  },
});

// Export the public IP and DNS name of the instance
export const publicIp = eip.publicIp;
export const publicDns = instance.publicDns;

// Export the command to create the validator
export const createValidatorCommand = pulumi.interpolate`
kiichaind tx staking create-validator \
  --amount=1tkii \
  --pubkey=$(kiichaind tendermint show-validator) \
  --moniker="${validatorName}" \
  --commission-rate=0.1 \
  --commission-max-rate=0.2 \
  --commission-max-change-rate=0.01 \
  --min-self-delegation=1 \
  --gas=auto --gas-adjustment=1.2 \
  --gas-prices=10.0tkii \
  --from ${walletName}
`;

export const keyPairName = keyPair.keyName;
export const privateKeyFilePath = pulumi.output(privateKeyPath);

// Cleanup function
async function cleanup(
  ec2: awsSdk.EC2,
  iam: awsSdk.IAM,
  instanceId: string,
  eipId: string,
  vpcId: string,
  sgId: string,
  igwId: string,
  subnetId: string,
  rtId: string,
  roleName: string,
  profileName: string
) {
  try {
    // Terminate the EC2 instance
    await ec2.terminateInstances({ InstanceIds: [instanceId] }).promise();
    console.log(`EC2 instance ${instanceId} termination initiated.`);

    // Wait for instance termination
    await ec2
      .waitFor("instanceTerminated", { InstanceIds: [instanceId] })
      .promise();
    console.log(`EC2 instance ${instanceId} terminated.`);

    // Release the Elastic IP
    await ec2.releaseAddress({ AllocationId: eipId }).promise();
    console.log(`Elastic IP ${eipId} released.`);

    // Delete the security group
    await ec2.deleteSecurityGroup({ GroupId: sgId }).promise();
    console.log(`Security group ${sgId} deleted.`);

    // Delete the route table
    await ec2.deleteRouteTable({ RouteTableId: rtId }).promise();
    console.log(`Route table ${rtId} deleted.`);

    // Detach the internet gateway
    await ec2
      .detachInternetGateway({
        InternetGatewayId: igwId,
        VpcId: vpcId,
      })
      .promise();
    console.log(`Internet gateway ${igwId} detached.`);

    // Delete the internet gateway
    await ec2.deleteInternetGateway({ InternetGatewayId: igwId }).promise();
    console.log(`Internet gateway ${igwId} deleted.`);

    // Delete the subnet
    await ec2.deleteSubnet({ SubnetId: subnetId }).promise();
    console.log(`Subnet ${subnetId} deleted.`);

    // Delete the VPC
    await ec2.deleteVpc({ VpcId: vpcId }).promise();
    console.log(`VPC ${vpcId} deleted.`);

    // Remove role from instance profile
    await iam
      .removeRoleFromInstanceProfile({
        InstanceProfileName: profileName,
        RoleName: roleName,
      })
      .promise();
    console.log(
      `Role ${roleName} removed from instance profile ${profileName}.`
    );

    // Delete the instance profile
    await iam
      .deleteInstanceProfile({ InstanceProfileName: profileName })
      .promise();
    console.log(`Instance profile ${profileName} deleted.`);

    // Detach role policies
    try {
      const attachedPoliciesResponse = await iam
        .listAttachedRolePolicies({ RoleName: roleName })
        .promise();
      const attachedPolicies = attachedPoliciesResponse.AttachedPolicies;
      if (attachedPolicies) {
        for (const policy of attachedPolicies) {
          if (policy.PolicyArn) {
            await iam
              .detachRolePolicy({
                RoleName: roleName,
                PolicyArn: policy.PolicyArn,
              })
              .promise();
            console.log(
              `Policy ${policy.PolicyArn} detached from role ${roleName}.`
            );
          }
        }
      }
    } catch (error) {
      console.error(`Failed to detach role policies: ${error}`);
    }

    // Delete the IAM role
    await iam.deleteRole({ RoleName: roleName }).promise();
    console.log(`IAM role ${roleName} deleted.`);
  } catch (error) {
    console.error("Error during cleanup:", error);
    throw error;
  }
}

// Error handling
export const cleanupFunction = pulumi
  .all([
    instance.id,
    eip.id,
    vpc.id,
    securityGroup.id,
    internetGateway.id,
    publicSubnet.id,
    routeTable.id,
    role.name,
    instanceProfile.name,
  ])
  .apply(
    ([
      instanceId,
      eipId,
      vpcId,
      sgId,
      igwId,
      subnetId,
      rtId,
      roleName,
      profileName,
    ]) => {
      return async () => {
        const ec2 = new awsSdk.EC2({ region: aws.config.region });
        const iam = new awsSdk.IAM({ region: aws.config.region });
        await cleanup(
          ec2,
          iam,
          instanceId,
          eipId,
          vpcId,
          sgId,
          igwId,
          subnetId,
          rtId,
          roleName,
          profileName
        );
      };
    }
  );
