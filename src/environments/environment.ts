export const environment = {
    production: false,
    apiUrl: 'http://localhost:5000/api',

    // Feature flags
    features: {
        aiEnabled: true,
        certificatesEnabled: true,
        analyticsEnabled: true,
    },

    // Storage keys
    storageKeys: {
        accessToken: 'lems_access_token',
        refreshToken: 'lems_refresh_token',
        user: 'lems_user',
    },

    // Pagination
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
};
