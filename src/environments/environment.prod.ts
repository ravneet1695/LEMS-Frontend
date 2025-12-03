export const environment = {
    production: true,
    apiUrl: 'https://api.yourdomain.com/api',

    features: {
        aiEnabled: true,
        certificatesEnabled: true,
        analyticsEnabled: true,
    },

    storageKeys: {
        accessToken: 'lems_access_token',
        refreshToken: 'lems_refresh_token',
        user: 'lems_user',
    },

    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
};
