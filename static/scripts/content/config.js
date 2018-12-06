module.exports = {
  configs: {
    API: {
      clientURL: (process.env.HOST || 'http://localhost:3100'),
      serverURL: (process.env.BACKEND_URL || 'http://localhost:3030'),
      authPath: '/authentication',
      pwRecoveryPath: '/login?recovery=true',
      getPath: '/content/resources/',
      searchPath: '/content/search/',
      pushContentPath: '/resources/',
      redirectPath: '/content/redirect/',
      userInfoPath: '/users/',
    },
    card: {
      displayedTags: 9,
    },
  }
};
