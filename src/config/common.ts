export const commonConfig = {
  api: {
    version: 'v1',
    baseUrl: '/api',
    trpcPath: '/trpc',
  },
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  upload: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
};
