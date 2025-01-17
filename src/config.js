const config = {
    development: {
        packageId: process.env.REACT_APP_PACKAGE_ID || 'YOUR_LOCAL_PACKAGE_ID',
        ownerAddress: process.env.REACT_APP_OWNER_ADDRESS || 'YOUR_LOCAL_OWNER_ADDRESS',
        network: 'testnet'  // testnet for development
    },
    production: {
        packageId: process.env.REACT_APP_PACKAGE_ID,
        ownerAddress: process.env.REACT_APP_OWNER_ADDRESS,
        network: 'mainnet'  // mainnet for production
    }
};

// Default to development if environment variable REACT_APP_ENVIRONMENT is not set
export default config[process.env.REACT_APP_ENVIRONMENT || 'development'];

