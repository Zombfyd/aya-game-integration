const config = {
    development: {
        packageId: process.env.REACT_APP_PACKAGE_ID || 'YOUR_LOCAL_PACKAGE_ID',
        ownerAddress: process.env.REACT_APP_OWNER_ADDRESS || 'YOUR_LOCAL_OWNER_ADDRESS',
        network: 'devnet'
    },
    production: {
        packageId: process.env.REACT_APP_PACKAGE_ID,
        ownerAddress: process.env.REACT_APP_OWNER_ADDRESS,
        network: 'mainnet'
    }
};

export default config[process.env.NODE_ENV || 'development'];
