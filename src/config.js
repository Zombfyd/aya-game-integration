const config = {
    development: {
        packageId: process.env.0x4bfa52ee471bd01ea0ade83a343de62a4c500f9adc375eb4426a92042887b13d || 'YOUR_LOCAL_PACKAGE_ID',
        ownerAddress: process.env.0x715c980c14bbbbbec3bfdb8eb0388f47d1e89a4a63e07355d3f38fec173396af || 'YOUR_LOCAL_OWNER_ADDRESS',
        network: 'devnet'
    },
    production: {
        packageId: process.env.REACT_APP_PACKAGE_ID,
        ownerAddress: process.env.REACT_APP_OWNER_ADDRESS,
        network: 'mainnet'
    }
};

export default config[process.env.NODE_ENV || 'development'];
